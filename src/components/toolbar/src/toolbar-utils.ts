import type { RsComponentSize } from '../../../theme/types'

export type RsToolbarSize = RsComponentSize
export type RsToolbarBorder = 'bottom' | 'top' | 'both' | 'none'
export type RsToolbarOrientation = 'horizontal' | 'vertical'

export interface RsToolbarExpose {
  /** 焦点落到当前命令控件；没有则落到第一项。禁用时不移动。 */
  focus: () => void
  /** 焦点若在工具条内则失焦。 */
  blur: () => void
}

export type RsToolbarInstance = RsToolbarExpose & { $el: HTMLElement }

const COMMAND_SELECTOR = [
  'button',
  'a[href]',
  'input',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
].join(',')

const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
])

const COMMAND_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'checkbox', 'radio'])

export function isToolbarTextField(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false
  const el = node.closest('input, textarea, select, [contenteditable="true"]')
  if (!el) return false
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
  if (el.getAttribute('contenteditable') === 'true') return true
  if (!(el instanceof HTMLInputElement)) return false
  const type = (el.type || 'text').toLowerCase()
  if (COMMAND_INPUT_TYPES.has(type) || type === 'hidden' || type === 'file' || type === 'image') {
    return false
  }
  return TEXT_INPUT_TYPES.has(type) || type === 'text'
}

export function isToolbarCommand(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.closest('[inert], [hidden]')) return false
  if (el.getAttribute('aria-hidden') === 'true') return false
  if (el.hasAttribute('disabled')) return false
  if (el.getAttribute('aria-disabled') === 'true') return false
  if (isToolbarTextField(el)) return false

  const tag = el.tagName
  if (tag === 'BUTTON') return true
  if (tag === 'A') return el.hasAttribute('href')
  if (tag === 'INPUT') {
    return COMMAND_INPUT_TYPES.has((el as HTMLInputElement).type.toLowerCase())
  }
  const role = el.getAttribute('role')
  return (
    role === 'button' ||
    role === 'menuitem' ||
    role === 'checkbox' ||
    role === 'radio' ||
    role === 'switch' ||
    role === 'tab'
  )
}

function hasCommandAncestor(el: Element, root: HTMLElement): boolean {
  let current = el.parentElement
  while (current && current !== root) {
    if (isToolbarCommand(current)) return true
    current = current.parentElement
  }
  return false
}

/** 收集工具条内可方向键移动的命令控件。输入框不进列表。无 window 假设。 */
export function collectToolbarCommands(root: HTMLElement | null | undefined): HTMLElement[] {
  if (!root) return []
  const items: HTMLElement[] = []
  for (const node of root.querySelectorAll(COMMAND_SELECTOR)) {
    if (!(node instanceof HTMLElement) || !isToolbarCommand(node)) continue
    if (hasCommandAncestor(node, root)) continue
    items.push(node)
  }
  return items
}

export function nextToolbarIndex(
  current: number,
  length: number,
  delta: number,
  loop: boolean,
): number {
  if (length <= 0) return -1
  if (current < 0) return delta > 0 ? 0 : length - 1
  const raw = current + delta
  if (loop) return ((raw % length) + length) % length
  return Math.max(0, Math.min(length - 1, raw))
}

export function resolveToolbarKeyboardDelta(
  key: string,
  orientation: RsToolbarOrientation,
  rtl: boolean,
): number | 'start' | 'end' | null {
  if (key === 'Home') return 'start'
  if (key === 'End') return 'end'
  if (orientation === 'vertical') {
    if (key === 'ArrowDown') return 1
    if (key === 'ArrowUp') return -1
    return null
  }
  if (key === 'ArrowRight') return rtl ? -1 : 1
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  return null
}

export function applyToolbarRovingTabindex(
  items: readonly HTMLElement[],
  active?: HTMLElement | null,
): HTMLElement | null {
  if (!items.length) return null
  const current =
    active && items.includes(active)
      ? active
      : (items.find((el) => el.tabIndex === 0) ?? items[0] ?? null)
  for (const el of items) {
    el.tabIndex = el === current ? 0 : -1
  }
  return current
}
