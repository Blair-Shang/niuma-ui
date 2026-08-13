import type { RsTranslateFn } from '../composables/useRsI18n'
import { createTranslator } from '../composables/useRsI18n'
import { defaultLocale } from '../locale/types'
import {
  getInputRuleMessage,
  validateInputRule,
  type RsInputRule,
} from './input-rules'

/** 校验触发时机（对齐 Ant Design Form） */
export type RsFormRuleTrigger = 'blur' | 'change' | 'submit'

/**
 * 单条表单规则（声明式 + 自定义校验）。
 * 对标 Ant Design / Element Plus Form rules 的常用子集。
 */
/** 规则文案：静态字符串，或按当前值动态生成（对齐 Ant Design message 函数能力） */
export type RsFormRuleMessage =
  | string
  | ((ctx: { value: unknown; rule: RsFormRuleItem }) => string)

export interface RsFormRuleItem {
  required?: boolean
  /**
   * 错误文案；未传时使用内置 i18n。
   * 可传函数按当前值动态生成文案。
   */
  message?: RsFormRuleMessage
  /** 字符串长度下限 / 数值下限 */
  min?: number
  /** 字符串长度上限 / 数值上限 */
  max?: number
  /** 字符串精确长度 */
  len?: number
  pattern?: RegExp
  /** 内置类型：email/phone 等，或 string/number/array */
  type?: RsInputRule | 'string' | 'number' | 'array'
  /**
   * 自定义校验。返回 true 通过；false / 字符串为失败；支持 Promise。
   */
  validator?: (
    value: unknown,
  ) => boolean | string | void | Promise<boolean | string | void>
  trigger?: RsFormRuleTrigger | RsFormRuleTrigger[]
}

/** 字段名 → 规则（单条或数组） */
export type RsFormRules = Record<string, RsFormRuleItem | RsFormRuleItem[]>

export interface RsFormRuleValidateResult {
  valid: boolean
  message?: string
}

export function normalizeFormRules(
  rules?: RsFormRuleItem | RsFormRuleItem[] | null,
): RsFormRuleItem[] {
  if (!rules) return []
  return Array.isArray(rules) ? rules : [rules]
}

export function matchFormRuleTrigger(
  rule: RsFormRuleItem,
  trigger?: RsFormRuleTrigger,
): boolean {
  if (!trigger || trigger === 'submit') return true
  const ruleTrigger = rule.trigger
  if (!ruleTrigger) return true
  const list = Array.isArray(ruleTrigger) ? ruleTrigger : [ruleTrigger]
  return list.includes(trigger)
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  // 日期区间 { start, end }：两端皆空视为空
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('start' in record || 'end' in record) {
      return isEmptyValue(record.start) && isEmptyValue(record.end)
    }
  }
  return false
}

function valueLength(value: unknown): number | null {
  if (typeof value === 'string') return value.trim().length
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.length
  return null
}

function fail(message: string): RsFormRuleValidateResult {
  return { valid: false, message }
}

/** 解析规则 message（字符串或函数） */
export function resolveRuleMessage(
  rule: RsFormRuleItem,
  value: unknown,
  fallback: string,
): string {
  const message = rule.message
  if (typeof message === 'function') return message({ value, rule })
  if (typeof message === 'string') return message
  return fallback
}

function formatInvalid(
  rule: RsFormRuleItem,
  value: unknown,
  tr: RsTranslateFn,
): string {
  return resolveRuleMessage(rule, value, tr('input.formatInvalid'))
}

/** 类型规则：string/number/array 或内置 email/phone 等 */
function checkTypeRule(
  value: unknown,
  rule: RsFormRuleItem,
  tr: RsTranslateFn,
): RsFormRuleValidateResult | null {
  const type = rule.type
  if (!type) return null

  if (type === 'string' && typeof value !== 'string') {
    return fail(formatInvalid(rule, value, tr))
  }
  if (type === 'number' && typeof value !== 'number') {
    return fail(formatInvalid(rule, value, tr))
  }
  if (type === 'array' && !Array.isArray(value)) {
    return fail(formatInvalid(rule, value, tr))
  }

  const isBuiltin =
    type !== 'string' && type !== 'number' && type !== 'array'
  if (isBuiltin && typeof value === 'string' && !validateInputRule(value, type)) {
    return fail(
      resolveRuleMessage(rule, value, getInputRuleMessage(type, tr)),
    )
  }

  return null
}

function checkPatternRule(
  value: unknown,
  rule: RsFormRuleItem,
  tr: RsTranslateFn,
): RsFormRuleValidateResult | null {
  if (!rule.pattern || typeof value !== 'string') return null
  if (rule.pattern.test(value)) return null
  return fail(formatInvalid(rule, value, tr))
}

function checkLengthRule(
  value: unknown,
  rule: RsFormRuleItem,
  tr: RsTranslateFn,
): RsFormRuleValidateResult | null {
  const length = valueLength(value)
  if (length == null) return null

  if (rule.len != null && length !== rule.len) {
    return fail(formatInvalid(rule, value, tr))
  }
  if (rule.min != null && length < rule.min) {
    return fail(formatInvalid(rule, value, tr))
  }
  if (rule.max != null && length > rule.max) {
    return fail(formatInvalid(rule, value, tr))
  }
  return null
}

async function checkValidatorRule(
  value: unknown,
  rule: RsFormRuleItem,
  tr: RsTranslateFn,
): Promise<RsFormRuleValidateResult | null> {
  if (!rule.validator) return null

  const result = await rule.validator(value)
  if (result === true || result === undefined || result === null) return null
  if (result === false) return fail(formatInvalid(rule, value, tr))
  if (typeof result === 'string') return fail(result)
  return null
}

/**
 * 执行单条规则；通过返回 null，失败返回结果。
 * 空值且非必填时跳过格式类规则。
 */
async function evaluateFormRule(
  value: unknown,
  rule: RsFormRuleItem,
  tr: RsTranslateFn,
): Promise<RsFormRuleValidateResult | null> {
  if (rule.required && isEmptyValue(value)) {
    return fail(resolveRuleMessage(rule, value, tr('input.required')))
  }
  if (isEmptyValue(value)) return null

  return (
    checkTypeRule(value, rule, tr) ??
    checkPatternRule(value, rule, tr) ??
    checkLengthRule(value, rule, tr) ??
    (await checkValidatorRule(value, rule, tr))
  )
}

/**
 * 按顺序执行字段规则，首条失败即返回。
 */
export async function runFormFieldRules(
  value: unknown,
  rules: RsFormRuleItem[],
  options?: {
    trigger?: RsFormRuleTrigger
    t?: RsTranslateFn
  },
): Promise<RsFormRuleValidateResult> {
  const tr = options?.t ?? createTranslator(defaultLocale)
  const trigger = options?.trigger

  for (const rule of rules) {
    if (!matchFormRuleTrigger(rule, trigger)) continue
    const failed = await evaluateFormRule(value, rule, tr)
    if (failed) return failed
  }

  return { valid: true }
}

/** 将 Input 局部 props 转为规则列表，便于与 Form rules 合并 */
export function buildLocalInputRules(options: {
  required?: boolean
  rule?: RsInputRule
  validator?: (value: string) => boolean | string
  requiredMessage?: string
}): RsFormRuleItem[] {
  const list: RsFormRuleItem[] = []
  if (options.required) {
    list.push({ required: true, message: options.requiredMessage })
  }
  if (options.rule) {
    list.push({ type: options.rule })
  }
  if (options.validator) {
    list.push({
      validator: (value) => options.validator!(String(value ?? '')),
    })
  }
  return list
}
