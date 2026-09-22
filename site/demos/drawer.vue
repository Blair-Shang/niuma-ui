<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { RsButton, RsDrawer, RsInput, type RsDrawerCloseReason, type RsDrawerExpose, type RsDrawerSide, type RsDrawerSize } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const basicOpen = ref(false)
const name = ref('Alice')

const sideOpen = ref(false)
const side = ref<RsDrawerSide>('right')

const sizeOpen = ref(false)
const size = ref<RsDrawerSize>('md')

const modalOpen = ref(false)
const plainOpen = ref(false)
const modalLog = ref('')

const resizeOpen = ref(false)
const widthPx = ref(360)

const slotOpen = ref(false)
const guardOpen = ref(false)
const dirty = ref(true)
const guardLog = ref('')

const themeOpen = ref(false)

const eventOpen = ref(false)
const eventLog = ref('')

const methodOpen = ref(false)
const methodLog = ref('')
const methodRef = ref<RsDrawerExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    edit: 'Edit profile',
    save: 'Save',
    cancel: 'Cancel',
    name: 'Display name',
    openRight: 'From the right',
    openLeft: 'From the left',
    openTop: 'From the top',
    openBottom: 'From the bottom',
    sideTitle: 'Panel',
    sideBody: 'Keep the list in view. Use a dialog when the user must finish a form.',
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
    full: 'Full',
    custom: '420px',
    sizeBody: 'Preset size, or pass width / height. full cannot be dragged.',
    modal: 'Modal',
    plain: 'No overlay',
    modalIdle: 'Open a drawer. afterClose prints the reason.',
    filters: 'Filters',
    apply: 'Apply',
    resize: 'Resize',
    resizeIdle: 'Drag the inner edge, or focus it and press Arrow keys. Home / End jump to the limits.',
    slotOpen: 'Custom header',
    extra: 'Preview',
    guard: 'Unsaved note',
    guardHint: 'Turn off “dirty” to allow close.',
    dirty: 'Dirty',
    guardIdle: 'Close is blocked while the note is dirty.',
    blocked: 'beforeClose → blocked',
    allowed: 'beforeClose → closed',
    theme: 'Open in dark island',
    themeBody: 'Tokens follow data-rs-theme on this island, including after teleport.',
    events: 'Open and close',
    eventsIdle: 'afterOpen, afterClose, and resize show up here.',
    methods: 'Open via method',
    focus: 'focus()',
    close: 'close()',
    methodIdle: 'openDrawer(), focus(), and close() are on the ref.',
    focused: 'focus() → dialog',
    closed: 'close() → closed',
    stillOpen: 'close() → still open',
  },
  'zh-CN': {
    edit: '编辑资料',
    save: '保存',
    cancel: '取消',
    name: '显示名称',
    openRight: '从右侧',
    openLeft: '从左侧',
    openTop: '从顶部',
    openBottom: '从底部',
    sideTitle: '面板',
    sideBody: '背后的列表还在。必须填完再用对话框。',
    sm: '小',
    md: '中',
    lg: '大',
    full: '满幅',
    custom: '420px',
    sizeBody: '用预设，或传 width / height。full 不能拖。',
    modal: '模态',
    plain: '无遮罩',
    modalIdle: '打开抽屉。afterClose 会写下关闭原因。',
    filters: '筛选',
    apply: '应用',
    resize: '调整宽度',
    resizeIdle: '拖内边缘，或聚焦后按方向键。Home / End 到最小 / 最大。',
    slotOpen: '自定义标题',
    extra: '预览',
    guard: '未保存的备注',
    guardHint: '关掉「未保存」才允许关闭。',
    dirty: '未保存',
    guardIdle: '备注未保存时，关闭会被拦住。',
    blocked: 'beforeClose → 已拦截',
    allowed: 'beforeClose → 已关闭',
    theme: '在深色岛里打开',
    themeBody: '颜色跟这块岛上的 data-rs-theme，Teleport 之后也一样。',
    events: '打开再关闭',
    eventsIdle: 'afterOpen、afterClose、resize 会显示在这里。',
    methods: '用方法打开',
    focus: 'focus()',
    close: 'close()',
    methodIdle: 'ref 上有 openDrawer()、focus()、close()。',
    focused: 'focus() → 对话框',
    closed: 'close() → 已关闭',
    stillOpen: 'close() → 仍打开',
  },
})

const basicCode = `<RsButton @click="open = true">Edit profile</RsButton>
<RsDrawer v-model:open="open" title="Profile" description="Update the display name.">
  <RsInput v-model="name" label="Display name" />
  <template #footer>
    <RsButton variant="default" @click="open = false">Cancel</RsButton>
    <RsButton @click="open = false">Save</RsButton>
  </template>
</RsDrawer>`

const sideCode = `<RsButton @click="openFrom('left')">From the left</RsButton>
<RsDrawer v-model:open="open" :side="side" title="Panel">
  Keep the list in view.
</RsDrawer>`

const sizeCode = `<RsDrawer v-model:open="open" :size="size" title="Panel" />
<RsDrawer v-model:open="custom" :width="420" title="Custom" />`

const modalCode = `<RsDrawer v-model:open="modal" title="Filters" @after-close="onClose">
  Modal locks focus and scroll.
</RsDrawer>
<RsDrawer
  v-model:open="plain"
  title="Inspector"
  :show-overlay="false"
  :modal="false"
  @after-close="onClose"
/>`

const resizeCode = `<RsDrawer
  v-model:width="widthPx"
  v-model:open="open"
  :width="widthPx"
  title="Resize"
  @resize="onResize"
/>`

const slotsCode = `<RsDrawer v-model:open="open" title="Details">
  <template #header>
    <strong>Shipment 1842</strong>
  </template>
  <template #extra>
    <RsButton size="sm" variant="default">Preview</RsButton>
  </template>
  <p>Body scrolls inside the drawer.</p>
  <template #footer>
    <RsButton>Save</RsButton>
  </template>
</RsDrawer>`

const guardCode = `<RsDrawer
  v-model:open="open"
  title="Unsaved note"
  :before-close="(reason) => !dirty"
/>`

const themeCode = `<div data-rs-theme="dark" class="island">
  <RsButton @click="open = true">Open in dark island</RsButton>
  <RsDrawer v-model:open="open" title="Appearance">
    Tokens follow data-rs-theme.
  </RsDrawer>
</div>`

const eventsCode = `<RsDrawer
  v-model:open="open"
  title="Activity"
  @after-open="log('afterOpen')"
  @after-close="(reason) => log('afterClose → ' + reason)"
  @resize="(px) => log('resize → ' + px)"
/>`

const methodsCode = `<RsButton @click="drawerRef?.openDrawer()">openDrawer()</RsButton>
<RsButton @click="drawerRef?.focus()">focus()</RsButton>
<RsButton @click="drawerRef?.close('programmatic')">close()</RsButton>
<RsDrawer ref="drawerRef" v-model:open="open" title="Commands" />`

function openSide(next: RsDrawerSide) {
  side.value = next
  sideOpen.value = true
}

function openSize(next: RsDrawerSize) {
  size.value = next
  sizeOpen.value = true
}

function onModalClose(reason: RsDrawerCloseReason) {
  modalLog.value = `afterClose → ${reason}`
}

async function onGuardClose(reason: RsDrawerCloseReason) {
  if (dirty.value && reason !== 'programmatic') {
    guardLog.value = copy.value.blocked
    return false
  }
  guardLog.value = copy.value.allowed
  return true
}

function onEventOpen() {
  eventLog.value = 'afterOpen'
}

function onEventClose(reason: RsDrawerCloseReason) {
  eventLog.value = `afterClose → ${reason}`
}

function onEventResize(px: number) {
  eventLog.value = `resize → ${px}`
}

async function runFocus() {
  methodOpen.value = true
  await nextTick()
  methodRef.value?.focus()
  methodLog.value = copy.value.focused
}

async function runClose() {
  const closed = await methodRef.value?.close('programmatic')
  methodLog.value = closed ? copy.value.closed : copy.value.stillOpen
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="侧滑详情"
    title-en="Side detail"
    description="默认从右侧滑出。适合筛选、资料、设置。必须打断当前任务时用 Dialog。"
    description-en="Slides in from the right. Use it for filters, a profile, or settings. Use Dialog when the user must stop and finish a task."
    :code="basicCode"
  >
    <RsButton @click="basicOpen = true">{{ copy.edit }}</RsButton>
    <RsDrawer v-model:open="basicOpen" :title="copy.edit" :description="copy.name">
      <RsInput v-model="name" :label="copy.name" />
      <template #footer>
        <RsButton variant="default" @click="basicOpen = false">{{ copy.cancel }}</RsButton>
        <RsButton @click="basicOpen = false">{{ copy.save }}</RsButton>
      </template>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-side"
    title="四个方向"
    title-en="Four edges"
    description="left / right 改宽度，top / bottom 改高度。方向是物理边缘，不随 RTL 对调。"
    description-en="left / right set the width. top / bottom set the height. The edge is physical and does not flip in RTL."
    :code="sideCode"
  >
    <div class="row">
      <RsButton variant="default" @click="openSide('right')">{{ copy.openRight }}</RsButton>
      <RsButton variant="default" @click="openSide('left')">{{ copy.openLeft }}</RsButton>
      <RsButton variant="default" @click="openSide('top')">{{ copy.openTop }}</RsButton>
      <RsButton variant="default" @click="openSide('bottom')">{{ copy.openBottom }}</RsButton>
    </div>
    <RsDrawer v-model:open="sideOpen" :side="side" :title="copy.sideTitle">
      <p class="body">{{ copy.sideBody }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="sm / md / lg / full 是预设。同时传 width 或 height 时，自定义尺寸优先。"
    description-en="sm / md / lg / full are presets. width or height wins when both are set."
    :code="sizeCode"
  >
    <div class="row">
      <RsButton variant="default" @click="openSize('sm')">{{ copy.sm }}</RsButton>
      <RsButton variant="default" @click="openSize('md')">{{ copy.md }}</RsButton>
      <RsButton variant="default" @click="openSize('lg')">{{ copy.lg }}</RsButton>
      <RsButton variant="default" @click="openSize('full')">{{ copy.full }}</RsButton>
    </div>
    <p class="note">{{ copy.sizeBody }}</p>
    <RsDrawer v-model:open="sizeOpen" :size="size" :title="copy.sideTitle" :resizable="size !== 'full'">
      <p class="body">{{ copy.sizeBody }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-modal"
    title="模态与遮罩"
    title-en="Modal and overlay"
    description="没传 modal 时跟着遮罩：有遮罩就锁焦点和页面滚动。遮罩可以关掉，页面仍能操作。"
    description-en="When modal is omitted it follows the overlay: an overlay locks focus and page scroll. Turn the overlay off and the page stays usable."
    :code="modalCode"
  >
    <div class="row">
      <RsButton @click="modalOpen = true">{{ copy.modal }}</RsButton>
      <RsButton variant="default" @click="plainOpen = true">{{ copy.plain }}</RsButton>
    </div>
    <p class="note" :data-live="modalLog ? '1' : undefined">{{ modalLog || copy.modalIdle }}</p>
    <RsDrawer v-model:open="modalOpen" :title="copy.filters" @after-close="onModalClose">
      <p class="body">{{ copy.filters }}</p>
      <template #footer>
        <RsButton @click="modalOpen = false">{{ copy.apply }}</RsButton>
      </template>
    </RsDrawer>
    <RsDrawer
      v-model:open="plainOpen"
      :title="copy.plain"
      :show-overlay="false"
      :modal="false"
      @after-close="onModalClose"
    >
      <p class="body">{{ copy.sideBody }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-resize"
    title="拖拽改尺寸"
    title-en="Resize"
    description="内边缘是分隔条。方向键步进，按住 Shift 加大步进。拖动过程直接改 DOM，松手再提交 v-model。"
    description-en="The inner edge is a separator. Arrow keys step; Shift steps further. Dragging writes the DOM, and pointer-up commits the v-model."
    :code="resizeCode"
  >
    <RsButton @click="resizeOpen = true">{{ copy.resize }}</RsButton>
    <p class="note" :data-live="widthPx !== 360 ? '1' : undefined">{{ widthPx }}px — {{ copy.resizeIdle }}</p>
    <RsDrawer v-model:open="resizeOpen" v-model:width="widthPx" :title="copy.resize">
      <p class="body">{{ copy.resizeIdle }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="标题、附加操作与页脚"
    title-en="Header, extra, and footer"
    description="默认插槽是正文，过长时在抽屉内滚动。#header 换掉标题区，#extra 放在关闭钮左边，#footer 贴底。"
    description-en="The default slot is the body and scrolls inside the drawer. #header replaces the title block, #extra sits beside the close button, and #footer stays at the bottom."
    :code="slotsCode"
  >
    <RsButton @click="slotOpen = true">{{ copy.slotOpen }}</RsButton>
    <RsDrawer v-model:open="slotOpen" :title="copy.slotOpen">
      <template #header>
        <strong>{{ copy.slotOpen }}</strong>
      </template>
      <template #extra>
        <RsButton size="sm" variant="default">{{ copy.extra }}</RsButton>
      </template>
      <p class="body">{{ copy.sideBody }}</p>
      <template #footer>
        <RsButton variant="default" @click="slotOpen = false">{{ copy.cancel }}</RsButton>
        <RsButton @click="slotOpen = false">{{ copy.save }}</RsButton>
      </template>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-guard"
    title="关闭前确认"
    title-en="beforeClose"
    description="返回 false 会留下抽屉。Esc、遮罩、关闭钮和 close() 都走这个钩子。"
    description-en="Return false to keep the drawer open. Escape, the overlay, the close button, and close() all go through this hook."
    :code="guardCode"
  >
    <div class="row">
      <RsButton @click="guardOpen = true">{{ copy.guard }}</RsButton>
      <label class="check">
        <input v-model="dirty" type="checkbox" />
        {{ copy.dirty }}
      </label>
    </div>
    <p class="note" :data-live="guardLog ? '1' : undefined">{{ guardLog || copy.guardIdle }}</p>
    <RsDrawer v-model:open="guardOpen" :title="copy.guard" :before-close="onGuardClose">
      <p class="body">{{ copy.guardHint }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题"
    title-en="Theme"
    description="面板挂到 body 时会抄触发处的 data-rs-theme、dir 和 lang，深色岛里不会变回页面底色。"
    description-en="When the panel mounts on body it copies data-rs-theme, dir, and lang from where it was opened, so a dark island does not fall back to the page background."
    :code="themeCode"
  >
    <div class="island" data-rs-theme="dark">
      <RsButton @click="themeOpen = true">{{ copy.theme }}</RsButton>
      <p class="island__hint">{{ copy.themeBody }}</p>
      <RsDrawer v-model:open="themeOpen" :title="copy.theme" :description="copy.themeBody">
        <p class="body">{{ copy.themeBody }}</p>
      </RsDrawer>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="afterOpen 在滑入之后。afterClose 带上 close / overlay / escape / programmatic。拖拽时 resize 给出像素。"
    description-en="afterOpen fires after the slide. afterClose includes close, overlay, escape, or programmatic. resize reports pixels while dragging."
    :code="eventsCode"
  >
    <RsButton @click="eventOpen = true">{{ copy.events }}</RsButton>
    <p class="note" :data-live="eventLog ? '1' : undefined">{{ eventLog || copy.eventsIdle }}</p>
    <RsDrawer
      v-model:open="eventOpen"
      :title="copy.events"
      @after-open="onEventOpen"
      @after-close="onEventClose"
      @resize="onEventResize"
    >
      <p class="body">{{ copy.eventsIdle }}</p>
    </RsDrawer>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="openDrawer() 打开，focus() 把焦点送进面板，close() 走 beforeClose，被拦住时返回 false。"
    description-en="openDrawer() opens, focus() moves focus into the panel, and close() runs beforeClose. It returns false when closing is blocked."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton @click="methodRef?.openDrawer()">openDrawer()</RsButton>
      <RsButton variant="default" @click="runFocus">{{ copy.focus }}</RsButton>
      <RsButton variant="default" @click="runClose">{{ copy.close }}</RsButton>
    </div>
    <p class="note" :data-live="methodLog ? '1' : undefined">{{ methodLog || copy.methodIdle }}</p>
    <RsDrawer ref="methodRef" v-model:open="methodOpen" :title="copy.methods">
      <p class="body">{{ copy.methodIdle }}</p>
    </RsDrawer>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.body {
  margin: 0;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: 1.5;
}

.note {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.note[data-live] {
  color: var(--rs-text);
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
}

.island {
  padding: 0.9rem 1rem;
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text);
}

.island__hint {
  margin: 0.6rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}
</style>
