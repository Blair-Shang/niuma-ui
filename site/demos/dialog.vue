<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RsButton, RsDialog, RsInput, type RsDialogCloseReason, type RsDialogExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const formOpen = ref(false)
const name = ref('')
const windowOpen = ref(false)
const boundsNote = ref('')
const dockOpen = ref(false)
const dockRef = ref<HTMLElement | null>(null)
const mountNote = ref('')
const backOpen = ref(false)
const frontOpen = ref(false)
const stackNote = ref('')
const chain = ref<number[]>([])
let chainSeq = 0
const modalOpen = ref(false)
const modelessOpen = ref(false)
const guardOpen = ref(false)
const blockClose = ref(true)
const confirmLoading = ref(false)
const slotOpen = ref(false)
const eventOpen = ref(false)
const eventLog = ref('')
const methodOpen = ref(false)
const methodLog = ref('')
const methodRef = ref<RsDialogExpose | null>(null)
const toneOpen = ref(false)
const tones = ['default', 'info', 'success', 'warning', 'danger'] as const
const tone = ref<(typeof tones)[number]>('warning')

const { copy } = useSiteDemo({
  'en-US': {
    namePh: 'Production',
    saved: 'Saved',
    blocked: 'beforeClose blocked the close',
    allowed: 'beforeClose allowed the close',
    idle: 'Open a dialog. Events land here.',
    opened: 'openChange → true',
    closed: (reason: string) => `afterClose → ${reason}`,
    confirmed: 'confirm',
    cancelled: 'cancel',
    methodIdle: 'Call openDialog(), close(), or focus().',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    behind: 'This button stays clickable while the modeless window is open.',
    behindHit: 'click → page button',
    dark: 'Dark island. The dialog copies data-rs-theme when it teleports.',
    boundsIdle: 'Drag the title bar or an edge, then measure.',
    boundsHit: (width: number, height: number, left: number, top: number) =>
      `${width} × ${height} at ${left}, ${top}`,
    boundsClosed: 'Open the window first.',
    mountIdle: 'Open it, then check the parent. Fullscreen moves the node to body.',
    inDock: 'parent → #rs-demo-dialog-dock',
    inBody: 'parent → body (fullscreen leaves the dock)',
    mountClosed: 'The dialog is closed.',
    stackIdle: 'Open the back window, then the front dialog. Esc closes only the front one.',
    stackClosed: (which: string, reason: string) => `${which} afterClose → ${reason}`,
    dockHint: 'DOM parent. The window is still position:fixed, so it is not clipped by this box.',
    chainIdle: 'Each dialog can open another. Esc closes only the top one.',
    chainOpen: (count: number) => `${count} open. Esc closes the top layer.`,
  },
  'zh-CN': {
    namePh: '生产库',
    saved: '已保存',
    blocked: 'beforeClose 拦住了关闭',
    allowed: 'beforeClose 允许关闭',
    idle: '打开对话框。事件显示在这里。',
    opened: 'openChange → true',
    closed: (reason: string) => `afterClose → ${reason}`,
    confirmed: 'confirm',
    cancelled: 'cancel',
    methodIdle: '调用 openDialog()、close() 或 focus()。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    behind: '非模态窗口打开时，这颗按钮仍可点。',
    behindHit: 'click → 页面按钮',
    dark: '深色岛。对话框 Teleport 时抄 data-rs-theme。',
    boundsIdle: '拖标题栏或拉边缘，再量一次尺寸。',
    boundsHit: (width: number, height: number, left: number, top: number) =>
      `${width} × ${height}，位置 ${left}, ${top}`,
    boundsClosed: '先打开工作窗。',
    mountIdle: '打开后查看父节点。全屏会把节点改挂到 body。',
    inDock: '父节点 → #rs-demo-dialog-dock',
    inBody: '父节点 → body（全屏离开挂载点）',
    mountClosed: '对话框已关闭。',
    stackIdle: '先开后面的窗口，再开前面的对话框。Esc 只关最上层。',
    stackClosed: (which: string, reason: string) => `${which} afterClose → ${reason}`,
    dockHint: 'DOM 父节点。窗口仍是 position:fixed，不会被这个盒子裁切。',
    chainIdle: '每一层都能再开一层。Esc 只关最上面那层。',
    chainOpen: (count: number) => `已打开 ${count} 层。Esc 只关最上层。`,
  },
})

const events = computed(() => eventLog.value || copy.value.idle)
const bounds = computed(() => boundsNote.value || copy.value.boundsIdle)
const mounted = computed(() => mountNote.value || copy.value.mountIdle)
const stacked = computed(() => stackNote.value || copy.value.stackIdle)
const chainDepth = computed(() =>
  chain.value.length ? copy.value.chainOpen(chain.value.length) : copy.value.chainIdle,
)
const methods = computed(() => methodLog.value || copy.value.methodIdle)
const pageNote = ref('')

function onFormConfirm() {
  formOpen.value = false
}

function beforeClose(reason: RsDialogCloseReason) {
  if (blockClose.value && reason !== 'confirm') {
    eventLog.value = copy.value.blocked
    return false
  }
  eventLog.value = copy.value.allowed
  return true
}

async function onGuardConfirm() {
  confirmLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  confirmLoading.value = false
  guardOpen.value = false
}

function noteEvent(line: string) {
  const prev = eventLog.value
  eventLog.value = !prev || prev === copy.value.idle ? line : `${prev} · ${line}`
}

function onEventOpen(next: boolean) {
  if (next) noteEvent(copy.value.opened)
}

function onAfterClose(reason: RsDialogCloseReason) {
  noteEvent(copy.value.closed(reason))
}

function openTone(next: (typeof tones)[number]) {
  tone.value = next
  toneOpen.value = true
}

function callOpen() {
  methodRef.value?.openDialog()
  methodLog.value = copy.value.methodHit('openDialog()', 'open')
}

async function callClose() {
  const closed = await methodRef.value?.close('programmatic')
  methodLog.value = copy.value.methodHit('close()', closed ? 'true' : 'false')
}

function readBounds() {
  const el = document.getElementById('rs-demo-window')
  if (!el) {
    boundsNote.value = copy.value.boundsClosed
    return
  }
  const box = el.getBoundingClientRect()
  boundsNote.value = copy.value.boundsHit(
    Math.round(box.width),
    Math.round(box.height),
    Math.round(box.left),
    Math.round(box.top),
  )
}

function readMount() {
  const el = document.getElementById('rs-demo-docked')
  const dock = dockRef.value
  if (!el || !dock) {
    mountNote.value = copy.value.mountClosed
    return
  }
  mountNote.value = dock.contains(el) ? copy.value.inDock : copy.value.inBody
}

async function openDock() {
  dockOpen.value = true
  await nextTick()
  readMount()
}

function noteStack(which: string, reason: RsDialogCloseReason) {
  stackNote.value = copy.value.stackClosed(which, reason)
}

function openChain() {
  chainSeq += 1
  chain.value = [...chain.value, chainSeq]
}

function closeChain(id: number, next: boolean) {
  if (next) return
  chain.value = chain.value.filter((item) => item !== id)
}

function callFocus() {
  methodRef.value?.focus()
  const active = document.activeElement
  const label = active instanceof HTMLElement ? active.id || active.tagName : 'none'
  methodLog.value = copy.value.methodHit('focus()', label)
}

const formCode = `<RsButton @click="formOpen = true">New connection</RsButton>
<RsDialog
  v-model:open="formOpen"
  layout="form"
  title="New connection"
  description="Name the database. Delete flows belong on ConfirmDialog."
  show-overlay
  close-on-overlay-click
  show-footer
  auto-close-on-confirm
>
  <RsInput v-model="name" label="Name" placeholder="Production" autofocus />
</RsDialog>`

const windowCode = `<RsDialog
  v-model:open="windowOpen"
  id="rs-demo-window"
  title="Session"
  width="lg"
  height="60%"
  draggable
  resizable
  fullscreenable
>
  Drag the title bar. Pull any edge to resize.
</RsDialog>`

const mountCode = `<div id="rs-demo-dialog-dock">Page dock</div>
<RsDialog
  v-model:open="dockOpen"
  teleport-to="#rs-demo-dialog-dock"
  title="Docked"
  width="md"
  draggable
  fullscreenable
>
  Fullscreen moves this node from the dock back to body.
</RsDialog>`

const stackCode = `<RsDialog v-model:open="backOpen" title="Back" width="lg" draggable>
  <RsButton @click="frontOpen = true">Open front</RsButton>
</RsDialog>
<RsDialog
  v-model:open="frontOpen"
  layout="form"
  title="Front"
  :z-index="120"
  show-overlay
  :overlay-opacity="0.28"
  show-footer
>
  Esc closes this layer only.
</RsDialog>`

const chainCode = `<RsButton @click="openAnother">Open</RsButton>
<RsDialog
  v-for="(id, index) in layers"
  :key="id"
  :open="true"
  layout="form"
  :title="'Layer ' + (index + 1)"
  :z-index="200 + index * 10"
  show-overlay
  :overlay-opacity="0.16"
  show-footer
  auto-close-on-confirm
  @update:open="(open) => closeLayer(id, open)"
>
  <RsButton @click="openAnother">Open another</RsButton>
</RsDialog>`

const modalCode = `<RsButton @click="modalOpen = true">Modal</RsButton>
<RsDialog
  v-model:open="modalOpen"
  layout="form"
  title="Modal"
  show-overlay
  :overlay-opacity="0.35"
  close-on-overlay-click
  show-footer
/>

<RsButton @click="modelessOpen = true">Modeless</RsButton>
<RsDialog v-model:open="modelessOpen" title="Modeless" :modal="false" width="sm" draggable />`

const guardCode = `<RsDialog
  v-model:open="guardOpen"
  layout="form"
  title="Unsaved changes"
  :before-close="beforeClose"
  :confirm-loading="confirmLoading"
  show-footer
  confirm-text="Save"
  @confirm="save"
/>`

const slotCode = `<RsDialog v-model:open="slotOpen" layout="form" show-footer>
  <template #header>
    <strong>Custom header</strong>
  </template>
  <template #body>
    Body slot wins over the default slot.
  </template>
  <template #footer="{ onConfirm, onCancel }">
    <RsButton variant="default" @click="onCancel">Not now</RsButton>
    <RsButton variant="primary" @click="onConfirm">Apply</RsButton>
  </template>
</RsDialog>`

const eventCode = `<RsDialog
  v-model:open="eventOpen"
  layout="form"
  title="Events"
  show-footer
  auto-close-on-confirm
  @open-change="onOpenChange"
  @after-close="onAfterClose"
  @confirm="onConfirm"
  @cancel="onCancel"
/>`

const methodCode = `<RsDialog ref="dialogRef" v-model:open="open" layout="form" title="Methods" />
<RsButton @click="dialogRef?.openDialog()">openDialog()</RsButton>
<RsButton @click="dialogRef?.close()">close()</RsButton>
<RsButton @click="dialogRef?.focus()">focus()</RsButton>`

const toneCode = `<div data-rs-theme="dark">
  <RsDialog v-model:open="open" layout="form" title="Warning" tone="warning" show-footer />
</div>`
</script>

<template>
  <DocDemo
    id="demo-form"
    title="表单窗"
    title-en="Form"
    description="layout=form 居中，高度随内容。默认插槽就是正文。删除确认用 ConfirmDialog。"
    description-en="layout=form is centered and sizes to its content. The default slot is the body. Use ConfirmDialog for a delete."
    :code="formCode"
  >
    <RsButton variant="default" @click="formOpen = true">New connection</RsButton>
    <RsDialog
      v-model:open="formOpen"
      layout="form"
      title="New connection"
      description="Name the database. Delete flows belong on ConfirmDialog."
      show-overlay
      close-on-overlay-click
      show-footer
      auto-close-on-confirm
      @confirm="onFormConfirm"
    >
      <RsInput v-model="name" label="Name" :placeholder="copy.namePh" autofocus />
    </RsDialog>
    <p class="note">{{ name ? `${copy.saved}: ${name}` : copy.namePh }}</p>
  </DocDemo>

  <DocDemo
    id="demo-window"
    title="拖拽与缩放"
    title-en="Drag and resize"
    description="拖标题栏移动，拉八向边缘改大小。量尺寸会读到当前宽高和位置。不铺遮罩，避免挡住背后页面。"
    description-en="Drag the title bar to move it. Pull any of the eight edges to resize. Measure reads the current size and position. No overlay, so the page stays visible."
    :code="windowCode"
  >
    <div class="row">
      <RsButton @click="windowOpen = true">Open session</RsButton>
      <RsButton variant="default" @click="readBounds">Measure</RsButton>
    </div>
    <p class="note">{{ bounds }}</p>
    <RsDialog
      id="rs-demo-window"
      v-model:open="windowOpen"
      title="Session"
      width="lg"
      height="60%"
      draggable
      resizable
      fullscreenable
    >
      Drag the title bar. Pull any edge to resize, then measure.
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-mount"
    title="挂载目标"
    title-en="Mount target"
    description="teleport-to 决定节点挂在哪。全屏且没有禁用 Teleport 时，会临时改挂到 body，还原后回到原来的目标。"
    description-en="teleport-to chooses the DOM parent. Fullscreen moves the node to body unless teleport is disabled, then puts it back."
    :code="mountCode"
  >
    <div id="rs-demo-dialog-dock" ref="dockRef" class="dock">
      <p>{{ copy.dockHint }}</p>
    </div>
    <div class="row">
      <RsButton @click="openDock">Open in dock</RsButton>
      <RsButton variant="default" @click="readMount">Where?</RsButton>
    </div>
    <p class="note">{{ mounted }}</p>
    <RsDialog
      id="rs-demo-docked"
      v-model:open="dockOpen"
      teleport-to="#rs-demo-dialog-dock"
      title="Docked"
      width="md"
      draggable
      resizable
      fullscreenable
      @after-close="mountNote = copy.mountClosed"
    >
      Check the parent, then go fullscreen and check again.
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-stack"
    title="弹窗叠加"
    title-en="Stacked dialogs"
    description="后打开的一层用更高的 z-index 盖住前面。Esc 只关最上层，后面的窗口保持打开。"
    description-en="The later layer uses a higher z-index. Esc closes only the top dialog. The one behind stays open."
    :code="stackCode"
  >
    <RsButton @click="backOpen = true">Open back</RsButton>
    <p class="note">{{ stacked }}</p>
    <RsDialog
      v-model:open="backOpen"
      title="Back"
      width="lg"
      draggable
      @after-close="noteStack('back', $event)"
    >
      <RsButton @click="frontOpen = true">Open front</RsButton>
    </RsDialog>
    <RsDialog
      v-model:open="frontOpen"
      layout="form"
      title="Front"
      description="Esc closes this layer. The back window stays."
      :z-index="120"
      show-overlay
      :overlay-opacity="0.28"
      show-footer
      auto-close-on-confirm
      @after-close="noteStack('front', $event)"
    />
  </DocDemo>

  <DocDemo
    id="demo-chain"
    title="无限叠加"
    title-en="Unbounded stack"
    description="层数不固定。后开的一层 z-index 加 10，遮罩才能盖住下面的面板。Esc、关闭和确认都只拆最上层。"
    description-en="There is no fixed depth. Each new layer adds 10 to z-index so its overlay covers the panel below. Esc, close, and confirm remove only the top one."
    :code="chainCode"
  >
    <RsButton @click="openChain">Open</RsButton>
    <p class="note">{{ chainDepth }}</p>
    <RsDialog
      v-for="(id, index) in chain"
      :key="id"
      :open="true"
      layout="form"
      :title="`Layer ${index + 1}`"
      :description="`This is layer ${index + 1}.`"
      :z-index="200 + index * 10"
      show-overlay
      :overlay-opacity="0.16"
      show-footer
      auto-close-on-confirm
      @update:open="closeChain(id, $event)"
    >
      <RsButton @click="openChain">Open another</RsButton>
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-modal"
    title="模态与遮罩"
    title-en="Modal and overlay"
    description="modal 锁焦点并挡住点击。showOverlay 只负责涂暗，两者分开。非模态不锁滚动，页面按钮仍可点。"
    description-en="modal traps focus and blocks clicks. showOverlay only paints the dim layer. A modeless dialog does not lock scroll, so the page button still works."
    :code="modalCode"
  >
    <div class="row">
      <RsButton @click="modalOpen = true">Modal</RsButton>
      <RsButton variant="default" @click="modelessOpen = true">Modeless</RsButton>
      <RsButton variant="ghost" @click="pageNote = copy.behindHit">{{ copy.behind }}</RsButton>
    </div>
    <p class="note">{{ pageNote }}</p>
    <RsDialog
      v-model:open="modalOpen"
      layout="form"
      title="Modal"
      description="Esc closes. A click on the overlay closes too."
      show-overlay
      :overlay-opacity="0.35"
      close-on-overlay-click
      show-footer
      auto-close-on-confirm
    />
    <RsDialog v-model:open="modelessOpen" title="Modeless" :modal="false" width="sm" draggable>
      The page behind stays usable.
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-guard"
    title="关闭拦截"
    title-en="Before close"
    description="beforeClose 返回 false 会留下对话框。confirmLoading 时 Esc 和关闭按钮无效。"
    description-en="beforeClose returning false keeps the dialog open. confirmLoading ignores Esc and the close button."
    :code="guardCode"
  >
    <RsButton @click="guardOpen = true">Unsaved changes</RsButton>
    <label class="check">
      <input v-model="blockClose" type="checkbox" />
      Block close
    </label>
    <p class="note">{{ eventLog }}</p>
    <RsDialog
      v-model:open="guardOpen"
      layout="form"
      title="Unsaved changes"
      description="Save before leaving, or turn off the block."
      :before-close="beforeClose"
      :confirm-loading="confirmLoading"
      show-footer
      confirm-text="Save"
      show-overlay
      @confirm="onGuardConfirm"
    />
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#header 替换标题区，关闭按钮还在。#body 优先于默认插槽。#footer 拿到 onConfirm / onCancel。"
    description-en="#header replaces the heading; the close button stays. #body wins over the default slot. #footer receives onConfirm / onCancel."
    :code="slotCode"
  >
    <RsButton @click="slotOpen = true">Custom chrome</RsButton>
    <RsDialog v-model:open="slotOpen" layout="form" show-overlay auto-close-on-confirm>
      <template #header>
        <strong>Custom header</strong>
      </template>
      <template #body>
        Body slot wins over the default slot.
      </template>
      <template #footer="{ onConfirm, onCancel }">
        <RsButton variant="default" @click="onCancel">Not now</RsButton>
        <RsButton variant="primary" @click="onConfirm">Apply</RsButton>
      </template>
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="openChange、confirm、cancel、afterClose 都会写到下面一行。afterClose 带关闭原因。"
    description-en="openChange, confirm, cancel, and afterClose all write the line below. afterClose includes the reason."
    :code="eventCode"
  >
    <RsButton @click="eventOpen = true">Open</RsButton>
    <p class="note">{{ events }}</p>
    <RsDialog
      v-model:open="eventOpen"
      layout="form"
      title="Events"
      show-footer
      auto-close-on-confirm
      show-overlay
      @open-change="onEventOpen"
      @after-close="onAfterClose"
      @confirm="noteEvent(copy.confirmed)"
      @cancel="noteEvent(copy.cancelled)"
    />
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 上有 openDialog、close、focus。close 仍走 beforeClose。"
    description-en="The template ref exposes openDialog, close, and focus. close still runs beforeClose."
    :code="methodCode"
  >
    <div class="row">
      <RsButton @click="callOpen">openDialog()</RsButton>
      <RsButton variant="default" @click="callClose">close()</RsButton>
      <RsButton variant="ghost" @click="callFocus">focus()</RsButton>
    </div>
    <p class="note">{{ methods }}</p>
    <RsDialog ref="methodRef" v-model:open="methodOpen" layout="form" title="Methods" id="rs-dialog-methods" />
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="色相与主题"
    title-en="Tone and theme"
    description="tone 只改描边。深色岛里打开时，浮层抄 data-rs-theme，不跟页面背景走。"
    description-en="tone only changes the border. Opened from a dark island, the layer copies data-rs-theme instead of the page background."
    :code="toneCode"
  >
    <div class="row">
      <RsButton v-for="item in tones" :key="item" variant="default" @click="openTone(item)">
        {{ item }}
      </RsButton>
    </div>
    <div class="island" data-rs-theme="dark">
      <p>{{ copy.dark }}</p>
      <RsButton @click="openTone('info')">Open from dark island</RsButton>
    </div>
    <RsDialog
      v-model:open="toneOpen"
      layout="form"
      :title="tone"
      :tone="tone"
      description="The border follows the tone token."
      show-footer
      show-overlay
      auto-close-on-confirm
    />
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  align-items: center;
}
.note {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}
.check {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  margin-inline-start: var(--rs-space-sm);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
}
.island {
  margin-top: var(--rs-space-md);
  padding: var(--rs-space-md);
  border-radius: var(--rs-radius);
  background: var(--rs-bg);
  color: var(--rs-text);
}
.island p {
  margin: 0 0 var(--rs-space-sm);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}
.dock {
  margin-bottom: var(--rs-space-sm);
  padding: var(--rs-space-md);
  min-height: 4.5rem;
  border: 1px dashed var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}
.dock p {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}
</style>
