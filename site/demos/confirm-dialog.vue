<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  RsButton,
  RsConfirmDialog,
  type RsConfirmCloseReason,
  type RsConfirmDialogExpose,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const dangerOpen = ref(false)
const dangerNote = ref('')
const tones = ['danger', 'warning', 'info', 'success'] as const
const tone = ref<(typeof tones)[number]>('danger')
const toneOpen = ref(false)
const alertOpen = ref(false)
const alertNote = ref('')
const guardOpen = ref(false)
const guardRef = ref<RsConfirmDialogExpose | null>(null)
const blockClose = ref(true)
const confirmLoading = ref(false)
const guardNote = ref('')
const extraOpen = ref(false)
const understood = ref(false)
const extraNote = ref('')
const overlayOpen = ref(false)
const dockOpen = ref(false)
const dockRef = ref<HTMLElement | null>(null)
const mountNote = ref('')
const backOpen = ref(false)
const frontOpen = ref(false)
const stackNote = ref('')
const methodOpen = ref(false)
const methodRef = ref<RsConfirmDialogExpose | null>(null)
const methodNote = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    idle: 'Confirm or cancel. The line updates here.',
    confirmed: 'confirm',
    cancelled: (reason: string) => `cancel → ${reason}`,
    toneIdle: 'Pick a tone.',
    toneHit: (name: string) => `tone → ${name}`,
    alertIdle: 'One button. Esc still cancels.',
    alertHit: 'confirm → acknowledged',
    guardIdle: 'Turn the block off, or save. Loading ignores Esc.',
    guardBlocked: 'beforeClose blocked the close',
    guardSaved: 'confirm → saved',
    extraIdle: 'Check the box, then delete.',
    extraNeed: 'The box is still empty.',
    extraHit: 'confirm → deleted',
    mountIdle: 'Open it, then check the parent.',
    inDock: 'parent → #rs-confirm-dock',
    mountClosed: 'The confirm dialog is closed.',
    dockHint: 'DOM parent. The panel stays position:fixed.',
    stackIdle: 'Open the back dialog, then another from inside. Esc closes only the top one.',
    stackClosed: (which: string) => `${which} cancel`,
    methodIdle: 'Call close() or focus().',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
  'zh-CN': {
    idle: '确认或取消。结果写在这一行。',
    confirmed: 'confirm',
    cancelled: (reason: string) => `cancel → ${reason}`,
    toneIdle: '选一个色相。',
    toneHit: (name: string) => `tone → ${name}`,
    alertIdle: '只有一颗按钮。Esc 仍会取消。',
    alertHit: 'confirm → 知道了',
    guardIdle: '关掉拦截，或点保存。加载中 Esc 无效。',
    guardBlocked: 'beforeClose 拦住了关闭',
    guardSaved: 'confirm → 已保存',
    extraIdle: '勾选后再删除。',
    extraNeed: '还没勾选。',
    extraHit: 'confirm → 已删除',
    mountIdle: '打开后查看父节点。',
    inDock: '父节点 → #rs-confirm-dock',
    mountClosed: '确认框已关闭。',
    dockHint: 'DOM 父节点。面板仍是 position:fixed。',
    stackIdle: '先开后面的，再从里面再开一层。Esc 只关最上层。',
    stackClosed: (which: string) => `${which} cancel`,
    methodIdle: '调用 close() 或 focus()。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
})

const dangerLine = computed(() => dangerNote.value || copy.value.idle)
const toneLine = computed(() => (toneOpen.value ? copy.value.toneHit(tone.value) : copy.value.toneIdle))
const alertLine = computed(() => alertNote.value || copy.value.alertIdle)
const guardLine = computed(() => guardNote.value || copy.value.guardIdle)
const extraLine = computed(() => extraNote.value || copy.value.extraIdle)
const mountLine = computed(() => mountNote.value || copy.value.mountIdle)
const stackLine = computed(() => stackNote.value || copy.value.stackIdle)
const methodLine = computed(() => methodNote.value || copy.value.methodIdle)

function noteDanger(reason: RsConfirmCloseReason | 'confirm') {
  dangerNote.value = reason === 'confirm' ? copy.value.confirmed : copy.value.cancelled(reason)
}

function beforeClose(reason: RsConfirmCloseReason) {
  if (blockClose.value && reason !== 'confirm') {
    guardNote.value = copy.value.guardBlocked
    return false
  }
  return true
}

async function onGuardConfirm() {
  confirmLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  confirmLoading.value = false
  const closed = await guardRef.value?.close('confirm')
  guardNote.value = closed ? copy.value.guardSaved : copy.value.guardBlocked
}

function onExtraConfirm() {
  if (!understood.value) {
    extraNote.value = copy.value.extraNeed
    return
  }
  extraOpen.value = false
  extraNote.value = copy.value.extraHit
}

function readMount() {
  const el = document.getElementById('rs-demo-confirm')
  const dock = dockRef.value
  if (!el || !dock) {
    mountNote.value = copy.value.mountClosed
    return
  }
  mountNote.value = dock.contains(el) ? copy.value.inDock : copy.value.mountClosed
}

async function openDock() {
  dockOpen.value = true
  await nextTick()
  readMount()
}

function openTone(next: (typeof tones)[number]) {
  tone.value = next
  toneOpen.value = true
}

async function callClose() {
  const closed = await methodRef.value?.close('programmatic')
  methodNote.value = copy.value.methodHit('close()', closed ? 'true' : 'false')
}

function callFocus() {
  methodRef.value?.focus()
  const active = document.activeElement
  const label = active instanceof HTMLElement ? active.tagName : 'none'
  methodNote.value = copy.value.methodHit('focus()', label)
}

const dangerCode = `<RsConfirmDialog
  v-model:open="open"
  title="Delete resource?"
  subtitle="This cannot be undone"
  description="Delete the selected resource?"
  confirm-text="Delete"
  confirm-variant="danger"
  tone="danger"
  show-overlay
  @confirm="onConfirm"
  @cancel="onCancel"
/>`

const toneCode = `<RsConfirmDialog
  v-model:open="open"
  :title="tone"
  :tone="tone"
  confirm-variant="primary"
  show-overlay
/>`

const alertCode = `<RsConfirmDialog
  v-model:open="open"
  title="Published"
  description="The release is live."
  confirm-text="OK"
  confirm-variant="primary"
  tone="success"
  :show-cancel="false"
  show-overlay
/>`

const guardCode = `<RsConfirmDialog
  v-model:open="open"
  title="Unsaved changes"
  :before-close="beforeClose"
  :confirm-loading="loading"
  confirm-text="Save"
  confirm-variant="primary"
  tone="warning"
  :auto-close-on-confirm="false"
  show-overlay
  @confirm="save"
/>`

const extraCode = `<RsConfirmDialog v-model:open="open" title="Delete user?" :auto-close-on-confirm="false" show-overlay>
  <template #extra>
    <label><input v-model="understood" type="checkbox" /> I understand</label>
  </template>
</RsConfirmDialog>`

const overlayCode = `<RsConfirmDialog
  v-model:open="open"
  title="Disconnect?"
  show-overlay
  :overlay-opacity="0.4"
/>`

const mountCode = `<div id="rs-confirm-dock"></div>
<RsConfirmDialog
  v-model:open="open"
  teleport-to="#rs-confirm-dock"
  title="Docked"
  show-overlay
/>`

const stackCode = `<RsConfirmDialog v-model:open="backOpen" title="Back" show-overlay>
  <template #extra>
    <RsButton @click="frontOpen = true">Open another</RsButton>
  </template>
</RsConfirmDialog>
<RsConfirmDialog v-model:open="frontOpen" title="Front" :z-index="140" show-overlay />`

const methodCode = `<RsConfirmDialog ref="dialogRef" v-model:open="open" title="Methods" show-overlay />
<RsButton @click="dialogRef?.close()">close()</RsButton>
<RsButton @click="dialogRef?.focus()">focus()</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-danger"
    title="危险确认"
    title-en="Danger"
    description="删除、断开、覆盖用确认框。确认发 confirm；取消、Esc 和父级关闭发 cancel。"
    description-en="Use a confirm dialog to delete, disconnect, or overwrite. Confirm emits confirm. Cancel, Esc, and a parent close emit cancel."
    :code="dangerCode"
  >
    <RsButton variant="danger" @click="dangerOpen = true">Delete resource</RsButton>
    <p class="note">{{ dangerLine }}</p>
    <RsConfirmDialog
      v-model:open="dangerOpen"
      title="Delete resource?"
      subtitle="This cannot be undone"
      description="Delete the selected resource?"
      confirm-text="Delete"
      confirm-variant="danger"
      tone="danger"
      show-overlay
      @confirm="noteDanger('confirm')"
      @cancel="noteDanger('cancel')"
    />
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="色相"
    title-en="Tone"
    description="tone 只改图标底。确认钮用 confirmVariant，和 tone 分开。"
    description-en="tone only changes the icon well. confirmVariant is separate."
    :code="toneCode"
  >
    <div class="row">
      <RsButton v-for="item in tones" :key="item" variant="default" @click="openTone(item)">
        {{ item }}
      </RsButton>
    </div>
    <p class="note">{{ toneLine }}</p>
    <RsConfirmDialog
      v-model:open="toneOpen"
      :title="tone"
      :description="`Icon tone is ${tone}.`"
      :tone="tone"
      confirm-variant="primary"
      show-overlay
    />
  </DocDemo>

  <DocDemo
    id="demo-alert"
    title="单按钮提示"
    title-en="Single action"
    description="show-cancel 为 false 时只留确认钮。Esc 仍然取消并关掉。"
    description-en="show-cancel false leaves one button. Esc still cancels and closes."
    :code="alertCode"
  >
    <RsButton variant="default" @click="alertOpen = true">Show notice</RsButton>
    <p class="note">{{ alertLine }}</p>
    <RsConfirmDialog
      v-model:open="alertOpen"
      title="Published"
      description="The release is live."
      confirm-text="OK"
      confirm-variant="primary"
      tone="success"
      :show-cancel="false"
      show-overlay
      @confirm="alertNote = copy.alertHit"
      @cancel="alertNote = copy.cancelled('escape')"
    />
  </DocDemo>

  <DocDemo
    id="demo-guard"
    title="关闭拦截"
    title-en="Before close"
    description="beforeClose 返回 false 会留下确认框。confirmLoading 时按钮和 Esc 都无效。"
    description-en="beforeClose returning false keeps it open. confirmLoading ignores the buttons and Esc."
    :code="guardCode"
  >
    <RsButton @click="guardOpen = true">Unsaved changes</RsButton>
    <label class="check">
      <input v-model="blockClose" type="checkbox" />
      Block close
    </label>
    <p class="note">{{ guardLine }}</p>
    <RsConfirmDialog
      ref="guardRef"
      v-model:open="guardOpen"
      title="Unsaved changes"
      description="Save before leaving, or turn off the block."
      tone="warning"
      confirm-variant="primary"
      confirm-text="Save"
      :before-close="beforeClose"
      :confirm-loading="confirmLoading"
      :auto-close-on-confirm="false"
      show-overlay
      @confirm="onGuardConfirm"
    />
  </DocDemo>

  <DocDemo
    id="demo-extra"
    title="附加内容"
    title-en="Extra"
    description="#extra 在说明和按钮之间。确认前可以读里面的勾选。"
    description-en="#extra sits between the description and the buttons. Read it before confirming."
    :code="extraCode"
  >
    <RsButton variant="danger" @click="extraOpen = true">Delete user</RsButton>
    <p class="note">{{ extraLine }}</p>
    <RsConfirmDialog
      v-model:open="extraOpen"
      title="Delete user?"
      description="The account and its sessions will be removed."
      confirm-text="Delete"
      :auto-close-on-confirm="false"
      show-overlay
      @confirm="onExtraConfirm"
    >
      <template #extra>
        <label class="check">
          <input v-model="understood" type="checkbox" />
          I understand
        </label>
      </template>
    </RsConfirmDialog>
  </DocDemo>

  <DocDemo
    id="demo-overlay"
    title="遮罩"
    title-en="Overlay"
    description="默认不涂暗，但背后仍不可点。show-overlay 才铺颜色。点遮罩不会关闭。"
    description-en="The dim layer is off by default, but the page behind is still blocked. show-overlay paints it. A click on it does not close."
    :code="overlayCode"
  >
    <RsButton @click="overlayOpen = true">Disconnect</RsButton>
    <RsConfirmDialog
      v-model:open="overlayOpen"
      title="Disconnect?"
      description="The session will drop."
      tone="warning"
      confirm-variant="danger"
      confirm-text="Disconnect"
      show-overlay
      :overlay-opacity="0.4"
    />
  </DocDemo>

  <DocDemo
    id="demo-mount"
    title="挂载目标"
    title-en="Mount target"
    description="teleport-to 决定节点挂在哪。目标可以和确认框写在同一页，打开时再解析。"
    description-en="teleport-to chooses the DOM parent. The target can live in the same page; lookup waits until that page is mounted."
    :code="mountCode"
  >
    <div id="rs-confirm-dock" ref="dockRef" class="dock">
      <p>{{ copy.dockHint }}</p>
    </div>
    <div class="row">
      <RsButton @click="openDock">Open in dock</RsButton>
      <RsButton variant="default" @click="readMount">Where?</RsButton>
    </div>
    <p class="note">{{ mountLine }}</p>
    <RsConfirmDialog
      id="rs-demo-confirm"
      v-model:open="dockOpen"
      teleport-to="#rs-confirm-dock"
      title="Docked"
      description="This node is inside the dock."
      show-overlay
      @cancel="mountNote = copy.mountClosed"
    />
  </DocDemo>

  <DocDemo
    id="demo-stack"
    title="叠加"
    title-en="Stack"
    description="后开的一层用更高的 z-index。Esc 只关最上层，和 Dialog 共用同一层栈。"
    description-en="The later layer uses a higher z-index. Esc closes only the top one. Confirm dialogs share the Dialog layer stack."
    :code="stackCode"
  >
    <RsButton @click="backOpen = true">Open back</RsButton>
    <p class="note">{{ stackLine }}</p>
    <RsConfirmDialog
      v-model:open="backOpen"
      title="Back"
      description="Open another confirm from here."
      show-overlay
      @cancel="stackNote = copy.stackClosed('back')"
    >
      <template #extra>
        <RsButton @click="frontOpen = true">Open another</RsButton>
      </template>
    </RsConfirmDialog>
    <RsConfirmDialog
      v-model:open="frontOpen"
      title="Front"
      description="Esc closes this layer only."
      :z-index="140"
      show-overlay
      @cancel="stackNote = copy.stackClosed('front')"
    />
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 上有 close 和 focus。close 仍走 beforeClose，并以 programmatic 发出 cancel。"
    description-en="The template ref exposes close and focus. close still runs beforeClose and emits cancel as programmatic."
    :code="methodCode"
  >
    <div class="row">
      <RsButton @click="methodOpen = true">Open</RsButton>
      <RsButton variant="default" @click="callClose">close()</RsButton>
      <RsButton variant="ghost" @click="callFocus">focus()</RsButton>
    </div>
    <p class="note">{{ methodLine }}</p>
    <RsConfirmDialog
      ref="methodRef"
      v-model:open="methodOpen"
      title="Methods"
      id="rs-confirm-methods"
      show-overlay
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
