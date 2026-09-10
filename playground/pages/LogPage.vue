<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import {
  RS_LOG_FILTER_LEVELS,
  RsButton,
  RsLog,
  otelSeverityOf,
  syslogSeverityOf,
  type RsLogExpose,
  type RsLogLevel,
  type RsLogLine,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const typed: RsLogLine[] = [
  { time: '12:00:01', level: 'info', text: 'sync workspace sources' },
  { time: '12:00:02', level: 'debug', text: 'resolve Maven reactor order' },
  { time: '12:00:03', level: 'success', text: 'build ok: niuma-ui' },
  { time: '12:00:04', level: 'warn', text: 'skip tests (-DskipTests)' },
  { time: '12:00:05', level: 'error', text: 'ftp_push failed: connection refused' },
  { time: '12:00:06', level: 'fatal', text: 'panic: workspace missing' },
  { time: '12:00:07', text: 'plain output without a level tag' },
]

const textLog = ref(`[INFO] start auto release
[WARN] pom version already tag-SNAPSHOT
BUILD SUCCESS
[ERROR] ftp_push failed: ECONNREFUSED
[FATAL] worker aborted
制品上传成功
构建失败：connection refused
done.`)

const liveRef = ref<RsLogExpose | null>(null)
const liveLines = ref<RsLogLine[]>([{ time: now(), level: 'info', text: 'waiting for jobs…' }])
const follow = ref(true)
const wrap = ref(false)
const search = ref('')
const filterLevels = ref<RsLogLevel[]>([])
let timer = 0
let tick = 0

const wrapFillLines = `[2026/9/10 17:02:58] 预同步 Git（2/43）：flux-collaboration-adapterexpress  pull origin release/V9.0.0-P08-03 --ff-only
[INFO] clone https://git.example.com/group/very-long-repo-name-flux-collaboration-adapterexpress.git into /data/autopack/workspaces/ws-001/src/flux-collaboration-adapterexpress
[INFO] checkout release/V9.0.0-P08-03 @ 8f3a1c2
done.`

const wrapFillCode = `<div class="log-col">
  <RsLog v-model:lines="text" wrap height="100%" />
</div>`

const largeLines = ref(
  Array.from({ length: 8000 }, (_, index) => {
    const level: RsLogLevel =
      index % 23 === 0
        ? 'fatal'
        : index % 17 === 0
          ? 'error'
          : index % 11 === 0
            ? 'warn'
            : index % 5 === 0
              ? 'success'
              : 'info'
    return {
      id: index + 1,
      time: `12:${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
      level,
      text: `${level.toUpperCase()} row ${String(index + 1).padStart(4, '0')} — virtualized, only visible rows mount`,
    } satisfies RsLogLine
  }),
)

const api: DemoApiRow[] = [
  {
    name: 'v-model:lines',
    type: 'string | Array<string | RsLogLine>',
    default: "''",
    description: '日志源。字符串按行拆；对象可带 level / severity / time / id',
  },
  { name: 'text', type: 'string', description: '只读字符串源；未绑 lines 时使用' },
  { name: 'v-model:search', type: 'string', description: '过滤正文（大小写不敏感），命中处 mark 高亮。Ctrl/⌘+F 聚焦搜索' },
  { name: 'showSearch / showCopy', type: 'boolean', default: 'true', description: '工具条搜索框与复制。复制：选区 > 当前行 > 可见/匹配行。Ctrl/⌘+C' },
  { name: 'v-model:levels', type: 'RsLogLevel[]', description: '级别白名单；空数组表示不过滤' },
  { name: 'height', type: 'number | string', default: '280', description: '整框高度。数字按 px，也可传 100% / 24rem' },
  { name: 'itemSize', type: 'number', default: '24 / 48', description: '虚拟行高。0 时单行 24，折行且仍虚拟时 48' },
  { name: 'overscan', type: 'number', default: '8', description: '视口外额外渲染行数' },
  { name: 'follow', type: 'boolean', default: 'true', description: '贴底时新行自动滚到最后；上翻后暂停' },
  { name: 'wrap', type: 'boolean', default: 'false', description: '折行。默认同时关闭虚拟列表（无变高虚拟）；要虚拟请显式 virtual' },
  { name: 'virtual', type: "boolean | 'auto'", default: "'auto'", description: 'auto：折行关虚拟，单行开虚拟。折行没有变高虚拟' },
  { name: 'showTime / showLevel / showLineNo', type: 'boolean', default: 'false / true / false', description: '时间、级别文案、行号。关级别文案仍保留色条与读屏名称' },
  { name: 'inferLevel', type: 'boolean', default: 'true', description: '未写 level 时从正文推断。结构化日志请关掉以免误判' },
  { name: 'inferMarkers', type: 'RsLogInferMarkers', description: '调用方成功 / 失败等标识，在内置扫描之后匹配。拉丁词边界，中日韩按子串，也可 RegExp。多条命中取更严重档' },
  { name: 'severityScale', type: "'syslog' | 'otel' | 'auto'", default: "'auto'", description: '行上 severity 数字：0–7 当 RFC 5424，更大当 OTel' },
  { name: 'maxLines', type: 'number', description: '超出丢掉最旧行，并 emit overflow' },
  { name: 'live', type: "boolean | 'off' | 'polite' | 'assertive'", default: "'off'", description: '独立播报「新增 N 行」。默认关，避免虚拟回收刷读屏' },
  { name: 'ariaLabel / busy / dir', type: 'string / boolean / ltr|rtl|auto', description: '无障碍名称、aria-busy、方向（正文默认 LTR）' },
  { name: 'showFilter', type: 'boolean', default: 'false', description: '级别芯片过滤' },
  { name: 'zebra / emptyText / radius', type: 'boolean / string / RsRadius', description: '斑马纹、空态、圆角' },
  { name: 'followChange / overflow', type: 'event', description: '跟随状态变化；maxLines 丢行时 { dropped, kept }' },
  { name: '#toolbar / #row / #empty', type: 'slot', description: '工具条、自定义行（item / index / levelLabel / parts）、空态' },
  { name: 'append() / clear() / focus() / focusSearch()', type: 'expose', description: '追加、清空、聚焦视口 / 搜索框' },
  { name: 'copy() / copyAll()', type: 'expose', description: 'copy：选区或当前行或可见行；copyAll：当前可见（含搜索结果）' },
  { name: 'scrollToBottom() / scrollToTop()', type: 'expose', description: '滚到首尾' },
  { name: 'getLines() / getVisibleLines()', type: 'expose', description: '归一化全量 / 过滤后可见行（含 syslog / otel）' },
]

const levelCode = `<RsLog
  :lines="rows"
  :height="240"
  show-time
  aria-label="Release log"
/>`

const liveCode = `<RsLog
  ref="logRef"
  v-model:lines="lines"
  v-model:search="search"
  :height="280"
  follow
  show-search
  show-filter
  show-time
  live="off"
/>`

const largeCode = `<RsLog
  :lines="eightThousandRows"
  :height="320"
  :item-size="24"
  show-time
/>`

const mapRows = RS_LOG_FILTER_LEVELS.map((level) => ({
  level,
  syslog: syslogSeverityOf(level),
  otel: otelSeverityOf(level),
}))

function now(): string {
  return new Date().toLocaleTimeString()
}

function pushLive(level: RsLogLine['level'], text: string): void {
  liveLines.value = [...liveLines.value, { time: now(), level, text }]
}

function startLive(): void {
  if (timer) return
  timer = window.setInterval(() => {
    tick += 1
    const kind: RsLogLevel =
      tick % 11 === 0 ? 'fatal' : tick % 9 === 0 ? 'error' : tick % 6 === 0 ? 'warn' : tick % 4 === 0 ? 'success' : 'info'
    pushLive(kind, `tick ${tick} — ${kind} from polling job log`)
  }, 600)
}

function stopLive(): void {
  if (!timer) return
  window.clearInterval(timer)
  timer = 0
}

onUnmounted(stopLive)
</script>

<template>
  <DemoPage title="RsLog" test-file="RsLog.spec.ts / RsLog.a11y.spec.ts" :api="api">
    <DemoBlock title="语义色、色条与读屏名称" :code="levelCode">
      <p class="hint">
        只追加的日志查看器，不是终端。级别不只靠颜色：左侧色条始终在；<code>showLevel</code> 控制可见文案，关闭时仍有
        <code>aria-label</code> 与读屏隐藏文本。默认带搜索和复制：<kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>F</kbd> 过滤，
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>C</kbd> 复制选区 / 当前行 / 匹配行。键盘漫游：↑↓ / Home / End / PgUp / PgDn。
        <code>RsTerminal</code> 管 PTY，作业 / 发版日志用这个。
      </p>
      <RsLog :lines="typed" :height="260" show-time show-line-no aria-label="级别示例" />
    </DemoBlock>

    <DemoBlock title="字符串源 + 级别推断">
      <p class="hint">
        内置只扫 <code>[ERROR]</code> / 行首 <code>ERROR:</code> / <code>BUILD SUCCESS</code>。
        产品文案传入 <code>inferMarkers</code>（如 <code>成功</code> / <code>失败</code>），或写
        <code>level</code> / RFC 5424 · OTel <code>severity</code>。
      </p>
      <RsLog
        v-model:lines="textLog"
        :height="200"
        :infer-markers="{ success: ['成功'], error: ['失败'] }"
      />
    </DemoBlock>

    <DemoBlock title="搜索、过滤、跟尾" :code="liveCode">
      <p class="hint">
        <code>append</code> 往流上加行。<code>live</code> 默认 <code>off</code>，避免虚拟列表回收刷读屏；需要时可
        <code>live="polite"</code> 只播「新增 N 行」。<code>wrap</code> 默认关掉虚拟（无变高虚拟）。
      </p>
      <div class="actions">
        <RsButton size="sm" @click="startLive">模拟轮询</RsButton>
        <RsButton size="sm" variant="default" @click="stopLive">停止</RsButton>
        <RsButton size="sm" variant="default" @click="pushLive('success', 'manual append: build ok')">追加成功</RsButton>
        <RsButton size="sm" variant="default" @click="pushLive('error', 'manual append: push failed')">追加失败</RsButton>
        <RsButton size="sm" variant="ghost" @click="liveRef?.clear()">清空</RsButton>
        <RsButton size="sm" variant="ghost" @click="follow = !follow">{{ follow ? '关闭跟尾' : '开启跟尾' }}</RsButton>
        <RsButton size="sm" variant="ghost" @click="wrap = !wrap">{{ wrap ? '单行省略' : '折行' }}</RsButton>
        <RsButton size="sm" variant="ghost" @click="void liveRef?.copy()">复制</RsButton>
        <RsButton size="sm" variant="ghost" @click="liveRef?.focus()">聚焦视口</RsButton>
      </div>
      <RsLog
        ref="liveRef"
        v-model:lines="liveLines"
        v-model:search="search"
        v-model:levels="filterLevels"
        :height="260"
        :follow="follow"
        :wrap="wrap"
        show-search
        show-filter
        show-time
      />
      <p class="meta">当前 {{ liveLines.length }} 行，可见 {{ liveRef?.getVisibleLines().length ?? liveLines.length }} 行</p>
    </DemoBlock>

    <DemoBlock title="折行（撑满栏，对齐作业/发版日志）" :code="wrapFillCode">
      <p class="hint">
        自动构建 / 发版右侧日志是 <code>wrap</code> + <code>height="100%"</code>。
        折行行高必须跟正文走，不能 <code>min-height: 100%</code>，否则会出现整栏空白、字挤在底部。
        几何回归：Playground <code>/#/visual/rs-log</code>（不进侧栏），<code>pnpm test:visual</code>。
      </p>
      <div class="wrap-fill">
        <RsLog
          :lines="wrapFillLines"
          wrap
          height="100%"
          :show-search="false"
          aria-label="折行撑满示例"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="大数据虚拟滚动" :code="largeCode">
      <p class="hint">8000 行只渲染可视区 + <code>overscan</code>。不要用 <code>RsTextarea</code> 或整段 <code>pre</code>。</p>
      <RsLog :lines="largeLines" :height="320" :item-size="24" show-time />
      <p class="meta">共 <code>{{ largeLines.length }}</code> 行</p>
    </DemoBlock>

    <DemoBlock title="RFC 5424 / OpenTelemetry 映射">
      <p class="hint">
        <code>success</code> 是 UI 结果，syslog / OTel 按 info 档。<code>plain</code> 无数字。行对象可写
        <code>severity: 3</code>（syslog error）或 <code>17</code>（OTel error）。
      </p>
      <table class="map">
        <thead>
          <tr>
            <th>level</th>
            <th>syslog</th>
            <th>otel</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in mapRows" :key="row.level">
            <td><code>{{ row.level }}</code></td>
            <td>{{ row.syslog }}</td>
            <td>{{ row.otel }}</td>
          </tr>
        </tbody>
      </table>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--rs-text-muted, #64748b);
}
.wrap-fill {
  width: min(100%, 22rem);
  height: 22rem;
  display: flex;
  flex-direction: column;
}
.wrap-fill :deep(.rs-log) {
  flex: 1;
  min-height: 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
}
.meta {
  margin: 0.55rem 0 0;
  font-size: 0.78rem;
  color: var(--rs-text-muted, #64748b);
}
.map {
  width: 100%;
  max-width: 28rem;
  border-collapse: collapse;
  font-size: 0.86rem;
}
.map th,
.map td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--rs-border-subtle);
  text-align: left;
}
</style>
