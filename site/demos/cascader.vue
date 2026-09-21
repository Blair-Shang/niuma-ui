<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCascader, RsForm, type RsCascaderExpose, type RsCascaderOption } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const path = ref<(string | number)[]>([])
const changePath = ref<(string | number)[]>([])
const hoverPath = ref<(string | number)[]>([])
const sizePath = ref<(string | number)[]>(['east', 'sh'])
const eventPath = ref<(string | number)[]>([])
const methodPath = ref<(string | number)[]>([])
const lastAction = ref('')
const methodLog = ref('')
const cascaderRef = ref<RsCascaderExpose | null>(null)

const options: RsCascaderOption[] = [
  {
    label: 'East China',
    value: 'east',
    children: [
      { label: 'Shanghai', value: 'sh' },
      { label: 'Hangzhou', value: 'hz' },
    ],
  },
  {
    label: 'North China',
    value: 'north',
    children: [
      { label: 'Beijing', value: 'bj' },
      { label: 'Tianjin', value: 'tj' },
    ],
  },
]

const { copy } = useSiteDemo({
  'en-US': {
    region: 'Choose a region',
    disabled: 'Disabled',
    formDisabled: 'Inside a disabled form — the cascader inherits Form.disabled',
    darkSurface: 'Dark surface — cascader tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change logs a click or clear. hover expand does not.',
    changeHit: (value: string) => `change → ${value || '(empty)'}`,
    toFocus: 'focus()',
    methodIdle: 'Call focus(). Open the panel with v-model:open. There is no toggle().',
    methodFocus: 'focus()',
  },
  'zh-CN': {
    region: '选择地区',
    disabled: '已禁用',
    formDisabled: '在禁用的 Form 里 — 级联框继承 Form.disabled',
    darkSurface: '深色表面 — 级联 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change 记点选或清除。hover 展开不记。',
    changeHit: (value: string) => `change → ${value || '（空）'}`,
    toFocus: 'focus()',
    methodIdle: '调用 focus()。面板用 v-model:open。没有 toggle()。',
    methodFocus: 'focus()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsCascader v-model="path" allow-clear :options="options" placeholder="Choose a region" />`

const changeCode = `<RsCascader v-model="path" change-on-select :options="options" />`

const hoverCode = `<RsCascader v-model="path" expand-trigger="hover" :options="options" />`

const sizeCode = `<RsCascader size="ssm" :options="options" />
<RsCascader size="sm" :options="options" />
<RsCascader size="md" :options="options" />
<RsCascader size="lg" :options="options" />`

const disabledCode = `<RsCascader disabled :options="options" />

<RsForm disabled>
  <RsCascader :options="options" />
</RsForm>`

const eventsCode = `<RsCascader v-model="path" allow-clear :options="options" @change="onChange" />`

const methodsCode = `const cascader = ref<RsCascaderExpose>()
cascader.value?.focus()
// cascader.value?.toggle is undefined

<RsCascader ref="cascader" v-model="path" :options="options" />`

function formatPath(value: (string | number)[]): string {
  return value.map(String).join(' / ')
}

function onChange(value: (string | number)[]) {
  lastAction.value = copy.value.changeHit(formatPath(value))
}

function runFocus() {
  cascaderRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="多列选择"
    title-en="Columns"
    description="v-model 是路径数组。从左到右逐级展开。叶子会关面板。allowClear 用 RsButton，不嵌在触发 button 里。"
    description-en="v-model is a path array. Columns expand left to right. A leaf closes the panel. allowClear uses RsButton — not nested inside the trigger button."
    :code="basicCode"
  >
    <div class="field">
      <RsCascader v-model="path" allow-clear :options="options" :placeholder="copy.region" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsCascader v-model="path" allow-clear :options="options" :placeholder="copy.region" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-change"
    title="选即生效"
    title-en="Change on select"
    description="changeOnSelect 点非叶子也写入路径并发 change。只有叶子关面板。"
    description-en="changeOnSelect writes the path and emits change on a non-leaf. Only a leaf closes the panel."
    :code="changeCode"
  >
    <div class="field">
      <RsCascader v-model="changePath" change-on-select :options="options" :placeholder="copy.region" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-hover"
    title="悬停展开"
    title-en="Hover expand"
    description="expandTrigger=hover 展开非叶子只写 v-model，不发 change。点叶子才发 change。"
    description-en="expandTrigger=hover writes v-model only when expanding a non-leaf — not change. A leaf click still emits change."
    :code="hoverCode"
  >
    <div class="field">
      <RsCascader v-model="hoverPath" expand-trigger="hover" :options="options" :placeholder="copy.region" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟控件高度。触发器与面板选项一起变。未传跟随 Form / ConfigProvider.control-size。"
    description-en="Four steps follow control height. The trigger and panel items move together. Omit to follow Form / ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="stack">
      <RsCascader v-model="sizePath" size="ssm" :options="options" :placeholder="copy.region" />
      <RsCascader v-model="sizePath" size="sm" :options="options" :placeholder="copy.region" />
      <RsCascader v-model="sizePath" size="md" :options="options" :placeholder="copy.region" />
      <RsCascader v-model="sizePath" size="lg" :options="options" :placeholder="copy.region" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 打不开面板。也会继承 Form.disabled。"
    description-en="disabled cannot open the panel. It also inherits Form.disabled."
    :code="disabledCode"
  >
    <div class="stack">
      <RsCascader disabled :options="options" :placeholder="copy.disabled" />
      <RsForm disabled>
        <RsCascader :options="options" :placeholder="copy.formDisabled" />
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 v-model / open。hover 展开不发 change。没有 click。"
    description-en="The events you can feel are change and v-model / open. hover expand does not emit change. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsCascader
        v-model="eventPath"
        allow-clear
        :options="options"
        :placeholder="copy.region"
        @change="onChange"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus()。面板用 v-model:open。没有 toggle()。模板 ref 用 RsCascaderExpose。"
    description-en="Hosts can call focus(). The panel uses v-model:open. There is no toggle(). Type the template ref as RsCascaderExpose."
    :code="methodsCode"
  >
    <div class="row">
      <RsCascader ref="cascaderRef" v-model="methodPath" :options="options" :placeholder="copy.region" />
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.field,
.stack {
  max-width: 20rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
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
