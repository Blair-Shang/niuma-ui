<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  nextTick,
  onUnmounted,
  ref,
  useId,
  useSlots,
  watch,
  type VNode,
} from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { rsRadiusCss } from '../../_shared/src/resolve-radius'
import RsContextMenuItems from './RsContextMenuItems.vue'
import {
  claimContextMenu,
  escapeContextMenuSelector,
  findContextMenuItem,
  firstEnabledContextMenuKey,
  hasActionableContextMenuItems,
  hasContextMenuChildren,
  isContextMenuSeparator,
  lastEnabledContextMenuKey,
  listContextMenuLayerItems,
  matchContextMenuTypeahead,
  placeContextMenuPoint,
  placeContextMenuSubmenu,
  releaseContextMenu,
  resolveContextMenuElement,
  resolveContextMenuKeys,
  resolveContextMenuLayers,
  resolveContextMenuPortalTarget,
  shouldCloseContextMenuOnSelect,
  stepContextMenuKey,
  RS_CONTEXT_MENU_ICON_SIZE,
  type RsContextMenuExpose,
  type RsContextMenuGetPopupContainer,
  type RsContextMenuItem,
  type RsContextMenuPoint,
  type RsContextMenuPointBox,
} from './context-menu-utils'

defineOptions({ name: 'RsContextMenu', inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    items: RsContextMenuItem[]
    /** 禁用时不拦截右键，浏览器原生菜单照常出现 */
    disabled?: boolean
    /** 行高。不传保持紧凑的右键密度，不跟 Form / ConfigProvider 的控件 size。 */
    size?: RsComponentSize
    /** 面板与条目圆角。不传用 --rs-ctx-radius。 */
    radius?: RsRadius
    /** 普通项选中后关闭。checkbox / radio 默认保持打开。 */
    hideOnSelect?: boolean
    getPopupContainer?: RsContextMenuGetPopupContainer
    popupClassName?: string
    /** 面板最大高度（px）。不传则贴视口。 */
    maxHeight?: number
    ariaLabel?: string
    id?: string
    /** 关闭后卸下面板。false 只隐藏，避免反复创建。 */
    destroyOnHide?: boolean
  }>(),
  {
    disabled: false,
    hideOnSelect: true,
    destroyOnHide: true,
  },
)

const emit = defineEmits<{
  select: [key: string]
  openChange: [open: boolean]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const slots = useSlots()
const autoId = useId()
const menuId = computed(() => props.id || autoId)
const configRtl = computed(
  () => resolveDirMode(config?.dir.value ?? 'auto', config?.locale.value ?? locale.value) === 'rtl',
)
const menuLabel = computed(() => props.ariaLabel || t('contextMenu.menu'))
const iconSize = computed(() =>
  props.size ? RS_COMPONENT_SIZE_ICON_PX[props.size] : RS_CONTEXT_MENU_ICON_SIZE,
)
const portalTarget = computed(() =>
  resolveContextMenuPortalTarget(props.getPopupContainer, triggerEl.value),
)
const showPanel = computed(() => open.value || !props.destroyOnHide)

const triggerEl = ref<HTMLElement | null>(null)
const anchor = ref<RsContextMenuPoint>({ x: 0, y: 0 })
const submenuPath = ref<string[]>([])
const rootHighlight = ref('')
const subHighlights = ref<Record<string, string>>({})
const boxes = ref<Record<string, RsContextMenuPointBox>>({})
const settled = ref<Record<string, true>>({})
const panelTheme = ref<string | undefined>()
const panelDir = ref<'ltr' | 'rtl'>('ltr')
const panelLang = ref<string | undefined>()

const isRtl = computed(() => (open.value ? panelDir.value === 'rtl' : configRtl.value))

const layers = computed(() =>
  resolveContextMenuLayers(props.items, submenuPath.value).map((layer, depth) => ({
    ...layer,
    depth,
    openKey: submenuPath.value[depth] ?? '',
  })),
)

type ItemListApi = {
  getHighlight: () => string
  setHighlight: (key: string) => void
}

const layerEls = new Map<string, HTMLElement>()
const layerRefs = new Map<string, (el: unknown) => void>()
const itemRefs = new Map<string, (el: unknown) => void>()
const itemLists = new Map<string, ItemListApi>()
let frame = 0
let overlayBound = false
let openWatchReady = false
let ignoreContextClose = false
let pointLocked = false
let restoreOnClose = false
let restoreTarget: HTMLElement | null = null
let subOpenTimer: ReturnType<typeof setTimeout> | undefined
let subCloseTimer: ReturnType<typeof setTimeout> | undefined
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
let typeaheadQuery = ''
let resizeObserver: ResizeObserver | undefined
let swallowStop: ((event: MouseEvent) => void) | undefined

const SUB_OPEN_MS = 80
const SUB_CLOSE_MS = 160
const ESTIMATE_W = 176
const ESTIMATE_H = 32

function requestClose() {
  restoreOnClose = false
  pointLocked = false
  if (open.value) open.value = false
}

function pointFromTrigger(): RsContextMenuPoint {
  const el = triggerEl.value
  if (!el) return { x: 8, y: 8 }
  const rect = el.getBoundingClientRect()
  return { x: rect.left + 8, y: rect.top + Math.min(rect.height, 24) }
}

function setOpen(next: boolean, point?: RsContextMenuPoint) {
  if (next) {
    if (point) {
      anchor.value = point
      pointLocked = true
    } else if (!open.value) {
      pointLocked = false
      anchor.value = pointFromTrigger()
    }
    if (props.disabled || !hasActionableContextMenuItems(props.items)) {
      pointLocked = false
      if (open.value) open.value = false
      return
    }
  }
  if (open.value === next) {
    if (next) requestPlace()
    return
  }
  open.value = next
}

function highlightOf(layerId: string): string {
  const live = itemLists.get(layerId)?.getHighlight()
  if (live) return live
  if (layerId === 'root') return rootHighlight.value
  return subHighlights.value[layerId] ?? ''
}

function setHighlight(layerId: string, key: string) {
  if (!key || highlightOf(layerId) === key) return
  const list = itemLists.get(layerId)
  if (list) {
    list.setHighlight(key)
    return
  }
  if (layerId === 'root') rootHighlight.value = key
  else subHighlights.value = { ...subHighlights.value, [layerId]: key }
}

function layerHighlight(id: string): string {
  if (id === 'root') return rootHighlight.value
  return subHighlights.value[id] ?? ''
}

function setPath(next: string[]) {
  const keep = new Set(next)
  const settledNext: Record<string, true> = {}
  for (const id of Object.keys(settled.value)) {
    if (id === 'root' || keep.has(id)) settledNext[id] = true
  }
  if (Object.keys(settledNext).length !== Object.keys(settled.value).length) {
    settled.value = settledNext
  }
  const boxesNext: Record<string, RsContextMenuPointBox> = {}
  for (const id of Object.keys(boxes.value)) {
    const box = boxes.value[id]
    if (box && (id === 'root' || keep.has(id))) boxesNext[id] = box
  }
  if (Object.keys(boxesNext).length !== Object.keys(boxes.value).length) boxes.value = boxesNext
  submenuPath.value = next
}

function revealSettled() {
  const next: Record<string, true> = {}
  for (const layer of layers.value) {
    if (boxes.value[layer.id]) next[layer.id] = true
  }
  const prev = settled.value
  const nextKeys = Object.keys(next)
  if (nextKeys.length === Object.keys(prev).length && nextKeys.every((id) => prev[id])) return
  settled.value = next
}

function settleLayers(after?: () => void, prepare?: () => void) {
  void nextTick(() => {
    if (!open.value) return
    prepare?.()
    placeAll()
    void nextTick(() => {
      if (!open.value) return
      placeAll()
      revealSettled()
      after?.()
    })
  })
}

function readPanelDir(el: HTMLElement | null): 'ltr' | 'rtl' {
  const dirHost = el?.closest('[dir]')
  if (dirHost instanceof HTMLElement && (dirHost.dir === 'rtl' || dirHost.dir === 'ltr')) {
    return dirHost.dir
  }
  return configRtl.value ? 'rtl' : 'ltr'
}

function syncPanelChrome() {
  const el = triggerEl.value
  const themed = el?.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
  panelDir.value = readPanelDir(el)
  const langHost = el?.closest('[lang]')
  panelLang.value = langHost instanceof HTMLElement ? langHost.lang || undefined : undefined
}

function sameBoxes(
  prev: Record<string, RsContextMenuPointBox>,
  next: Record<string, RsContextMenuPointBox>,
): boolean {
  const keys = Object.keys(next)
  if (keys.length !== Object.keys(prev).length) return false
  return keys.every((key) => {
    const left = prev[key]
    const right = next[key]
    return (
      left &&
      right &&
      left.top === right.top &&
      left.left === right.left &&
      left.maxHeight === right.maxHeight &&
      left.originX === right.originX &&
      left.originY === right.originY
    )
  })
}

function placeAll() {
  if (!open.value || typeof window === 'undefined') return
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const rtl = panelDir.value === 'rtl'
  const next: Record<string, RsContextMenuPointBox> = {}
  for (const layer of layers.value) {
    const el = layerEls.get(layer.id)
    const measured = el?.getBoundingClientRect()
    const popup = {
      width: measured?.width || ESTIMATE_W,
      height: measured?.height || ESTIMATE_H,
    }
    if (layer.id === 'root') {
      const placed = roundBox(placeContextMenuPoint(anchor.value, popup, viewport, 8, rtl))
      next[layer.id] =
        props.maxHeight != null
          ? { ...placed, maxHeight: Math.min(placed.maxHeight, Math.max(0, props.maxHeight)) }
          : placed
      continue
    }
    const parent = layers.value[layer.depth - 1]
    const parentEl = parent ? layerEls.get(parent.id) : undefined
    const trigger = parentEl?.querySelector<HTMLElement>(
      `[data-ctx-key="${escapeContextMenuSelector(layer.parentKey ?? '')}"]`,
    )
    if (!trigger) continue
    const rect = trigger.getBoundingClientRect()
    const placed = roundBox(
      placeContextMenuSubmenu(
        { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        popup,
        viewport,
        rtl,
      ),
    )
    next[layer.id] =
      props.maxHeight != null
        ? { ...placed, maxHeight: Math.min(placed.maxHeight, Math.max(0, props.maxHeight)) }
        : placed
  }
  if (!sameBoxes(boxes.value, next)) boxes.value = next
}

function requestPlace() {
  if (typeof window === 'undefined' || !open.value) return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placeAll()
  })
}

function observeLayers() {
  if (typeof ResizeObserver === 'undefined') return
  if (!resizeObserver) resizeObserver = new ResizeObserver(() => requestPlace())
  resizeObserver.disconnect()
  for (const el of layerEls.values()) resizeObserver.observe(el)
}

function setLayerEl(id: string, value: unknown) {
  if (value instanceof HTMLElement) {
    if (layerEls.get(id) === value) return
    layerEls.set(id, value)
  } else {
    if (!layerEls.has(id)) return
    layerEls.delete(id)
    return
  }
  if (open.value) {
    observeLayers()
    requestPlace()
  }
}

function layerRefFor(id: string): (el: unknown) => void {
  const existing = layerRefs.get(id)
  if (existing) return existing
  const fn = (el: unknown) => setLayerEl(id, el)
  layerRefs.set(id, fn)
  return fn
}

function itemsRefFor(id: string): (el: unknown) => void {
  const existing = itemRefs.get(id)
  if (existing) return existing
  const fn = (el: unknown) => bindItems(id, el)
  itemRefs.set(id, fn)
  return fn
}

function bindItems(id: string, value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'getHighlight' in value &&
    'setHighlight' in value &&
    typeof value.getHighlight === 'function' &&
    typeof value.setHighlight === 'function'
  ) {
    itemLists.set(id, value as ItemListApi)
    return
  }
  itemLists.delete(id)
}

function layerStyle(id: string): Record<string, string> {
  const box = boxes.value[id]
  const style: Record<string, string> = {
    top: `${box?.top ?? anchor.value.y}px`,
    left: `${box?.left ?? anchor.value.x}px`,
    zIndex: 'var(--rs-ctx-z)',
  }
  if (box) style.maxHeight = `${box.maxHeight}px`
  else if (props.maxHeight != null) style.maxHeight = `${Math.max(0, props.maxHeight)}px`
  if (props.radius) {
    const radius = rsRadiusCss(props.radius)
    style['--rs-ctx-radius'] = radius
    style['--rs-ctx-item-radius'] = radius
  }
  return style
}

function isInsideMenu(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false
  for (const el of layerEls.values()) {
    if (el === target || el.contains(target)) return true
  }
  return false
}

function layerIdFromTarget(target: EventTarget | null): string {
  if (target instanceof Node) {
    for (const layer of [...layers.value].reverse()) {
      const el = layerEls.get(layer.id)
      if (el && (el === target || el.contains(target))) return layer.id
    }
  }
  return layers.value[layers.value.length - 1]?.id ?? 'root'
}

function focusWithoutScroll(el: HTMLElement) {
  try {
    el.focus({ preventScroll: true })
  } catch {
    el.focus()
  }
}

function roundBox(box: RsContextMenuPointBox): RsContextMenuPointBox {
  return {
    top: Math.round(box.top),
    left: Math.round(box.left),
    maxHeight: Math.round(box.maxHeight),
    originX: box.originX,
    originY: box.originY,
  }
}

function focusLayerItem(layerId: string, key: string) {
  const root = layerEls.get(layerId)
  if (!root) return
  if (!key) {
    focusWithoutScroll(root)
    return
  }
  const el = root.querySelector<HTMLElement>(`[data-ctx-key="${escapeContextMenuSelector(key)}"]`)
  if (el) focusWithoutScroll(el)
  else focusWithoutScroll(root)
}

function clearSubOpen() {
  if (!subOpenTimer) return
  clearTimeout(subOpenTimer)
  subOpenTimer = undefined
}

function clearSubClose() {
  if (!subCloseTimer) return
  clearTimeout(subCloseTimer)
  subCloseTimer = undefined
}

function clearSubTimers() {
  clearSubOpen()
  clearSubClose()
}

function clearTypeahead() {
  typeaheadQuery = ''
  if (!typeaheadTimer) return
  clearTimeout(typeaheadTimer)
  typeaheadTimer = undefined
}

function openSubmenu(key: string, depth: number) {
  clearSubTimers()
  const next = submenuPath.value.slice(0, depth)
  next.push(key)
  const parent = findContextMenuItem(props.items, key)
  if (!subHighlights.value[key]) {
    subHighlights.value = {
      ...subHighlights.value,
      [key]: firstEnabledContextMenuKey(parent?.children ?? []),
    }
  }
  setPath(next)
  const focusKey = subHighlights.value[key] ?? ''
  settleLayers(() => focusLayerItem(key, focusKey))
}

function scheduleOpen(key: string, depth: number) {
  clearSubOpen()
  clearSubClose()
  subOpenTimer = setTimeout(() => {
    subOpenTimer = undefined
    openSubmenu(key, depth)
  }, SUB_OPEN_MS)
}

function scheduleCloseFrom(depth: number) {
  clearSubOpen()
  clearSubClose()
  subCloseTimer = setTimeout(() => {
    subCloseTimer = undefined
    setPath(submenuPath.value.slice(0, depth))
  }, SUB_CLOSE_MS)
}

function armLayerLeave() {
  clearSubClose()
  subCloseTimer = setTimeout(() => {
    subCloseTimer = undefined
    clearSubOpen()
    setPath([])
  }, SUB_CLOSE_MS)
}

function onItemHover(layerId: string, depth: number, item: RsContextMenuItem) {
  clearSubClose()
  if (item.disabled || !hasContextMenuChildren(item)) {
    scheduleCloseFrom(depth)
    return
  }
  scheduleOpen(item.key, depth)
}

function onSelect(item: RsContextMenuItem, depth: number) {
  if (item.disabled || isContextMenuSeparator(item)) return
  if (hasContextMenuChildren(item)) {
    openSubmenu(item.key, depth)
    return
  }
  emit('select', item.key)
  if (shouldCloseContextMenuOnSelect(item, props.hideOnSelect)) {
    restoreOnClose = true
    setOpen(false)
  }
}

function prunePath() {
  const next: string[] = []
  let current = props.items
  for (const key of submenuPath.value) {
    const parent = current.find((item) => item.key === key && hasContextMenuChildren(item))
    if (!parent?.children?.length) break
    next.push(key)
    current = parent.children
  }
  if (next.length !== submenuPath.value.length) setPath(next)
}

function attach() {
  if (overlayBound || typeof document === 'undefined') return
  overlayBound = true
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onDocKeydown, true)
  document.addEventListener('contextmenu', onDocContextMenu)
  window.addEventListener('resize', requestPlace)
  window.addEventListener('scroll', onWindowScroll, true)
}

function detach() {
  if (typeof document !== 'undefined' && overlayBound) {
    document.removeEventListener('pointerdown', onDocPointerDown, true)
    document.removeEventListener('keydown', onDocKeydown, true)
    document.removeEventListener('contextmenu', onDocContextMenu)
    window.removeEventListener('resize', requestPlace)
    window.removeEventListener('scroll', onWindowScroll, true)
  }
  overlayBound = false
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  resizeObserver?.disconnect()
  resizeObserver = undefined
}

function clearSwallow() {
  if (swallowStop && typeof document !== 'undefined') {
    document.removeEventListener('click', swallowStop, true)
  }
  swallowStop = undefined
}

function armSwallow() {
  if (typeof document === 'undefined') return
  clearSwallow()
  const stop = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    clearSwallow()
  }
  swallowStop = stop
  document.addEventListener('click', stop, true)
  window.setTimeout(() => {
    if (swallowStop === stop) clearSwallow()
  }, 400)
}

function onDocPointerDown(event: PointerEvent) {
  if (!open.value || event.button !== 0) return
  if (isInsideMenu(event.target)) return
  armSwallow()
  restoreOnClose = false
  setOpen(false)
}

function onDocContextMenu(event: MouseEvent) {
  if (!open.value || ignoreContextClose) return
  if (isInsideMenu(event.target)) {
    event.preventDefault()
    return
  }
  if (triggerEl.value && event.target instanceof Node && triggerEl.value.contains(event.target)) return
  restoreOnClose = false
  setOpen(false)
}

function onWindowScroll(event: Event) {
  if (!open.value) return
  const target = event.target
  if (target instanceof Node && isInsideMenu(target)) return
  restoreOnClose = false
  setOpen(false)
}

function closeTopLayer() {
  if (!submenuPath.value.length) {
    restoreOnClose = true
    setOpen(false)
    return
  }
  setPath(submenuPath.value.slice(0, -1))
  void nextTick(() => {
    const parent = layers.value.at(-1)
    if (parent) focusLayerItem(parent.id, highlightOf(parent.id))
  })
}

function moveHighlight(layerId: string, key: string) {
  setHighlight(layerId, key)
  focusLayerItem(layerId, key)
}

function onTypeahead(layerId: string, items: RsContextMenuItem[], key: string) {
  typeaheadQuery += key.toLowerCase()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => {
    typeaheadQuery = ''
    typeaheadTimer = undefined
  }, 500)
  const list = listContextMenuLayerItems(items)
  const from = list.findIndex((item) => item.key === highlightOf(layerId))
  const index = matchContextMenuTypeahead(items, typeaheadQuery, from)
  const next = index >= 0 ? list[index]?.key : ''
  if (next) moveHighlight(layerId, next)
}

function onLayerKey(event: KeyboardEvent, layer: { id: string; items: RsContextMenuItem[]; depth: number }) {
  const keys = resolveContextMenuKeys(isRtl.value)
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeTopLayer()
    return
  }
  if (event.key === 'Tab') {
    restoreOnClose = false
    setOpen(false)
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    event.stopPropagation()
    const delta = event.key === 'ArrowDown' ? 1 : -1
    moveHighlight(layer.id, stepContextMenuKey(layer.items, highlightOf(layer.id), delta))
    return
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    event.stopPropagation()
    const next =
      event.key === 'Home' ? firstEnabledContextMenuKey(layer.items) : lastEnabledContextMenuKey(layer.items)
    moveHighlight(layer.id, next)
    return
  }
  if (event.key === keys.openSub) {
    const current = listContextMenuLayerItems(layer.items).find((item) => item.key === highlightOf(layer.id))
    if (current && hasContextMenuChildren(current) && !current.disabled) {
      event.preventDefault()
      event.stopPropagation()
      openSubmenu(current.key, layer.depth)
    }
    return
  }
  if (event.key === keys.closeSub && layer.depth > 0) {
    event.preventDefault()
    event.stopPropagation()
    setPath(submenuPath.value.slice(0, layer.depth - 1))
    void nextTick(() => {
      const parent = layers.value[layer.depth - 1]
      if (parent) focusLayerItem(parent.id, highlightOf(parent.id))
    })
    return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    onTypeahead(layer.id, layer.items, event.key)
  }
}

function onDocKeydown(event: KeyboardEvent) {
  if (!open.value || event.isComposing) return
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    restoreOnClose = true
    setOpen(false)
    return
  }
  const layerId = layerIdFromTarget(target)
  const layer = layers.value.find((item) => item.id === layerId) ?? layers.value.at(-1)
  if (!layer) return
  onLayerKey(event, layer)
}

function onTriggerContextMenu(event: MouseEvent) {
  if (props.disabled) return
  if (!hasActionableContextMenuItems(props.items)) {
    event.preventDefault()
    setOpen(false)
    return
  }
  event.preventDefault()
  ignoreContextClose = true
  queueMicrotask(() => {
    ignoreContextClose = false
  })
  setOpen(true, { x: event.clientX, y: event.clientY })
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled || event.isComposing || open.value) return
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    event.preventDefault()
    setOpen(true)
  }
}

function assignTrigger(value: unknown) {
  triggerEl.value = resolveContextMenuElement(value)
}

function flattenNodes(nodes: unknown, out: VNode[] = []): VNode[] {
  if (nodes == null || typeof nodes === 'boolean') return out
  if (Array.isArray(nodes)) {
    for (const node of nodes) flattenNodes(node, out)
    return out
  }
  if (!isVNode(nodes)) return out
  if (nodes.type === Comment || nodes.type === Text) return out
  if (nodes.type === Fragment && Array.isArray(nodes.children)) {
    flattenNodes(nodes.children, out)
    return out
  }
  out.push(nodes)
  return out
}

function callListeners(existing: unknown, event: Event) {
  if (typeof existing === 'function') existing(event)
  else if (Array.isArray(existing)) {
    for (const fn of existing) {
      if (typeof fn === 'function') fn(event)
    }
  }
}

const TriggerHost = defineComponent({
  name: 'RsContextMenuTrigger',
  setup() {
    return () => {
      const nodes = flattenNodes(slots.default?.())
      const target = nodes[0]
      if (!target) return null
      const cloned = cloneVNode(
        target,
        {
          ref: assignTrigger,
          'aria-haspopup': 'menu',
          'aria-expanded': open.value ? 'true' : 'false',
          'aria-controls': open.value ? menuId.value : undefined,
          onContextmenu: (event: MouseEvent) => {
            callListeners(target.props?.onContextmenu, event)
            onTriggerContextMenu(event)
          },
          onKeydown: (event: KeyboardEvent) => {
            callListeners(target.props?.onKeydown, event)
            onTriggerKeydown(event)
          },
        },
        true,
      )
      return nodes.length === 1 ? cloned : [cloned, ...nodes.slice(1)]
    }
  },
})

const exposeApi: RsContextMenuExpose = {
  open: (point) => setOpen(true, point),
  close: () => {
    restoreOnClose = false
    setOpen(false)
  },
}

defineExpose(exposeApi)

watch(
  open,
  (isOpen) => {
    const skip = !openWatchReady
    openWatchReady = true
    if (isOpen) {
      if (props.disabled || !hasActionableContextMenuItems(props.items)) {
        open.value = false
        return
      }
      claimContextMenu(requestClose)
      settled.value = {}
      submenuPath.value = []
      subHighlights.value = {}
      rootHighlight.value = firstEnabledContextMenuKey(props.items)
      syncPanelChrome()
      if (!pointLocked) anchor.value = pointFromTrigger()
      attach()
      if (typeof document !== 'undefined') {
        restoreTarget =
          document.activeElement instanceof HTMLElement ? document.activeElement : triggerEl.value
      }
      settleLayers(
        () => focusLayerItem('root', rootHighlight.value),
        () => {
          if (!pointLocked) anchor.value = pointFromTrigger()
          syncPanelChrome()
          observeLayers()
        },
      )
      if (!skip) emit('openChange', true)
      return
    }
    detach()
    releaseContextMenu(requestClose)
    clearSubTimers()
    clearTypeahead()
    submenuPath.value = []
    settled.value = {}
    boxes.value = {}
    const shouldRestore = restoreOnClose
    restoreOnClose = false
    const back = restoreTarget
    restoreTarget = null
    pointLocked = false
    if (shouldRestore && back) focusWithoutScroll(back)
    if (!skip) emit('openChange', false)
  },
  { immediate: true },
)

watch(
  () => props.items,
  (items) => {
    if (!hasActionableContextMenuItems(items)) {
      if (open.value) open.value = false
      return
    }
    if (!open.value) return
    prunePath()
    const enabled = listContextMenuLayerItems(items)
    if (!enabled.some((item) => item.key === highlightOf('root') && !item.disabled)) {
      const next = firstEnabledContextMenuKey(items)
      rootHighlight.value = next
      itemLists.get('root')?.setHighlight(next)
    }
    requestPlace()
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled && open.value) open.value = false
  },
)

onUnmounted(() => {
  detach()
  releaseContextMenu(requestClose)
  clearSubTimers()
  clearTypeahead()
  clearSwallow()
  layerRefs.clear()
  itemRefs.clear()
  itemLists.clear()
})
</script>

<template>
  <TriggerHost v-if="!disabled" />
  <slot v-else />
  <Teleport v-if="showPanel" :to="portalTarget">
    <div v-show="open" class="rs-context-menu__portal">
      <div
        v-for="layer in layers"
        :id="layer.id === 'root' ? menuId : undefined"
        :key="layer.id"
        :ref="layerRefFor(layer.id)"
        class="rs-context-menu__content rs-native-scrollbar rs-motion-reduce"
        :class="[
          layer.id !== 'root' && 'rs-context-menu__sub-content',
          size && `rs-context-menu--${size}`,
          popupClassName,
        ]"
        role="menu"
        :aria-label="layer.id === 'root' ? menuLabel : t('contextMenu.submenu')"
        :dir="panelDir"
        :lang="panelLang"
        :data-rs-theme="panelTheme"
        :data-placed="settled[layer.id] ? '' : undefined"
        :data-origin-x="boxes[layer.id]?.originX"
        :data-origin-y="boxes[layer.id]?.originY"
        :style="layerStyle(layer.id)"
        tabindex="-1"
        @pointerenter="clearSubClose"
        @pointerleave="armLayerLeave"
        @contextmenu.prevent
      >
        <RsContextMenuItems
          :ref="itemsRefFor(layer.id)"
          :items="layer.items"
          :highlight="layerHighlight(layer.id)"
          :open-key="layer.openKey"
          :menu-id="menuId"
          :layer-id="layer.id"
          :icon-size="iconSize"
          @select="onSelect($event, layer.depth)"
          @hover="onItemHover(layer.id, layer.depth, $event)"
        >
          <template #item="slotProps">
            <slot name="item" v-bind="slotProps">
              <span class="rs-context-menu__label">{{ slotProps.item.label }}</span>
              <span v-if="slotProps.item.hint" class="rs-context-menu__hint">{{ slotProps.item.hint }}</span>
            </slot>
          </template>
        </RsContextMenuItems>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* 实底。半透明加 backdrop-filter 在 CEF GPU 崩溃后会被丢掉，菜单会透出下层。 */
.rs-context-menu__portal {
  display: contents;
}

.rs-context-menu__content,
.rs-context-menu__sub-content {
  position: fixed;
  z-index: var(--rs-ctx-z);
  box-sizing: border-box;
  min-width: var(--rs-ctx-min-width);
  max-width: min(var(--rs-ctx-max-width), calc(100vw - 1rem));
  width: max-content;
  padding: var(--rs-ctx-pad);
  border-radius: var(--rs-ctx-radius);
  border: 1px solid var(--rs-ctx-border);
  background: var(--rs-ctx-bg);
  box-shadow: var(--rs-ctx-shadow);
  color: var(--rs-ctx-fg);
  font-family: var(--rs-font-sans);
  font-size: var(--rs-ctx-font-size);
  line-height: var(--rs-line-height-tight);
  outline: none;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rs-context-menu__content {
  transform-origin: top left;
}

.rs-context-menu__content:not([data-placed]) {
  visibility: hidden;
  pointer-events: none;
}

.rs-context-menu__content[data-origin-x='right'][data-origin-y='top'] {
  transform-origin: top right;
}

.rs-context-menu__content[data-origin-x='left'][data-origin-y='bottom'] {
  transform-origin: bottom left;
}

.rs-context-menu__content[data-origin-x='right'][data-origin-y='bottom'] {
  transform-origin: bottom right;
}

.rs-context-menu__content[data-placed] {
  animation: rs-ctx-in var(--rs-ctx-motion-in) ease-out;
}

.rs-context-menu__sub-content[data-placed] {
  animation: rs-ctx-sub-in var(--rs-ctx-motion-sub) ease-out;
}

.rs-context-menu__sub-content[data-origin-x='left'] {
  transform-origin: left center;
}

.rs-context-menu__sub-content[data-origin-x='right'] {
  transform-origin: right center;
}

@keyframes rs-ctx-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rs-ctx-sub-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.rs-context-menu--ssm {
  --rs-ctx-item-height: 1.25rem;
  --rs-ctx-font-size: var(--rs-font-size-xs);
}

.rs-context-menu--sm {
  --rs-ctx-item-height: 1.5rem;
  --rs-ctx-font-size: var(--rs-font-size-xs);
}

.rs-context-menu--md {
  --rs-ctx-item-height: 2rem;
  --rs-ctx-font-size: var(--rs-font-size-sm);
}

.rs-context-menu--lg {
  --rs-ctx-item-height: 2.25rem;
  --rs-ctx-font-size: var(--rs-font-size-sm);
}

.rs-context-menu__item {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0 0.625rem 0 0;
  min-height: var(--rs-ctx-item-height);
  border: 0;
  border-radius: var(--rs-ctx-item-radius);
  background: transparent;
  font: inherit;
  font-size: var(--rs-ctx-font-size);
  font-weight: var(--rs-font-weight-regular);
  line-height: 1.2;
  color: inherit;
  text-align: start;
  text-decoration: none;
  cursor: default;
  appearance: none;
  outline: none;
  user-select: none;
  transition:
    background-color 0.08s ease-out,
    color 0.08s ease-out;
}

.rs-context-menu__icon-cell {
  flex-shrink: 0;
  width: var(--rs-ctx-icon-col);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-ctx-muted);
}

.rs-context-menu__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.rs-context-menu__label,
.rs-context-menu__hint {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-context-menu__hint {
  color: var(--rs-ctx-muted);
  font-size: var(--rs-font-size-xs);
}

.rs-context-menu__shortcut {
  flex-shrink: 0;
  margin-inline-start: 1.75rem;
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-ctx-muted);
  font-family: var(--rs-font-sans);
}

.rs-context-menu__arrow {
  flex-shrink: 0;
  margin-inline-start: 6px;
  color: var(--rs-ctx-muted);
}

[dir='rtl'] .rs-context-menu__arrow {
  transform: scaleX(-1);
}

.rs-context-menu__item[data-highlighted],
.rs-context-menu__item[data-state='open'] {
  background: var(--rs-ctx-item-active-bg);
  color: var(--rs-ctx-item-active-fg);
}

.rs-context-menu__item[data-highlighted] .rs-context-menu__icon-cell,
.rs-context-menu__item[data-highlighted] .rs-context-menu__shortcut,
.rs-context-menu__item[data-highlighted] .rs-context-menu__arrow,
.rs-context-menu__item[data-highlighted] .rs-context-menu__hint,
.rs-context-menu__item[data-state='open'] .rs-context-menu__icon-cell,
.rs-context-menu__item[data-state='open'] .rs-context-menu__shortcut,
.rs-context-menu__item[data-state='open'] .rs-context-menu__arrow,
.rs-context-menu__item[data-state='open'] .rs-context-menu__hint {
  color: var(--rs-ctx-item-active-muted);
}

.rs-context-menu__item:focus-visible {
  outline: none;
}

.rs-context-menu__item--danger {
  color: var(--rs-ctx-danger);
}

.rs-context-menu__item--danger .rs-context-menu__icon-cell {
  color: var(--rs-ctx-danger);
}

.rs-context-menu__item[data-disabled] {
  opacity: var(--rs-ctx-disabled-opacity);
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .rs-context-menu__item {
    transition: none;
  }
}

.rs-context-menu__separator {
  height: 1px;
  margin: 4px 0.375rem;
  border: 0;
  background: var(--rs-ctx-separator);
}

.rs-context-menu__group {
  margin: 0;
  padding: 0.375rem 0.75rem 0.125rem var(--rs-ctx-icon-col);
  font-size: var(--rs-font-size-xs);
  line-height: 1.2;
  color: var(--rs-ctx-muted);
  user-select: none;
}
</style>
