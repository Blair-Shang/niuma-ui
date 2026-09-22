<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsContextMenu, RsMonacoEditor } from 'niuma-ui'
import type {
  MonacoCompletionContext,
  MonacoCompletionSnippet,
  MonacoLanguage,
  RsContextMenuExpose,
  RsContextMenuItem,
  RsMonacoEditorContextMenu,
  RsMonacoEditorInstance,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const code = ref('{\n  "name": "niuma-ui",\n  "active": true\n}')
const schemaJson = ref('{\n  "name": "Ada",\n  "age": 36\n}')
const locked = ref('{\n  "note": "read-only"\n}')
const minimapOn = ref(true)
const readonly = ref(true)
const disabled = ref(false)
const eventLog = ref('')
const methodLog = ref('')
const readyLog = ref('')
const editorRef = ref<RsMonacoEditorInstance | null>(null)
const methodRef = ref<RsMonacoEditorInstance | null>(null)

const languages: { key: MonacoLanguage; label: string; sample: string }[] = [
  { key: 'json', label: 'JSON', sample: '{\n  "language": "json"\n}' },
  { key: 'javascript', label: 'JavaScript', sample: 'export function greet(name) {\n  return `Hello, ${name}`\n}' },
  { key: 'typescript', label: 'TypeScript', sample: 'export function id(value: string): string {\n  return value\n}' },
  { key: 'sql', label: 'SQL', sample: 'select id, name\nfrom users\nwhere active = 1' },
  { key: 'yaml', label: 'YAML', sample: 'server:\n  port: 8080' },
]
const activeLang = ref<MonacoLanguage>('json')
const langSample = ref(languages[0]?.sample ?? '')

const userSchema = {
  type: 'object',
  required: ['name', 'age'],
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0, maximum: 150 },
  },
  additionalProperties: false,
}

const snippets: MonacoCompletionSnippet[] = [
  { label: 'find', insertText: 'find(${1:query})', detail: 'cursor', kind: 'function' },
]
const script = ref('const rows = db.')

const glyphDoc = ref('{\n  "step": 1\n}\n{\n  "step": 2\n}')
const methodDoc = ref(Array.from({ length: 24 }, (_, index) => `  "line_${index + 1}": ${index + 1}`).join(',\n').replace(/^/, '{\n').replace(/$/, '\n}'))
const embedDoc = ref('{\n  "embedded": true\n}')
const radiusDoc = ref('{\n  "radius": "lg"\n}')
const wrapDoc = ref('{"note":"this line stays on one row so word wrap off shows a horizontal scrollbar in a narrow frame"}')
const wrapOptions = { wordWrap: 'off' }

const { copy } = useSiteDemo({
  'en-US': {
    chars: (n: number) => `${n} characters`,
    clear: 'Clear',
    invalid: 'Set an invalid age',
    restore: 'Restore a valid document',
    readonly: 'Read-only',
    disabled: 'Disabled',
    minimap: 'Minimap',
    eventIdle: 'Focus the gutter editor, or click a glyph.',
    focused: 'focus',
    blurred: 'blur',
    ready: 'ready',
    glyph: (line: number) => `glyphMarginClick → ${line}`,
    methodIdle: 'Host methods. Click a button.',
    formatted: (lines: number) => `format() → ${lines} lines`,
    revealed: (line: number) => `revealLine(20) → visible from ${line}`,
    editorReady: 'getEditor() → editor',
    editorMissing: 'getEditor() → null',
    focusedHost: 'focus() → text area',
    blurredHost: 'blur()',
    candidates: 'Candidates: find, db.collection',
    menuIdle: 'Right-click the editor.',
    menuAt: (line: number, column: number, text: string) => {
      const clip = text.length > 24 ? `${text.slice(0, 24)}…` : text
      return clip
        ? `contextmenu → line ${line}, column ${column} · ${clip}`
        : `contextmenu → line ${line}, column ${column}`
    },
    menuSelect: (key: string) => `select → ${key}`,
    nativeOn: 'Native menu',
    hostMenu: 'Host menu',
    formatItem: 'Format',
    revealItem: 'Reveal line 1',
  },
  'zh-CN': {
    chars: (n: number) => `${n} 个字符`,
    clear: '清空',
    invalid: '把 age 改成非法值',
    restore: '恢复合法文档',
    readonly: '只读',
    disabled: '禁用',
    minimap: '缩略图',
    eventIdle: '聚焦断点槽编辑器，或点 glyph。',
    focused: 'focus',
    blurred: 'blur',
    ready: 'ready',
    glyph: (line: number) => `glyphMarginClick → ${line}`,
    methodIdle: '宿主方法。点按钮调用。',
    formatted: (lines: number) => `format() → ${lines} 行`,
    revealed: (line: number) => `revealLine(20) → 可见起点 ${line}`,
    editorReady: 'getEditor() → editor',
    editorMissing: 'getEditor() → null',
    focusedHost: 'focus() → 文本区',
    blurredHost: 'blur()',
    candidates: '候选：find、db.collection',
    menuIdle: '在编辑器里右键。',
    menuAt: (line: number, column: number, text: string) => {
      const clip = text.length > 24 ? `${text.slice(0, 24)}…` : text
      return clip
        ? `contextmenu → 第 ${line} 行，第 ${column} 列 · ${clip}`
        : `contextmenu → 第 ${line} 行，第 ${column} 列`
    },
    menuSelect: (key: string) => `select → ${key}`,
    nativeOn: '原生菜单',
    hostMenu: '宿主菜单',
    formatItem: '格式化',
    revealItem: '滚到第 1 行',
  },
})

const eventNote = computed(() => eventLog.value || copy.value.eventIdle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const menuDoc = ref('{\n  "name": "niuma-ui"\n}')
const nativeMenu = ref(false)
const menuLog = ref('')
const menuRef = ref<RsContextMenuExpose | null>(null)
const menuEditor = ref<RsMonacoEditorInstance | null>(null)
const menuNote = computed(() => menuLog.value || copy.value.menuIdle)
const menuItems = computed<RsContextMenuItem[]>(() => [
  { key: 'format', label: copy.value.formatItem },
  { key: 'reveal', label: copy.value.revealItem },
])
function minimapSample(): string {
  const lines = ['{']
  for (let index = 0; index < 28; index += 1) {
    const comma = index === 27 ? '' : ','
    lines.push(`  "field_${index + 1}": ${index + 1}${comma}`)
  }
  lines.push('}')
  return lines.join('\n')
}

const minimapDoc = ref(minimapSample())

function onEditorFocus(): void {
  eventLog.value = copy.value.focused
}

function onEditorBlur(): void {
  eventLog.value = copy.value.blurred
}

function onReady(): void {
  readyLog.value = copy.value.ready
}

function switchLang(lang: (typeof languages)[number]): void {
  activeLang.value = lang.key
  langSample.value = lang.sample
}

function breakSchema(): void {
  schemaJson.value = '{\n  "name": "Ada",\n  "age": "nope"\n}'
}

function restoreSchema(): void {
  schemaJson.value = '{\n  "name": "Ada",\n  "age": 36\n}'
}

function complete(context: MonacoCompletionContext): MonacoCompletionSnippet[] {
  if (!context.prefix.startsWith('db')) return []
  return [{ label: 'db.collection', insertText: 'db.getCollection("${1:name}")', detail: 'collection', kind: 'function' }]
}

function onGlyph(line: number): void {
  eventLog.value = copy.value.glyph(line)
}

function onEditorContextMenu(payload: RsMonacoEditorContextMenu): void {
  menuLog.value = copy.value.menuAt(payload.line, payload.column, payload.selectedText)
  if (!nativeMenu.value) menuRef.value?.open({ x: payload.x, y: payload.y })
}

function toggleNativeMenu(): void {
  nativeMenu.value = !nativeMenu.value
  if (nativeMenu.value) menuRef.value?.close()
}

function onMenuSelect(key: string): void {
  if (key === 'format') menuEditor.value?.format()
  if (key === 'reveal') menuEditor.value?.revealLine(1)
  menuLog.value = copy.value.menuSelect(key)
}

function formatDoc(): void {
  methodRef.value?.format()
  window.setTimeout(() => {
    methodLog.value = copy.value.formatted(methodDoc.value.split('\n').length)
  }, 400)
}

function reveal(): void {
  methodRef.value?.revealLine(20)
  const line = methodRef.value?.getEditor()?.getVisibleRanges()?.[0]?.startLineNumber ?? 0
  methodLog.value = copy.value.revealed(line)
}

function inspect(): void {
  methodLog.value = methodRef.value?.getEditor() ? copy.value.editorReady : copy.value.editorMissing
}

function focusEditor(): void {
  methodRef.value?.focus()
  const active = document.activeElement
  methodLog.value = active instanceof HTMLElement && active.classList.contains('inputarea')
    ? copy.value.focusedHost
    : copy.value.blurredHost
}

function blurEditor(): void {
  methodRef.value?.blur()
  methodLog.value = copy.value.blurredHost
}

const basicCode = `<RsMonacoEditor
  v-model="code"
  language="json"
  placeholder="Paste JSON"
  :height="160"
/>`

const languageCode = `<RsMonacoEditor v-model="code" :language="language" :height="140" />`

const schemaCode = `<RsMonacoEditor
  v-model="code"
  language="json"
  :height="160"
  :json-schema="schema"
/>`

const readonlyCode = `<RsMonacoEditor v-model="code" language="json" :height="120" :readonly="readonly" :disabled="disabled" />`

const minimapCodeSample = `<RsMonacoEditor v-model="code" language="json" :height="200" :minimap="true" />`

const themeCode = `<RsMonacoEditor v-model="code" language="json" theme="auto" :height="120" />`

const completeCode = `const snippets = [{ label: 'find', insertText: 'find(\${1:query})', kind: 'function' }]

function complete(context) {
  if (!context.prefix.startsWith('db')) return []
  return [{ label: 'db.collection', insertText: 'db.getCollection("\${1:name}")' }]
}

<RsMonacoEditor
  v-model="code"
  language="javascript"
  :height="120"
  :snippets="snippets"
  :completion-request="complete"
/>`

const eventsCode = `<RsMonacoEditor
  v-model="code"
  language="json"
  glyph-margin
  :debug-current-line="4"
  :debug-breakpoints="[1]"
  :height="160"
  @glyph-margin-click="onGlyph"
  @focus="onFocus"
  @blur="onBlur"
  @ready="onReady"
/>`

const contextMenuCode = `const menu = ref(null)
const nativeMenu = ref(false)
const items = [
  { key: 'format', label: 'Format' },
  { key: 'reveal', label: 'Reveal line 1' },
]

function onContextMenu(event) {
  log.value = \`contextmenu → line \${event.line}, column \${event.column}\`
  if (!nativeMenu.value) menu.value?.open({ x: event.x, y: event.y })
}

<RsButton @click="nativeMenu = !nativeMenu">Host menu</RsButton>
<p>{{ log }}</p>
<RsContextMenu ref="menu" :items="items" @select="onSelect" />
<RsMonacoEditor
  v-model="code"
  language="json"
  :height="160"
  :context-menu="nativeMenu"
  @contextmenu="onContextMenu"
/>`

const methodsCode = `const editor = ref(null)
editor.value?.format()
editor.value?.revealLine(20)
editor.value?.getEditor()
editor.value?.focus()
editor.value?.blur()`

const embeddedCode = `<div class="frame">
  <RsMonacoEditor v-model="code" language="json" embedded height="100%" />
</div>`

const radiusCode = `<RsMonacoEditor v-model="code" language="json" radius="none" :height="120" />
<RsMonacoEditor v-model="code" language="json" radius="lg" :height="120" />`

const optionsCode = `<RsMonacoEditor
  v-model="code"
  language="json"
  :height="80"
  :options="{ wordWrap: 'off' }"
/>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="绑定"
    title-en="Binding"
    description="v-model 是文档。清空后看到 placeholder，字符数跟着变。颜色走 token。"
    description-en="v-model is the document. Clear it to see the placeholder. The character count follows the text. Colors come from tokens."
    :code="basicCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="code = ''">{{ copy.clear }}</RsButton>
      <span class="note">{{ copy.chars(code.length) }}</span>
    </div>
    <RsMonacoEditor v-model="code" language="json" placeholder="Paste JSON" :height="160" />
  </DocDemo>

  <DocDemo
    id="demo-language"
    title="语言"
    title-en="Language"
    description="language 决定语法。切换会重建编辑器，光标和撤销栈不保留。SQL 方言走宿主的语言服务，这里不注册实例补全。"
    description-en="language selects the grammar. Switching recreates the editor, so the caret and undo stack reset. SQL dialects use the host language service and do not register instance completion."
    :code="languageCode"
  >
    <div class="toolbar">
      <RsButton
        v-for="lang in languages"
        :key="lang.key"
        size="sm"
        :variant="activeLang === lang.key ? 'primary' : 'ghost'"
        @click="switchLang(lang)"
      >
        {{ lang.label }}
      </RsButton>
    </div>
    <RsMonacoEditor v-model="langSample" :language="activeLang" :height="140" />
  </DocDemo>

  <DocDemo
    id="demo-schema"
    title="JSON Schema"
    title-en="JSON Schema"
    description="json-schema 只绑这个编辑器的 URI。把 age 改成字符串后，行内会出现校验提示。"
    description-en="json-schema binds this editor's URI only. Set age to a string and the line shows a validation marker."
    :code="schemaCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="breakSchema">{{ copy.invalid }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="restoreSchema">{{ copy.restore }}</RsButton>
    </div>
    <RsMonacoEditor v-model="schemaJson" language="json" :height="160" :json-schema="userSchema" />
  </DocDemo>

  <DocDemo
    id="demo-readonly"
    title="只读与禁用"
    title-en="Read-only and disabled"
    description="readonly 仍可选中，并走 Monaco 的只读提示。disabled 锁住 DOM，根节点 aria-disabled，不再弹出那条提示。"
    description-en="readonly still allows selection and uses Monaco's read-only notice. disabled locks the DOM, sets aria-disabled on the root, and skips that notice."
    :code="readonlyCode"
  >
    <div class="toolbar">
      <RsButton size="sm" :variant="readonly ? 'primary' : 'ghost'" @click="readonly = !readonly">{{ copy.readonly }}</RsButton>
      <RsButton size="sm" :variant="disabled ? 'primary' : 'ghost'" @click="disabled = !disabled">{{ copy.disabled }}</RsButton>
    </div>
    <RsMonacoEditor v-model="locked" language="json" :height="120" :readonly="readonly" :disabled="disabled" />
  </DocDemo>

  <DocDemo
    id="demo-minimap"
    title="缩略图"
    title-en="Minimap"
    description="长文档用 minimap 在右侧画缩略图。默认关。"
    description-en="minimap draws a thumbnail for a long document. It is off by default."
    :code="minimapCodeSample"
  >
    <div class="toolbar">
      <RsButton size="sm" :variant="minimapOn ? 'primary' : 'ghost'" @click="minimapOn = !minimapOn">{{ copy.minimap }}</RsButton>
    </div>
    <RsMonacoEditor v-model="minimapDoc" language="json" :height="200" :minimap="minimapOn" />
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题"
    title-en="Theme"
    description="theme=auto 跟文档根上的 data-rs-theme。用页头切换明暗即可。Monaco 的主题是进程级的，不要在同一页再挂一个相反的 theme。"
    description-en="theme=auto follows data-rs-theme on the document root. Use the header theme toggle. Monaco's theme is process-global, so do not mount an opposing theme on the same page."
    :code="themeCode"
  >
    <RsMonacoEditor v-model="code" language="json" theme="auto" :height="120" />
  </DocDemo>

  <DocDemo
    id="demo-complete"
    title="补全"
    title-en="Completion"
    description="snippets 与 completionRequest 合并。在 db. 后按 Ctrl+Space（macOS 为 ⌃Space）。候选写在下面，不依赖弹层是否打开。"
    description-en="snippets merge with completionRequest. After db. press Ctrl+Space (⌃Space on macOS). The candidates are listed here so they do not depend on the popup."
    :code="completeCode"
  >
    <p class="note">{{ copy.candidates }}</p>
    <RsMonacoEditor
      v-model="script"
      language="javascript"
      :height="120"
      :snippets="snippets"
      :completion-request="complete"
    />
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="点行号左侧的槽发 glyphMarginClick。焦点进出文本区发 focus / blur。创建完成发 ready。"
    description-en="Click the gutter beside the line numbers for glyphMarginClick. Entering and leaving the text area emits focus and blur. ready fires when the editor is created."
    :code="eventsCode"
  >
    <p class="note">{{ eventNote }} <span v-if="readyLog">· {{ readyLog }}</span></p>
    <RsMonacoEditor
      ref="editorRef"
      v-model="glyphDoc"
      language="json"
      glyph-margin
      :debug-current-line="4"
      :debug-breakpoints="[1]"
      :height="160"
      @glyph-margin-click="onGlyph"
      @focus="onEditorFocus"
      @blur="onEditorBlur"
      @ready="onReady"
    />
  </DocDemo>

  <DocDemo
    id="demo-contextmenu"
    title="右键"
    title-en="Context menu"
    description="默认关掉原生菜单。右键后下面出现行和列，并在指针处打开宿主菜单。点「原生菜单」改回 Monaco 的剪切、复制、粘贴。"
    description-en="The native menu starts off. A right-click prints the line and column, then opens the host menu at the pointer. Native menu switches back to Monaco’s Cut, Copy, and Paste."
    :code="contextMenuCode"
  >
    <div class="toolbar">
      <RsButton size="sm" :variant="nativeMenu ? 'primary' : 'ghost'" @click="toggleNativeMenu">
        {{ nativeMenu ? copy.nativeOn : copy.hostMenu }}
      </RsButton>
    </div>
    <p class="note">{{ menuNote }}</p>
    <RsContextMenu ref="menuRef" :items="menuItems" @select="onMenuSelect" />
    <RsMonacoEditor
      ref="menuEditor"
      v-model="menuDoc"
      language="json"
      :height="160"
      :context-menu="nativeMenu"
      @contextmenu="onEditorContextMenu"
    />
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 用 RsMonacoEditorInstance。format、revealLine、getEditor、focus、blur 都能点出结果。"
    description-en="Type the template ref as RsMonacoEditorInstance. format, revealLine, getEditor, focus, and blur each show a result."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="formatDoc">format()</RsButton>
      <RsButton size="sm" variant="ghost" @click="reveal">revealLine(20)</RsButton>
      <RsButton size="sm" variant="ghost" @click="inspect">getEditor()</RsButton>
      <RsButton size="sm" variant="ghost" @click="focusEditor">focus()</RsButton>
      <RsButton size="sm" variant="ghost" @click="blurEditor">blur()</RsButton>
    </div>
    <p class="note">{{ methodNote }}</p>
    <RsMonacoEditor ref="methodRef" v-model="methodDoc" language="json" :height="180" />
  </DocDemo>

  <DocDemo
    id="demo-embedded"
    title="嵌入"
    title-en="Embedded"
    description="embedded 去掉自己的边框和底色，圆角跟父级面板，画布裁在圆角里。父级要有高度。"
    description-en="embedded drops its own border and fill, follows the parent radius, and clips the canvas to that curve. The parent needs a height."
    :code="embeddedCode"
  >
    <div class="embed">
      <RsMonacoEditor v-model="embedDoc" language="json" embedded height="100%" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radius"
    title="圆角"
    title-en="Radius"
    description="radius 写入外框。默认 md。none 是直角，lg 更圆。画布裁进圆角，不会露出方角。"
    description-en="radius sets the frame. The default is md. none is square and lg is rounder. The canvas is clipped to the curve."
    :code="radiusCode"
  >
    <div class="pair">
      <div>
        <p class="note">none</p>
        <RsMonacoEditor v-model="radiusDoc" language="json" radius="none" :height="120" />
      </div>
      <div>
        <p class="note">lg</p>
        <RsMonacoEditor v-model="radiusDoc" language="json" radius="lg" :height="120" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-options"
    title="构造选项"
    title-en="Options"
    description="options 浅合并进 Monaco。wordWrap 默认开；关掉后长行出现横向滚动。对象请定义在 script 里，不要在模板里每次新建。"
    description-en="options shallow-merges into Monaco. wordWrap is on by default; turning it off shows a horizontal scrollbar. Define the object in script, not as a fresh template literal."
    :code="optionsCode"
  >
    <RsMonacoEditor v-model="wrapDoc" language="json" :height="80" :options="wrapOptions" />
  </DocDemo>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-sm);
}

.note {
  margin: 0 0 var(--rs-space-sm);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.embed {
  display: flex;
  flex-direction: column;
  block-size: 10rem;
  overflow: hidden;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-surface);
}

.pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--rs-space-md);
}
</style>
