<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCodeEditor, type RsCodeEditorExpose, type RsCodeEditorLanguage } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const json = ref('{\n  "name": "niuma-ui"\n}')
const readyCount = ref(0)
const language = ref<RsCodeEditorLanguage>('json')
const languageDoc = ref('{\n  "ok": true\n}')
const stateDoc = ref('const total = 1\n')
const readonly = ref(false)
const disabled = ref(false)
const wrap = ref(true)
const themeDoc = ref('{\n  "theme": "light"\n}')
const autoDoc = ref('{\n  "theme": "auto"\n}')
const diagDoc = ref('{\n  "name": "niuma-ui",\n  "version": 1\n}')
const diagEditor = ref<RsCodeEditorExpose | null>(null)
const methodLog = ref('')
const toolbarDoc = ref('select id from users\n')
const embeddedDoc = ref('id = 1\n')
const sqlDoc = ref('select id, name from users\n')
const assistDoc = ref('function greet(name) {\n  return name\n}\n')
const assistLog = ref('')
const sqlConfig = {
  dialect: 'postgresql' as const,
  schema: {
    users: [
      { label: 'id', detail: 'integer' },
      { label: 'name', detail: 'text' },
    ],
  },
}

const { copy } = useSiteDemo({
  'en-US': {
    readyIdle: 'Not ready yet.',
    readyHit: (count: number) => `ready × ${count}`,
    methodIdle: 'Call goToPosition(2) or focus().',
    methodHit: (detail: string) => detail,
    jump: 'goToPosition(2)',
    focus: 'focus()',
    readonly: 'Read-only',
    editable: 'Editable',
    disabled: 'Disabled',
    enabled: 'Enabled',
    wrapOn: 'Wrap on',
    wrapOff: 'Wrap off',
    assistIdle: 'Ctrl/Cmd+click return, or select text and press Ctrl/Cmd+K.',
    defined: (file: string, line: number) => `goto-definition → ${file}:${line}`,
    languages: [
      { id: 'json', label: 'JSON' },
      { id: 'sql', label: 'SQL' },
      { id: 'toml', label: 'TOML' },
    ] as const,
  },
  'zh-CN': {
    readyIdle: '还没就绪。',
    readyHit: (count: number) => `ready × ${count}`,
    methodIdle: '调用 goToPosition(2) 或 focus()。',
    methodHit: (detail: string) => detail,
    jump: 'goToPosition(2)',
    focus: 'focus()',
    readonly: '只读',
    editable: '可编辑',
    disabled: '禁用',
    enabled: '可用',
    wrapOn: '折行开',
    wrapOff: '折行关',
    assistIdle: 'Ctrl/Cmd+单击 return，或选中文字后按 Ctrl/Cmd+K。',
    defined: (file: string, line: number) => `goto-definition → ${file}:${line}`,
    languages: [
      { id: 'json', label: 'JSON' },
      { id: 'sql', label: 'SQL' },
      { id: 'toml', label: 'TOML' },
    ] as const,
  },
})

const readyNote = computed(() => (readyCount.value ? copy.value.readyHit(readyCount.value) : copy.value.readyIdle))
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const assistNote = computed(() => assistLog.value || copy.value.assistIdle)

const languageSamples: Record<string, string> = {
  json: '{\n  "ok": true\n}',
  sql: 'select id from users\n',
  toml: 'name = "niuma-ui"\n',
}

function pickLanguage(next: RsCodeEditorLanguage) {
  language.value = next
  languageDoc.value = languageSamples[next] ?? ''
}

function onReady() {
  readyCount.value += 1
}

function jumpToVersion() {
  diagEditor.value?.goToPosition(2, 1)
  methodLog.value = copy.value.methodHit('goToPosition(2, 1)')
}

function focusDiag() {
  diagEditor.value?.focus()
  const active = document.activeElement
  const name = active instanceof HTMLElement ? active.className.split(' ')[0] || active.tagName.toLowerCase() : 'none'
  methodLog.value = copy.value.methodHit(`focus() → ${name}`)
}

const basicCode = `<RsCodeEditor
  v-model="json"
  language="json"
  :height="160"
  aria-label="Package manifest"
  @ready="onReady"
/>`

const languageCode = `<RsCodeEditor v-model="source" :language="language" :height="140" />`

const stateCode = `<RsCodeEditor
  v-model="source"
  language="javascript"
  placeholder="Type a snippet"
  :readonly="readonly"
  :disabled="disabled"
  :wrap="wrap"
  :height="140"
/>`

const themeCode = `<div data-rs-theme="dark">
  <RsCodeEditor v-model="source" language="json" theme="light" :height="120" />
</div>
<RsCodeEditor v-model="autoSource" language="json" theme="auto" :height="120" />`

const diagCode = `const editor = ref<RsCodeEditorExpose | null>(null)

<RsCodeEditor
  ref="editor"
  v-model="source"
  language="json"
  :diagnostics="[
    { message: 'Expected string', line: 2, column: 14, severity: 'error' },
    { message: 'Consider pinning the version', line: 2, severity: 'warning' },
  ]"
/>

editor.value?.goToPosition(2, 1)
editor.value?.focus()`

const toolbarCode = `<RsCodeEditor v-model="source" language="sql" :height="120">
  <template #toolbar>
    <RsButton size="sm" variant="ghost">Format</RsButton>
  </template>
</RsCodeEditor>

<div class="frame">
  <RsCodeEditor v-model="filter" language="sql" embedded :show-toolbar="false" :height="96" />
</div>`

const assistCode = `<RsCodeEditor
  v-model="sql"
  language="sql"
  :sql-config="{
    dialect: 'postgresql',
    schema: { users: [{ label: 'id', detail: 'integer' }, { label: 'name', detail: 'text' }] },
  }"
/>

<RsCodeEditor
  v-model="source"
  language="javascript"
  file-path="src/greet.ts"
  :definition-request="onDefinition"
  :inline-edit-request="onInlineEdit"
  @goto-definition="onGoto"
/>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="绑定文本"
    title-en="Bound text"
    description="v-model 即正文。ready 在编辑器创建完成后发出，换语言时会再发一次。"
    description-en="v-model is the document. ready fires when the editor is created, and again if the language changes."
    :code="basicCode"
  >
    <RsCodeEditor
      v-model="json"
      language="json"
      :height="160"
      aria-label="Package manifest"
      @ready="onReady"
    />
    <p class="demo-note">{{ json }}</p>
    <p class="demo-note">{{ readyNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-language"
    title="语言"
    title-en="Language"
    description="language 决定高亮。toml 有语法，vue 目前用 HTML 高亮。不认识的值显示 Plain Text。"
    description-en="language picks the grammar. toml has a mode. vue currently uses HTML. An unknown value shows Plain Text."
    :code="languageCode"
  >
    <div class="demo-row">
      <RsButton
        v-for="item in copy.languages"
        :key="item.id"
        size="sm"
        :variant="language === item.id ? 'default' : 'ghost'"
        @click="pickLanguage(item.id)"
      >
        {{ item.label }}
      </RsButton>
    </div>
    <RsCodeEditor v-model="languageDoc" :language="language" :height="140" />
  </DocDemo>

  <DocDemo
    id="demo-state"
    title="只读、禁用与折行"
    title-en="Read-only, disabled, wrap"
    description="只读仍可聚焦和复制。禁用移出 Tab 序。wrap 默认开，关掉后长行横向滚动，不用重建编辑器。"
    description-en="Read-only can still focus and copy. Disabled leaves the tab order. wrap defaults to on. Turning it off scrolls long lines and does not rebuild the editor."
    :code="stateCode"
  >
    <div class="demo-row">
      <RsButton size="sm" variant="ghost" @click="readonly = !readonly">
        {{ readonly ? copy.editable : copy.readonly }}
      </RsButton>
      <RsButton size="sm" variant="ghost" @click="disabled = !disabled">
        {{ disabled ? copy.enabled : copy.disabled }}
      </RsButton>
      <RsButton size="sm" variant="ghost" @click="wrap = !wrap">
        {{ wrap ? copy.wrapOff : copy.wrapOn }}
      </RsButton>
    </div>
    <RsCodeEditor
      v-model="stateDoc"
      language="javascript"
      placeholder="Type a snippet"
      :readonly="readonly"
      :disabled="disabled"
      :wrap="wrap"
      :height="140"
    />
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题"
    title-en="Theme"
    description="深色岛里 theme=light 只把这个编辑器画成浅色。旁边的 auto 跟随页面 data-rs-theme。"
    description-en="Inside a dark island, theme=light paints only this editor light. The auto editor follows the page data-rs-theme."
    :code="themeCode"
  >
    <div class="demo-island" data-rs-theme="dark">
      <RsCodeEditor v-model="themeDoc" language="json" theme="light" :height="120" />
    </div>
    <RsCodeEditor v-model="autoDoc" language="json" theme="auto" :height="120" />
  </DocDemo>

  <DocDemo
    id="demo-diagnostics"
    title="诊断与跳转"
    title-en="Diagnostics and jump"
    description="底栏点击跳到对应行。goToPosition 与 focus 是宿主要调的方法。"
    description-en="A footer click jumps to that line. goToPosition and focus are the host methods."
    :code="diagCode"
  >
    <RsCodeEditor
      ref="diagEditor"
      v-model="diagDoc"
      language="json"
      :height="150"
      :diagnostics="[
        { message: 'Expected string', line: 2, column: 14, severity: 'error' },
        { message: 'Consider pinning the version', line: 2, severity: 'warning' },
      ]"
    />
    <div class="demo-row">
      <RsButton size="sm" variant="ghost" @click="jumpToVersion">{{ copy.jump }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="focusDiag">{{ copy.focus }}</RsButton>
    </div>
    <p class="demo-note">{{ methodNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-toolbar"
    title="工具条与嵌入"
    title-en="Toolbar and embedded"
    description="#toolbar 在语言名右侧。嵌入面板时用 embedded，不要再用 :deep 去掉边框。"
    description-en="#toolbar sits after the language name. Use embedded inside a panel that already has a border. Do not :deep the frame away."
    :code="toolbarCode"
  >
    <RsCodeEditor v-model="toolbarDoc" language="sql" :height="120">
      <template #toolbar>
        <RsButton size="sm" variant="ghost">Format</RsButton>
      </template>
    </RsCodeEditor>
    <div class="demo-frame">
      <RsCodeEditor v-model="embeddedDoc" language="sql" embedded :show-toolbar="false" :height="96" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-assist"
    title="SQL、行内编辑与定义"
    title-en="SQL, inline edit, definition"
    description="SQL schema 提供表和字段补全。选中函数名后 Ctrl/Cmd+K 走 inlineEditRequest。Ctrl/Cmd+单击 return，文件不同就发 goto-definition。"
    description-en="SQL schema completes tables and columns. Select the function name and press Ctrl/Cmd+K to call inlineEditRequest. Ctrl/Cmd+click return emits goto-definition when the file differs."
    :code="assistCode"
  >
    <RsCodeEditor v-model="sqlDoc" language="sql" :height="120" :sql-config="sqlConfig" />
    <RsCodeEditor
      v-model="assistDoc"
      language="javascript"
      file-path="src/greet.ts"
      :height="160"
      :definition-request="async (line) => (line === 2 ? { file: 'src/name.ts', line: 4, column: 1 } : null)"
      :inline-edit-request="async ({ selection, instruction }) => `${selection} /* ${instruction} */`"
      @goto-definition="(loc) => { assistLog = copy.defined(loc.file, loc.line) }"
    />
    <p class="demo-note">{{ assistNote }}</p>
  </DocDemo>
</template>

<style scoped>
.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  margin-block-end: var(--rs-space-sm);
}
.demo-note {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  white-space: pre-wrap;
}
.demo-island {
  padding: var(--rs-space-md);
  border-radius: var(--rs-radius);
  background: var(--rs-bg);
  margin-block-end: var(--rs-space-md);
}
.demo-frame {
  margin-block-start: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  overflow: hidden;
}
</style>
