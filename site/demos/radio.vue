<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsRadio, RsRadioItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const plan = ref('pro')
const groupRef = ref<Record<string, unknown> | null>(null)
const lastAction = ref('')
const methodLog = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
    freeHint: 'Free — personal trial',
    proHint: 'Pro — team work',
    entHint: 'Enterprise — org control',
    trial: 'Trial',
    darkSurface: 'Dark surface — radio tokens follow data-rs-theme, do not hard-code color',
    idle: 'No change yet. Click another option. Clicking the current one does nothing.',
    changeHit: 'change →',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no setValue() on the radio ref.',
    methodNone: 'expose keys: none',
    plan: 'Plan',
    disabledGroup: 'Whole group',
    oneOff: 'One option off',
  },
  'zh-CN': {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
    freeHint: 'Free — 个人试用',
    proHint: 'Pro — 团队协作',
    entHint: 'Enterprise — 组织管控',
    trial: '试用',
    darkSurface: '深色表面 — 单选 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有变化。点另一项。再点当前项没有事件。',
    changeHit: 'change →',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。单选 ref 上没有 setValue()。',
    methodNone: 'expose 键：none',
    plan: '套餐',
    disabledGroup: '整组禁用',
    oneOff: '只禁用一项',
  },
})

const eventLog = computed(() =>
  lastAction.value ? `${copy.value.changeHit} ${lastAction.value}` : copy.value.idle,
)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsRadio v-model="plan" aria-label="Plan">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
  <RsRadioItem value="enterprise">Enterprise</RsRadioItem>
</RsRadio>`

const orientationCode = `<RsRadio v-model="plan" orientation="vertical" aria-label="Plan">
  <RsRadioItem value="free">Free — personal trial</RsRadioItem>
  <RsRadioItem value="pro">Pro — team work</RsRadioItem>
  <RsRadioItem value="enterprise">Enterprise — org control</RsRadioItem>
</RsRadio>`

const sizeCode = `<RsRadio v-model="plan" size="ssm">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>
<RsRadio v-model="plan" size="sm">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>
<RsRadio v-model="plan" size="md">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>
<RsRadio v-model="plan" size="lg">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>`

const stateCode = `<RsRadio v-model="plan" disabled>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>
<RsRadio v-model="plan">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="trial" disabled>Trial</RsRadioItem>
</RsRadio>`

const eventsCode = `<RsRadio v-model="plan" @change="onChange">
  <RsRadioItem value="free">Free</RsRadioItem>
  <RsRadioItem value="pro">Pro</RsRadioItem>
</RsRadio>`

const methodsCode = `const radio = ref()
// RsRadio has no defineExpose — radio.value.setValue is undefined
<RsRadio ref="radio" v-model="plan" />`

function onChange(value: string | number | boolean) {
  lastAction.value = String(value)
}

function inspectRadioRef() {
  const inst = groupRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="选项"
    title-en="Options"
    description="选项很少且需要同时可见时用单选。选项多或要搜索时用 Select。默认插槽是选项文案。"
    description-en="Use radio when a few exclusive options should stay visible. Use Select when the list is long or searchable. The default slot is the option label."
    :code="basicCode"
  >
    <RsRadio v-model="plan" :aria-label="copy.plan">
      <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
      <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      <RsRadioItem value="enterprise">{{ copy.enterprise }}</RsRadioItem>
    </RsRadio>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsRadio v-model="plan">
          <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
          <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
          <RsRadioItem value="enterprise">{{ copy.enterprise }}</RsRadioItem>
        </RsRadio>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-orientation"
    title="方向"
    title-en="Orientation"
    description="默认横向换行。说明较长时用 vertical，并写入 aria-orientation。"
    description-en="Default is a wrapping row. Use vertical when the labels are long. aria-orientation is set to match."
    :code="orientationCode"
  >
    <RsRadio v-model="plan" orientation="vertical" :aria-label="copy.plan">
      <RsRadioItem value="free">{{ copy.freeHint }}</RsRadioItem>
      <RsRadioItem value="pro">{{ copy.proHint }}</RsRadioItem>
      <RsRadioItem value="enterprise">{{ copy.entHint }}</RsRadioItem>
    </RsRadio>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="size 跟同档 Input / Switch 的行高。未传跟随 ConfigProvider.control-size。"
    description-en="size matches Input / Switch row height at the same step. Omit it to follow ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="stack">
      <RsRadio v-model="plan" size="ssm" :aria-label="copy.plan">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
      <RsRadio v-model="plan" size="sm" :aria-label="copy.plan">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
      <RsRadio v-model="plan" size="md" :aria-label="copy.plan">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
      <RsRadio v-model="plan" size="lg" :aria-label="copy.plan">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-state"
    title="禁用"
    title-en="Disabled"
    description="disabled 禁整组。RsRadioItem.disabled 只禁一项。灰掉时附近写清原因。"
    description-en="disabled turns off the group. RsRadioItem.disabled turns off one option. Explain nearby why it is unavailable."
    :code="stateCode"
  >
    <div class="stack">
      <RsRadio v-model="plan" disabled :aria-label="copy.disabledGroup">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
      <RsRadio v-model="plan" :aria-label="copy.oneOff">
        <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
        <RsRadioItem value="trial" disabled>{{ copy.trial }}</RsRadioItem>
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 v-model。再点当前项不发。没有独立 click。"
    description-en="The events you can feel are change and v-model. Clicking the current option does not emit. There is no separate click."
    :code="eventsCode"
  >
    <RsRadio v-model="plan" @change="onChange">
      <RsRadioItem value="free">{{ copy.free }}</RsRadioItem>
      <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      <RsRadioItem value="enterprise">{{ copy.enterprise }}</RsRadioItem>
    </RsRadio>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改选用 v-model。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change the selection with v-model. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsRadio ref="groupRef" v-model="plan">
        <RsRadioItem value="pro">{{ copy.pro }}</RsRadioItem>
      </RsRadio>
      <RsButton variant="default" @click="inspectRadioRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack,
.row {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
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
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: 0.75rem;
  background: var(--rs-surface);
  color: var(--rs-text);
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
</style>
