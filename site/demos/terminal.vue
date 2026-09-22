<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RsButton, RsTerminal, type RsTerminalExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const basicRef = ref<RsTerminalExpose | null>(null)
const readonlyRef = ref<RsTerminalExpose | null>(null)
const overlayRef = ref<RsTerminalExpose | null>(null)
const searchRef = ref<RsTerminalExpose | null>(null)
const menuRef = ref<RsTerminalExpose | null>(null)
const sessionRef = ref<RsTerminalExpose | null>(null)
const methodRef = ref<RsTerminalExpose | null>(null)
const themeRef = ref<RsTerminalExpose | null>(null)
const directionRef = ref<RsTerminalExpose | null>(null)

const loading = ref(true)
const overlay = ref('Connecting…')
const dataNote = ref('')
const resizeNote = ref('')
const menuNote = ref('')
const sessionNote = ref('')
const methodNote = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    dataIdle: 'Type in the terminal. Enter starts a new prompt.',
    data: (value: string) => `data → ${value}`,
    resize: (cols: number, rows: number) => `resize → ${cols}×${rows}`,
    menuIdle: 'Right-click, then choose Ask AI or Open docs.',
    ask: (text: string) => `askAi → ${text || '(empty)'}`,
    extra: (key: string) => `extraSelect → ${key}`,
    sessionIdle: 'The title comes from OSC. Ring bell emits bell. Click the URL.',
    title: (title: string) => `titleChange → ${title}`,
    bell: 'bell',
    link: (url: string) => `link → ${url}`,
    ring: 'Ring bell',
    methodIdle: 'Host methods. Click a button.',
    wrote: 'write() → prompt',
    cleared: 'clear()',
    fitted: 'fit()',
    focused: 'focus()',
    geometry: (text: string) => `getGeometry() → ${text}`,
    copied: 'copySelection()',
    write: 'write()',
    clear: 'clear()',
    fit: 'fit()',
    focus: 'focus()',
    geometryBtn: 'getGeometry()',
    copyBtn: 'copySelection()',
    reconnect: 'Reconnect',
    reconnected: 'overlay cleared',
    rtlNote: 'The page is rtl. The terminal stays ltr so columns do not flip.',
    darkNote: 'This island is data-rs-theme=dark. The palette follows the island.',
  },
  'zh-CN': {
    dataIdle: '在终端里打字。回车换一个提示符。',
    data: (value: string) => `data → ${value}`,
    resize: (cols: number, rows: number) => `resize → ${cols}×${rows}`,
    menuIdle: '右键，再点询问 AI 或打开文档。',
    ask: (text: string) => `askAi → ${text || '（空）'}`,
    extra: (key: string) => `extraSelect → ${key}`,
    sessionIdle: '标题来自 OSC。响铃会发 bell。点链接。',
    title: (title: string) => `titleChange → ${title}`,
    bell: 'bell',
    link: (url: string) => `link → ${url}`,
    ring: '响铃',
    methodIdle: '宿主方法。点按钮调用。',
    wrote: 'write() → 提示符',
    cleared: 'clear()',
    fitted: 'fit()',
    focused: 'focus()',
    geometry: (text: string) => `getGeometry() → ${text}`,
    copied: 'copySelection()',
    write: 'write()',
    clear: 'clear()',
    fit: 'fit()',
    focus: 'focus()',
    geometryBtn: 'getGeometry()',
    copyBtn: 'copySelection()',
    reconnect: '重新连接',
    reconnected: '遮罩已去掉',
    rtlNote: '这一段页面是 rtl。终端保持 ltr，列不会被翻过去。',
    darkNote: '这一岛是 data-rs-theme=dark。调色板跟这一岛。',
  },
})

const dataText = computed(() => dataNote.value || copy.value.dataIdle)
const menuText = computed(() => menuNote.value || copy.value.menuIdle)
const sessionText = computed(() => sessionNote.value || copy.value.sessionIdle)
const methodText = computed(() => methodNote.value || copy.value.methodIdle)

function echo(target: RsTerminalExpose | null, data: string): void {
  if (data === '\r') {
    target?.write('\r\n$ ')
    return
  }
  if (data === '\u007f') {
    target?.write('\b \b')
    return
  }
  target?.write(data)
}

function onBasicData(data: string): void {
  dataNote.value = copy.value.data(JSON.stringify(data))
  echo(basicRef.value, data)
}

function onBasicResize(payload: { cols: number; rows: number }): void {
  resizeNote.value = copy.value.resize(payload.cols, payload.rows)
}

function reconnect(): void {
  loading.value = false
  overlay.value = ''
  overlayRef.value?.write('\x1b[32mconnected\x1b[0m\r\n$ ')
  dataNote.value = copy.value.reconnected
}

function onAskAi(text: string): void {
  menuNote.value = copy.value.ask(text)
}

function onExtra(key: string): void {
  menuNote.value = copy.value.extra(key)
}

function onTitle(title: string): void {
  sessionNote.value = copy.value.title(title)
}

function onBell(): void {
  sessionNote.value = copy.value.bell
}

function onLink(url: string): void {
  sessionNote.value = copy.value.link(url)
}

function ring(): void {
  sessionRef.value?.write('\x07')
}

function writePrompt(): void {
  methodRef.value?.write('\r\n$ ')
  methodNote.value = copy.value.wrote
}

function clearMethod(): void {
  methodRef.value?.clear()
  methodNote.value = copy.value.cleared
}

async function fitMethod(): Promise<void> {
  await methodRef.value?.fit()
  methodNote.value = copy.value.fitted
}

function focusMethod(): void {
  methodRef.value?.focus()
  methodNote.value = copy.value.focused
}

function readGeometry(): void {
  const geometry = methodRef.value?.getGeometry()
  methodNote.value = copy.value.geometry(geometry ? `${geometry.cols}×${geometry.rows}` : 'null')
}

async function copyMethod(): Promise<void> {
  await methodRef.value?.copySelection()
  methodNote.value = copy.value.copied
}

let loadingTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  basicRef.value?.write('\x1b[1;36mniuma-ui\x1b[0m terminal\r\n$ ')
  readonlyRef.value?.write('build ok\r\nlast line is read only\r\n')
  searchRef.value?.write('alpha\r\nbeta\r\nalpha again\r\n$ ')
  menuRef.value?.write('select this word, then right-click\r\n$ ')
  sessionRef.value?.write('\x1b]0;build\x07ready https://example.com\r\n$ ')
  methodRef.value?.write('$ ')
  themeRef.value?.write('\x1b[36mcyan\x1b[0m \x1b[33mwarn\x1b[0m \x1b[31merr\x1b[0m\r\n')
  directionRef.value?.write('columns stay left to right\r\n$ ')
  loadingTimer = setTimeout(() => {
    loading.value = false
  }, 600)
})

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
})

const basicCode = `<RsTerminal ref="term" @data="onData" @resize="onResize" />

function onData(data: string) {
  term.value?.write(data === '\\r' ? '\\r\\n$ ' : data)
}`

const readonlyCode = `<RsTerminal :input-enabled="false" cursor-style="bar" />`

const overlayCode = `<RsTerminal :loading="loading" :overlay="overlay">
  <template #overlayAction>
    <RsButton @click="reconnect">Reconnect</RsButton>
  </template>
</RsTerminal>`

const searchCode = `<RsTerminal search-enabled copy-on-select />`

const menuCode = `<RsTerminal
  show-ask-ai
  :extra-context-menu-items="[{ key: 'docs', label: 'Open docs' }]"
  @ask-ai="onAskAi"
  @extra-select="onExtra"
/>`

const sessionCode = `<RsTerminal
  @title-change="onTitle"
  @bell="onBell"
  @link="onLink"
/>

term.value?.write('\\x1b]0;build\\x07ready https://example.com\\r\\n')
term.value?.write('\\x07')`

const methodsCode = `const term = ref<RsTerminalExpose | null>(null)

term.value?.write('$ ')
term.value?.clear()
await term.value?.fit()
term.value?.focus()
term.value?.getGeometry()`

const themeCode = `<div data-rs-theme="dark">
  <RsTerminal theme-mode="auto" />
</div>`

const directionCode = `<div dir="rtl">
  <RsTerminal />
</div>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="回显"
    title-en="Echo"
    description="演示只把输入写回去。真实 PTY 把 @data 送进通道，再把字节 write() 回来。容器要有高度。"
    description-en="This demo only echoes. A real PTY sends @data into the channel and write()s bytes back. The box needs a height."
    :code="basicCode"
  >
    <p class="note">{{ dataText }}</p>
    <p v-if="resizeNote" class="note">{{ resizeNote }}</p>
    <div class="wrap">
      <RsTerminal ref="basicRef" @data="onBasicData" @resize="onBasicResize" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-readonly"
    title="只读"
    title-en="Read only"
    description="inputEnabled 关掉 stdin。还能滚动和复制。光标可以换成 bar 或 underline。"
    description-en="inputEnabled turns stdin off. Scroll and copy still work. The cursor can be bar or underline."
    :code="readonlyCode"
  >
    <div class="wrap wrap--short">
      <RsTerminal ref="readonlyRef" :input-enabled="false" cursor-style="bar" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-overlay"
    title="遮罩"
    title-en="Overlay"
    description="loading 和 overlay 盖住画面。overlayAction 里放重连，遮罩就可以点。"
    description-en="loading and overlay cover the surface. overlayAction holds reconnect, and the overlay accepts clicks."
    :code="overlayCode"
  >
    <div class="wrap wrap--short">
      <RsTerminal ref="overlayRef" :loading="loading" :overlay="overlay">
        <template #overlayAction>
          <RsButton type="button" @click="reconnect">{{ copy.reconnect }}</RsButton>
        </template>
      </RsTerminal>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-search"
    title="搜索"
    title-en="Search"
    description="searchEnabled 才加载搜索。Ctrl 或 ⌘+F 打开，Enter 下一个，Shift+Enter 上一个，Esc 关闭。copyOnSelect 在松开鼠标时复制。"
    description-en="Search loads only when searchEnabled is on. Ctrl or ⌘+F opens it, Enter finds the next match, Shift+Enter the previous, Esc closes it. copyOnSelect copies on mouseup."
    :code="searchCode"
  >
    <div class="wrap wrap--short">
      <RsTerminal ref="searchRef" search-enabled copy-on-select @data="(data) => echo(searchRef, data)" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-menu"
    title="右键"
    title-en="Context menu"
    description="内置复制、粘贴、全选和清空。showAskAi 只把选区交出来。extraContextMenuItems 的 key 不要和内置项重复。"
    description-en="Copy, paste, select all, and clear are built in. showAskAi only hands you the selection. Do not reuse a built-in key in extraContextMenuItems."
    :code="menuCode"
  >
    <p class="note">{{ menuText }}</p>
    <div class="wrap wrap--short">
      <RsTerminal
        ref="menuRef"
        show-ask-ai
        :extra-context-menu-items="[{ key: 'docs', label: 'Open docs' }]"
        @data="(data) => echo(menuRef, data)"
        @ask-ai="onAskAi"
        @extra-select="onExtra"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-session"
    title="标题、响铃与链接"
    title-en="Title, bell, and links"
    description="OSC 0 改标题。BEL 只发 bell，不发声。http(s) 和 mailto 新开标签；javascript: 被丢掉。openLinks 设为 false 时只发 link。"
    description-en="OSC 0 sets the title. BEL only emits bell. http(s) and mailto open in a new tab; javascript: is dropped. Set openLinks to false to handle link yourself."
    :code="sessionCode"
  >
    <p class="note">{{ sessionText }}</p>
    <div class="toolbar">
      <RsButton type="button" @click="ring">{{ copy.ring }}</RsButton>
    </div>
    <div class="wrap wrap--short">
      <RsTerminal
        ref="sessionRef"
        @data="(data) => echo(sessionRef, data)"
        @title-change="onTitle"
        @bell="onBell"
        @link="onLink"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主用 ref 写字节、清屏、适配、聚焦和读行列。复制没有选区时不会发 action。"
    description-en="The host uses a ref to write, clear, fit, focus, and read the geometry. copySelection does not emit action without a selection."
    :code="methodsCode"
  >
    <p class="note">{{ methodText }}</p>
    <div class="toolbar">
      <RsButton type="button" @click="writePrompt">{{ copy.write }}</RsButton>
      <RsButton type="button" @click="clearMethod">{{ copy.clear }}</RsButton>
      <RsButton type="button" @click="fitMethod">{{ copy.fit }}</RsButton>
      <RsButton type="button" @click="focusMethod">{{ copy.focus }}</RsButton>
      <RsButton type="button" @click="readGeometry">{{ copy.geometryBtn }}</RsButton>
      <RsButton type="button" @click="copyMethod">{{ copy.copyBtn }}</RsButton>
    </div>
    <div class="wrap wrap--short">
      <RsTerminal ref="methodRef" @data="(data) => echo(methodRef, data)" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题岛"
    title-en="Theme island"
    description="颜色读 --rs-terminal-*。父级 data-rs-theme 会盖住这一岛，不必改 documentElement。"
    description-en="Colors read --rs-terminal-*. A parent data-rs-theme restyles this island without touching documentElement."
    :code="themeCode"
  >
    <p class="note">{{ copy.darkNote }}</p>
    <div class="island" data-rs-theme="dark">
      <div class="wrap wrap--short">
        <RsTerminal ref="themeRef" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-direction"
    title="书写方向"
    title-en="Direction"
    description="页面可以是 rtl。终端画面保持 ltr，列从左往右。"
    description-en="The page may be rtl. The terminal surface stays ltr, so columns run left to right."
    :code="directionCode"
  >
    <p class="note">{{ copy.rtlNote }}</p>
    <div class="rtl" dir="rtl">
      <div class="wrap wrap--short">
        <RsTerminal ref="directionRef" @data="(data) => echo(directionRef, data)" />
      </div>
    </div>
  </DocDemo>
</template>

<style scoped>
.wrap {
  height: 12rem;
}

.wrap--short {
  height: 8rem;
}

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

.island {
  padding: var(--rs-space-sm);
  border-radius: var(--rs-radius-md);
  background: var(--rs-terminal-shell-bg, var(--rs-surface));
}

.rtl {
  padding: var(--rs-space-sm);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-md);
}
</style>
