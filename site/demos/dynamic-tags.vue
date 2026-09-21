<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsDynamicTags, RsForm, type RsDynamicTagsExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const tags = ref(['Vue', 'TypeScript'])
const always = ref(['design', 'research'])
const separated = ref(['alpha'])
const sizeTags = ref(['md'])
const slotTags = ref(['prod', 'canary'])
const eventTags = ref(['Vue'])
const methodTags = ref(['focus'])
const lastAction = ref('')
const methodLog = ref('')
const fieldRef = ref<RsDynamicTagsExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    placeholder: 'Type and press Enter',
    darkSurface: 'Dark surface — box tokens follow data-rs-theme, do not hard-code color',
    alwaysHint: 'input-mode="always" keeps the field visible. max=6 hides it at the cap.',
    sepHint: 'separators=",". Type or paste a, b, c to split. parse lowercases.',
    disabledHint: 'Unavailable — explain why nearby.',
    readonlyHint: 'Read-only — tags stay, add and clear stay off.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    slotHint: '#tag can prefix a mark. #trigger replaces the plus icon.',
    idle: 'No event yet. create / remove / reject / clear / focus / blur log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toFocus: 'focus()',
    toBlur: 'blur()',
    toClear: 'setValue([])',
    methodIdle: 'Call focus(), blur(), or setValue([]). validate() belongs with Form.rules.',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
    methodSet: 'setValue([])',
  },
  'zh-CN': {
    placeholder: '输入后回车添加',
    darkSurface: '深色表面 — 容器 token 跟 data-rs-theme，不要写死颜色',
    alwaysHint: 'input-mode="always" 始终露出输入框。max=6 到上限后隐藏。',
    sepHint: 'separators=","。输入或粘贴 a, b, c 会切开。parse 转小写。',
    disabledHint: '不可用 — 附近写清原因。',
    readonlyHint: '只读 — 能看标签，不能增删或清空。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    slotHint: '#tag 可以加标记。#trigger 替换 plus 图标。',
    idle: '还没有事件。create / remove / reject / clear / focus / blur 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toFocus: 'focus()',
    toBlur: 'blur()',
    toClear: 'setValue([])',
    methodIdle: '调用 focus()、blur() 或 setValue([])。validate() 交给 Form.rules。',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
    methodSet: 'setValue([])',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsDynamicTags v-model="tags" />`

const alwaysCode = `<RsDynamicTags
  v-model="tags"
  input-mode="always"
  :max="6"
  allow-clear
  tag-variant="primary"
/>`

const separatorsCode = `<RsDynamicTags
  v-model="tags"
  input-mode="always"
  separators=","
  :parse="(value) => value.toLowerCase()"
/>`

const sizeCode = `<RsDynamicTags size="ssm" v-model="tags" />
<RsDynamicTags size="sm" v-model="tags" />
<RsDynamicTags size="md" v-model="tags" />
<RsDynamicTags size="lg" v-model="tags" />`

const disabledCode = `<RsDynamicTags disabled :model-value="['locked']" />
<RsDynamicTags readonly :model-value="['visible']" />

<RsForm disabled>
  <RsDynamicTags :model-value="['inherited']" />
</RsForm>`

const slotsCode = `<RsDynamicTags v-model="tags">
  <template #tag="{ tag }">#{{ tag }}</template>
  <template #trigger>+</template>
</RsDynamicTags>`

const eventsCode = `<RsDynamicTags
  v-model="tags"
  allow-clear
  @create="onCreate"
  @remove="onRemove"
  @reject="onReject"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const field = ref<RsDynamicTagsExpose>()
field.value?.focus()
field.value?.blur()
field.value?.setValue([])

<RsDynamicTags ref="field" v-model="tags" />`

function log(name: string, detail: string) {
  lastAction.value = copy.value.changeHit(name, detail)
}

function runFocus() {
  fieldRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runBlur() {
  fieldRef.value?.blur()
  methodLog.value = copy.value.methodBlur
}

function runClear() {
  fieldRef.value?.setValue([])
  methodLog.value = copy.value.methodSet
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="触发式创建"
    title-en="Trigger to create"
    description="默认 input-mode=&quot;trigger&quot;：点 + 再输入。Enter / Tab 添加，Esc 取消，空输入 Backspace 删末尾。单个状态芯片用 Tag。"
    description-en="Default input-mode=&quot;trigger&quot;: click + then type. Enter / Tab add, Esc cancels, empty Backspace removes the last tag. A single status chip belongs on Tag."
    :code="basicCode"
  >
    <div class="field">
      <RsDynamicTags v-model="tags" :placeholder="copy.placeholder" :aria-label="copy.placeholder" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsDynamicTags v-model="tags" :placeholder="copy.placeholder" :aria-label="copy.placeholder" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-always"
    title="常驻输入"
    title-en="Always-on input"
    description="input-mode=&quot;always&quot; 始终露出输入框。max 到上限后隐藏。allow-clear 清空整组。"
    description-en="input-mode=&quot;always&quot; keeps the field visible. max hides it at the cap. allow-clear empties the group."
    :code="alwaysCode"
  >
    <div class="field">
      <RsDynamicTags
        v-model="always"
        input-mode="always"
        :max="6"
        allow-clear
        tag-variant="primary"
        :aria-label="copy.alwaysHint"
      />
      <p class="hint">{{ copy.alwaysHint }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-separators"
    title="分隔与粘贴"
    title-en="Separators and paste"
    description="separators 切开输入或粘贴。parse 可 toLowerCase 或返回 false 拒绝。未传 separators 时整段是一条。"
    description-en="separators split typing or paste. parse can toLowerCase or return false to reject. Without separators the whole string is one tag."
    :code="separatorsCode"
  >
    <div class="field">
      <RsDynamicTags
        v-model="separated"
        input-mode="always"
        separators=","
        :parse="(value) => value.toLowerCase()"
        :aria-label="copy.sepHint"
      />
      <p class="hint">{{ copy.sepHint }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟标签与输入高度。未传跟随 ConfigProvider.control-size。"
    description-en="Four steps follow tag and input height. Omit to follow ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="stack">
      <RsDynamicTags v-model="sizeTags" size="ssm" :aria-label="copy.placeholder" />
      <RsDynamicTags v-model="sizeTags" size="sm" :aria-label="copy.placeholder" />
      <RsDynamicTags v-model="sizeTags" size="md" :aria-label="copy.placeholder" />
      <RsDynamicTags v-model="sizeTags" size="lg" :aria-label="copy.placeholder" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用与只读"
    title-en="Disabled and readonly"
    description="disabled 不能改，也会继承 Form.disabled。readonly 能看标签，不打开输入。"
    description-en="disabled cannot edit and also inherits Form.disabled. readonly keeps the tags visible and leaves the input closed."
    :code="disabledCode"
  >
    <div class="stack">
      <RsDynamicTags disabled :model-value="['locked']" :aria-label="copy.disabledHint" />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsDynamicTags readonly allow-clear :model-value="['visible']" :aria-label="copy.readonlyHint" />
      <p class="hint">{{ copy.readonlyHint }}</p>
      <RsForm disabled>
        <RsDynamicTags :model-value="['inherited']" :aria-label="copy.formDisabled" />
      </RsForm>
      <p class="hint">{{ copy.formDisabled }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#tag 自定义一条正文（可以加标记）。#trigger 替换 + 按钮内容。"
    description-en="#tag customizes a row body (a mark is allowed). #trigger replaces the plus button content."
    :code="slotsCode"
  >
    <div class="field">
      <RsDynamicTags v-model="slotTags" :aria-label="copy.slotHint">
        <template #tag="{ tag }">#{{ tag }}</template>
        <template #trigger>+</template>
      </RsDynamicTags>
      <p class="hint">{{ copy.slotHint }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 create / remove / reject / clear / focus / blur。没有 click。"
    description-en="The events you can feel are create, remove, reject, clear, focus, and blur. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsDynamicTags
        v-model="eventTags"
        allow-clear
        :aria-label="copy.placeholder"
        @create="(value) => log('create', value)"
        @remove="(value, index) => log('remove', `${value} @${index}`)"
        @reject="(reason, value) => log('reject', `${reason} ${value}`)"
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
    description="宿主可调 focus() / blur() / setValue()。validate() 交给 Form。模板 ref 用 RsDynamicTagsExpose。"
    description-en="Hosts can call focus(), blur(), and setValue(). validate() belongs on Form. Type the template ref as RsDynamicTagsExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsDynamicTags
          ref="fieldRef"
          v-model="methodTags"
          :aria-label="copy.placeholder"
        />
      </div>
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
      <RsButton variant="default" @click="runBlur">{{ copy.toBlur }}</RsButton>
      <RsButton variant="default" @click="runClear">{{ copy.toClear }}</RsButton>
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
