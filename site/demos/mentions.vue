<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RsButton, RsForm, RsMentions, type RsMentionsExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const PEOPLE = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
  { label: 'Chris', value: 'chris', disabled: true },
]

const TOPICS = [
  { label: 'release', value: 'release' },
  { label: 'design', value: 'design' },
]

const text = ref('Hello @')
const prefixText = ref('See @alice and #')
const remoteText = ref('@')
const remoteOptions = ref(PEOPLE)
const remoteLoading = ref(false)
const sizeText = ref('@')
const slotText = ref('@')
const eventText = ref('@')
const methodText = ref('Hello @')
const lastAction = ref('')
const methodLog = ref('')
const fieldRef = ref<RsMentionsExpose | null>(null)
let remoteSeq = 0
let remoteTimer = 0

const { copy } = useSiteDemo({
  'en-US': {
    placeholder: 'Type @ to mention a teammate',
    darkSurface: 'Dark surface — mention tokens follow data-rs-theme, do not hard-code color',
    prefixHint: 'prefix=["@", "#"]. # opens topics; @ opens people.',
    remoteHint: 'filterOption=false. @search replaces options after a short wait.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    disabledHint: 'Unavailable — explain why nearby.',
    readonlyHint: 'Read-only — the mention list stays closed.',
    emptyHint: 'No teammate matches. Keep typing or pick another prefix.',
    optionHint: (label: string) => `@${label}`,
    idle: 'No event yet. search / select / clear / focus / blur log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toFocus: 'focus()',
    toBlur: 'blur()',
    methodIdle: 'Call focus() or blur(). There is no setValue() on the ref.',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
  },
  'zh-CN': {
    placeholder: '输入 @ 提及同事',
    darkSurface: '深色表面 — 提及 token 跟 data-rs-theme，不要写死颜色',
    prefixHint: 'prefix=["@", "#"]。# 打开话题，@ 打开成员。',
    remoteHint: 'filterOption=false。@search 稍等后替换 options。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    disabledHint: '不可用 — 附近写清原因。',
    readonlyHint: '只读 — 提及列表保持关闭。',
    emptyHint: '没有匹配的同事。继续输入或换一个触发符。',
    optionHint: (label: string) => `@${label}`,
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

const basicCode = `<RsMentions
  v-model="text"
  allow-clear
  :options="[
    { label: 'Alice', value: 'alice' },
    { label: 'Bob', value: 'bob' },
  ]"
  placeholder="Type @ to mention a teammate"
/>`

const prefixCode = `<RsMentions
  v-model="text"
  :prefix="['@', '#']"
  :options="options"
/>`

const remoteCode = `<RsMentions
  v-model="text"
  :options="options"
  :filter-option="false"
  :loading="loading"
  :debounce="240"
  @search="onSearch"
/>`

const sizeCode = `<RsMentions size="ssm" :options="options" />
<RsMentions size="sm" :options="options" />
<RsMentions size="md" :options="options" />
<RsMentions size="lg" :options="options" />`

const disabledCode = `<RsMentions disabled :options="options" model-value="Hello @alice" />
<RsMentions readonly :options="options" model-value="Hello @alice" />

<RsForm disabled>
  <RsMentions :options="options" model-value="Hello @alice" />
</RsForm>`

const slotsCode = `<RsMentions v-model="text" :options="options">
  <template #option="{ option }">
    @{{ option.label }}
  </template>
  <template #empty>No teammate matches.</template>
</RsMentions>`

const eventsCode = `<RsMentions
  v-model="text"
  allow-clear
  :options="options"
  @search="onSearch"
  @select="onSelect"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const field = ref<RsMentionsExpose>()
field.value?.focus()
field.value?.blur()
// field.value?.setValue is undefined

<RsMentions ref="field" v-model="text" :options="options" />`

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
      ? PEOPLE.filter((item) => item.label.toLowerCase().includes(q) || item.value.includes(q))
      : PEOPLE
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
    title="@ 提及"
    title-en="Type @ to mention"
    description="在段落里输入 @ 过滤成员。选中后写入 @value 。纯多行文本用 Textarea。"
    description-en="Type @ inside a paragraph to filter people. A pick writes @value. Plain multi-line text belongs on Textarea."
    :code="basicCode"
  >
    <div class="field">
      <RsMentions
        v-model="text"
        allow-clear
        :options="PEOPLE"
        :placeholder="copy.placeholder"
        :aria-label="copy.placeholder"
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsMentions
          v-model="text"
          allow-clear
          :options="PEOPLE"
          :placeholder="copy.placeholder"
          :aria-label="copy.placeholder"
        />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-prefix"
    title="多触发符"
    title-en="Multiple prefixes"
    description="prefix 可以是数组。光标前最近一个触发符决定当前查询。"
    description-en="prefix may be an array. The nearest trigger before the caret owns the query."
    :code="prefixCode"
  >
    <div class="field">
      <RsMentions
        v-model="prefixText"
        :prefix="['@', '#']"
        :options="[...PEOPLE, ...TOPICS]"
        :aria-label="copy.prefixHint"
      />
      <p class="hint">{{ copy.prefixHint }}</p>
    </div>
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
      <RsMentions
        v-model="remoteText"
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
    description="四档跟字号与最小高度。未传跟随 ConfigProvider.control-size。"
    description-en="Four steps follow type size and minimum height. Omit to follow ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="stack">
      <RsMentions v-model="sizeText" size="ssm" :options="PEOPLE" :aria-label="copy.placeholder" />
      <RsMentions v-model="sizeText" size="sm" :options="PEOPLE" :aria-label="copy.placeholder" />
      <RsMentions v-model="sizeText" size="md" :options="PEOPLE" :aria-label="copy.placeholder" />
      <RsMentions v-model="sizeText" size="lg" :options="PEOPLE" :aria-label="copy.placeholder" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用与只读"
    title-en="Disabled and readonly"
    description="disabled 不能输入，也会继承 Form.disabled。readonly 能看文本，不打开建议。"
    description-en="disabled cannot type and also inherits Form.disabled. readonly keeps the text visible and leaves the list closed."
    :code="disabledCode"
  >
    <div class="stack">
      <RsMentions
        disabled
        :options="PEOPLE"
        model-value="Hello @alice"
        :aria-label="copy.disabledHint"
      />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsMentions
        readonly
        :options="PEOPLE"
        model-value="Hello @alice"
        :aria-label="copy.readonlyHint"
      />
      <p class="hint">{{ copy.readonlyHint }}</p>
      <RsForm disabled>
        <RsMentions :options="PEOPLE" model-value="Hello @alice" :aria-label="copy.formDisabled" />
      </RsForm>
      <p class="hint">{{ copy.formDisabled }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#option 自定义一项（可以是头像 + 名字）。#empty 在无建议时出现。"
    description-en="#option customizes a row (avatar plus name is allowed). #empty appears when there is no suggestion."
    :code="slotsCode"
  >
    <div class="field">
      <RsMentions v-model="slotText" :options="PEOPLE" :aria-label="copy.placeholder">
        <template #option="{ option }">
          {{ copy.optionHint(option.label) }}
        </template>
        <template #empty>{{ copy.emptyHint }}</template>
      </RsMentions>
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
      <RsMentions
        v-model="eventText"
        allow-clear
        :options="PEOPLE"
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
    description="宿主可调 focus() / blur()。没有 setValue()。模板 ref 用 RsMentionsExpose。"
    description-en="Hosts can call focus() and blur(). There is no setValue(). Type the template ref as RsMentionsExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsMentions
          ref="fieldRef"
          v-model="methodText"
          :options="PEOPLE"
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
  max-width: 28rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 28rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
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
