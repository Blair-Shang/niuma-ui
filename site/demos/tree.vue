<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RsButton, RsInput, RsTree } from 'niuma-ui'
import type { RsTreeInstance, RsTreeNode } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const selected = ref('flows')
const multi = ref<string[]>(['flows'])
const checked = ref<string[]>(['design'])
const half = ref<string[]>([])
const strictChecked = ref<string[]>(['design'])
const leafChecked = ref<string[]>(['design'])
const clickChecked = ref<string[]>([])
const filter = ref('')
const fieldSelected = ref('1-1')
const accordionKeys = ref<string[]>(['flows'])
const blockKeys = ref<string[]>([])
const eventLog = ref('')
const dropLog = ref('')
const methodLog = ref('')
let loadTimer: ReturnType<typeof setTimeout> | undefined
let releaseLoad: (() => void) | undefined
let disposed = false
const lazyNodes = ref<RsTreeNode[]>([])
const treeRef = ref<RsTreeInstance | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    workspace: 'Workspace',
    flows: 'Flows',
    datasets: 'Datasets',
    settings: 'Settings',
    selected: (key: string) => `selected → ${key || 'none'}`,
    multi: (keys: string) => `multiple → ${keys || 'none'}`,
    half: (keys: string) => `half → ${keys || 'none'}`,
    strict: 'Parents and children check independently.',
    leaf: 'Only leaves have a checkbox.',
    checkClick: 'Click the label to toggle the check.',
    archived: 'Team B (archived)',
    noCheck: 'Team C (checkbox off)',
    nodeDisabled: 'A disabled node cannot be selected. disableCheckbox hides the check only.',
    fieldHint: 'id / name / subList mapped with fieldNames. The value is the id.',
    accordionHint: 'Opening one branch closes its siblings.',
    blockHint: 'The whole row expands. The label is not a separate button.',
    sizeSm: 'sm — dense sidebar',
    sizeLg: 'lg — looser rows',
    rowDrag: 'Drag from the row. Dropping inside a node is rejected.',
    keyHint: 'Focus the tree, then Arrow / Home / End, or type a letter. In RTL, forward is ArrowLeft.',
    autoVirtual: '120 rows, virtual is off. It still virtualizes past the threshold. Check the console.',
    product: 'Product',
    design: 'Design',
    research: 'Research',
    checked: (keys: string) => `checked → ${keys || 'none'}`,
    filterLabel: 'Filter',
    dragHint: 'Drop a row. The tree reports the move; this demo does not rewrite the data.',
    dropped: (drag: string, drop: string, position: string) => `node-drop → ${drag} ${position} ${drop}`,
    folder: 'Folder',
    loaded: 'Loaded child',
    load: 'Expand the folder. Children arrive after a short wait.',
    loading: 'Loading…',
    virtualHint: '200 rows with virtual. Open the console: one line when virtual scroll turns on.',
    row: (n: number) => `Node ${n}`,
    emptyTitle: 'No matches',
    emptyHint: 'Try another keyword.',
    badge: 'New',
    disabledHint: 'Disabled trees ignore click, check, and drag. Form.disabled does the same.',
    eventIdle: 'Click, expand, check, or right-click a row.',
    clicked: (key: string) => `node-click → ${key}`,
    expanded: (key: string, open: boolean) => `expand → ${key} ${open ? 'open' : 'closed'}`,
    context: (key: string) => `node-contextmenu → ${key}`,
    methodIdle: 'Host methods. Click a button.',
    expandAll: 'expandAll()',
    collapseAll: 'collapseAll()',
    focus: 'focus()',
    scroll: 'scrollToKey(leaf)',
    expandedKeys: (keys: string) => `getExpandedKeys() → ${keys || 'none'}`,
    focused: 'focus() → tree focused',
    scrolled: 'scrollToKey(leaf) → leaf focused',
    theme: 'Dark surface. Guides and selection follow tokens.',
    rtl: 'RTL. Forward is ArrowLeft.',
  },
  'zh-CN': {
    workspace: '工作区',
    flows: '流程',
    datasets: '数据集',
    settings: '设置',
    selected: (key: string) => `selected → ${key || '无'}`,
    multi: (keys: string) => `multiple → ${keys || '无'}`,
    half: (keys: string) => `half → ${keys || '无'}`,
    strict: '父子各自勾选，互不影响。',
    leaf: '只有叶子有勾选框。',
    checkClick: '点标题就会切换勾选。',
    archived: '团队 B（已归档）',
    noCheck: '团队 C（禁止勾选）',
    nodeDisabled: '禁用节点不能选中。disableCheckbox 只关掉勾选框。',
    fieldHint: 'id / name / subList 用 fieldNames 映射。选中值是 id。',
    accordionHint: '展开一支会收起同一层的其他支。',
    blockHint: '点整行展开。标题不再是单独的按钮。',
    sizeSm: 'sm — 紧凑侧栏',
    sizeLg: 'lg — 行更高',
    rowDrag: '从整行拖。不允许拖进节点内部。',
    keyHint: '先聚焦树，再用方向键 / Home / End，或输入首字母。从右向左时，向前是左方向键。',
    autoVirtual: '120 行，没有传 virtual。超过阈值仍会虚拟化。看控制台。',
    product: '产品',
    design: '设计',
    research: '研究',
    checked: (keys: string) => `checked → ${keys || '无'}`,
    filterLabel: '过滤',
    dragHint: '拖一行放下。树只报告落点，这个演示不改数据。',
    dropped: (drag: string, drop: string, position: string) => `node-drop → ${drag} ${position} ${drop}`,
    folder: '文件夹',
    loaded: '加载出的子节点',
    load: '展开文件夹。子节点稍后出现。',
    loading: '正在加载…',
    virtualHint: '200 行并打开 virtual。看控制台：虚拟滚动开启时打一行。',
    row: (n: number) => `节点 ${n}`,
    emptyTitle: '没有匹配',
    emptyHint: '换一个关键字。',
    badge: '新',
    disabledHint: '禁用的树忽略点击、勾选和拖拽。Form.disabled 同样生效。',
    eventIdle: '点击、展开、勾选，或在行上右键。',
    clicked: (key: string) => `node-click → ${key}`,
    expanded: (key: string, open: boolean) => `expand → ${key} ${open ? '展开' : '收起'}`,
    context: (key: string) => `node-contextmenu → ${key}`,
    methodIdle: '宿主方法。点按钮调用。',
    expandAll: 'expandAll()',
    collapseAll: 'collapseAll()',
    focus: 'focus()',
    scroll: 'scrollToKey(leaf)',
    expandedKeys: (keys: string) => `getExpandedKeys() → ${keys || '无'}`,
    focused: 'focus() → 树已聚焦',
    scrolled: 'scrollToKey(leaf) → 已聚焦叶子',
    theme: '深色表面。引导线和选中色跟 token。',
    rtl: '从右向左。向前是左方向键。',
  },
})

const basicNodes = computed<RsTreeNode[]>(() => [
  {
    key: 'workspace',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'flows', label: copy.value.flows, icon: 'workflow' },
      { key: 'datasets', label: copy.value.datasets, icon: 'database' },
    ],
  },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const checkNodes = computed<RsTreeNode[]>(() => [
  {
    key: 'product',
    label: copy.value.product,
    children: [
      { key: 'design', label: copy.value.design },
      { key: 'research', label: copy.value.research },
    ],
  },
])

const dragNodes = computed<RsTreeNode[]>(() => [
  { key: 'flows', label: copy.value.flows },
  { key: 'datasets', label: copy.value.datasets },
  { key: 'settings', label: copy.value.settings },
])

const disabledNodes = computed<RsTreeNode[]>(() => [
  {
    key: 'product',
    label: copy.value.product,
    children: [
      { key: 'design', label: copy.value.design },
      { key: 'research', label: copy.value.archived, disabled: true },
      { key: 'settings', label: copy.value.noCheck, disableCheckbox: true },
    ],
  },
])

const apiNodes = computed(() => [
  {
    id: '1',
    name: copy.value.product,
    subList: [
      { id: '1-1', name: copy.value.design },
      { id: '1-2', name: copy.value.research },
    ],
  },
])

const branchNodes = computed<RsTreeNode[]>(() => [
  {
    key: 'flows',
    label: copy.value.flows,
    children: [{ key: 'flow-child', label: copy.value.design }],
  },
  {
    key: 'datasets',
    label: copy.value.datasets,
    children: [{ key: 'data-child', label: copy.value.research }],
  },
])

const autoNodes = computed<RsTreeNode[]>(() =>
  Array.from({ length: 120 }, (_, index) => ({
    key: `auto-${index}`,
    label: copy.value.row(index + 1),
  })),
)

const virtualNodes = computed<RsTreeNode[]>(() =>
  Array.from({ length: 200 }, (_, index) => ({
    key: `n-${index}`,
    label: copy.value.row(index + 1),
  })),
)

const methodNodes = computed<RsTreeNode[]>(() => [
  {
    key: 'workspace',
    label: copy.value.workspace,
    children: [
      {
        key: 'group',
        label: copy.value.product,
        children: [{ key: 'leaf', label: copy.value.design }],
      },
    ],
  },
])

const selectedNote = computed(() => copy.value.selected(selected.value))
const multiNote = computed(() => copy.value.multi(multi.value.join(', ')))
const checkedNote = computed(() => `${copy.value.checked(checked.value.join(', '))} · ${copy.value.half(half.value.join(', '))}`)
const strictNote = computed(() => copy.value.checked(strictChecked.value.join(', ')))
const leafNote = computed(() => copy.value.checked(leafChecked.value.join(', ')))
const clickNote = computed(() => copy.value.checked(clickChecked.value.join(', ')))
const fieldNote = computed(() => copy.value.selected(fieldSelected.value))
const accordionNote = computed(() => copy.value.expandedKeys(accordionKeys.value.join(', ')))
const blockNote = computed(() => copy.value.expandedKeys(blockKeys.value.join(', ')))
const eventNote = computed(() => eventLog.value || copy.value.eventIdle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

watch(
  copy,
  () => {
    const root = lazyNodes.value[0]
    if (!root) {
      lazyNodes.value = [{ key: 'folder', label: copy.value.folder, isLeaf: false }]
      return
    }
    if (root.children?.length) return
    if (root.label === copy.value.folder) return
    lazyNodes.value = [{ ...root, label: copy.value.folder }]
  },
  { immediate: true },
)

onUnmounted(() => {
  disposed = true
  if (loadTimer != null) clearTimeout(loadTimer)
  releaseLoad?.()
  releaseLoad = undefined
})

function onDrop(dragKey: string, dropKey: string, position: string): void {
  dropLog.value = copy.value.dropped(dragKey, dropKey, position)
}

function allowSiblingDrop(_dragKey: string, _dropKey: string, position: string): boolean {
  return position !== 'inside'
}

async function loadFolder(node: RsTreeNode, key: string): Promise<void> {
  if (key !== 'folder') return
  await new Promise<void>((resolve) => {
    releaseLoad = resolve
    loadTimer = setTimeout(() => {
      loadTimer = undefined
      releaseLoad = undefined
      resolve()
    }, 400)
  })
  if (disposed) return
  lazyNodes.value = [
    {
      ...node,
      label: copy.value.folder,
      children: [{ key: 'folder-child', label: copy.value.loaded, isLeaf: true }],
    },
  ]
}

function expandAll(): void {
  treeRef.value?.expandAll()
  methodLog.value = copy.value.expandedKeys(treeRef.value?.getExpandedKeys().join(', ') ?? '')
}

function collapseAll(): void {
  treeRef.value?.collapseAll()
  methodLog.value = copy.value.expandedKeys(treeRef.value?.getExpandedKeys().join(', ') ?? '')
}

function focusTree(): void {
  treeRef.value?.focus()
  methodLog.value = document.activeElement?.classList.contains('rs-tree')
    ? copy.value.focused
    : copy.value.methodIdle
}

function scrollToLeaf(): void {
  treeRef.value?.scrollToKey('leaf')
  methodLog.value = copy.value.scrolled
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="选中"
    title-en="Selection"
    description="v-model 是选中的 key。下拉里选节点用 TreeSelect。"
    description-en="v-model is the selected key. Use TreeSelect when the tree lives in a field."
    code="<RsTree v-model=&quot;selected&quot; :nodes=&quot;nodes&quot; default-expand-all show-line />"
  >
    <div class="frame">
      <RsTree v-model="selected" :nodes="basicNodes" default-expand-all show-line />
      <p class="note">{{ selectedNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-multiple"
    title="多选"
    title-en="Multiple"
    description="multiple 时 v-model 是 key 数组。再点一次取消。"
    description-en="With multiple, v-model is an array of keys. Click again to remove one."
    code="<RsTree v-model=&quot;multi&quot; multiple :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <RsTree v-model="multi" multiple :nodes="dragNodes" />
      <p class="note">{{ multiNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-check"
    title="勾选"
    title-en="Check"
    description="勾选父节点会带上子节点。只勾一边时父节点半选。"
    description-en="Checking a parent checks its children. A partial set leaves the parent indeterminate."
    code="<RsTree checkable default-expand-all :nodes=&quot;nodes&quot; v-model:checked-keys=&quot;checked&quot; />"
  >
    <div class="frame">
      <RsTree
        v-model:checked-keys="checked"
        v-model:half-checked-keys="half"
        checkable
        default-expand-all
        :nodes="checkNodes"
      />
      <p class="note">{{ checkedNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-strict"
    title="父子不关联"
    title-en="Independent check"
    description="check-strictly 时勾父节点不会带上子节点，也没有半选。"
    description-en="check-strictly checks a node alone. Children stay put, and nothing is half-checked."
    code="<RsTree checkable check-strictly :nodes=&quot;nodes&quot; v-model:checked-keys=&quot;strictChecked&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.strict }}</p>
      <RsTree
        v-model:checked-keys="strictChecked"
        checkable
        check-strictly
        default-expand-all
        :nodes="checkNodes"
      />
      <p class="note">{{ strictNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-leaf"
    title="只勾叶子"
    title-en="Leaves only"
    description="only-check-leaf 隐藏父节点的勾选框。适合把权限授到叶子。"
    description-en="only-check-leaf hides the parent checkbox. Use it when permission sits on the leaves."
    code="<RsTree checkable only-check-leaf :nodes=&quot;nodes&quot; v-model:checked-keys=&quot;leafChecked&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.leaf }}</p>
      <RsTree
        v-model:checked-keys="leafChecked"
        checkable
        only-check-leaf
        default-expand-all
        :nodes="checkNodes"
      />
      <p class="note">{{ leafNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-check-click"
    title="点行勾选"
    title-en="Check on row click"
    description="check-on-click-node 让点标题和点勾选框一样。这里关掉选中，避免两套状态。"
    description-en="check-on-click-node toggles the check from the label. Selection is off so the two states do not compete."
    code="<RsTree checkable check-on-click-node :selectable=&quot;false&quot; :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.checkClick }}</p>
      <RsTree
        v-model:checked-keys="clickChecked"
        checkable
        check-on-click-node
        :selectable="false"
        :nodes="dragNodes"
      />
      <p class="note">{{ clickNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-node-disabled"
    title="禁用节点"
    title-en="Disabled nodes"
    description="节点 disabled 不能选、不能勾。disableCheckbox 只去掉这一项的勾选。"
    description-en="disabled on a node blocks select and check. disableCheckbox removes only that checkbox."
    code="<RsTree checkable :nodes=&quot;[{ key: 'b', label: 'Archived', disabled: true }]&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.nodeDisabled }}</p>
      <RsTree checkable default-expand-all :nodes="disabledNodes" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-filter"
    title="过滤"
    title-en="Filter"
    description="filter 留下匹配节点和祖先，并高亮片段。清空后恢复原来的展开。"
    description-en="filter keeps matches and ancestors, and highlights the slice. Clearing it restores the previous expansion."
    code="<RsInput v-model=&quot;filter&quot; /><RsTree :nodes=&quot;nodes&quot; :filter=&quot;filter&quot; default-expand-all />"
  >
    <div class="frame">
      <RsInput v-model="filter" :placeholder="copy.filterLabel" :aria-label="copy.filterLabel" />
      <RsTree :nodes="basicNodes" :filter="filter" default-expand-all />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-fields"
    title="字段映射"
    title-en="Field names"
    description="接口字段不是 key / label / children 时，用 fieldNames 指过去。选中值仍是映射后的 key。"
    description-en="When the API uses other field names, point fieldNames at them. The selected value is still that key."
    code="<RsTree :field-names=&quot;{ key: 'id', label: 'name', children: 'subList' }&quot; :nodes=&quot;rows&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.fieldHint }}</p>
      <RsTree
        v-model="fieldSelected"
        :nodes="apiNodes"
        :field-names="{ key: 'id', label: 'name', children: 'subList' }"
        default-expand-all
      />
      <p class="note">{{ fieldNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-drag"
    title="拖拽"
    title-en="Drag"
    description="放下后读 node-drop。树不改 nodes，宿主自己重排。"
    description-en="Read node-drop after a drop. The tree does not mutate nodes; the host reorders them."
    code="<RsTree draggable :nodes=&quot;nodes&quot; @node-drop=&quot;onDrop&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.dragHint }}</p>
      <RsTree draggable :nodes="dragNodes" @node-drop="onDrop" />
      <p class="note">{{ copy.rowDrag }}</p>
      <RsTree
        draggable
        drag-trigger="row"
        :allow-drop="allowSiblingDrop"
        :nodes="dragNodes"
        @node-drop="onDrop"
      />
      <p v-if="dropLog" class="note">{{ dropLog }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-accordion"
    title="手风琴"
    title-en="Accordion"
    description="accordion 让同一层只留一支展开。下面一行是当前展开的 key。"
    description-en="accordion keeps one sibling open. The line below is the expanded keys."
    code="<RsTree accordion v-model:expanded-keys=&quot;keys&quot; :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.accordionHint }}</p>
      <RsTree v-model:expanded-keys="accordionKeys" accordion :nodes="branchNodes" />
      <p class="note">{{ accordionNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-block"
    title="整行展开"
    title-en="Click row to expand"
    description="expand-on-click-node 配合 block-node：点行内空白也展开，不必瞄准箭头。"
    description-en="expand-on-click-node with block-node expands from anywhere on the row, not only the arrow."
    code="<RsTree block-node expand-on-click-node :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.blockHint }}</p>
      <RsTree
        v-model:expanded-keys="blockKeys"
        block-node
        expand-on-click-node
        :selectable="false"
        :nodes="branchNodes"
      />
      <p class="note">{{ blockNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-lazy"
    title="懒加载"
    title-en="Lazy load"
    description="空枝第一次展开时调用 loadData。把子节点写回 nodes。"
    description-en="loadData runs the first time an empty branch expands. Write the children back onto nodes."
    code="<RsTree lazy :nodes=&quot;nodes&quot; :load-data=&quot;loadFolder&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.load }}</p>
      <RsTree lazy :nodes="lazyNodes" :load-data="loadFolder" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-virtual"
    title="虚拟滚动"
    title-en="Virtual scroll"
    description="可见行很多时只渲染窗口。给 height，或在父级里用 virtual 撑满。"
    description-en="Only the window mounts when many rows are visible. Pass height, or virtual inside a sized parent."
    code="<RsTree virtual :height=&quot;240&quot; :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.virtualHint }}</p>
      <RsTree virtual :height="240" :nodes="virtualNodes" />
      <p class="note">{{ copy.autoVirtual }}</p>
      <RsTree :height="160" :nodes="autoNodes" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="sm 给侧栏，lg 给触控。未传时跟 Form，再跟 ConfigProvider。"
    description-en="sm for a sidebar, lg for touch. When omitted, size follows Form, then ConfigProvider."
    code="<RsTree size=&quot;sm&quot; :nodes=&quot;nodes&quot; /><RsTree size=&quot;lg&quot; :nodes=&quot;nodes&quot; />"
  >
    <div class="stack">
      <div class="frame">
        <p class="note">{{ copy.sizeSm }}</p>
        <RsTree size="sm" :nodes="dragNodes" />
      </div>
      <div class="frame">
        <p class="note">{{ copy.sizeLg }}</p>
        <RsTree size="lg" :nodes="dragNodes" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="title 换标题，icon 换图标，empty 换空态。"
    description-en="title replaces the label, icon replaces the glyph, empty replaces the empty state."
    code="<RsTree :nodes=&quot;[]&quot; :filter=&quot;'missing'&quot;><template #empty>None</template></RsTree>"
  >
    <div class="stack">
      <div class="frame">
        <RsTree :nodes="basicNodes" default-expand-all>
          <template #icon="{ expanded }">
            <span class="mark" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
          </template>
          <template #title="{ label, key }">
            <span class="title">
              {{ label }}
              <span v-if="key === 'flows'" class="badge">{{ copy.badge }}</span>
            </span>
          </template>
        </RsTree>
      </div>
      <div class="frame">
        <RsTree :nodes="basicNodes" filter="missing-keyword">
          <template #empty>
            <p class="empty">
              <strong>{{ copy.emptyTitle }}</strong>
              <span>{{ copy.emptyHint }}</span>
            </p>
          </template>
        </RsTree>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 停掉选择、勾选和拖拽。包在禁用的 Form 里同样停。"
    description-en="disabled stops selection, checks, and dragging. A disabled Form does the same."
    code="<RsTree disabled :nodes=&quot;nodes&quot; />"
  >
    <div class="frame">
      <p class="note">{{ copy.disabledHint }}</p>
      <RsTree disabled checkable :nodes="basicNodes" default-expand-all />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-keyboard"
    title="键盘"
    title-en="Keyboard"
    description="树是一个 Tab 停靠点。上下移动，向前展开，向后回到父节点。输入首字母跳到匹配标签。"
    description-en="The tree is one tab stop. Up and down move. Forward expands. Backward returns to the parent. Typing jumps to a label prefix."
    code="<RsTree :nodes=&quot;nodes&quot; default-expand-all />"
  >
    <div class="frame">
      <p class="note">{{ copy.keyHint }}</p>
      <RsTree :nodes="branchNodes" default-expand-all />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="点击、展开和右键都会写到下面一行。"
    description-en="Click, expand, and context menu write the line below."
    code="<RsTree :nodes=&quot;nodes&quot; @node-click=&quot;onClick&quot; @expand=&quot;onExpand&quot; />"
  >
    <div class="frame">
      <RsTree
        :nodes="checkNodes"
        checkable
        @node-click="(_node, key) => { eventLog = copy.clicked(key) }"
        @expand="(key, open) => { eventLog = copy.expanded(key, open) }"
        @node-contextmenu="(_node, key, event) => { event.preventDefault(); eventLog = copy.context(key) }"
      />
      <p class="note">{{ eventNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="expandAll、focus 和 scrollToKey 给宿主调用。scrollToKey 会先展开祖先。"
    description-en="expandAll, focus, and scrollToKey are for the host. scrollToKey expands ancestors first."
    code="<RsTree ref=&quot;treeRef&quot; :nodes=&quot;nodes&quot; /><RsButton @click=&quot;treeRef?.scrollToKey('leaf')&quot;>scrollToKey</RsButton>"
  >
    <div class="frame">
      <div class="actions">
        <RsButton size="sm" variant="secondary" @click="expandAll">{{ copy.expandAll }}</RsButton>
        <RsButton size="sm" variant="secondary" @click="collapseAll">{{ copy.collapseAll }}</RsButton>
        <RsButton size="sm" variant="secondary" @click="focusTree">{{ copy.focus }}</RsButton>
        <RsButton size="sm" variant="secondary" @click="scrollToLeaf">{{ copy.scroll }}</RsButton>
      </div>
      <RsTree ref="treeRef" :nodes="methodNodes" />
      <p class="note">{{ methodNote }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题与方向"
    title-en="Theme and direction"
    description="深色岛用 data-rs-theme。dir=rtl 时向前展开走左方向键。"
    description-en="A dark island uses data-rs-theme. In dir=rtl, forward is ArrowLeft."
    code="<div data-rs-theme=&quot;dark&quot;><RsTree show-line :nodes=&quot;nodes&quot; /></div>"
  >
    <div class="stack">
      <div class="island" data-rs-theme="dark">
        <p class="note">{{ copy.theme }}</p>
        <RsTree :nodes="basicNodes" default-expand-all show-line />
      </div>
      <div class="frame" dir="rtl">
        <p class="note">{{ copy.rtl }}</p>
        <RsTree :nodes="basicNodes" default-expand-all show-line />
      </div>
    </div>
  </DocDemo>
</template>

<style scoped>
.frame,
.island {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  max-width: 22rem;
}

.island {
  padding: var(--rs-space-md);
  border-radius: var(--rs-radius-md);
  background: var(--rs-bg);
  color: var(--rs-text);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-lg);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
}

.note,
.empty {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.empty {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xs);
  padding: var(--rs-space-lg);
}

.empty strong {
  color: var(--rs-text-primary);
  font-weight: var(--rs-font-weight-medium);
}

.title {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}

.badge,
.mark {
  color: var(--rs-primary);
  font-size: var(--rs-font-size-xs);
}

.mark {
  display: inline-flex;
  width: 1rem;
  justify-content: center;
}
</style>
