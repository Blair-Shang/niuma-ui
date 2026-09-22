<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { resolveDirMode } from '../../../locale/apply'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext } from '../../form/src/form-utils'
import RsEmpty from '../../empty/src/RsEmpty.vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import type {
  RsTreeCheckState,
  RsTreeDragTrigger,
  RsTreeDropPosition,
  RsTreeExpose,
  RsTreeFlatNode,
  RsTreeFocusMove,
  RsTreeNode,
  RsTreeFieldNames,
  RsTreeSize,
} from './tree-utils'
import {
  buildTreeNodeIndex,
  collectExpandableKeys,
  collectHalfCheckedKeys,
  filterTreeNodes,
  flattenVisibleTreeNodes,
  getTreeChildren,
  getTreeKey,
  getTreeLabel,
  hasTreeChildren,
  isTreeAncestorKey,
  isTreeCheckboxDisabled,
  isTreeNodeDisabled,
  isTreeNodeLoading,
  resolveAccordionExpandedKeys,
  resolveTreeCheckState,
  resolveTreeFieldNames,
  resolveTreeFocusKey,
  resolveTreeIndent,
  resolveTreeRowHeight,
  resolveTreeTypeaheadKey,
  resolveTreeVirtualEnabled,
  sliceVirtualTreeNodes,
  shouldShowTreeCheckbox,
  splitTreeLabelHighlight,
  toggleTreeCheck,
} from './tree-utils'
import {
  isVirtualListFillHeight,
  parseVirtualListHeightPx,
  resolveVirtualListHeight,
} from '../../virtual-list/src/virtual-list-utils'

defineOptions({ name: 'RsTree' })

const model = defineModel<string | string[]>({ default: '' })
const expandedKeysModel = defineModel<string[]>('expandedKeys')
const checkedKeysModel = defineModel<string[]>('checkedKeys')
const halfCheckedKeysModel = defineModel<string[]>('halfCheckedKeys')

const props = withDefaults(
  defineProps<{
    nodes: RsTreeNode[]
    fieldNames?: RsTreeFieldNames
    size?: RsTreeSize
    id?: string
    ariaLabel?: string
    disabled?: boolean
    multiple?: boolean
    selectable?: boolean
    checkable?: boolean
    checkStrictly?: boolean
    onlyCheckLeaf?: boolean
    checkOnClickNode?: boolean
    defaultExpandAll?: boolean
    defaultExpandedKeys?: string[]
    defaultCheckedKeys?: string[]
    expandOnClickNode?: boolean
    blockNode?: boolean
    showLine?: boolean
    accordion?: boolean
    filter?: string
    filterNode?: (node: RsTreeNode, keyword: string) => boolean
    highlight?: boolean
    autoExpandParent?: boolean
    lazy?: boolean
    loadData?: (node: RsTreeNode, key: string) => void | Promise<void>
    draggable?: boolean
    /** handle=显示拖拽手柄；row=整行拖拽且不显示手柄 */
    dragTrigger?: RsTreeDragTrigger
    allowDrop?: (dragKey: string, dropKey: string, position: RsTreeDropPosition) => boolean
    virtual?: boolean
    virtualThreshold?: number
    height?: number | string
    itemHeight?: number
    overscan?: number
  }>(),
  {
    multiple: false,
    selectable: true,
    checkable: false,
    checkStrictly: false,
    onlyCheckLeaf: false,
    checkOnClickNode: false,
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    defaultCheckedKeys: () => [],
    expandOnClickNode: false,
    blockNode: false,
    showLine: false,
    accordion: false,
    filter: '',
    highlight: true,
    autoExpandParent: true,
    lazy: false,
    disabled: false,
    draggable: false,
    dragTrigger: 'handle',
    virtual: false,
    virtualThreshold: 100,
    overscan: 4,
  },
)

const emit = defineEmits<{
  'node-click': [node: RsTreeNode, key: string]
  'node-dblclick': [node: RsTreeNode, key: string]
  'node-contextmenu': [node: RsTreeNode, key: string, event: MouseEvent]
  expand: [key: string, expanded: boolean]
  check: [keys: string[], halfCheckedKeys: string[], node: RsTreeNode, key: string]
  'node-drop': [dragKey: string, dropKey: string, position: RsTreeDropPosition]
}>()

const { t } = useRsI18n()
const formContext = useRsFormContext()
const config = useRsConfigOptional()
const uid = useId()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const treeDisabled = computed(() => props.disabled || Boolean(formContext?.disabled.value))
const rootId = computed(() => props.id || uid)
const treeLabel = computed(() => props.ariaLabel || t('tree.label'))

const fields = computed(() => resolveTreeFieldNames(props.fieldNames))
const rowHeight = computed(() => resolveTreeRowHeight(resolvedSize.value, props.itemHeight))
const indentPx = computed(() => resolveTreeIndent(props.size))
const rootKeys = computed(() => props.nodes.map((node) => getTreeKey(node, fields.value)))

/* ── 自动高度（仅当业务显式传 virtual，且高度为填满/百分比/未指定） ── */
const treeRootRef = ref<HTMLElement | null>(null)
const _measuredHeight = ref(0)
let _heightObs: ResizeObserver | null = null
let alive = true
let typeaheadQuery = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

function needsHeightObserver(): boolean {
  if (!props.virtual || !treeRootRef.value) return false
  if (props.height !== undefined && !isVirtualListFillHeight(props.height)) return false
  return typeof ResizeObserver !== 'undefined'
}

function syncHeightObserver(): void {
  _heightObs?.disconnect()
  _heightObs = null
  if (!needsHeightObserver() || !treeRootRef.value) return
  const target = treeRootRef.value
  _heightObs = new ResizeObserver((entries) => {
    if (!alive) return
    _measuredHeight.value = entries[0]?.contentRect.height ?? 0
  })
  _heightObs.observe(target)
  _measuredHeight.value = target.clientHeight
}

onMounted(() => {
  syncHeightObserver()
})

watch(
  () => [props.virtual, props.height] as const,
  () => {
    void nextTick(() => {
      if (!alive) return
      syncHeightObserver()
    })
  },
)

onUnmounted(() => {
  alive = false
  _heightObs?.disconnect()
  _heightObs = null
  if (typeaheadTimer != null) clearTimeout(typeaheadTimer)
  typeaheadTimer = null
  typeaheadQuery = ''
  rowRefs.value.clear()
})

const expandedKeysInternal = ref<string[]>(
  props.defaultExpandAll
    ? collectExpandableKeys(props.nodes, fields.value, props.lazy)
    : [...props.defaultExpandedKeys],
)
/** 进入过滤前的展开快照；清空过滤时还原，避免无匹配时被清空后无法恢复 */
const expandedKeysBeforeFilter = ref<string[] | null>(null)
const checkedKeysInternal = ref<string[]>([...props.defaultCheckedKeys])
const scrollTop = ref(0)
const viewportRef = ref<HTMLElement | null>(null)
const focusedKey = ref<string | null>(null)
const loadingKeys = ref<Set<string>>(new Set())
const dragKey = ref<string | null>(null)
const dropTargetKey = ref<string | null>(null)
const dropPosition = ref<RsTreeDropPosition>('inside')
const rowRefs = ref<Map<string, HTMLElement>>(new Map())

const expandedKeys = computed({
  get: () => expandedKeysModel.value ?? expandedKeysInternal.value,
  set: (value: string[]) => {
    expandedKeysInternal.value = value
    expandedKeysModel.value = value
  },
})

const checkedKeys = computed({
  get: () => checkedKeysModel.value ?? checkedKeysInternal.value,
  set: (value: string[]) => {
    checkedKeysInternal.value = value
    checkedKeysModel.value = value
  },
})

const expandedSet = computed(() => new Set(expandedKeys.value))
const checkedSet = computed(() => new Set(checkedKeys.value))

const displayNodes = computed(() => {
  const keyword = props.filter.trim()
  if (!keyword) return props.nodes
  return filterTreeNodes(props.nodes, keyword, {
    fieldNames: fields.value,
    filterNode: props.filterNode,
  })
})

const nodeIndex = computed(() => buildTreeNodeIndex(props.nodes, fields.value, props.lazy))
const flatNodes = computed(() =>
  flattenVisibleTreeNodes(displayNodes.value, expandedSet.value, fields.value, props.lazy),
)

/**
 * 无勾选项时不存在半选态，直接短路。
 * 关键在于「不读取 nodeIndex」——否则这个 immediate watch 会把全树索引拽成 eager，
 * 使不带 checkbox 的树也在每次数据变更时重建 O(N) 索引并做一次全量勾选态遍历。
 */
const halfCheckedKeys = computed(() => {
  if (checkedSet.value.size === 0) return []
  return collectHalfCheckedKeys(nodeIndex.value, checkedSet.value, props.checkStrictly, props.onlyCheckLeaf)
})

function checkboxOptions() {
  return { onlyCheckLeaf: props.onlyCheckLeaf, lazy: props.lazy }
}

watch(
  halfCheckedKeys,
  (value) => {
    halfCheckedKeysModel.value = value
  },
  { immediate: true },
)

const useVirtualScroll = computed(() =>
  resolveTreeVirtualEnabled({
    virtual: props.virtual,
    flatCount: flatNodes.value.length,
    virtualThreshold: props.virtualThreshold,
  }),
)

if (import.meta.env.DEV) {
  watch(useVirtualScroll, (enabled, wasEnabled) => {
    if (!enabled || wasEnabled) return
    let heightInfo: string
    if (_measuredHeight.value > 0) {
      heightInfo = `${Math.round(_measuredHeight.value)}px (ResizeObserver)`
    } else if (props.height !== undefined && !isVirtualListFillHeight(props.height)) {
      heightInfo = `${props.height} (prop)`
    } else {
      heightInfo = '320px (fallback)'
    }
    console.info(
      '[RsTree] 虚拟滚动已开启',
      '| 节点数:',
      flatNodes.value.length,
      '| 视口高度:',
      heightInfo,
    )
  }, { immediate: true })
}

const viewportHeightPx = computed(() => {
  const parsed = parseVirtualListHeightPx(props.height)
  if (parsed != null) return parsed
  if (_measuredHeight.value > 0) return _measuredHeight.value
  const el = treeRootRef.value
  if (el && el.clientHeight > 0) return el.clientHeight
  return 320
})

/** 过滤后滚回顶部；内容缩短时钳位，避免内部 scrollTop 与 DOM 脱节导致虚拟列表空白 */
function resetViewportScroll(): void {
  scrollTop.value = 0
  const el = viewportRef.value
  if (el && el.scrollTop !== 0) el.scrollTop = 0
}

function clampViewportScroll(): void {
  if (!useVirtualScroll.value) return
  const totalHeight = flatNodes.value.length * rowHeight.value
  const maxScroll = Math.max(0, totalHeight - viewportHeightPx.value)
  if (scrollTop.value <= maxScroll) return
  scrollTop.value = maxScroll
  const el = viewportRef.value
  if (el && el.scrollTop !== maxScroll) el.scrollTop = maxScroll
}

const virtualSlice = computed(() => {
  if (!useVirtualScroll.value) {
    return { nodes: flatNodes.value, startIndex: 0, paddingTop: 0, paddingBottom: 0 }
  }
  return sliceVirtualTreeNodes(
    flatNodes.value,
    scrollTop.value,
    viewportHeightPx.value,
    rowHeight.value,
    props.overscan,
  )
})

const visibleFlatNodes = computed(() => virtualSlice.value.nodes)
const isEmpty = computed(() => displayNodes.value.length === 0)
const showDragHandle = computed(() => props.draggable && props.dragTrigger === 'handle')
const dragWholeRow = computed(() => props.draggable && props.dragTrigger === 'row')
/** 限定高度或虚拟滚动时铺满父级，并用 ::before 捕获空白区右键（对齐 RsTable shell） */
const fillCapture = computed(() => props.virtual || props.height !== undefined)

const viewportStyle = computed(() => {
  if (!useVirtualScroll.value && props.height === undefined) return undefined
  if (props.height !== undefined && !isVirtualListFillHeight(props.height)) {
    return { maxHeight: resolveVirtualListHeight(props.height, 320) }
  }
  // 百分比 / 填满：由 CSS height:100% 承接，不再写死 maxHeight px
  if (isVirtualListFillHeight(props.height)) {
    return { height: '100%', maxHeight: '100%' }
  }
  const h = _measuredHeight.value > 0 ? _measuredHeight.value : 320
  return { maxHeight: `${h}px` }
})

const selectedSet = computed(() => {
  if (props.multiple) return new Set(Array.isArray(model.value) ? model.value.map(String) : [])
  return new Set(typeof model.value === 'string' && model.value ? [model.value] : [])
})

watch(
  () => props.filter,
  (keyword, previousKeyword) => {
    if (props.autoExpandParent) {
      const query = keyword.trim()
      if (!query) {
        if (expandedKeysBeforeFilter.value !== null) {
          expandedKeys.value = expandedKeysBeforeFilter.value
          expandedKeysBeforeFilter.value = null
        }
      } else {
        if (expandedKeysBeforeFilter.value === null) {
          expandedKeysBeforeFilter.value = [...expandedKeys.value]
        }
        // 复用 displayNodes 的过滤结果，避免每次输入对整棵树重复跑一遍 filterTreeNodes
        const filtered = displayNodes.value
        // 无匹配时不覆盖展开键，否则清空搜索后原展开状态会丢失
        if (filtered.length > 0) {
          expandedKeys.value = collectExpandableKeys(filtered, fields.value, props.lazy)
        }
      }
    }
    // 挂载时的首次运行（oldValue 为 undefined）只处理展开键，不该动滚动位置
    if (previousKeyword === undefined) return
    // 列表高度骤变时浏览器不一定派发 scroll，主动归零避免虚拟切片空白
    void nextTick(() => {
      if (!alive) return
      resetViewportScroll()
    })
  },
  { immediate: true },
)

watch(
  flatNodes,
  (nodes) => {
    if (nodes.length === 0) {
      focusedKey.value = null
      void nextTick(() => {
        if (!alive) return
        clampViewportScroll()
      })
      return
    }
    if (!focusedKey.value || !nodes.some((item) => item.key === focusedKey.value)) {
      focusedKey.value = nodes[0]?.key ?? null
    }
    void nextTick(() => {
      if (!alive) return
      clampViewportScroll()
    })
  },
  { immediate: true },
)

watch(
  () => props.nodes,
  () => {
    dragKey.value = null
    dropTargetKey.value = null
  },
)

function setRowRef(key: string, element: Element | null): void {
  if (element instanceof HTMLElement) rowRefs.value.set(key, element)
  else rowRefs.value.delete(key)
}

function pruneRowRefs(nodes: readonly RsTreeFlatNode[]): void {
  const live = new Set(nodes.map((item) => item.key))
  for (const key of rowRefs.value.keys()) {
    if (!live.has(key)) rowRefs.value.delete(key)
  }
}

watch(visibleFlatNodes, (nodes) => {
  pruneRowRefs(nodes)
})

function itemDomId(key: string): string {
  return `${rootId.value}-item-${encodeURIComponent(key).replace(/%/g, '_')}`
}

function isRtlHost(): boolean {
  if (config) return resolveDirMode(config.dir.value, config.locale.value) === 'rtl'
  const dir = treeRootRef.value?.closest('[dir]')?.getAttribute('dir')
  if (dir === 'rtl') return true
  if (dir === 'ltr') return false
  if (treeRootRef.value && typeof getComputedStyle === 'function') {
    return getComputedStyle(treeRootRef.value).direction === 'rtl'
  }
  return false
}

function scrollKeyIntoView(key: string): void {
  const index = flatNodes.value.findIndex((item) => item.key === key)
  if (index < 0) return
  if (useVirtualScroll.value) {
    const top = index * rowHeight.value
    const view = viewportHeightPx.value
    const current = scrollTop.value
    let next = current
    if (top < current) next = top
    else if (top + rowHeight.value > current + view) next = Math.max(0, top + rowHeight.value - view)
    if (next !== current) {
      scrollTop.value = next
      const el = viewportRef.value
      if (el && el.scrollTop !== next) el.scrollTop = next
    }
    return
  }
  rowRefs.value.get(key)?.scrollIntoView?.({ block: 'nearest' })
}

async function scrollFocusedIntoView(key: string): Promise<void> {
  await nextTick()
  if (!alive) return
  scrollKeyIntoView(key)
}

function revealAncestors(key: string): void {
  const index = nodeIndex.value
  if (!index.has(key)) return
  const chain: string[] = []
  let parent = index.get(key)?.parentKey ?? null
  while (parent) {
    chain.push(parent)
    parent = index.get(parent)?.parentKey ?? null
  }
  if (chain.length === 0) return
  const next = new Set(expandedKeys.value)
  let changed = false
  for (const id of chain) {
    if (!next.has(id)) {
      next.add(id)
      changed = true
    }
  }
  if (changed) expandedKeys.value = [...next]
}

function setExpanded(key: string, expanded: boolean): void {
  let next = [...expandedKeys.value]
  if (expanded) {
    next = props.accordion ? resolveAccordionExpandedKeys(key, next, nodeIndex.value, rootKeys.value) : [...new Set([...next, key])]
  } else {
    const set = new Set(next)
    set.delete(key)
    next = [...set]
  }
  expandedKeys.value = next
  emit('expand', key, expanded)
}

async function toggleExpanded(node: RsTreeNode, key: string): Promise<void> {
  if (treeDisabled.value) return
  const expanded = expandedSet.value.has(key)
  if (expanded) {
    setExpanded(key, false)
    return
  }

  if (
    props.lazy
    && props.loadData
    && hasTreeChildren(node, fields.value, true)
    && getTreeChildren(node, fields.value).length === 0
  ) {
    const nextLoading = new Set(loadingKeys.value)
    nextLoading.add(key)
    loadingKeys.value = nextLoading
    try {
      await props.loadData(node, key)
    } finally {
      if (!alive) return
      const doneLoading = new Set(loadingKeys.value)
      doneLoading.delete(key)
      loadingKeys.value = doneLoading
    }
  }

  if (!alive) return
  setExpanded(key, true)
}

function selectNode(node: RsTreeNode, key: string): void {
  if (treeDisabled.value || !props.selectable || isTreeNodeDisabled(node, fields.value)) return

  if (props.multiple) {
    const next = new Set(selectedSet.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    model.value = [...next]
    return
  }
  model.value = key
}

function toggleCheck(node: RsTreeNode, key: string): void {
  if (treeDisabled.value || isTreeCheckboxDisabled(node, fields.value, checkboxOptions())) return
  const next = toggleTreeCheck(
    key,
    checkedSet.value,
    nodeIndex.value,
    props.checkStrictly,
    props.onlyCheckLeaf,
  )
  checkedKeys.value = next
  emit('check', next, halfCheckedKeys.value, node, key)
}

function handleNodeAction(node: RsTreeNode, key: string): void {
  if (treeDisabled.value) return
  emit('node-click', node, key)
  focusedKey.value = key

  if (props.checkable && props.checkOnClickNode) {
    toggleCheck(node, key)
    if (!props.selectable && !props.expandOnClickNode) return
  }

  if (props.expandOnClickNode && hasTreeChildren(node, fields.value, props.lazy)) {
    void toggleExpanded(node, key)
    return
  }

  if (props.selectable) selectNode(node, key)
}

function handleRowClick(node: RsTreeNode, key: string, event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (target.closest('.rs-tree__toggle, .rs-tree__checkbox, .rs-tree__drag-handle')) return
  handleNodeAction(node, key)
}

function handleRowDblclick(node: RsTreeNode, key: string, event: MouseEvent): void {
  if (treeDisabled.value) return
  const target = event.target as HTMLElement
  if (target.closest('.rs-tree__toggle, .rs-tree__checkbox, .rs-tree__drag-handle')) return
  emit('node-dblclick', node, key)
}

function handleLabelClick(node: RsTreeNode, key: string, event: MouseEvent): void {
  event.stopPropagation()
  handleNodeAction(node, key)
}

/**
 * 只给当前可见行算勾选态，模板里多次读取走 Map。
 * 没有勾选项时不建索引。
 */
const checkStateMap = computed(() => {
  const map = new Map<string, RsTreeCheckState>()
  if (!props.checkable || checkedSet.value.size === 0) return map
  const index = nodeIndex.value
  for (const entry of visibleFlatNodes.value) {
    map.set(
      entry.key,
      resolveTreeCheckState(entry.key, checkedSet.value, index, props.checkStrictly, props.onlyCheckLeaf),
    )
  }
  return map
})

function checkStateFor(key: string): RsTreeCheckState {
  return checkStateMap.value.get(key) ?? 'unchecked'
}

function ariaChecked(key: string): 'true' | 'false' | 'mixed' | undefined {
  if (!props.checkable) return undefined
  const state = checkStateFor(key)
  if (state === 'checked') return 'true'
  if (state === 'indeterminate') return 'mixed'
  return 'false'
}

function isSelected(key: string): boolean {
  return selectedSet.value.has(key)
}

function isExpanded(key: string): boolean {
  return expandedSet.value.has(key)
}

function isFocused(key: string): boolean {
  return focusedKey.value === key
}

const labelPartsByKey = computed(() => {
  const map = new Map<string, Array<{ text: string; highlight: boolean }>>()
  const keyword = props.filter.trim()
  for (const entry of visibleFlatNodes.value) {
    const label = getTreeLabel(entry.node, fields.value)
    map.set(
      entry.key,
      !props.highlight || !keyword
        ? [{ text: label, highlight: false }]
        : splitTreeLabelHighlight(label, props.filter),
    )
  }
  return map
})

function labelParts(key: string): Array<{ text: string; highlight: boolean }> {
  return labelPartsByKey.value.get(key) ?? []
}

function rowIndentStyle(depth: number): Record<string, string> {
  return { paddingInlineStart: `${depth * indentPx.value}px` }
}

function expandAll(): void {
  expandedKeys.value = collectExpandableKeys(displayNodes.value, fields.value, props.lazy)
}

function collapseAll(): void {
  expandedKeys.value = []
}

function expandNode(key: string): void {
  setExpanded(key, true)
}

function collapseNode(key: string): void {
  setExpanded(key, false)
}

function focusNode(key: string): void {
  focusedKey.value = key
  void scrollFocusedIntoView(key)
}

function focus(): void {
  treeRootRef.value?.focus()
}

function scrollToKey(key: string): void {
  if (!nodeIndex.value.has(key)) return
  revealAncestors(key)
  focusedKey.value = key
  void scrollFocusedIntoView(key)
}

function getSelectedKeys(): string[] {
  if (props.multiple) return Array.isArray(model.value) ? model.value.map(String) : []
  return typeof model.value === 'string' && model.value ? [model.value] : []
}

function getCheckedKeys(): string[] {
  return [...checkedKeys.value]
}

function getExpandedKeys(): string[] {
  return [...expandedKeys.value]
}

function getHalfCheckedKeys(): string[] {
  return [...halfCheckedKeys.value]
}

function moveFocus(move: RsTreeFocusMove): void {
  const nextKey = resolveTreeFocusKey(flatNodes.value, focusedKey.value, move, nodeIndex.value)
  if (!nextKey) return
  focusedKey.value = nextKey
  void scrollFocusedIntoView(nextKey)
}

const TREE_NAVIGATION_KEYS: Record<string, RsTreeFocusMove> = {
  ArrowDown: 'next',
  ArrowUp: 'prev',
  Home: 'first',
  End: 'last',
}

function handleTreeNavigationKey(event: KeyboardEvent): boolean {
  const move = TREE_NAVIGATION_KEYS[event.key]
  if (!move) return false
  event.preventDefault()
  moveFocus(move)
  return true
}

function handleTreeArrowForward(event: KeyboardEvent, entry: RsTreeFlatNode, current: string): void {
  event.preventDefault()
  if (entry.hasChildren && !isExpanded(current)) void toggleExpanded(entry.node, current)
  else moveFocus('next')
}

function handleTreeArrowBackward(event: KeyboardEvent, entry: RsTreeFlatNode, current: string): void {
  event.preventDefault()
  if (entry.hasChildren && isExpanded(current)) setExpanded(current, false)
  else moveFocus('parent')
}

function expandSiblingBranches(current: string): void {
  if (props.accordion || treeDisabled.value) return
  const index = nodeIndex.value
  const parentKey = index.get(current)?.parentKey ?? null
  const siblings = parentKey ? (index.get(parentKey)?.childrenKeys ?? []) : rootKeys.value
  const next = new Set(expandedKeys.value)
  let changed = false
  for (const sibling of siblings) {
    const entry = index.get(sibling)
    if (!entry || entry.childrenKeys.length === 0 || next.has(sibling)) continue
    next.add(sibling)
    changed = true
  }
  if (changed) expandedKeys.value = [...next]
}

function handleTypeahead(event: KeyboardEvent): boolean {
  if (event.isComposing || event.key === 'Process') return false
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  if (event.key.length !== 1) return false
  event.preventDefault()
  typeaheadQuery = `${typeaheadQuery}${event.key}`.slice(-32)
  if (typeaheadTimer != null) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => {
    typeaheadTimer = null
    typeaheadQuery = ''
  }, 500)
  const nextKey = resolveTreeTypeaheadKey(flatNodes.value, focusedKey.value, typeaheadQuery, fields.value)
  if (!nextKey) return true
  focusedKey.value = nextKey
  void scrollFocusedIntoView(nextKey)
  return true
}

function isInnerControlTarget(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.rs-tree__label, .rs-tree__toggle, .rs-tree__checkbox'))
}

function handleKeydown(event: KeyboardEvent): void {
  if (treeDisabled.value) return
  if ((event.key === 'Enter' || event.key === ' ') && isInnerControlTarget(event)) return
  if (handleTreeNavigationKey(event)) return

  const current = focusedKey.value
  if (!current) return
  const entry = flatNodes.value.find((item) => item.key === current)
  if (!entry) return

  const forward = isRtlHost() ? 'ArrowLeft' : 'ArrowRight'
  const backward = isRtlHost() ? 'ArrowRight' : 'ArrowLeft'
  if (event.key === forward) {
    handleTreeArrowForward(event, entry, current)
    return
  }
  if (event.key === backward) {
    handleTreeArrowBackward(event, entry, current)
    return
  }
  if (event.key === '*') {
    event.preventDefault()
    expandSiblingBranches(current)
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleNodeAction(entry.node, current)
    return
  }
  handleTypeahead(event)
}

function canDrop(drag: string, drop: string, position: RsTreeDropPosition): boolean {
  if (drag === drop) return false
  // 只禁止拖进自己的子孙（会成环）。放到自己的祖先上是合法操作——例如把节点拖出所在文件夹，
  // 落在该文件夹的前/后；是否真的允许交由 allowDrop 决定，组件内不越权否决。
  if (isTreeAncestorKey(drag, drop, nodeIndex.value)) return false
  if (props.allowDrop) return props.allowDrop(drag, drop, position)
  return true
}

function resolveDropPosition(event: MouseEvent, element: HTMLElement): RsTreeDropPosition {
  const rect = element.getBoundingClientRect()
  const offset = event.clientY - rect.top
  if (offset < rect.height * 0.25) return 'before'
  if (offset > rect.height * 0.75) return 'after'
  return 'inside'
}

function onDragStart(key: string, event: DragEvent): void {
  if (treeDisabled.value || !props.draggable) return
  dragKey.value = key
  if (!event.dataTransfer) return
  event.dataTransfer.setData('text/plain', key)
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(key: string, event: DragEvent): void {
  if (treeDisabled.value || !props.draggable || !dragKey.value) return
  const row = event.currentTarget as HTMLElement
  const position = resolveDropPosition(event, row)
  if (!canDrop(dragKey.value, key, position)) return
  event.preventDefault()
  dropTargetKey.value = key
  dropPosition.value = position
}

function onDragLeave(): void {
  dropTargetKey.value = null
}

function onDrop(key: string, event: DragEvent): void {
  if (treeDisabled.value || !props.draggable || !dragKey.value) return
  const row = event.currentTarget as HTMLElement
  const position = resolveDropPosition(event, row)
  event.preventDefault()
  if (!canDrop(dragKey.value, key, position)) return
  emit('node-drop', dragKey.value, key, position)
  dragKey.value = null
  dropTargetKey.value = null
}

function onDragEnd(): void {
  dragKey.value = null
  dropTargetKey.value = null
}

function onViewportScroll(event: Event): void {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}

defineExpose<RsTreeExpose>({
  expandAll,
  collapseAll,
  expandNode,
  collapseNode,
  focusNode,
  focus,
  scrollToKey,
  getSelectedKeys,
  getCheckedKeys,
  getExpandedKeys,
  getHalfCheckedKeys,
})
</script>

<template>
  <div
    :id="rootId"
    ref="treeRootRef"
    class="rs-tree rs-motion-reduce"
    :class="[
      `rs-tree--${resolvedSize}`,
      {
        'rs-tree--virtual': useVirtualScroll,
        'rs-tree--fill-capture': fillCapture,
        'rs-tree--block': blockNode,
        'rs-tree--line': showLine,
        'rs-tree--draggable': draggable,
        'rs-tree--drag-row': dragWholeRow,
        'rs-tree--disabled': treeDisabled,
      },
    ]"
    role="tree"
    :tabindex="treeDisabled ? -1 : 0"
    :aria-label="treeLabel"
    :aria-disabled="treeDisabled || undefined"
    :aria-multiselectable="multiple || checkable || undefined"
    :aria-activedescendant="focusedKey ? itemDomId(focusedKey) : undefined"
    @keydown="handleKeydown"
  >
    <slot v-if="isEmpty" name="empty">
      <RsEmpty
        fill
        class="rs-tree__empty"
        :description="t('tree.empty')"
      />
    </slot>

    <div
      v-else
      ref="viewportRef"
      class="rs-tree__viewport"
      :class="{
        'rs-tree__viewport--scroll rs-native-scrollbar': useVirtualScroll || height !== undefined,
      }"
      :style="viewportStyle"
      @scroll="onViewportScroll"
    >
      <div
        v-if="useVirtualScroll && virtualSlice.paddingTop > 0"
        class="rs-tree__pad"
        :style="{ height: `${virtualSlice.paddingTop}px` }"
        aria-hidden="true"
      />

      <ul class="rs-tree__list">
        <li
          v-for="entry in visibleFlatNodes"
          :key="`${entry.parentKey ?? 'root'}:${entry.key}`"
          class="rs-tree__item"
        >
          <div
            :id="itemDomId(entry.key)"
            :ref="(el) => setRowRef(entry.key, el as Element | null)"
            class="rs-tree__row"
            role="treeitem"
            tabindex="-1"
            :aria-expanded="entry.hasChildren ? isExpanded(entry.key) : undefined"
            :aria-selected="selectable ? isSelected(entry.key) : undefined"
            :aria-checked="checkable && shouldShowTreeCheckbox(entry.node, fields, checkboxOptions()) ? ariaChecked(entry.key) : undefined"
            :aria-disabled="treeDisabled || isTreeNodeDisabled(entry.node, fields) || undefined"
            :aria-busy="isTreeNodeLoading(entry.node, entry.key, loadingKeys, fields) || undefined"
            :aria-level="entry.depth + 1"
            :aria-setsize="entry.setSize"
            :aria-posinset="entry.posInSet"
            :draggable="draggable && !isTreeNodeDisabled(entry.node, fields)"
            :class="{
              'rs-tree__row--selected': selectable && isSelected(entry.key),
              'rs-tree__row--focused': isFocused(entry.key),
              'rs-tree__row--disabled': isTreeNodeDisabled(entry.node, fields),
              'rs-tree__row--drop-before': dropTargetKey === entry.key && dropPosition === 'before',
              'rs-tree__row--drop-inside': dropTargetKey === entry.key && dropPosition === 'inside',
              'rs-tree__row--drop-after': dropTargetKey === entry.key && dropPosition === 'after',
              'rs-tree__row--last': showLine && entry.isLast,
            }"
            :data-tree-key="entry.key"
            :style="[rowIndentStyle(entry.depth), { minHeight: `${rowHeight}px` }]"
            @contextmenu="emit('node-contextmenu', entry.node, entry.key, $event)"
            @dragstart="onDragStart(entry.key, $event)"
            @dragover="onDragOver(entry.key, $event)"
            @dragleave="onDragLeave"
            @drop="onDrop(entry.key, $event)"
            @dragend="onDragEnd"
            @click="blockNode ? handleRowClick(entry.node, entry.key, $event) : undefined"
            @dblclick="handleRowDblclick(entry.node, entry.key, $event)"
          >
            <span v-if="showLine" class="rs-tree__lines" aria-hidden="true">
              <span
                v-for="(draw, level) in entry.levelLines"
                v-show="draw"
                :key="`v-${level}`"
                class="rs-tree__line-vert"
                :style="{ insetInlineStart: `${level * indentPx + indentPx / 2}px` }"
              />
              <span
                class="rs-tree__line-vert rs-tree__line-vert--self"
                :class="{ 'rs-tree__line-vert--end': entry.isLast }"
                :style="{ insetInlineStart: `${entry.depth * indentPx + indentPx / 2}px` }"
              />
              <span
                class="rs-tree__line-horz"
                :style="{
                  insetInlineStart: `${entry.depth * indentPx + indentPx / 2}px`,
                  width: `${indentPx / 2}px`,
                }"
              />
            </span>

            <span
              v-if="showDragHandle"
              class="rs-tree__drag-handle"
              :title="t('tree.drag')"
              aria-hidden="true"
            >
              <RsIcon name="grip-vertical" size="sm" />
            </span>

            <button
              v-if="entry.hasChildren"
              type="button"
              class="rs-tree__toggle"
              :class="{ 'rs-tree__toggle--expanded': isExpanded(entry.key) }"
              tabindex="-1"
              :aria-label="isExpanded(entry.key) ? t('tree.collapse') : t('tree.expand')"
              :aria-expanded="isExpanded(entry.key)"
              :disabled="treeDisabled || isTreeNodeLoading(entry.node, entry.key, loadingKeys, fields)"
              @click.stop="toggleExpanded(entry.node, entry.key)"
            >
              <RsIcon
                v-if="isTreeNodeLoading(entry.node, entry.key, loadingKeys, fields)"
                name="loader"
                size="sm"
                class="rs-tree__loading-icon"
                spin
              />
              <span v-else class="rs-tree__toggle-caret" aria-hidden="true">›</span>
            </button>
            <span v-else class="rs-tree__spacer" aria-hidden="true" />

            <label
              v-if="checkable && shouldShowTreeCheckbox(entry.node, fields, checkboxOptions())"
              class="rs-tree__checkbox"
              :class="{
                'rs-tree__checkbox--checked': checkStateFor(entry.key) === 'checked',
                'rs-tree__checkbox--indeterminate': checkStateFor(entry.key) === 'indeterminate',
              }"
            >
              <input
                type="checkbox"
                class="rs-tree__checkbox-input"
                tabindex="-1"
                :checked="checkStateFor(entry.key) === 'checked'"
                :indeterminate="checkStateFor(entry.key) === 'indeterminate'"
                :disabled="treeDisabled || isTreeCheckboxDisabled(entry.node, fields, checkboxOptions())"
                :aria-label="t('tree.check')"
                @click.stop
                @change="toggleCheck(entry.node, entry.key)"
              />
              <span class="rs-tree__checkbox-box" aria-hidden="true" />
            </label>
            <span
              v-else-if="checkable && onlyCheckLeaf && hasTreeChildren(entry.node, fields, lazy)"
              class="rs-tree__checkbox-spacer"
              aria-hidden="true"
            />

            <slot
              v-if="$slots.icon || entry.node[fields.icon] || entry.node.icon"
              name="icon"
              :node="entry.node"
              :key="entry.key"
              :expanded="isExpanded(entry.key)"
            >
              <RsIcon
                v-if="entry.node[fields.icon] || entry.node.icon"
                :name="String(entry.node[fields.icon] ?? entry.node.icon)"
                size="sm"
                class="rs-tree__node-icon"
              />
            </slot>

            <button
              v-if="!blockNode"
              type="button"
              class="rs-tree__label"
              tabindex="-1"
              :disabled="treeDisabled || isTreeNodeDisabled(entry.node, fields)"
              @click="handleLabelClick(entry.node, entry.key, $event)"
            >
              <slot
                name="title"
                :node="entry.node"
                :key="entry.key"
                :label="getTreeLabel(entry.node, fields)"
                :expanded="isExpanded(entry.key)"
                :selected="isSelected(entry.key)"
                :check-state="checkStateFor(entry.key)"
                :depth="entry.depth"
                :focused="isFocused(entry.key)"
              >
                <span class="rs-tree__label-text">
                  <template v-for="(part, index) in labelParts(entry.key)" :key="index">
                    <mark v-if="part.highlight" class="rs-tree__highlight">{{ part.text }}</mark>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </span>
              </slot>
            </button>
            <span
              v-else
              class="rs-tree__label rs-tree__label--block"
              :class="{ 'rs-tree__label--disabled': isTreeNodeDisabled(entry.node, fields) }"
            >
              <slot
                name="title"
                :node="entry.node"
                :key="entry.key"
                :label="getTreeLabel(entry.node, fields)"
                :expanded="isExpanded(entry.key)"
                :selected="isSelected(entry.key)"
                :check-state="checkStateFor(entry.key)"
                :depth="entry.depth"
                :focused="isFocused(entry.key)"
              >
                <span class="rs-tree__label-text">
                  <template v-for="(part, index) in labelParts(entry.key)" :key="index">
                    <mark v-if="part.highlight" class="rs-tree__highlight">{{ part.text }}</mark>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </span>
              </slot>
            </span>
          </div>
        </li>
      </ul>

      <div
        v-if="useVirtualScroll && virtualSlice.paddingBottom > 0"
        class="rs-tree__pad"
        :style="{ height: `${virtualSlice.paddingBottom}px` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.rs-tree {
  outline: none;
}

/* 限定高度 / 虚拟滚动：铺满父级，::before 捕获节点列表下方空白区右键 */
.rs-tree--fill-capture {
  position: relative;
  height: 100%;
  min-height: 0;
}

.rs-tree--fill-capture::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
}

.rs-tree--fill-capture > .rs-tree__empty,
.rs-tree--fill-capture > .rs-tree__viewport {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.rs-tree:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
  border-radius: var(--rs-radius-sm);
}

.rs-tree__viewport--scroll {
  overflow: auto;
}

/* 虚拟模式下组件自动撑满父容器，使内置 ResizeObserver 能测到真实可用高度 */
.rs-tree--virtual {
  height: 100%;
}

.rs-tree--virtual .rs-tree__viewport--scroll,
.rs-tree__viewport--scroll {
  border-radius: var(--rs-radius-sm);
}

.rs-tree__empty {
  padding: var(--rs-space-xl) var(--rs-space-md);
}

.rs-tree__list,
.rs-tree__item {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-tree__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--rs-space-xs);
  margin-inline: var(--rs-space-xs);
  padding-inline: var(--rs-space-xs);
  border-radius: var(--rs-radius-sm);
  box-sizing: border-box;
  transition: background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}

.rs-tree__row:hover:not(.rs-tree__row--disabled):not(.rs-tree__row--selected) {
  background: var(--rs-tree-row-hover);
}

.rs-tree__row--selected {
  background: var(--rs-tree-selected-bg);
}

.rs-tree__row--selected .rs-tree__label,
.rs-tree__row--selected .rs-tree__label--block {
  color: var(--rs-tree-selected-fg);
  font-weight: inherit;
}

.rs-tree__row--focused {
  background: var(--rs-tree-focused-bg);
  box-shadow: inset 0 0 0 1px var(--rs-tree-focused-ring);
}

.rs-tree__row--selected.rs-tree__row--focused {
  background: var(--rs-tree-selected-focused-bg);
  box-shadow: inset 0 0 0 1px var(--rs-tree-selected-focused-ring);
}

.rs-tree--block .rs-tree__row {
  cursor: pointer;
}

.rs-tree__row--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.rs-tree__row--drop-before::before,
.rs-tree__row--drop-after::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  height: 2px;
  background: var(--rs-tree-drop-indicator);
  pointer-events: none;
}

.rs-tree__row--drop-before::before {
  top: 0;
}

.rs-tree__row--drop-after::after {
  bottom: 0;
}

.rs-tree__row--drop-inside {
  background: var(--rs-tree-drop-inside-bg);
}

.rs-tree--disabled {
  cursor: not-allowed;
}

.rs-tree--line .rs-tree__lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 导航线：半透明字色 token，避免宿主把 --rs-border-subtle 桥成实色灰后过深 */
.rs-tree--line .rs-tree__line-vert {
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--rs-tree-line-width, 1px);
  background: var(--rs-tree-line);
}

.rs-tree--line .rs-tree__line-vert--self.rs-tree__line-vert--end {
  bottom: 50%;
}

.rs-tree--line .rs-tree__line-horz {
  position: absolute;
  top: 50%;
  height: var(--rs-tree-line-width, 1px);
  background: var(--rs-tree-line);
}

.rs-tree__drag-handle {
  display: inline-flex;
  align-items: center;
  color: var(--rs-muted);
  cursor: move;
  flex: 0 0 auto;
}


.rs-tree__toggle,
.rs-tree__spacer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;
}

.rs-tree__toggle {
  border: 0;
  padding: 0;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  outline: none;
  transition: color var(--rs-transition-fast);
}

.rs-tree__toggle:hover:not(:disabled) {
  color: var(--rs-text);
}

.rs-tree__toggle:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tree__toggle:disabled {
  cursor: default;
}

.rs-tree__toggle-caret {
  display: block;
  font-size: var(--rs-font-size-lg);
  font-weight: var(--rs-font-weight-medium);
  line-height: 1;
  transform: translateY(-0.5px);
  transition: transform var(--rs-transition-fast);
}

[dir='rtl'] .rs-tree__toggle-caret {
  transform: translateY(-0.5px) scaleX(-1);
}

.rs-tree__toggle--expanded .rs-tree__toggle-caret {
  transform: translateY(-0.5px) rotate(90deg);
}

[dir='rtl'] .rs-tree__toggle--expanded .rs-tree__toggle-caret {
  transform: translateY(-0.5px) scaleX(-1) rotate(-90deg);
}

.rs-tree__loading-icon {
  color: var(--rs-primary);
}

.rs-tree__checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  cursor: pointer;
}

.rs-tree__checkbox-spacer {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.rs-tree__checkbox-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-tree__checkbox-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-xs, 4px);
  background: var(--rs-surface);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rs-tree__checkbox--checked .rs-tree__checkbox-box,
.rs-tree__checkbox--indeterminate .rs-tree__checkbox-box {
  border-color: var(--rs-primary);
  background: var(--rs-primary);
}

.rs-tree__checkbox--checked .rs-tree__checkbox-box::after {
  content: '';
  width: 0.3rem;
  height: 0.55rem;
  border: solid var(--rs-tree-check-fg, var(--rs-primary-foreground));
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.rs-tree__checkbox--indeterminate .rs-tree__checkbox-box::after {
  content: '';
  width: 0.5rem;
  height: 2px;
  background: var(--rs-tree-check-fg, var(--rs-primary-foreground));
  border-radius: 1px;
}

.rs-tree__node-icon {
  flex: 0 0 auto;
  color: var(--rs-muted);
}

.rs-tree__label {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--rs-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.rs-tree__label-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-tree__label--block {
  cursor: inherit;
}

.rs-tree__label:disabled,
.rs-tree__label--disabled {
  cursor: not-allowed;
}

.rs-tree__highlight {
  padding: 0 0.125rem;
  border: 0;
  border-radius: 2px;
  background: var(--rs-tree-highlight-bg);
  color: inherit;
  font-weight: var(--rs-font-weight-semibold);
}

.rs-tree__pad {
  flex: 0 0 auto;
  pointer-events: none;
}

.rs-tree--ssm .rs-tree__label,
.rs-tree--ssm .rs-tree__toggle {
  font-size: var(--rs-font-size-xs);
}

.rs-tree--ssm .rs-tree__toggle,
.rs-tree--ssm .rs-tree__spacer {
  width: 0.875rem;
  height: 0.875rem;
}

.rs-tree--ssm .rs-tree__toggle-caret {
  font-size: var(--rs-font-size-sm);
}

.rs-tree--sm .rs-tree__label,
.rs-tree--sm .rs-tree__toggle {
  font-size: var(--rs-font-size-xs);
}

.rs-tree--sm .rs-tree__toggle,
.rs-tree--sm .rs-tree__spacer {
  width: 1rem;
  height: 1rem;
}

.rs-tree--sm .rs-tree__toggle-caret {
  font-size: var(--rs-font-size-base);
}

.rs-tree--lg .rs-tree__label {
  font-size: var(--rs-font-size-sm);
}

.rs-tree--lg .rs-tree__toggle,
.rs-tree--lg .rs-tree__spacer {
  width: 1.5rem;
  height: 1.5rem;
}

.rs-tree--lg .rs-tree__toggle-caret {
  font-size: var(--rs-font-size-xl);
}
</style>
