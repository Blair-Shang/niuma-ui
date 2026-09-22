<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsToaster, useRsToast } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const toast = useRsToast()
const lastAction = ref('')
const heldId = ref('')
const loadingId = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    success: 'Saved',
    info: 'A new version is available',
    warning: 'Quota is almost gone',
    error: 'Submit failed. Try again.',
    descTitle: 'Invite sent',
    descBody: 'The link works for 24 hours.',
    withDesc: 'With description',
    undo: 'Undo',
    dismiss: 'Dismiss',
    actionHint: 'action and cancel are buttons. The click is logged, then the toast closes.',
    idle: 'No action yet.',
    undoHit: 'action → Undo',
    dismissHit: 'cancel → Dismiss',
    short: 'Closes in 1.5s',
    sticky: 'Stays until dismissed',
    stickyTitle: 'Upload paused',
    corner: 'This corner only',
    promiseOk: 'Save (success)',
    promiseBad: 'Save (error)',
    saving: 'Saving…',
    saved: 'Saved',
    failed: 'The request failed',
    hold: 'Sticky (duration 0)',
    startLoading: 'loading()',
    finishLoading: 'update() to success',
    clearOne: 'dismiss(id)',
    clearAll: 'dismiss()',
    held: (id: string) => `sticky id → ${id}`,
    loadingShown: (id: string) => `loading id → ${id}`,
    loadingDone: 'update() → success. The same id, so the loading toast is gone.',
    cleared: 'dismiss(id) → that toast left',
    clearedAll: 'dismiss() → queue cleared',
    stack: 'Add three',
    stackTitle: (n: number) => `Stacked ${n}`,
    rich: 'Rich color',
    log: (text: string) => text,
  },
  'zh-CN': {
    success: '已保存',
    info: '有新版本可用',
    warning: '配额即将用尽',
    error: '提交失败，请重试',
    descTitle: '邀请已发出',
    descBody: '链接 24 小时内有效。',
    withDesc: '带描述',
    undo: '撤销',
    dismiss: '知道了',
    actionHint: 'action 和 cancel 是按钮。点击会记下来，然后这条提示关闭。',
    idle: '还没有操作。',
    undoHit: 'action → 撤销',
    dismissHit: 'cancel → 知道了',
    short: '1.5 秒后关闭',
    sticky: '一直留着',
    stickyTitle: '上传已暂停',
    corner: '只在这个角',
    promiseOk: '保存（成功）',
    promiseBad: '保存（失败）',
    saving: '正在保存…',
    saved: '已保存',
    failed: '请求失败',
    hold: '常驻（duration 0）',
    startLoading: 'loading()',
    finishLoading: 'update() 成成功',
    clearOne: 'dismiss(id)',
    clearAll: 'dismiss()',
    held: (id: string) => `常驻 id → ${id}`,
    loadingShown: (id: string) => `loading id → ${id}`,
    loadingDone: 'update() → 成功。还是同一个 id，loading 那条被换掉。',
    cleared: 'dismiss(id) → 这一条已关闭',
    clearedAll: 'dismiss() → 队列已清空',
    stack: '叠三条',
    stackTitle: (n: number) => `第 ${n} 条`,
    rich: '语义底色',
    log: (text: string) => text,
  },
})

function showBasic(type: 'success' | 'info' | 'warning' | 'error') {
  const text = {
    success: copy.value.success,
    info: copy.value.info,
    warning: copy.value.warning,
    error: copy.value.error,
  }[type]
  toast[type](text)
  lastAction.value = type
}

function showDescription() {
  toast.success({ title: copy.value.descTitle, description: copy.value.descBody })
  lastAction.value = copy.value.withDesc
}

function showAction() {
  toast.success({
    title: copy.value.success,
    description: copy.value.descBody,
    duration: 8000,
    action: {
      label: copy.value.undo,
      onClick: () => {
        lastAction.value = copy.value.undoHit
      },
    },
    cancel: {
      label: copy.value.dismiss,
      onClick: () => {
        lastAction.value = copy.value.dismissHit
      },
    },
  })
}

function showShort() {
  toast.info({ title: copy.value.short, duration: 1500 })
  lastAction.value = copy.value.short
}

function showSticky() {
  toast.warning({ title: copy.value.stickyTitle, duration: 0 })
  lastAction.value = copy.value.sticky
}

function showAt(position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right') {
  toast.message({ title: `${position}`, description: copy.value.corner, position, duration: 2500 })
  lastAction.value = position
}

function saveOk() {
  lastAction.value = copy.value.saving
  toast.promise(new Promise((resolve) => setTimeout(() => resolve('ok'), 700)), {
    loading: copy.value.saving,
    success: copy.value.saved,
    error: copy.value.failed,
  })
}

function saveBad() {
  lastAction.value = copy.value.saving
  toast.promise(new Promise((_, reject) => setTimeout(() => reject(new Error(copy.value.failed)), 700)), {
    loading: copy.value.saving,
    success: copy.value.saved,
    error: copy.value.failed,
  })
}

function holdOne() {
  heldId.value = toast.info({ title: copy.value.stickyTitle, duration: 0 })
  lastAction.value = copy.value.held(heldId.value)
}

function startLoading() {
  loadingId.value = toast.loading(copy.value.saving)
  lastAction.value = copy.value.loadingShown(loadingId.value)
}

function finishLoading() {
  if (!loadingId.value) return
  toast.update(loadingId.value, { title: copy.value.saved }, 'success')
  loadingId.value = ''
  lastAction.value = copy.value.loadingDone
}

function clearHeld() {
  if (!heldId.value) return
  toast.dismiss(heldId.value)
  heldId.value = ''
  lastAction.value = copy.value.cleared
}

function clearAll() {
  toast.dismiss()
  heldId.value = ''
  loadingId.value = ''
  lastAction.value = copy.value.clearedAll
}

function stackThree() {
  for (let index = 1; index <= 3; index += 1) {
    toast.info({
      title: copy.value.stackTitle(index),
      toasterId: 'demo-stack',
      duration: 8000,
    })
  }
  lastAction.value = copy.value.stack
}

function showRich() {
  toast.success({ title: copy.value.success, description: copy.value.descBody, richColors: true })
  lastAction.value = copy.value.rich
}

const basicCode = `const toast = useRsToast()

toast.success('Saved')
toast.info('A new version is available')
toast.warning('Quota is almost gone')
toast.error('Submit failed. Try again.')`

const descCode = `toast.success({
  title: 'Invite sent',
  description: 'The link works for 24 hours.',
})`

const actionCode = `toast.success({
  title: 'Saved',
  duration: 8000,
  action: { label: 'Undo', onClick: () => {} },
  cancel: { label: 'Dismiss', onClick: () => {} },
})`

const durationCode = `toast.info({ title: 'Closes in 1.5s', duration: 1500 })
toast.warning({ title: 'Upload paused', duration: 0 })`

const positionCode = `toast.message({
  title: 'bottom-right',
  position: 'bottom-right',
  duration: 2500,
})`

const promiseCode = `toast.promise(save(), {
  loading: 'Saving…',
  success: 'Saved',
  error: 'The request failed',
})`

const dismissCode = `import { onUnmounted } from 'vue'
import { useRsToast } from 'niuma-ui'

const toast = useRsToast()
const stickyId = toast.info({ title: 'Upload paused', duration: 0 })
const loadingId = toast.loading('Saving…')

toast.dismiss(stickyId)
toast.update(loadingId, { title: 'Saved' }, 'success')

onUnmounted(() => {
  toast.dismiss(stickyId)
  toast.dismiss(loadingId)
})`

const stackCode = `<RsToaster toaster-id="demo-stack" position="bottom-left" :expand="false" />

toast.info({ title: 'Stacked 1', toasterId: 'demo-stack' })`

const richCode = `toast.success({
  title: 'Saved',
  description: 'The link works for 24 hours.',
  richColors: true,
})`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="四种结果"
    title-en="Four results"
    description="站点根已挂 RsToaster。成功、信息、警告、错误各一条。错误是 role=alert。"
    description-en="The site root already mounts RsToaster. One toast per result. Errors use role=alert."
    :code="basicCode"
  >
    <p class="log">{{ lastAction || copy.idle }}</p>
    <div class="row">
      <RsButton size="sm" @click="showBasic('success')">success</RsButton>
      <RsButton size="sm" variant="default" @click="showBasic('info')">info</RsButton>
      <RsButton size="sm" variant="default" @click="showBasic('warning')">warning</RsButton>
      <RsButton size="sm" variant="danger" @click="showBasic('error')">error</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-description"
    title="标题与描述"
    title-en="Title and description"
    description="对象可以带 title 和 description。字符串是只有标题的简写。"
    description-en="Pass title and description, or a string when there is only a title."
    :code="descCode"
  >
    <RsButton size="sm" variant="default" @click="showDescription">{{ copy.withDesc }}</RsButton>
  </DocDemo>

  <DocDemo
    id="demo-action"
    title="操作按钮"
    title-en="Actions"
    description="action 是主按钮，cancel 是次按钮。点击后这条提示关闭。"
    description-en="action is the primary button. cancel is secondary. The toast closes after the click."
    :code="actionCode"
  >
    <p class="log">{{ lastAction || copy.actionHint }}</p>
    <RsButton size="sm" @click="showAction">{{ copy.undo }}</RsButton>
  </DocDemo>

  <DocDemo
    id="demo-duration"
    title="时长与常驻"
    title-en="Duration"
    description="duration 是毫秒。0 表示不自动关闭。不传则 4 秒。"
    description-en="duration is milliseconds. 0 stays up. Omit it for 4 seconds."
    :code="durationCode"
  >
    <div class="row">
      <RsButton size="sm" variant="default" @click="showShort">{{ copy.short }}</RsButton>
      <RsButton size="sm" variant="default" @click="showSticky">{{ copy.sticky }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-position"
    title="位置"
    title-en="Position"
    description="单条 position 盖过宿主默认方位。六个角都是物理 left / right。"
    description-en="A toast position overrides the host. All six corners are physical left / right."
    :code="positionCode"
  >
    <div class="row">
      <RsButton size="sm" variant="default" @click="showAt('top-left')">top-left</RsButton>
      <RsButton size="sm" variant="default" @click="showAt('top-center')">top-center</RsButton>
      <RsButton size="sm" variant="default" @click="showAt('top-right')">top-right</RsButton>
      <RsButton size="sm" variant="default" @click="showAt('bottom-left')">bottom-left</RsButton>
      <RsButton size="sm" variant="default" @click="showAt('bottom-center')">bottom-center</RsButton>
      <RsButton size="sm" variant="default" @click="showAt('bottom-right')">bottom-right</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-promise"
    title="Promise"
    title-en="Promise"
    description="先显示 loading，落定后改成成功或错误。同一条 id，不会叠两条。"
    description-en="Shows loading, then replaces that same toast with success or error."
    :code="promiseCode"
  >
    <div class="row">
      <RsButton size="sm" @click="saveOk">{{ copy.promiseOk }}</RsButton>
      <RsButton size="sm" variant="danger" @click="saveBad">{{ copy.promiseBad }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-dismiss"
    title="手动关闭"
    title-en="Dismiss yourself"
    description="duration 为 0、以及 loading()，都不会自己消失。保存返回的 id，结束时 dismiss(id) 或 update()。离开页面时在 onUnmounted 里 dismiss，避免悬停暂停后这条一直留着。dismiss() 不传 id 会清空队列。promise() 会自己从 loading 换成结果，不用再 dismiss。"
    description-en="duration 0 and loading() stay up. Keep the returned id and call dismiss(id) or update() when the work ends. Call dismiss in onUnmounted when leaving the page, so a toast paused by hover does not stay behind. dismiss() with no id clears the queue. promise() replaces loading itself."
    :code="dismissCode"
  >
    <p class="log">{{ lastAction || copy.idle }}</p>
    <div class="row">
      <RsButton size="sm" variant="default" @click="holdOne">{{ copy.hold }}</RsButton>
      <RsButton size="sm" variant="default" @click="startLoading">{{ copy.startLoading }}</RsButton>
      <RsButton size="sm" variant="default" @click="finishLoading">{{ copy.finishLoading }}</RsButton>
      <RsButton size="sm" variant="default" @click="clearHeld">{{ copy.clearOne }}</RsButton>
      <RsButton size="sm" variant="default" @click="clearAll">{{ copy.clearAll }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-stack"
    title="折叠堆叠"
    title-en="Collapsed stack"
    description="另一个 toasterId，expand 为 false。悬停这一摞会展开。不占用站点根上的宿主。"
    description-en="A second toasterId with expand false. Hover the stack to expand it. It does not use the site host."
    :code="stackCode"
  >
    <RsToaster toaster-id="demo-stack" position="bottom-left" :expand="false" />
    <RsButton size="sm" variant="default" @click="stackThree">{{ copy.stack }}</RsButton>
  </DocDemo>

  <DocDemo
    id="demo-rich"
    title="语义底色"
    title-en="Rich colors"
    description="richColors 用语义色洗表面，文字仍走 --rs-text。深色岛跟 data-rs-theme。"
    description-en="richColors washes the surface with the semantic color. Text stays on --rs-text and follows data-rs-theme."
    :code="richCode"
  >
    <RsButton size="sm" @click="showRich">{{ copy.rich }}</RsButton>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
}

.log {
  margin: 0 0 var(--rs-space-sm);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}
</style>
