<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsAlert, RsButton, RsIcon, type RsAlertExpose, type RsAlertSize } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const closableOpen = ref(true)
const eventOpen = ref(true)
const lastAction = ref('')
const methodLog = ref('')
const methodRef = ref<RsAlertExpose | null>(null)
const size = ref<RsAlertSize>('md')
const sizes: RsAlertSize[] = ['sm', 'md', 'lg']

const { copy } = useSiteDemo({
  'en-US': {
    infoTitle: 'Info',
    infoBody: 'Config synced to every environment.',
    successTitle: 'Success',
    successBody: 'Deploy finished. The service is ready.',
    warningTitle: 'Warning',
    warningBody: 'Quota is almost gone. Scale up soon.',
    dangerTitle: 'Error',
    dangerBody: 'The request failed. Try again later.',
    defaultTitle: 'Note',
    defaultBody: 'Neutral copy that is not a status color.',
    darkSurface: 'Dark surface — alert tokens follow data-rs-theme, do not hard-code color',
    variantHint: 'variant is shape. tone stays the hue. outline / solid do not change the meaning.',
    closed: 'Dismissed. The host hid the alert after close.',
    showAgain: 'Show again',
    closeHint: 'closable emits close. The alert stays until the host uses v-if.',
    hideIcon: 'No default icon',
    customIcon: 'Custom #icon',
    bannerHint: 'banner is full width and square. Use it at the top of a page, not inside a card.',
    sizeHint: 'sm / md / lg. Omit size to follow ConfigProvider. ssm becomes sm.',
    slotHint: '#title / #icon / #action / #close. Buttons stay native or RsButton.',
    retry: 'Retry',
    hide: 'Hide',
    idle: 'No event yet. close logs here.',
    closeHit: 'close → host hid the alert',
    methodIdle: 'Call focus(). There is no close() on the ref — dismissal uses @close.',
    methodHit: (detail: string) => `focus() → ${detail}`,
    toFocus: 'focus()',
    inspect: 'Inspect ref',
  },
  'zh-CN': {
    infoTitle: '信息',
    infoBody: '配置已同步到所有环境。',
    successTitle: '成功',
    successBody: '部署完成，服务已就绪。',
    warningTitle: '警告',
    warningBody: '配额即将用尽，请及时扩容。',
    dangerTitle: '错误',
    dangerBody: '请求失败，请稍后重试。',
    defaultTitle: '说明',
    defaultBody: '中性文案，不是状态色。',
    darkSurface: '深色表面 — 提示条 token 跟 data-rs-theme，不要写死颜色',
    variantHint: 'variant 只管形态。色相仍走 tone。outline / solid 不改变含义。',
    closed: '已关闭。宿主在 close 之后藏掉了提示。',
    showAgain: '再次显示',
    closeHint: 'closable 只发 close。提示会留到宿主 v-if。',
    hideIcon: '无默认图标',
    customIcon: '自定义 #icon',
    bannerHint: 'banner 通栏且直角。用在页顶，不要塞进卡片里。',
    sizeHint: 'sm / md / lg。未传跟 ConfigProvider。ssm 落到 sm。',
    slotHint: '#title / #icon / #action / #close。操作走 RsButton 或原生 button。',
    retry: '重试',
    hide: '隐藏',
    idle: '还没有事件。close 会记在这里。',
    closeHit: 'close → 宿主藏掉了提示',
    methodIdle: '调用 focus()。ref 上没有 close()，关闭走 @close。',
    methodHit: (detail: string) => `focus() → ${detail}`,
    toFocus: 'focus()',
    inspect: '查看 ref',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onClosableClose() {
  closableOpen.value = false
}

function onEventClose() {
  eventOpen.value = false
  lastAction.value = copy.value.closeHit
}

function restoreEvent() {
  eventOpen.value = true
  lastAction.value = ''
}

function callFocus() {
  methodRef.value?.focus()
  const active = document.activeElement
  const tag = active instanceof HTMLElement ? active.tagName.toLowerCase() : 'none'
  const name = active instanceof HTMLElement ? active.className.split(' ')[0] || tag : tag
  methodLog.value = copy.value.methodHit(name)
}

const typeCode = `<RsAlert tone="info" title="Info">Config synced to every environment.</RsAlert>
<RsAlert type="success" title="Success">Deploy finished. The service is ready.</RsAlert>
<RsAlert tone="warning" title="Warning">Quota is almost gone. Scale up soon.</RsAlert>
<RsAlert tone="danger" title="Error">The request failed. Try again later.</RsAlert>`

const variantCode = `<RsAlert tone="info" variant="soft" title="Soft" />
<RsAlert tone="info" variant="outline" title="Outline" />
<RsAlert tone="info" variant="solid" title="Solid" />`

const closeCode = `<RsAlert
  v-if="open"
  tone="info"
  title="Closable"
  closable
  close-text="Hide"
  @close="open = false"
>
  closable emits close. The host hides the alert.
</RsAlert>`

const iconCode = `<RsAlert tone="warning" title="No icon" :show-icon="false" />
<RsAlert tone="success" title="Custom icon">
  <template #icon>
    <RsIcon name="star" :size="16" />
  </template>
  #icon still renders when show-icon is false.
</RsAlert>`

const bannerCode = `<RsAlert banner tone="warning" title="Maintenance window">
  The API pauses at 02:00 UTC. banner is full width and square.
</RsAlert>`

const sizeCode = `<RsAlert size="sm" radius="sm" tone="info" title="sm" />
<RsAlert size="md" radius="md" tone="info" title="md" />
<RsAlert size="lg" radius="lg" tone="info" title="lg" />`

const slotsCode = `<RsAlert tone="danger" closable>
  <template #icon><RsIcon name="shield-alert" :size="16" /></template>
  <template #title>Payment failed</template>
  The card was declined.
  <template #action>
    <RsButton size="sm" variant="default">Retry</RsButton>
  </template>
  <template #close>Hide</template>
</RsAlert>`

const eventsCode = `<RsAlert
  v-if="open"
  tone="warning"
  title="Quota"
  closable
  @close="onClose"
>
  close → host hid the alert
</RsAlert>`

const methodsCode = `<RsAlert ref="alertRef" tone="info" title="Focus me" closable>
  focus() moves to the close control.
</RsAlert>
<RsButton variant="default" @click="alertRef?.focus()">focus()</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-type"
    title="语义色"
    title-en="Tone"
    description="色相走 tone。type 是旧调用别名，效果相同。warning / danger 用 role=alert；其余用 role=status。短暂结果请用 Toast。"
    description-en="Hue is tone. type is the legacy alias and looks the same. warning / danger use role=alert; the rest use role=status. Use Toast for a fleeting result."
    :code="typeCode"
  >
    <div class="stack">
      <RsAlert tone="info" :title="copy.infoTitle">{{ copy.infoBody }}</RsAlert>
      <RsAlert type="success" :title="copy.successTitle">{{ copy.successBody }}</RsAlert>
      <RsAlert tone="warning" :title="copy.warningTitle">{{ copy.warningBody }}</RsAlert>
      <RsAlert tone="danger" :title="copy.dangerTitle">{{ copy.dangerBody }}</RsAlert>
      <RsAlert tone="default" :title="copy.defaultTitle">{{ copy.defaultBody }}</RsAlert>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsAlert tone="info" :title="copy.infoTitle">{{ copy.infoBody }}</RsAlert>
        <RsAlert tone="danger" :title="copy.dangerTitle">{{ copy.dangerBody }}</RsAlert>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-variant"
    title="形态"
    title-en="Variant"
    :description="copy.variantHint"
    :description-en="copy.variantHint"
    :code="variantCode"
  >
    <div class="stack">
      <RsAlert tone="info" variant="soft" :title="copy.infoTitle">{{ copy.infoBody }}</RsAlert>
      <RsAlert tone="info" variant="outline" :title="copy.infoTitle">{{ copy.infoBody }}</RsAlert>
      <RsAlert tone="info" variant="solid" :title="copy.infoTitle">{{ copy.infoBody }}</RsAlert>
      <RsAlert tone="warning" variant="outline" :title="copy.warningTitle" :bordered="false">
        {{ copy.warningBody }}
      </RsAlert>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-close"
    title="可关闭"
    title-en="Closable"
    :description="copy.closeHint"
    :description-en="copy.closeHint"
    :code="closeCode"
  >
    <RsAlert
      v-if="closableOpen"
      tone="info"
      :title="copy.infoTitle"
      closable
      :close-text="copy.hide"
      @close="onClosableClose"
    >
      {{ copy.infoBody }}
    </RsAlert>
    <div v-else class="row">
      <RsAlert tone="default" :title="copy.closed" />
      <RsButton variant="default" @click="closableOpen = true">{{ copy.showAgain }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-icon"
    title="图标"
    title-en="Icon"
    description="show-icon=false 去掉默认图标。传了 #icon 时插槽仍显示。"
    description-en="show-icon=false hides the default glyph. A provided #icon still renders."
    :code="iconCode"
  >
    <div class="stack">
      <RsAlert tone="warning" :title="copy.hideIcon" :show-icon="false">
        {{ copy.warningBody }}
      </RsAlert>
      <RsAlert tone="success" :title="copy.customIcon">
        <template #icon>
          <RsIcon name="star" :size="16" />
        </template>
        {{ copy.successBody }}
      </RsAlert>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-banner"
    title="横幅"
    title-en="Banner"
    :description="copy.bannerHint"
    :description-en="copy.bannerHint"
    :code="bannerCode"
  >
    <RsAlert banner tone="warning" :title="copy.warningTitle">
      {{ copy.warningBody }}
    </RsAlert>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸与圆角"
    title-en="Size and radius"
    :description="copy.sizeHint"
    :description-en="copy.sizeHint"
    :code="sizeCode"
  >
    <div class="row">
      <RsButton
        v-for="item in sizes"
        :key="item"
        variant="default"
        :aria-pressed="size === item"
        @click="size = item"
      >
        {{ item }}
      </RsButton>
    </div>
    <div class="stack stack--tight">
      <RsAlert :size="size" radius="sm" tone="info" :title="copy.infoTitle">
        {{ copy.infoBody }}
      </RsAlert>
      <RsAlert :size="size" radius="lg" tone="success" :title="copy.successTitle">
        {{ copy.successBody }}
      </RsAlert>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    :description="copy.slotHint"
    :description-en="copy.slotHint"
    :code="slotsCode"
  >
    <RsAlert tone="danger" closable>
      <template #icon>
        <RsIcon name="shield-alert" :size="16" />
      </template>
      <template #title>{{ copy.dangerTitle }}</template>
      {{ copy.dangerBody }}
      <template #action>
        <RsButton size="sm" variant="default">{{ copy.retry }}</RsButton>
      </template>
      <template #close>{{ copy.hide }}</template>
    </RsAlert>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="唯一组件事件是 close。点关闭后日志会变，提示由宿主藏掉。"
    description-en="The only component event is close. The log updates and the host hides the alert."
    :code="eventsCode"
  >
    <RsAlert
      v-if="eventOpen"
      tone="warning"
      :title="copy.warningTitle"
      closable
      @close="onEventClose"
    >
      {{ copy.warningBody }}
    </RsAlert>
    <RsButton v-else variant="default" @click="restoreEvent">{{ copy.showAgain }}</RsButton>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="expose 只有 focus()。没有 close() / setType()。关闭仍走 @close。"
    description-en="The only expose is focus(). There is no close() or setType(). Dismissal still uses @close."
    :code="methodsCode"
  >
    <div class="stack">
      <RsAlert ref="methodRef" tone="info" :title="copy.infoTitle" closable>
        {{ copy.infoBody }}
      </RsAlert>
      <div class="row">
        <RsButton variant="default" @click="callFocus">{{ copy.toFocus }}</RsButton>
      </div>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stack--tight {
  margin-block-start: 0.75rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: 0.75rem;
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}
</style>
