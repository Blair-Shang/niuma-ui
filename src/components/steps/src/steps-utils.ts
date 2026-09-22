import type { RsComponentSize } from '../../../theme/types'

export type RsStepStatus = 'wait' | 'process' | 'finish' | 'error'
export type RsStepsOrientation = 'horizontal' | 'vertical'
export type RsStepsSize = RsComponentSize
export type RsStepsLabelPlacement = 'end' | 'bottom'
export type RsStepsType = 'default' | 'dot'

export interface RsStepItem {
  value: string
  title: string
  description?: string
  status?: RsStepStatus
  disabled?: boolean
  /** Lucide kebab-case。有值时覆盖默认数字 / 勾 / 叉。 */
  icon?: string
}

export interface RsStepsRenderItem {
  item: RsStepItem
  index: number
  status: RsStepStatus
  active: boolean
  disabled: boolean
  completedSeparator: boolean
  indicator: 'number' | 'icon' | 'check' | 'error' | 'dot'
}

export interface RsStepsItemSlot {
  item: RsStepItem
  index: number
  status: RsStepStatus
  active: boolean
  disabled: boolean
}

export interface RsStepsExpose {
  /** 跳到下一个未禁用步骤。已在末级或没有可选项时返回 undefined。 */
  next: () => string | undefined
  /** 跳到上一个未禁用步骤。已在首级或没有可选项时返回 undefined。 */
  prev: () => string | undefined
  /** 跳到指定 value。找不到或禁用时返回 false。 */
  goTo: (value: string) => boolean
  /** 焦点落到指定步骤；未传则落到当前步。不可点时也能落（tabindex=-1）。 */
  focus: (value?: string) => void
}

export type RsStepsInstance = RsStepsExpose & { $el: HTMLElement }

export function resolveStepStatus(index: number, activeIndex: number, explicit?: RsStepStatus): RsStepStatus {
  if (explicit) return explicit
  if (index < activeIndex) return 'finish'
  if (index === activeIndex) return 'process'
  return 'wait'
}

export function isStepSeparatorCompleted(status: RsStepStatus): boolean {
  return status === 'finish'
}

/** model 对不上任一项时回退 0，与原先 Math.max(0, findIndex) 一致。 */
export function resolveActiveStepIndex(items: readonly RsStepItem[], value?: string): number {
  return Math.max(0, items.findIndex((item) => item.value === value))
}

/**
 * 单项 status 优先；当前步可用组件级 status 覆盖自动推导（对标 Ant Design status）。
 */
export function resolveCurrentStepStatus(
  index: number,
  activeIndex: number,
  itemStatus?: RsStepStatus,
  currentStatus?: RsStepStatus,
): RsStepStatus {
  if (itemStatus) return itemStatus
  if (index === activeIndex && currentStatus) return currentStatus
  return resolveStepStatus(index, activeIndex)
}

export function clampStepPercent(percent?: number): number | undefined {
  if (percent == null || Number.isNaN(Number(percent))) return undefined
  return Math.min(100, Math.max(0, Number(percent)))
}

export function resolveSelectableStepValues(items: readonly RsStepItem[]): string[] {
  const values: string[] = []
  for (const item of items) {
    if (!item.disabled) values.push(item.value)
  }
  return values
}

export function resolveAdjacentStepValue(
  values: readonly string[],
  current: string | undefined,
  delta: number,
): string | undefined {
  if (values.length === 0) return undefined
  const index = current ? values.indexOf(current) : -1
  let next = index + delta
  if (index < 0) next = delta > 0 ? 0 : values.length - 1
  if (next < 0 || next >= values.length) return undefined
  return values[next]
}

/**
 * 可点步骤的键盘位移。竖排只用上下；横排左右在 RTL 下对调。
 * Home / End 返回端点；不处理的键返回 null。
 */
export function resolveStepKeyboardMove(
  key: string,
  orientation: RsStepsOrientation,
  rtl = false,
): number | 'start' | 'end' | null {
  if (key === 'Home') return 'start'
  if (key === 'End') return 'end'
  if (orientation === 'vertical') {
    if (key === 'ArrowUp') return -1
    if (key === 'ArrowDown') return 1
    return null
  }
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  return null
}

export function resolveStepIndicator(
  status: RsStepStatus,
  type: RsStepsType,
  icon?: string,
): RsStepsRenderItem['indicator'] {
  if (type === 'dot') return 'dot'
  if (icon) return 'icon'
  if (status === 'finish') return 'check'
  if (status === 'error') return 'error'
  return 'number'
}

export function buildStepRenderItems(
  items: readonly RsStepItem[],
  activeIndex: number,
  type: RsStepsType = 'default',
  currentStatus?: RsStepStatus,
): RsStepsRenderItem[] {
  return items.map((item, index) => {
    const status = resolveCurrentStepStatus(index, activeIndex, item.status, currentStatus)
    return {
      item,
      index,
      status,
      active: index === activeIndex,
      disabled: Boolean(item.disabled),
      completedSeparator: isStepSeparatorCompleted(status),
      indicator: resolveStepIndicator(status, type, item.icon),
    }
  })
}
