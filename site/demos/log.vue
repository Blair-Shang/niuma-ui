<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsLog, type RsLogExpose, type RsLogLine } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const structured: RsLogLine[] = [
  { id: '1', time: '2026-09-22T04:00:01Z', level: 'info', text: 'sync workspace sources' },
  { id: '2', time: '2026-09-22T04:00:03Z', level: 'success', text: 'build ok: niuma-ui' },
  { id: '3', time: '2026-09-22T04:00:04Z', level: 'warn', text: 'skip tests' },
  { id: '4', time: '2026-09-22T04:00:05Z', level: 'error', text: 'ftp_push failed: connection refused' },
]

const inferred = '[INFO] start\nBUILD SUCCESS\n[WARN] skip tests\nfailed to start'
const marked = '制品上传成功\n构建失败：timeout'

const followLines = ref<RsLogLine[]>([
  { id: 'f1', level: 'info', text: 'job started' },
  { id: 'f2', level: 'info', text: 'pull image' },
])
let followSeq = 2

const overflowLines = ref('one\ntwo')
const methodLines = ref('alpha\nbeta\ngamma')
const logRef = ref<RsLogExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    copyIdle: 'Copy the button, or select a few words first.',
    copied: (source: string) => `copy → ${source}`,
    followIdle: 'Append a line. Scroll up and follow pauses.',
    following: 'followChange → true',
    paused: 'followChange → false',
    append: 'Append line',
    overflowIdle: 'The next append drops the oldest line.',
    overflow: (dropped: number, kept: number) => `overflow → dropped ${dropped}, kept ${kept}`,
    push: 'Push a line',
    methodIdle: 'Host methods. Click a button.',
    appended: 'append() → one more line',
    cleared: 'clear() → empty',
    bottom: 'scrollToBottom() → following',
    top: 'scrollToTop() → paused',
    copiedAll: 'copy() → full visible text',
    copyFailed: 'copy() → failed',
    lines: (n: number) => `getLines() → ${n}`,
    focused: 'focus() → log focused',
    searchFocused: 'focusSearch() → search focused',
    toBottom: 'scrollToBottom()',
    toTop: 'scrollToTop()',
    copyAll: 'copy()',
    readLines: 'getLines()',
    focus: 'focus()',
    focusSearch: 'focusSearch()',
    clear: 'clear()',
    rtlNote: 'The toolbar follows the page. The log body stays ltr unless you set dir.',
    darkNote: 'This island is data-rs-theme=dark. Level colors follow the island.',
  },
  'zh-CN': {
    copyIdle: '点复制，或先选中几个词。',
    copied: (source: string) => `copy → ${source}`,
    followIdle: '追加一行。向上滚动后跟底会停。',
    following: 'followChange → true',
    paused: 'followChange → false',
    append: '追加一行',
    overflowIdle: '再追加一行会丢掉最旧的。',
    overflow: (dropped: number, kept: number) => `overflow → 丢掉 ${dropped}，留下 ${kept}`,
    push: '再推一行',
    methodIdle: '宿主方法。点按钮调用。',
    appended: 'append() → 多了一行',
    cleared: 'clear() → 已清空',
    bottom: 'scrollToBottom() → 正在跟底',
    top: 'scrollToTop() → 已停住',
    copiedAll: 'copy() → 已复制可见正文',
    copyFailed: 'copy() → 失败',
    lines: (n: number) => `getLines() → ${n}`,
    focused: 'focus() → 日志已聚焦',
    searchFocused: 'focusSearch() → 搜索已聚焦',
    toBottom: 'scrollToBottom()',
    toTop: 'scrollToTop()',
    copyAll: 'copy()',
    readLines: 'getLines()',
    focus: 'focus()',
    focusSearch: 'focusSearch()',
    clear: 'clear()',
    rtlNote: '工具条跟页面方向。日志正文默认 ltr，除非你自己设 dir。',
    darkNote: '这一岛是 data-rs-theme=dark。级别色跟这一岛。',
  },
})

const copyNote = ref('')
const followNote = ref('')
const overflowNote = ref('')
const methodNote = ref('')
const copyText = computed(() => copyNote.value || copy.value.copyIdle)
const followText = computed(() => followNote.value || copy.value.followIdle)
const overflowText = computed(() => overflowNote.value || copy.value.overflowIdle)
const methodText = computed(() => methodNote.value || copy.value.methodIdle)

const ansi = '\u001b[32mBUILD SUCCESS\u001b[0m\n\u001b[31m[ERROR] ftp_push failed\u001b[0m'

function onCopy(payload: { source: string }): void {
  copyNote.value = copy.value.copied(payload.source)
}

function appendFollow(): void {
  followSeq += 1
  followLines.value = [
    ...followLines.value,
    { id: `f${followSeq}`, level: followSeq % 4 === 0 ? 'warn' : 'info', text: `step ${followSeq}` },
  ]
}

function onFollow(following: boolean): void {
  followNote.value = following ? copy.value.following : copy.value.paused
}

function pushOverflow(): void {
  overflowLines.value = `${overflowLines.value}\nline ${overflowLines.value.split('\n').length + 1}`
}

function onOverflow(payload: { dropped: number; kept: number }): void {
  overflowNote.value = copy.value.overflow(payload.dropped, payload.kept)
}

function appendMethod(): void {
  logRef.value?.append({ level: 'info', text: 'appended from the host' })
  methodNote.value = copy.value.appended
}

function clearMethod(): void {
  logRef.value?.clear()
  methodNote.value = copy.value.cleared
}

function toBottom(): void {
  logRef.value?.scrollToBottom()
  methodNote.value = copy.value.bottom
}

function toTop(): void {
  logRef.value?.scrollToTop()
  methodNote.value = copy.value.top
}

async function copyMethod(): Promise<void> {
  const ok = await logRef.value?.copy()
  methodNote.value = ok ? copy.value.copiedAll : copy.value.copyFailed
}

function readLines(): void {
  methodNote.value = copy.value.lines(logRef.value?.getLines().length ?? 0)
}

function focusLog(): void {
  logRef.value?.focus()
  methodNote.value = copy.value.focused
}

function focusSearch(): void {
  logRef.value?.focusSearch()
  methodNote.value = copy.value.searchFocused
}

const basicCode = `<RsLog :lines="lines" :height="180" show-time show-line-no />`

const inferCode = `<RsLog :lines="text" :height="160" :show-search="false" />
<RsLog
  :lines="marked"
  :infer-markers="{ success: ['成功'], error: ['失败'] }"
  :height="120"
  :show-search="false"
/>`

const searchCode = `<RsLog
  v-model:search="search"
  v-model:levels="levels"
  :lines="lines"
  show-filter
  :height="180"
  @copy="onCopy"
/>`

const followCode = `<RsLog
  v-model:lines="lines"
  follow
  :height="160"
  @follow-change="onFollow"
/>
<RsButton @click="append">Append line</RsButton>`

const wrapCode = `<RsLog :lines="longLine" wrap :height="140" :show-search="false" />`

const overflowCode = `<RsLog
  v-model:lines="lines"
  :max-lines="3"
  :height="140"
  @overflow="onOverflow"
/>`

const ansiCode = `<RsLog :lines="ansi" :height="120" :show-search="false" />`

const slotCode = `<RsLog :lines="lines" :height="140" :show-search="false">
  <template #row="{ item, levelLabel }">
    <span class="rs-log-demo-row">{{ levelLabel }} · {{ item.plain }}</span>
  </template>
</RsLog>`

const methodsCode = `const logRef = ref<RsLogExpose | null>(null)

logRef.value?.append('next')
logRef.value?.scrollToBottom()
await logRef.value?.copy()
logRef.value?.getLines()`

const emptyCode = `<RsLog lines="" busy :height="140">
  <template #empty>Waiting for the job.</template>
</RsLog>`

const directionCode = `<div dir="rtl">
  <RsLog :lines="lines" :height="140" />
</div>`

const themeCode = `<div data-rs-theme="dark">
  <RsLog :lines="lines" :height="140" :show-search="false" />
</div>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="结构化行"
    title-en="Structured lines"
    description="lines 可以是 RsLogLine[]。时间能解析时按当前语言格式化。行号和级别不可选中。"
    description-en="lines can be RsLogLine[]. A parseable time formats for the active locale. Line numbers and levels are not selectable."
    :code="basicCode"
  >
    <RsLog :lines="structured" :height="180" show-time show-line-no />
  </DocDemo>

  <DocDemo
    id="demo-infer"
    title="从正文推断"
    title-en="Infer from text"
    description="字符串按行拆开。内置只认 [ERROR]、行首级别词和 BUILD SUCCESS 这类行首。产品里的「成功 / 失败」用 inferMarkers。"
    description-en="A string is split into lines. Built-in inference only reads [ERROR], a leading level word, and toolchain starts such as BUILD SUCCESS. Product words such as 成功 / 失败 go through inferMarkers."
    :code="inferCode"
  >
    <div class="stack">
      <RsLog :lines="inferred" :height="150" :show-search="false" :show-copy="false" />
      <RsLog
        :lines="marked"
        :infer-markers="{ success: ['成功'], error: ['失败'] }"
        :height="110"
        :show-search="false"
        :show-copy="false"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-search"
    title="搜索与过滤"
    title-en="Search and filter"
    description="搜索按当前语言折叠大小写，并统计匹配行。Enter / Shift+Enter 在匹配之间移动。复制成功会带上来源。"
    description-en="Search case-folds for the active locale and counts matching lines. Enter / Shift+Enter moves between matches. A successful copy reports its source."
    :code="searchCode"
  >
    <p class="note">{{ copyText }}</p>
    <RsLog :lines="structured" :height="180" show-filter @copy="onCopy" />
  </DocDemo>

  <DocDemo
    id="demo-follow"
    title="跟底"
    title-en="Follow"
    description="follow 默认开。向上滚动或框选正文后停住，并出现回到最新。再贴底会重新跟上。"
    description-en="follow defaults to on. Scrolling up or selecting text pauses it and shows Jump to latest. Sticking to the end resumes follow."
    :code="followCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="appendFollow">{{ copy.append }}</RsButton>
    </div>
    <p class="note">{{ followText }}</p>
    <RsLog v-model:lines="followLines" :height="160" :show-search="false" @follow-change="onFollow" />
  </DocDemo>

  <DocDemo
    id="demo-wrap"
    title="折行"
    title-en="Wrap"
    description="wrap 让长行撑满栏宽。virtual 为 auto 时折行不再虚拟，避免把每一行拉成整栏高。"
    description-en="wrap lets a long line fill the column. With virtual auto, wrap turns virtualization off so a row is not stretched to the full height."
    :code="wrapCode"
  >
    <RsLog
      lines="[2026/9/10 17:02:58] pre-sync git (2/43): flux-collaboration-adapterexpress — waiting for the remote to finish the pack"
      wrap
      :height="140"
      :show-search="false"
      :show-copy="false"
    />
  </DocDemo>

  <DocDemo
    id="demo-overflow"
    title="保留最新"
    title-en="Keep the tail"
    description="maxLines 只留最新的几行。丢掉更早的行时发 overflow，并带上丢掉和留下的条数。"
    description-en="maxLines keeps only the newest rows. Dropping older ones emits overflow with the dropped and kept counts."
    :code="overflowCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="pushOverflow">{{ copy.push }}</RsButton>
    </div>
    <p class="note">{{ overflowText }}</p>
    <RsLog v-model:lines="overflowLines" :max-lines="3" :height="140" :show-search="false" @overflow="onOverflow" />
  </DocDemo>

  <DocDemo
    id="demo-ansi"
    title="ANSI"
    title-en="ANSI"
    description="CI 日志里的颜色转义会从展示、搜索和复制里去掉，级别仍按正文判断。源文本留在 getLines().text。"
    description-en="Color escapes in CI logs are removed from display, search, and copy. The level still comes from the text. getLines().text keeps the source."
    :code="ansiCode"
  >
    <RsLog :lines="ansi" :height="120" :show-search="false" />
  </DocDemo>

  <DocDemo
    id="demo-slot"
    title="自定义行"
    title-en="Custom row"
    description="row 插槽拿到行、级别名和搜索片段。不传时用默认正文。"
    description-en="The row slot receives the line, the level name, and the search slices. Omit it for the default text."
    :code="slotCode"
  >
    <RsLog :lines="structured" :height="160" :show-search="false" :show-copy="false">
      <template #row="{ item, levelLabel }">
        <span class="custom-row">{{ levelLabel }} · {{ item.plain }}</span>
      </template>
    </RsLog>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主用模板 ref 调用 append、clear、scrollToBottom、scrollToTop、copy、getLines、focus、focusSearch。"
    description-en="Call append, clear, scrollToBottom, scrollToTop, copy, getLines, focus, and focusSearch on the template ref."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="appendMethod">append()</RsButton>
      <RsButton size="sm" variant="ghost" @click="clearMethod">{{ copy.clear }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="toBottom">{{ copy.toBottom }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="toTop">{{ copy.toTop }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="copyMethod">{{ copy.copyAll }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="readLines">{{ copy.readLines }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="focusLog">{{ copy.focus }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="focusSearch">{{ copy.focusSearch }}</RsButton>
    </div>
    <p class="note">{{ methodText }}</p>
    <RsLog ref="logRef" v-model:lines="methodLines" :height="160" />
  </DocDemo>

  <DocDemo
    id="demo-empty"
    title="空态"
    title-en="Empty"
    description="没有可见行时用 empty 插槽。busy 把日志区标成正在忙。"
    description-en="The empty slot shows when no row is visible. busy marks the region as busy."
    :code="emptyCode"
  >
    <RsLog lines="" busy :height="140" :show-search="false" :show-copy="false">
      <template #empty>
        <p class="note">Waiting for the job.</p>
      </template>
    </RsLog>
  </DocDemo>

  <DocDemo
    id="demo-direction"
    title="书写方向"
    title-en="Direction"
    description="工具条跟外层书写方向。日志正文默认 ltr，行号不会被翻到另一侧。"
    description-en="The toolbar follows the surrounding direction. The log body defaults to ltr, so line numbers stay put."
    :code="directionCode"
  >
    <p class="note">{{ copy.rtlNote }}</p>
    <div class="rtl" dir="rtl">
      <RsLog :lines="structured" :height="150" show-line-no :show-copy="false" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="深色岛"
    title-en="Dark island"
    description="级别色和表面读 --rs-log-*。父级 data-rs-theme 会盖住这一岛，不必改 documentElement。"
    description-en="Level colors and the surface read --rs-log-*. A parent data-rs-theme restyles this island without touching documentElement."
    :code="themeCode"
  >
    <p class="note">{{ copy.darkNote }}</p>
    <div class="island" data-rs-theme="dark">
      <RsLog :lines="structured" :height="150" :show-search="false" :show-copy="false" />
    </div>
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

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.custom-row {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rtl,
.island {
  padding: var(--rs-space-sm);
  border-radius: var(--rs-radius);
}

.island {
  background: var(--rs-bg);
}
</style>
