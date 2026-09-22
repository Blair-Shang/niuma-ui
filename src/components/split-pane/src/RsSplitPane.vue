<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  applySplitResize,
  collapseSplitPane,
  expandSplitPane,
  invertSplitAxisDelta,
  isSplitPaneCollapsed,
  isSplitResizerInteractive,
  normalizeSplitSizes,
  resolveSplitAutoFlags,
  resolveSplitConstraints,
  roundSize,
  splitPaneDomId,
  splitSizesEqual,
  type RsSplitOrientation,
  type RsSplitPaneExpose,
  type RsSplitPaneItem,
} from './split-pane-utils'

defineOptions({ name: 'RsSplitPane' })

const props = withDefaults(
  defineProps<{
    /** 面板定义列表（顺序即渲染顺序） */
    panes: RsSplitPaneItem[]
    /** horizontal 左右 · vertical 上下 */
    orientation?: RsSplitOrientation
    /** 禁用拖拽 / 键盘调整 */
    disabled?: boolean
    /** 键盘方向键单步调整的百分比 */
    keyboardStep?: number
    /** 在分隔条中央展示抓手（grip）指示 */
    withHandle?: boolean
    /**
     * 面板铺满父级，并把插槽根节点拉高。
     * 默认关，不改变原有内容尺寸；工作台 / 设置页显式打开，避免 :deep。
     */
    fill?: boolean
    id?: string
    ariaLabel?: string
  }>(),
  {
    orientation: 'horizontal',
    disabled: false,
    keyboardStep: 4,
    withHandle: false,
    fill: false,
  },
)

/** 各面板尺寸（百分比，总和 100） */
const model = defineModel<number[]>('sizes', { default: () => [] })

const emit = defineEmits<{
  /** 拖拽过程按帧、键盘调整立即触发（拖拽期间不回写 v-model，避免整树重渲染） */
  resize: [sizes: number[]]
  /** 一次调整结束时触发（指针抬起、键盘按键或程序化操作） */
  'resize-end': [sizes: number[]]
  /** 指针按下或键盘开始调整时触发 */
  'resize-start': [sizes: number[]]
  collapse: [key: string]
  expand: [key: string]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const fallbackId = useId()
const rootRef = ref<HTMLElement | null>(null)
const sizes = ref<number[]>([])

const rootId = computed(() => props.id || fallbackId)
const groupLabel = computed(() => props.ariaLabel || t('split.label'))
const writingDir = computed(() =>
  resolveDirMode(config?.dir.value ?? 'auto', config?.locale.value ?? locale.value),
)

const constraints = computed(() => resolveSplitConstraints(props.panes))
const resizerCount = computed(() => Math.max(0, props.panes.length - 1))

/** 内容自适应面板标记；首次拖拽/键盘调整时会物化为百分比并清空 */
const autoFlags = ref<boolean[]>(resolveSplitAutoFlags(props.panes))

/** pane key → 折叠前尺寸；expand 未显式传 toSize 时还原 */
const sizeBeforeCollapse = new Map<string, number>()

/** 归一化初始值，作为双击复位的基准 */
let initialSizes: number[] = normalizeSplitSizes(props.panes, modelSeed())
sizes.value = initialSizes.slice()

function modelSeed(): number[] | undefined {
  return model.value && model.value.length === props.panes.length ? model.value : undefined
}

function paneKeySignature(): string {
  return props.panes.map((pane) => pane.key).join('|')
}

function pruneCollapseMemory(): void {
  const keys = new Set(props.panes.map((pane) => pane.key))
  for (const key of sizeBeforeCollapse.keys()) {
    if (!keys.has(key)) sizeBeforeCollapse.delete(key)
  }
}

watch(
  () => paneKeySignature(),
  () => {
    const provided = sizes.value.length === props.panes.length ? sizes.value : undefined
    autoFlags.value = resolveSplitAutoFlags(props.panes)
    initialSizes = normalizeSplitSizes(props.panes, provided)
    sizes.value = initialSizes.slice()
    pruneCollapseMemory()
    syncModel(sizes.value)
  },
)

watch(
  () => props.panes.map((pane) => pane.size).join('|'),
  () => {
    // panes 引用不变但 size 声明变化时同步 auto 标记与基准尺寸
    autoFlags.value = resolveSplitAutoFlags(props.panes)
    initialSizes = normalizeSplitSizes(props.panes, modelSeed())
    if (!autoFlags.value.some(Boolean)) {
      sizes.value = initialSizes.slice()
      syncModel(sizes.value)
    }
  },
)

watch(model, (value) => {
  if (!value || value.length !== props.panes.length) return
  if (splitSizesEqual(value, sizes.value)) return
  // 外部受控 sizes 一律视为百分比物化结果
  autoFlags.value = props.panes.map(() => false)
  sizes.value = normalizeSplitSizes(props.panes, value)
})

function syncModel(next: number[]): void {
  if (!splitSizesEqual(model.value ?? [], next)) {
    model.value = next.slice()
  }
}

function commit(next: number[]): void {
  sizes.value = next
  syncModel(next)
  emit('resize', next.slice())
}

function emitBoundaryTransitions(before: number[], after: number[]): void {
  props.panes.forEach((pane, index) => {
    const constraint = constraints.value[index]
    const wasCollapsed = isSplitPaneCollapsed(before[index] ?? 0, constraint)
    const nowCollapsed = isSplitPaneCollapsed(after[index] ?? 0, constraint)
    if (!wasCollapsed && nowCollapsed) {
      const prev = before[index]
      if (prev !== undefined) sizeBeforeCollapse.set(pane.key, prev)
      emit('collapse', pane.key)
    } else if (wasCollapsed && !nowCollapsed) {
      emit('expand', pane.key)
    }
  })
}

/** 展开目标：显式 toSize > 折叠前记忆 > 初始 size */
function resolveExpandSize(key: string, index: number, toSize?: number): number | undefined {
  if (toSize !== undefined) return toSize
  return sizeBeforeCollapse.get(key) ?? initialSizes[index]
}

function paneDomId(key: string): string {
  return splitPaneDomId(rootId.value, key)
}

function resizerInteractive(index: number): boolean {
  return isSplitResizerInteractive(props.panes[index], props.disabled)
}

function resizerAriaLabel(index: number): string {
  return props.panes[index]?.resizerAriaLabel || t('split.resize')
}

function resizerValueText(index: number): string {
  return t('split.value', { value: Math.round(sizes.value[index] ?? 0) })
}

function resizerControls(index: number): string {
  const a = props.panes[index]
  const b = props.panes[index + 1]
  return [a, b]
    .filter((pane): pane is RsSplitPaneItem => Boolean(pane))
    .map((pane) => paneDomId(pane.key))
    .join(' ')
}

/** 跟计算样式，避免只读 Config 而父级已写 dir=rtl */
function rootIsRtl(): boolean {
  const root = rootRef.value
  if (root && typeof getComputedStyle === 'function') {
    return getComputedStyle(root).direction === 'rtl'
  }
  return writingDir.value === 'rtl'
}

function axisDelta(raw: number): number {
  return invertSplitAxisDelta(props.orientation, rootIsRtl(), raw)
}

// —— 指针拖拽 ——
let dragIndex: number | null = null
let dragOrigin = 0
let dragStartSizes: number[] = []
let flexPx = 0
let pendingDragSizes: number[] | null = null
let dragFrame = 0
let dragTarget: HTMLElement | null = null
let dragPointerId: number | null = null
let dragPaneEls: HTMLElement[] = []

function directPaneElements(root: HTMLElement): HTMLElement[] {
  return [...root.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('rs-split__pane'),
  )
}

function paneElements(): HTMLElement[] {
  const root = rootRef.value
  if (!root) return []
  return directPaneElements(root)
}

/** 拖拽过程中直接写 flex-grow，避免每帧触发 Vue 重渲染 */
function applyDragToDom(next: number[]): void {
  const panes = dragPaneEls.length ? dragPaneEls : paneElements()
  next.forEach((size, i) => {
    panes[i]?.style.setProperty('flex-grow', String(size))
  })
}

function setDraggingUi(active: boolean, host: HTMLElement | null): void {
  const root = rootRef.value
  root?.classList.toggle('rs-split--dragging', active)
  if (!host) {
    return
  }
  if (active) {
    host.dataset.active = ''
  } else {
    delete host.dataset.active
  }
}

function scheduleDragApply(next: number[]): void {
  pendingDragSizes = next
  if (dragFrame) {
    return
  }
  dragFrame = requestAnimationFrame(() => {
    dragFrame = 0
    if (!pendingDragSizes) {
      return
    }
    applyDragToDom(pendingDragSizes)
    emit('resize', pendingDragSizes.slice())
  })
}

function clearDragInlineStyles(): void {
  const panes = dragPaneEls.length ? dragPaneEls : paneElements()
  panes.forEach((el) => {
    el.style.removeProperty('flex-grow')
  })
}

function releaseDragPointer(): void {
  if (dragTarget && dragPointerId != null) {
    try {
      dragTarget.releasePointerCapture(dragPointerId)
    } catch {
      // 已释放或节点卸掉
    }
  }
  dragTarget = null
  dragPointerId = null
}

function abortDrag(): void {
  if (dragFrame) {
    cancelAnimationFrame(dragFrame)
    dragFrame = 0
  }
  const host = dragTarget
  const index = dragIndex
  releaseDragPointer()
  if (index !== null) {
    setDraggingUi(false, host)
    clearDragInlineStyles()
  }
  dragIndex = null
  pendingDragSizes = null
  dragPaneEls = []
}

function finishDrag(index: number): void {
  if (dragIndex !== index) {
    return
  }
  if (dragFrame) {
    cancelAnimationFrame(dragFrame)
    dragFrame = 0
  }
  const host = dragTarget
  const final = pendingDragSizes ?? sizes.value
  pendingDragSizes = null
  dragIndex = null
  releaseDragPointer()
  setDraggingUi(false, host)
  // 清掉拖拽期手写的 flex-grow，交回 Vue :style，避免残留内联样式干扰后续布局
  clearDragInlineStyles()
  dragPaneEls = []
  commit(final)
  emitBoundaryTransitions(dragStartSizes, final)
  emit('resize-end', final.slice())
}

function axisSize(el: HTMLElement): number {
  return props.orientation === 'horizontal' ? el.offsetWidth : el.offsetHeight
}

/** 可伸缩空间的像素总量（不含分隔条），用于像素→百分比换算 */
function measureFlexPx(): number {
  const root = rootRef.value
  if (!root) return 0
  let sum = 0
  directPaneElements(root).forEach((el) => {
    sum += axisSize(el)
  })
  return sum
}

function onResizerPointerDown(index: number, event: PointerEvent): void {
  if (!resizerInteractive(index)) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  materializeAutoPanes()
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)
  dragIndex = index
  dragOrigin = props.orientation === 'horizontal' ? event.clientX : event.clientY
  dragStartSizes = sizes.value.slice()
  pendingDragSizes = dragStartSizes
  flexPx = measureFlexPx()
  dragTarget = target
  dragPointerId = event.pointerId
  dragPaneEls = paneElements()
  setDraggingUi(true, target)
  emit('resize-start', dragStartSizes.slice())
  event.preventDefault()
}

function onResizerPointerMove(index: number, event: PointerEvent): void {
  if (dragIndex !== index || flexPx <= 0) return
  const position = props.orientation === 'horizontal' ? event.clientX : event.clientY
  const deltaPercent = axisDelta(((position - dragOrigin) / flexPx) * 100)
  scheduleDragApply(applySplitResize(dragStartSizes, constraints.value, index, deltaPercent))
}

function endDrag(index: number, event: PointerEvent): void {
  if (dragIndex !== index) return
  if (dragTarget && event.pointerId === dragPointerId) {
    try {
      dragTarget.releasePointerCapture(event.pointerId)
    } catch {
      // lostpointercapture 已经释放
    }
  }
  finishDrag(index)
}

function onLostPointerCapture(index: number): void {
  if (dragIndex !== index) return
  finishDrag(index)
}

// —— 键盘无障碍 ——
function onResizerKeydown(index: number, event: KeyboardEvent): void {
  if (!resizerInteractive(index)) return
  materializeAutoPanes()
  const horizontal = props.orientation === 'horizontal'
  const step = props.keyboardStep
  let delta = 0
  switch (event.key) {
    case 'ArrowLeft':
      if (horizontal) delta = axisDelta(-step)
      break
    case 'ArrowRight':
      if (horizontal) delta = axisDelta(step)
      break
    case 'ArrowUp':
      if (!horizontal) delta = -step
      break
    case 'ArrowDown':
      if (!horizontal) delta = step
      break
    case 'Home':
      delta = -100
      break
    case 'End':
      delta = 100
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      toggleCollapseAt(index)
      return
    default:
      return
  }
  if (delta === 0) return
  event.preventDefault()
  emit('resize-start', sizes.value.slice())
  const before = sizes.value.slice()
  commit(applySplitResize(sizes.value, constraints.value, index, delta))
  emitBoundaryTransitions(before, sizes.value)
  emit('resize-end', sizes.value.slice())
}

function onResizerDblClick(index: number): void {
  if (!resizerInteractive(index)) return
  materializeAutoPanes()
  const a = sizes.value[index]
  const b = sizes.value[index + 1]
  const initA = initialSizes[index]
  const initB = initialSizes[index + 1]
  if (a === undefined || b === undefined || initA === undefined || initB === undefined) return
  const total = a + b
  const initTotal = initA + initB
  const targetA = initTotal > 0 ? (initA / initTotal) * total : total / 2
  const next = sizes.value.slice()
  next[index] = roundSize(targetA)
  next[index + 1] = roundSize(total - targetA)
  const before = sizes.value.slice()
  commit(next)
  emitBoundaryTransitions(before, sizes.value)
  emit('resize-end', sizes.value.slice())
}

/** 分隔条 index 两侧择一可折叠面板进行折叠/展开切换 */
function collapsibleCandidate(index: number): number {
  if (constraints.value[index]?.collapsible) return index
  if (constraints.value[index + 1]?.collapsible) return index + 1
  return -1
}

function toggleCollapseAt(index: number): void {
  const candidate = collapsibleCandidate(index)
  if (candidate < 0) return
  const before = sizes.value.slice()
  const collapsed = isSplitPaneCollapsed(sizes.value[candidate] ?? 0, constraints.value[candidate])
  const key = props.panes[candidate]?.key
  const next = collapsed
    ? expandSplitPane(
        sizes.value,
        constraints.value,
        candidate,
        key ? resolveExpandSize(key, candidate) : undefined,
      )
    : collapseSplitPane(sizes.value, constraints.value, candidate)
  commit(next)
  emitBoundaryTransitions(before, sizes.value)
  emit('resize-end', sizes.value.slice())
}

/** 将 auto 面板按当前像素占比物化为百分比，之后走统一拖拽逻辑 */
function materializeAutoPanes(): void {
  if (!autoFlags.value.some(Boolean)) return
  const total = measureFlexPx()
  if (total <= 0) return
  const panes = paneElements()
  const measured = panes.map((el) => (axisSize(el) / total) * 100)
  const next = normalizeSplitSizes(
    props.panes.map((pane) => ({
      ...pane,
      size: typeof pane.size === 'number' ? pane.size : undefined,
    })),
    measured,
  )
  autoFlags.value = props.panes.map(() => false)
  sizes.value = next
  syncModel(next)
}

function paneStyle(index: number): Record<string, string> {
  if (autoFlags.value[index]) {
    const pane = props.panes[index]
    const vertical = props.orientation === 'vertical'
    // auto 面板必须按内容撑开；不能继承基类 min-height/min-width:0，否则在
    // 「另一侧 flex-grow 吃满」的分栏里会被算成 0 高/宽（KeepAlive 切页后常见）。
    const style: Record<string, string> = {
      flexGrow: '0',
      flexShrink: '0',
      flexBasis: 'auto',
      [vertical ? 'minHeight' : 'minWidth']: 'min-content',
    }
    if (typeof pane?.min === 'number' && pane.min > 0) {
      style[vertical ? 'minHeight' : 'minWidth'] = `${pane.min}%`
    }
    if (typeof pane?.max === 'number' && pane.max < 100) {
      style[vertical ? 'maxHeight' : 'maxWidth'] = `${pane.max}%`
    }
    return style
  }
  const size = sizes.value[index] ?? 0
  return { flexGrow: String(size), flexShrink: '1', flexBasis: '0%' }
}

function paneCollapsed(index: number): boolean {
  if (autoFlags.value[index]) return false
  return isSplitPaneCollapsed(sizes.value[index] ?? 0, constraints.value[index])
}

/** 分隔条 index（位于 panes[index] 与 panes[index+1] 之间）是否显示抓手 */
function resizerShowsHandle(index: number): boolean {
  const pane = props.panes[index]
  if (pane?.resizerHandle !== undefined) {
    return pane.resizerHandle
  }
  return props.withHandle
}

// —— 程序化 API ——
function indexOfKey(key: string): number {
  return props.panes.findIndex((pane) => pane.key === key)
}

function collapse(key: string): void {
  const index = indexOfKey(key)
  if (index < 0) return
  const before = sizes.value.slice()
  const next = collapseSplitPane(sizes.value, constraints.value, index)
  if (splitSizesEqual(before, next)) return
  commit(next)
  emitBoundaryTransitions(before, sizes.value)
  emit('resize-end', sizes.value.slice())
}

function expand(key: string, toSize?: number): void {
  const index = indexOfKey(key)
  if (index < 0) return
  const before = sizes.value.slice()
  const next = expandSplitPane(
    sizes.value,
    constraints.value,
    index,
    resolveExpandSize(key, index, toSize),
  )
  if (splitSizesEqual(before, next)) return
  commit(next)
  emitBoundaryTransitions(before, sizes.value)
  emit('resize-end', sizes.value.slice())
}

function reset(): void {
  autoFlags.value = resolveSplitAutoFlags(props.panes)
  initialSizes = normalizeSplitSizes(props.panes)
  commit(initialSizes.slice())
  emit('resize-end', sizes.value.slice())
}

function focus(index?: number): void {
  const root = rootRef.value
  if (!root) return
  const hosts = [...root.querySelectorAll<HTMLElement>('[data-resizer-index]')]
  const preferred =
    index !== undefined
      ? hosts.find((el) => Number(el.dataset.resizerIndex) === index)
      : hosts.find((el) => resizerInteractive(Number(el.dataset.resizerIndex)))
  const host = preferred ?? hosts[0]
  host?.querySelector<HTMLElement>('.rs-split__resizer')?.focus()
}

onUnmounted(() => {
  abortDrag()
  sizeBeforeCollapse.clear()
})

defineExpose<RsSplitPaneExpose>({
  collapse,
  expand,
  reset,
  getSizes: () => sizes.value.slice(),
  focus,
})
</script>

<template>
  <div
    :id="id"
    ref="rootRef"
    class="rs-split"
    role="group"
    :aria-label="groupLabel"
    :class="[
      `rs-split--${orientation}`,
      {
        'rs-split--disabled': disabled,
        'rs-split--fill': fill,
      },
    ]"
  >
    <template v-for="(pane, index) in panes" :key="pane.key">
      <div
        :id="paneDomId(pane.key)"
        class="rs-split__pane"
        :class="{
          'rs-split__pane--collapsed': paneCollapsed(index),
          'rs-split__pane--auto': autoFlags[index],
        }"
        :style="paneStyle(index)"
        :data-pane-key="pane.key"
      >
        <slot :name="pane.key" :size="sizes[index]" :collapsed="paneCollapsed(index)" />
      </div>

      <div
        v-if="index < resizerCount"
        class="rs-split__resizer-host"
        :class="{
          'rs-split__resizer-host--handle': resizerShowsHandle(index),
          'rs-split__resizer-host--disabled': !resizerInteractive(index),
        }"
        :data-resizer-index="index"
        @pointerdown="onResizerPointerDown(index, $event)"
        @pointermove="onResizerPointerMove(index, $event)"
        @pointerup="endDrag(index, $event)"
        @pointercancel="endDrag(index, $event)"
        @lostpointercapture="onLostPointerCapture(index)"
      >
        <hr
          class="rs-split__resizer"
          :class="{ 'rs-split__resizer--handle': resizerShowsHandle(index) }"
          :tabindex="resizerInteractive(index) ? 0 : -1"
          :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
          :aria-valuenow="Math.round(sizes[index] ?? 0)"
          :aria-valuemin="Math.round(constraints[index]?.min ?? 0)"
          :aria-valuemax="Math.round(constraints[index]?.max ?? 100)"
          :aria-valuetext="resizerValueText(index)"
          :aria-controls="resizerControls(index)"
          :aria-label="resizerAriaLabel(index)"
          :aria-disabled="resizerInteractive(index) ? undefined : true"
          @keydown="onResizerKeydown(index, $event)"
          @dblclick="onResizerDblClick(index)"
        />
        <span v-if="resizerShowsHandle(index)" class="rs-split__grip" aria-hidden="true">
          <RsIcon
            :name="orientation === 'horizontal' ? 'grip-vertical' : 'grip-horizontal'"
            :size="12"
          />
        </span>
      </div>
    </template>
  </div>
</template>

<style>
.rs-split {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  isolation: isolate;
  /* macOS 风格 resize 光标：两侧纤细箭头 + 中央分隔竖条，白芯 + 半透明描边，热点居中 */
  --rs-split-cursor-h: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7,8.5L3,12L7,15.5M3,12H8.5M17,8.5L21,12L17,15.5M21,12H15.5' stroke='%23000' stroke-opacity='.38' stroke-width='2.6'/%3E%3Cpath d='M12,6V18' stroke='%23000' stroke-opacity='.3' stroke-width='2.6'/%3E%3Cpath d='M7,8.5L3,12L7,15.5M3,12H8.5M17,8.5L21,12L17,15.5M21,12H15.5' stroke='%23fff' stroke-width='1.1'/%3E%3Cpath d='M12,6V18' stroke='%23fff' stroke-width='1.1'/%3E%3C/g%3E%3C/svg%3E")
    12 12, ew-resize;
  --rs-split-cursor-v: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8.5,7L12,3L15.5,7M12,3V8.5M8.5,17L12,21L15.5,17M12,21V15.5' stroke='%23000' stroke-opacity='.38' stroke-width='2.6'/%3E%3Cpath d='M6,12H18' stroke='%23000' stroke-opacity='.3' stroke-width='2.6'/%3E%3Cpath d='M8.5,7L12,3L15.5,7M12,3V8.5M8.5,17L12,21L15.5,17M12,21V15.5' stroke='%23fff' stroke-width='1.1'/%3E%3Cpath d='M6,12H18' stroke='%23fff' stroke-width='1.1'/%3E%3C/g%3E%3C/svg%3E")
    12 12, ns-resize;
}

.rs-split--horizontal {
  flex-direction: row;
}

.rs-split--vertical {
  flex-direction: column;
}

.rs-split__pane {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* fill：面板当弹性列，插槽根节点吃满。业务改自己的内容，不要 :deep 本组件。 */
.rs-split--fill > .rs-split__pane:not(.rs-split__pane--auto) {
  display: flex;
  flex-direction: column;
}

.rs-split--fill > .rs-split__pane:not(.rs-split__pane--auto) > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
}

.rs-split__pane--auto {
  /* 内容撑开；超出 max 时在面板内滚动 */
  overflow: auto;
  flex: 0 0 auto;
}

/* 覆盖基类 min-*:0，避免 auto 面板被弹性侧压成 0 */
.rs-split--vertical > .rs-split__pane--auto {
  min-height: min-content;
  height: auto;
  max-height: none;
}

.rs-split--horizontal > .rs-split__pane--auto {
  min-width: min-content;
  width: auto;
  max-width: none;
}

.rs-split__pane--collapsed {
  overflow: hidden;
}

.rs-split__resizer-host {
  position: relative;
  z-index: var(--rs-z-tooltip);
  flex: 0 0 var(--rs-split-resizer-size);
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  touch-action: none;
  user-select: none;
}

.rs-split__resizer {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
  background: var(--rs-split-resizer);
  opacity: 0.5;
  transition:
    background var(--rs-transition-normal),
    opacity var(--rs-transition-normal);
}

.rs-split__resizer-host:hover .rs-split__resizer,
.rs-split__resizer-host[data-active] .rs-split__resizer {
  opacity: 1;
}

.rs-split--dragging .rs-split__resizer,
.rs-split--dragging .rs-split__grip {
  transition: none;
}

/* 隐形命中区：向两侧扩展，不占布局尺寸 */
.rs-split__resizer-host::before {
  content: '';
  position: absolute;
  z-index: 1;
}

.rs-split--horizontal > .rs-split__resizer-host {
  cursor: var(--rs-split-cursor-h);
}

.rs-split--horizontal > .rs-split__resizer-host::before {
  inset-block: 0;
  inset-inline: calc(-1 * var(--rs-split-hit-slop));
}

.rs-split--vertical > .rs-split__resizer-host {
  cursor: var(--rs-split-cursor-v);
}

.rs-split--vertical > .rs-split__resizer-host::before {
  inset-inline: 0;
  inset-block: calc(-1 * var(--rs-split-hit-slop));
}

/* 拖拽中：整个容器沿用同一光标，指针移出细缝也不闪回默认 */
.rs-split--horizontal.rs-split--dragging {
  cursor: var(--rs-split-cursor-h);
}

.rs-split--vertical.rs-split--dragging {
  cursor: var(--rs-split-cursor-v);
}

.rs-split__resizer-host:hover .rs-split__resizer,
.rs-split__resizer:hover,
.rs-split__resizer-host[data-active] .rs-split__resizer {
  background: var(--rs-split-resizer-hover);
  opacity: 1;
}

.rs-split__resizer:focus-visible {
  outline: none;
  background: var(--rs-split-resizer-active);
  opacity: 1;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-split--disabled > .rs-split__resizer-host,
.rs-split__resizer-host--disabled {
  cursor: default;
}

.rs-split--disabled > .rs-split__resizer-host:hover .rs-split__resizer,
.rs-split__resizer-host--disabled:hover .rs-split__resizer {
  background: var(--rs-split-resizer);
}

/* 抓手指示（仅 withHandle 时常驻显示，悬浮不额外浮现胶囊） */
.rs-split__resizer--handle {
  background: var(--rs-split-resizer);
}

.rs-split__grip {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: var(--rs-radius-full);
  border: 1px solid var(--rs-split-grip-border);
  background: var(--rs-split-grip-bg);
  color: var(--rs-split-grip-fg);
  box-shadow: var(--rs-shadow-sm);
  pointer-events: none;
  opacity: 0;
  transition:
    opacity var(--rs-transition-fast),
    color var(--rs-transition-fast),
    background var(--rs-transition-fast),
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-split--horizontal > .rs-split__resizer-host--handle .rs-split__grip {
  width: var(--rs-split-grip-inline);
  height: var(--rs-split-grip-block);
}

.rs-split--vertical > .rs-split__resizer-host--handle .rs-split__grip {
  width: var(--rs-split-grip-block);
  height: var(--rs-split-grip-inline);
}

/* 悬浮 / 聚焦 / 拖拽：常驻抓手高亮为主色 */
.rs-split:not(.rs-split--disabled) > .rs-split__resizer-host--handle:hover .rs-split__grip,
.rs-split:not(.rs-split--disabled)
  > .rs-split__resizer-host--handle:has(.rs-split__resizer:focus-visible)
  .rs-split__grip,
.rs-split:not(.rs-split--disabled) > .rs-split__resizer-host--handle[data-active] .rs-split__grip {
  opacity: 1;
  color: var(--rs-split-grip-active-fg);
  border-color: var(--rs-split-grip-active-border);
  background: var(--rs-split-grip-active-bg);
  box-shadow: var(--rs-shadow);
}

/* 禁用态：抓手淡化 */
.rs-split--disabled .rs-split__grip,
.rs-split__resizer-host--disabled .rs-split__grip {
  opacity: var(--rs-split-disabled-opacity);
  box-shadow: none;
}

/* 拖拽中：屏蔽子内容命中，避免选中/iframe 抢占指针 */
.rs-split--dragging .rs-split__pane {
  pointer-events: none;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .rs-split__resizer,
  .rs-split__grip {
    transition: none;
  }
}
</style>
