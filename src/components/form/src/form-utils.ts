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
import type { RsFormRuleItem, RsFormRuleTrigger, RsFormRules, RsFormValidateMessages } from './form-rules'
import { normalizeFormRules } from './form-rules'
import { namePathKey, type RsFormNamePath } from './form-path'

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

/** Form.Item 校验态（对齐 Ant Design validateStatus） */
export type RsFormValidateStatus = 'success' | 'warning' | 'error' | 'validating' | ''

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
  /** 可选数据中枢（Form.model） */
  model: Readonly<Ref<Record<string, unknown> | undefined>>
  validateMessages: ComputedRef<RsFormValidateMessages | undefined>
  getFieldValue: (name: RsFormNamePath) => unknown
  setFieldValue: (name: RsFormNamePath, value: unknown) => void
  getFieldsValue: () => Record<string, unknown>
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

/**
 * Form.Item 上下文（对齐 Element `elFormItem` / Ant Design Form.Item）。
 * invalid 只属于绑定控件：Item 通过 cloneElement 打到直接子节点，
 * 子孙里的搜索框等应先用 isRsFormItemBoundControl 判断，不要一律跟 Item 变红。
 */
export interface RsFormItemContext {
  name: ComputedRef<string | undefined>
  /** 已声明 name 时 Item 拥有字段，内置控件不再向 Form 注册 */
  ownsField: ComputedRef<boolean>
  invalid: ComputedRef<boolean>
  message: ComputedRef<string>
  status: ComputedRef<RsFormValidateStatus>
  fieldId: ComputedRef<string>
  errorId: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
}

export const RS_FORM_ITEM_INJECTION_KEY: InjectionKey<RsFormItemContext> =
  Symbol('RsFormItem')

export function provideRsFormItemContext(context: RsFormItemContext): void {
  provide(RS_FORM_ITEM_INJECTION_KEY, context)
}

export function useRsFormItemContext(): RsFormItemContext | null {
  return inject(RS_FORM_ITEM_INJECTION_KEY, null)
}

/**
 * Form.List 上下文：子 Item 的 name 会拼上 List 前缀（users + [0, 'name'] → users.0.name）。
 */
export interface RsFormListContext {
  prefix: ComputedRef<Array<string | number>>
}

/** Form.List 默认插槽中的一行 */
export interface RsFormListField {
  /** 稳定行键，用于 v-for */
  key: number
  /** 当前下标，作为子 Item name 的第一段 */
  name: number
  index: number
}

/** Form.List 增删改操作 */
export interface RsFormListOperations {
  add: (defaultValue?: unknown) => void
  remove: (index: number) => void
  move: (from: number, to: number) => void
}

export const RS_FORM_LIST_INJECTION_KEY: InjectionKey<RsFormListContext> =
  Symbol('RsFormList')

export function provideRsFormListContext(context: RsFormListContext): void {
  provide(RS_FORM_LIST_INJECTION_KEY, context)
}

export function useRsFormListContext(): RsFormListContext | null {
  return inject(RS_FORM_LIST_INJECTION_KEY, null)
}

export function provideRsFormContext(context: RsFormContext): void {
  provide(RS_FORM_INJECTION_KEY, context)
}

export function useRsFormContext(): RsFormContext | null {
  return inject(RS_FORM_INJECTION_KEY, null)
}

/**
 * 是否为 Form.Item 的绑定控件（对齐 Ant Design cloneElement）。
 * name 与 Item 相同，或 id 等于 Item 注入的 fieldId。
 */
export function isRsFormItemBoundControl(
  item: RsFormItemContext | null | undefined,
  control: { id?: string; name?: string },
): boolean {
  if (!item?.ownsField.value) return false
  const itemName = item.name.value
  if (control.name && itemName && namePathKey(control.name) === itemName) return true
  if (control.id && control.id === item.fieldId.value) return true
  return false
}

export function useRsFormField(getExpose: () => RsFormFieldExpose | undefined): void {
  const form = useRsFormContext()
  const item = useRsFormItemContext()
  if (!form) return

  const fieldId = Symbol('rs-form-field')

  onMounted(() => {
    // Item 已按 name 注册时，内置控件只负责录入，避免重复校验
    if (item?.ownsField.value) return
    const expose = getExpose()
    // 对齐 Ant / RHF：无 name 不进字段表，弹层搜索框不参与外层校验
    if (!expose?.name) return
    form.registerField(fieldId, expose)
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
