<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import {
  RsAutoComplete,
  RsButton,
  RsForm,
  type RsAutoCompleteExpose,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const MODELS = ['GPT-4o', 'Claude', 'DeepSeek', 'Gemini']

const value = ref('')
const remoteValue = ref('')
const remoteOptions = ref<string[]>(MODELS)
const remoteLoading = ref(false)
const sizeValue = ref('Claude')
const slotValue = ref('')
const eventValue = ref('')
const methodValue = ref('')
const lastAction = ref('')
const methodLog = ref('')
const fieldRef = ref<RsAutoCompleteExpose | null>(null)
let remoteSeq = 0
let remoteTimer = 0

const { copy } = useSiteDemo({
  'en-US': {
    placeholder: 'Type a model name',
    darkSurface: 'Dark surface — autocomplete tokens follow data-rs-theme, do not hard-code color',
    remoteHint: 'filterOption=false. @search replaces options after a short wait.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    disabledHint: 'Unavailable — explain why nearby.',
    emptyHint: 'No match. Keep typing a custom value.',
    optionHint: (label: string) => `Use ${label}`,
    idle: 'No event yet. search / select / clear / focus / blur log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toFocus: 'focus()',
    toBlur: 'blur()',
    methodIdle: 'Call focus() or blur(). There is no setValue() on the ref.',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
  },
  'zh-CN': {
    placeholder: '输入模型名',
    darkSurface: '深色表面 — 自动完成 token 跟 data-rs-theme，不要写死颜色',
    remoteHint: 'filterOption=false。@search 稍等后替换 options。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    disabledHint: '不可用 — 附近写清原因。',
    emptyHint: '没有匹配。继续输入自定义值。',
    optionHint: (label: string) => `使用 ${label}`,
    idle: '还没有事件。search / select / clear / focus / blur 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toFocus: 'focus()',
    toBlur: 'blur()',
    methodIdle: '调用 focus() 或 blur()。ref 上没有 setValue()。',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsAutoComplete
  v-model="value"
  allow-clear
  :options="['GPT-4o', 'Claude', 'DeepSeek', 'Gemini']"
  placeholder="Type a model name"
/>`

const remoteCode = `<RsAutoComplete
  v-model="query"
  :options="options"
  :filter-option="false"
  :loading="loading"
  :debounce="240"
  @search="onSearch"
/>`

const sizeCode = `<RsAutoComplete size="ssm" :options="options" />
<RsAutoComplete size="sm" :options="options" />
<RsAutoComplete size="md" :options="options" />
<RsAutoComplete size="lg" :options="options" />`

const disabledCode = `<RsAutoComplete disabled :options="options" model-value="Claude" />

<RsForm disabled>
  <RsAutoComplete :options="options" model-value="Claude" />
</RsForm>`

const slotsCode = `<RsAutoComplete v-model="value" :options="options">
  <template #option="{ option }">
    Use {{ option.label }}
  </template>
  <template #empty>No match. Keep typing a custom value.</template>
</RsAutoComplete>`

const eventsCode = `<RsAutoComplete
  v-model="value"
  allow-clear
  :options="options"
  @search="onSearch"
  @select="onSelect"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const field = ref<RsAutoCompleteExpose>()
field.value?.focus()
field.value?.blur()
// field.value?.setValue is undefined

<RsAutoComplete ref="field" v-model="value" :options="options" />`

function log(name: string, detail: string) {
  lastAction.value = copy.value.changeHit(name, detail)
}

function onRemoteSearch(query: string) {
  remoteSeq += 1
  const seq = remoteSeq
  remoteLoading.value = true
  if (remoteTimer) window.clearTimeout(remoteTimer)
  remoteTimer = window.setTimeout(() => {
    remoteTimer = 0
    if (seq !== remoteSeq) return
    const q = query.trim().toLowerCase()
    remoteOptions.value = q
      ? MODELS.filter((item) => item.toLowerCase().includes(q))
      : MODELS
    remoteLoading.value = false
  }, 240)
}

function runFocus() {
  fieldRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runBlur() {
  fieldRef.value?.blur()
  methodLog.value = copy.value.methodBlur
}

onUnmounted(() => {
  if (remoteTimer) window.clearTimeout(remoteTimer)
})
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="输入即建议"
    title-en="Type to suggest"
    description="在触发器里打字过滤。值可以不在列表里。必须选自列表时用 Select。"
    description-en="Type on the trigger to filter. The value may be missing from the list. Force a list pick with Select."
    :code="basicCode"
  >
    <div class="field">
      <RsAutoComplete
        v-model="value"
        allow-clear
        :options="MODELS"
        :placeholder="copy.placeholder"
        :aria-label="copy.placeholder"
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsAutoComplete
          v-model="value"
          allow-clear
          :options="MODELS"
          :placeholder="copy.placeholder"
          :aria-label="copy.placeholder"
        />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-remote"
    title="远程搜索"
    title-en="Remote search"
    description="filterOption=false 不过滤本地列表。debounce 只延迟 @search。loading 在列表空时显示。"
    description-en="filterOption=false skips the local list. debounce only delays @search. loading shows when the list is empty."
    :code="remoteCode"
  >
    <div class="field">
      <RsAutoComplete
        v-model="remoteValue"
        :options="remoteOptions"
        :filter-option="false"
        :loading="remoteLoading"
        :debounce="240"
        :placeholder="copy.placeholder"
        :aria-label="copy.placeholder"
        @search="onRemoteSearch"
      />
      <p class="hint">{{ copy.remoteHint }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟控件高度。未传跟随 ConfigProvider.control-size。"
    description-en="Four steps follow control height. Omit to follow ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="stack">
      <RsAutoComplete v-model="sizeValue" size="ssm" :options="MODELS" :aria-label="copy.placeholder" />
      <RsAutoComplete v-model="sizeValue" size="sm" :options="MODELS" :aria-label="copy.placeholder" />
      <RsAutoComplete v-model="sizeValue" size="md" :options="MODELS" :aria-label="copy.placeholder" />
      <RsAutoComplete v-model="sizeValue" size="lg" :options="MODELS" :aria-label="copy.placeholder" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 不能输入。也会继承 Form.disabled。灰掉时附近写清原因。"
    description-en="disabled cannot type. It also inherits Form.disabled. Explain nearby why it is unavailable."
    :code="disabledCode"
  >
    <div class="stack">
      <RsAutoComplete
        disabled
        :options="MODELS"
        model-value="Claude"
        :aria-label="copy.disabledHint"
      />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsForm disabled>
        <RsAutoComplete :options="MODELS" model-value="Claude" :aria-label="copy.formDisabled" />
      </RsForm>
      <p class="hint">{{ copy.formDisabled }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#option 自定义一项文案（原生 option，只能是文本）。#empty 在无建议时出现。"
    description-en="#option customizes the option text (native option, text only). #empty appears when there is no suggestion."
    :code="slotsCode"
  >
    <div class="field">
      <RsAutoComplete v-model="slotValue" :options="MODELS" :aria-label="copy.placeholder">
        <template #option="{ option }">
          {{ copy.optionHint(option.label) }}
        </template>
        <template #empty>{{ copy.emptyHint }}</template>
      </RsAutoComplete>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 search / select / clear / focus / blur。没有 click。"
    description-en="The events you can feel are search, select, clear, focus, and blur. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsAutoComplete
        v-model="eventValue"
        allow-clear
        :options="MODELS"
        :aria-label="copy.placeholder"
        @search="(query) => log('search', query)"
        @select="(picked) => log('select', picked)"
        @clear="() => log('clear', '')"
        @focus="() => log('focus', 'in')"
        @blur="() => log('blur', 'out')"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus() / blur()。没有 setValue()。模板 ref 用 RsAutoCompleteExpose。"
    description-en="Hosts can call focus() and blur(). There is no setValue(). Type the template ref as RsAutoCompleteExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsAutoComplete
          ref="fieldRef"
          v-model="methodValue"
          :options="MODELS"
          :aria-label="copy.placeholder"
        />
      </div>
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
      <RsButton variant="default" @click="runBlur">{{ copy.toBlur }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 20rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 20rem;
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

.hint {
  margin: 0.45rem 0 0;
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
</style>
