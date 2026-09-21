<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsBadge, RsButton } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const { copy } = useSiteDemo({
  'en-US': {
    chipDefault: 'Default',
    chipPrimary: 'In progress',
    chipSuccess: 'Done',
    chipWarning: 'Needs review',
    chipDanger: 'Failed',
    chipInfo: 'Queued',
    darkSurface: 'Dark surface — badge follows theme tokens, do not hard-code color',
    inbox: 'Inbox',
    notify: 'Alerts',
    hiddenZero: 'count=0 (hidden)',
    shownZero: 'count=0 showZero',
    idle: 'RsBadge emits nothing. Click the button to see the event.',
    inboxHit: 'Button click → Inbox',
    methodIdle: 'No defineExpose. There is no setCount() on the badge ref.',
    methodNone: 'expose keys: none',
    inspect: 'Inspect ref',
  },
  'zh-CN': {
    chipDefault: '默认',
    chipPrimary: '进行中',
    chipSuccess: '已完成',
    chipWarning: '需关注',
    chipDanger: '已失败',
    chipInfo: '待处理',
    darkSurface: '深色表面 — 徽标跟主题 token，不要写死颜色',
    inbox: '收件箱',
    notify: '通知',
    hiddenZero: 'count=0（隐藏）',
    shownZero: 'count=0 showZero',
    idle: 'RsBadge 不发事件。点右边的按钮才能看到回调。',
    inboxHit: '按钮 click → 收件箱',
    methodIdle: '没有 defineExpose。徽标 ref 上没有 setCount()。',
    methodNone: 'expose 键：none',
    inspect: '查看 ref',
  },
})

const lastAction = ref('')
const methodLog = ref('')
const badgeRef = ref<Record<string, unknown> | null>(null)
const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onInbox() {
  lastAction.value = copy.value.inboxHit
}

function inspectBadgeRef() {
  const inst = badgeRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}

const typeCode = `<RsBadge>Default</RsBadge>
<RsBadge variant="primary">In progress</RsBadge>
<RsBadge variant="success">Done</RsBadge>
<RsBadge variant="warning">Needs review</RsBadge>
<RsBadge variant="danger">Failed</RsBadge>
<RsBadge variant="info">Queued</RsBadge>`

const countCode = `<RsBadge :count="5" variant="danger" />
<RsBadge :count="100" :max="99" variant="danger" />
<RsBadge :count="12" variant="primary" />`

const overlayCode = `<RsBadge :count="8" variant="danger">
  <RsButton variant="default">Inbox</RsButton>
</RsBadge>
<RsBadge :count="100" :max="99" variant="danger">
  <RsButton variant="default">Alerts</RsButton>
</RsBadge>`

const dotCode = `<RsBadge dot variant="danger">
  <RsButton variant="default">Inbox</RsButton>
</RsBadge>
<RsBadge dot variant="success">
  <RsButton variant="default">Alerts</RsButton>
</RsBadge>`

const zeroCode = `<RsBadge :count="0" variant="danger">
  <RsButton variant="default">Inbox</RsButton>
</RsBadge>
<RsBadge :count="0" show-zero variant="danger">
  <RsButton variant="default">Inbox</RsButton>
</RsBadge>`

const eventsCode = `<RsBadge variant="primary">In progress</RsBadge>
<RsBadge :count="3" variant="danger">
  <RsButton variant="default" @click="onInbox">Inbox</RsButton>
</RsBadge>`

const methodsCode = `<RsBadge ref="badgeRef" variant="primary">In progress</RsBadge>
<RsButton variant="default" @click="inspectBadgeRef">Inspect ref</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-type"
    title="状态芯片"
    title-en="Status chip"
    description="只写 variant 和默认插槽时，RsBadge 仍是原来的状态芯片：比 Tag 更紧凑，不可关闭。任务状态用浅底深字，避免大面积高饱和色。"
    description-en="With only variant and the default slot, RsBadge is still the original status chip: more compact than Tag, and it cannot close. Use tinted fill and on-container text for task status. Avoid large saturated blocks."
    :code="typeCode"
  >
    <div class="row">
      <RsBadge>{{ copy.chipDefault }}</RsBadge>
      <RsBadge variant="primary">{{ copy.chipPrimary }}</RsBadge>
      <RsBadge variant="success">{{ copy.chipSuccess }}</RsBadge>
      <RsBadge variant="warning">{{ copy.chipWarning }}</RsBadge>
      <RsBadge variant="danger">{{ copy.chipDanger }}</RsBadge>
      <RsBadge variant="info">{{ copy.chipInfo }}</RsBadge>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsBadge>{{ copy.chipDefault }}</RsBadge>
        <RsBadge variant="primary">{{ copy.chipPrimary }}</RsBadge>
        <RsBadge variant="success">{{ copy.chipSuccess }}</RsBadge>
        <RsBadge variant="danger">{{ copy.chipDanger }}</RsBadge>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-count"
    title="计数"
    title-en="Count"
    description="只传 count、不放插槽时，渲染一枚独立数字。超过 max（默认 99）显示 {max}+。未读数常用 variant=&quot;danger&quot;。"
    description-en="count without a slot renders a standalone number. Values above max (default 99) become {max}+. Unread counts usually use variant=&quot;danger&quot;."
    :code="countCode"
  >
    <div class="row">
      <RsBadge :count="5" variant="danger" />
      <RsBadge :count="100" :max="99" variant="danger" />
      <RsBadge :count="12" variant="primary" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-overlay"
    title="角标"
    title-en="Overlay"
    description="count 与默认插槽同时出现时，插槽是宿主，数字挂在右上角。这是 Ant / Element / MUI 的角标形态；旧的芯片调用不必改。"
    description-en="When count and the default slot appear together, the slot is the host and the number sits on the top-end corner. This is the Ant / Element / MUI overlay. Existing chip callers do not need to change."
    :code="overlayCode"
  >
    <div class="row">
      <RsBadge :count="8" variant="danger">
        <RsButton variant="default">{{ copy.inbox }}</RsButton>
      </RsBadge>
      <RsBadge :count="100" :max="99" variant="danger">
        <RsButton variant="default">{{ copy.notify }}</RsButton>
      </RsBadge>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsBadge :count="8" variant="danger">
          <RsButton variant="default">{{ copy.inbox }}</RsButton>
        </RsBadge>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-dot"
    title="圆点"
    title-en="Dot"
    description="只要「有动静」、不报具体数字时用 dot。与 count 同时出现时只显示点。"
    description-en="Use dot when something is new but the exact number does not matter. It wins over count when both are set."
    :code="dotCode"
  >
    <div class="row">
      <RsBadge dot variant="danger">
        <RsButton variant="default">{{ copy.inbox }}</RsButton>
      </RsBadge>
      <RsBadge dot variant="success">
        <RsButton variant="default">{{ copy.notify }}</RsButton>
      </RsBadge>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-zero"
    title="零值"
    title-en="Zero"
    description="count 为 0 时默认不渲染角标，宿主还在。需要看见 0 时加 showZero。"
    description-en="count 0 hides the mark by default; the host stays. Pass showZero when 0 must remain visible."
    :code="zeroCode"
  >
    <div class="row">
      <div class="stack">
        <span class="hint">{{ copy.hiddenZero }}</span>
        <RsBadge :count="0" variant="danger">
          <RsButton variant="default">{{ copy.inbox }}</RsButton>
        </RsBadge>
      </div>
      <div class="stack">
        <span class="hint">{{ copy.shownZero }}</span>
        <RsBadge :count="0" show-zero variant="danger">
          <RsButton variant="default">{{ copy.inbox }}</RsButton>
        </RsBadge>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="RsBadge 没有组件事件。点芯片不会改日志。可感知的点击请绑在角标宿主 RsButton 上。"
    description-en="RsBadge has no component events. Clicking the chip does not change the log. Bind a click you can feel on the overlay host RsButton."
    :code="eventsCode"
  >
    <div class="row">
      <RsBadge variant="primary">{{ copy.chipPrimary }}</RsBadge>
      <RsBadge :count="3" variant="danger">
        <RsButton variant="default" @click="onInbox">{{ copy.inbox }}</RsButton>
      </RsBadge>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改文案或数字走插槽 / count props。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change the label or number with the slot / count props. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsBadge ref="badgeRef" variant="primary">{{ copy.chipPrimary }}</RsBadge>
      <RsButton variant="default" @click="inspectBadgeRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hint {
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: 0.75rem;
  background: var(--rs-surface);
  color: var(--rs-text);
}
</style>
