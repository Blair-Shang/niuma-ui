import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  type ComputedRef,
  type InjectionKey,
  type Ref,
  type VNodeChild,
} from 'vue'
import type { RsFormRuleItem, RsFormRuleTrigger, RsFormRules } from './form-rules'
import { normalizeFormRules } from './form-rules'

/** 自定义错误渲染上下文（Form / 字段共用） */
export interface RsFormErrorRenderContext {
  name?: string
  message: string
  value: unknown
}

/**
 * 自定义错误渲染（对齐 Ant Design Form.Item help / Element #error）。
 * 返回 VNode / 字符串；返回 null/undefined 时回退默认文案。
 */
export type RsFormErrorRender = (
  ctx: RsFormErrorRenderContext,
) => VNodeChild | null | undefined

export type RsFormLabelPosition = 'top' | 'left'
export type RsFormLabelAlign = 'start' | 'end'
export type RsFormSize = 'ssm' | 'sm' | 'md' | 'lg'
export type RsFormGap = 'sm' | 'md' | 'lg'
export type RsFormMaxWidth = 'sm' | 'md' | 'lg' | 'full' | 'none'

/** 整表校验结果（含按字段名聚合的错误） */
export interface RsFormValidationResult {
  valid: boolean
  /** 字段名 → 首条错误文案；无 name 的字段不计入 */
  errors: Record<string, string>
}

export interface RsFormFieldValidationResult {
  valid: boolean
  message?: string
  name?: string
}

export interface RsFormFieldExpose {
  /** 字段名，用于匹配 Form.rules */
  name?: string
  getValue: () => unknown
  setValue: (value: unknown) => void
  validate?: (
    trigger?: RsFormRuleTrigger,
  ) => RsFormFieldValidationResult | Promise<RsFormFieldValidationResult>
  clearValidation?: () => void
  /** 由 Form 或外部写入错误态 */
  setError?: (message: string) => void
}

export interface RsFormContext {
  disabled: Readonly<Ref<boolean>>
  labelPosition: ComputedRef<RsFormLabelPosition>
  labelWidth: Readonly<Ref<string>>
  labelAlign: Readonly<Ref<RsFormLabelAlign>>
  size: Readonly<Ref<RsFormSize>>
  /** 当前 Form 上的 rules（响应式读取） */
  rules: Readonly<Ref<RsFormRules | undefined>>
  getFieldRules: (name?: string) => RsFormRuleItem[]
  /** Form 级自定义错误渲染；字段无 #error 时使用 */
  renderError?: RsFormErrorRender
  registerField: (id: symbol, field: RsFormFieldExpose) => void
  unregisterField: (id: symbol) => void
}

export const RS_FORM_INJECTION_KEY: InjectionKey<RsFormContext> = Symbol('RsForm')

export function cloneFormFieldValue(value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (typeof value !== 'object') return value
  try {
    return structuredClone(value)
  } catch {
    return value
  }
}

export function provideRsFormContext(context: RsFormContext): void {
  provide(RS_FORM_INJECTION_KEY, context)
}

export function useRsFormContext(): RsFormContext | null {
  return inject(RS_FORM_INJECTION_KEY, null)
}

export function useRsFormField(getExpose: () => RsFormFieldExpose | undefined): void {
  const form = useRsFormContext()
  if (!form) return

  const fieldId = Symbol('rs-form-field')

  onMounted(() => {
    const expose = getExpose()
    if (expose) form.registerField(fieldId, expose)
  })

  onUnmounted(() => {
    form.unregisterField(fieldId)
  })
}

export function resolveRsFormSize(
  size?: RsFormSize,
  form?: RsFormContext | null,
): ComputedRef<RsFormSize> {
  return computed(() => size ?? form?.size.value ?? 'md')
}

/** 供 Form 内部解析某字段 rules */
export function resolveFieldRules(
  rules: RsFormRules | undefined,
  name?: string,
): RsFormRuleItem[] {
  if (!name || !rules) return []
  return normalizeFormRules(rules[name])
}
