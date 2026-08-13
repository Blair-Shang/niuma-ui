<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsDrawer, type RsDrawerCloseReason } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const basicOpen = ref(false)
const descOpen = ref(false)

const sideOpen = ref(false)
const sidePreset = ref<'left' | 'right' | 'top' | 'bottom'>('right')

const sizeOpen = ref(false)
const sizePreset = ref<'sm' | 'md' | 'lg' | 'full'>('md')

const customWidthOpen = ref(false)
const customHeightOpen = ref(false)

const footerOpen = ref(false)

const overlayCloseOpen = ref(false)
const noOverlayCloseOpen = ref(false)
const noOverlayOpen = ref(false)
const noCloseOpen = ref(false)
const noEscOpen = ref(false)

const modalMatrixOpen = ref(false)
const modalMatrix = ref<{
  modal?: boolean
  showOverlay: boolean
  closeOnOverlayClick: boolean
  label: string
}>({
  showOverlay: true,
  closeOnOverlayClick: true,
  label: '默认：有遮罩 + 可点外关（modal 跟随遮罩）',
})

const overlayStyleOpen = ref(false)

const beforeCloseOpen = ref(false)
const beforeCloseBlocked = ref(true)
const beforeCloseDrawerRef = ref<{
  close: (reason?: RsDrawerCloseReason) => Promise<boolean>
} | null>(null)

const lifecycleOpen = ref(false)
const lifecycleLog = ref<string[]>([])

const headerSlotOpen = ref(false)

const scopedPanel = ref<'A' | 'B'>('A')
const scopedOpenA = ref(false)
const scopedOpenB = ref(false)
const scopedMountA = 'pg-drawer-mount-a'
const scopedMountB = 'pg-drawer-mount-b'

const drawerRef = ref<{
  close: (reason?: RsDrawerCloseReason) => Promise<boolean>
  openDrawer: () => void
} | null>(null)
const exposeOpen = ref(false)

const api: DemoApiRow[] = [
  { name: 'open / v-model:open', type: 'boolean', default: 'false', description: '显隐受控' },
  { name: 'title', type: 'string', description: '标题；可用 #header 覆盖' },
  { name: 'description', type: 'string', description: '次要说明' },
  {
    name: 'side',
    type: "'left' | 'right' | 'top' | 'bottom'",
    default: "'right'",
    description: '滑出方向',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'full'",
    default: "'md'",
    description: '预设尺寸；与 width/height 同时存在时自定义优先',
  },
  { name: 'width', type: 'number | string', description: '左右抽屉自定义宽度（px / CSS）' },
  { name: 'height', type: 'number | string', description: '上下抽屉自定义高度' },
  {
    name: 'modal',
    type: 'boolean',
    default: '跟随 showOverlay',
    description: '是否锁焦点并拦截背后交互',
  },
  { name: 'showOverlay', type: 'boolean', default: 'true', description: '是否渲染遮罩' },
  { name: 'overlayOpacity', type: 'number', description: '遮罩不透明度 0–1' },
  { name: 'overlayBlur', type: 'number | string', description: '遮罩模糊' },
  {
    name: 'closeOnOverlayClick',
    type: 'boolean',
    default: 'true',
    description: '点抽屉外是否关闭（与 modal 独立）',
  },
  { name: 'closeOnEsc', type: 'boolean', default: 'true', description: 'Esc 是否关闭' },
  { name: 'showClose', type: 'boolean', default: 'true', description: '是否显示右上角关闭' },
  { name: 'teleportTo', type: 'string | HTMLElement | false', description: 'Portal 挂载目标' },
  { name: 'beforeClose', type: '(reason) => boolean | Promise', description: '返回 false 阻止关闭' },
  { name: 'openChange', type: '(open: boolean) => void', description: '显隐变化' },
  { name: 'afterOpen', type: '() => void', description: '打开动画后' },
  { name: 'afterClose', type: '(reason) => void', description: '关闭后（含 reason）' },
  { name: 'close() / openDrawer()', type: 'expose', description: '命令式关闭（走 beforeClose）/ 打开' },
]

function pushLog(line: string): void {
  lifecycleLog.value = [line, ...lifecycleLog.value].slice(0, 8)
}

function openModalMatrix(
  next: typeof modalMatrix.value,
): void {
  modalMatrix.value = next
  modalMatrixOpen.value = true
}
</script>

<template>
  <DemoPage title="RsDrawer" test-file="RsDrawer.spec.ts" :api="api">
    <DemoBlock title="右侧抽屉（默认）">
      <p class="hint">
        默认 <code>side="right"</code>、<code>size="md"</code>；通过
        <code>v-model:open</code> 控制显隐，适合筛选面板、详情侧栏。打开/关闭带四向滑入动画。
      </p>
      <RsButton @click="basicOpen = true">打开抽屉</RsButton>
      <RsDrawer v-model:open="basicOpen" title="筛选条件">
        <p class="body-text">在此放置表单、列表或操作说明，body 区域可滚动。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="标题与描述">
      <RsButton variant="default" @click="descOpen = true">成员详情</RsButton>
      <RsDrawer
        v-model:open="descOpen"
        title="Alice Chen"
        description="产品设计师 · 加入于 2024-03"
      >
        <p class="body-text">个人简介、权限与活动记录可放在 body 中。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="滑出方向 side">
      <p class="hint"><code>left</code> / <code>right</code> / <code>top</code> / <code>bottom</code> 四向侧滑。</p>
      <div class="row">
        <RsButton
          v-for="side in (['left', 'right', 'top', 'bottom'] as const)"
          :key="side"
          size="sm"
          variant="default"
          @click="sidePreset = side; sideOpen = true"
        >
          {{ side }}
        </RsButton>
      </div>
      <RsDrawer
        v-model:open="sideOpen"
        :side="sidePreset"
        :title="`side: ${sidePreset}`"
        description="观察抽屉从对应边缘滑入。"
      >
        <p class="body-text">当前方向：<code>{{ sidePreset }}</code></p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="尺寸 size">
      <p class="hint">
        水平抽屉控制宽度，垂直抽屉控制高度；<code>full</code> 占满视口对应轴向。
      </p>
      <div class="row">
        <RsButton
          v-for="size in (['sm', 'md', 'lg', 'full'] as const)"
          :key="size"
          size="sm"
          variant="default"
          @click="sizePreset = size; sizeOpen = true"
        >
          {{ size }}
        </RsButton>
      </div>
      <RsDrawer
        v-model:open="sizeOpen"
        :size="sizePreset"
        title="通知中心"
        :description="`size: ${sizePreset}`"
      >
        <p class="body-text">调整 size 观察抽屉占位变化。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="自定义 width / height">
      <p class="hint">
        <code>width</code> / <code>height</code> 支持 number(px) 或 CSS 长度，优先于
        <code>size</code> 预设。
      </p>
      <div class="row">
        <RsButton size="sm" @click="customWidthOpen = true">width: 420</RsButton>
        <RsButton size="sm" variant="default" @click="customHeightOpen = true">
          bottom · height: 40%
        </RsButton>
      </div>
      <RsDrawer
        v-model:open="customWidthOpen"
        title="自定义宽度"
        description="width = 420px"
        :width="420"
      >
        <p class="body-text">面板 CSS 变量 <code>--rs-drawer-panel-size: 420px</code>。</p>
      </RsDrawer>
      <RsDrawer
        v-model:open="customHeightOpen"
        side="bottom"
        title="自定义高度"
        description="height = 40%"
        height="40%"
      >
        <p class="body-text">底部抽屉按视口高度百分比展开。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="footer 插槽">
      <RsButton @click="footerOpen = true">编辑资料</RsButton>
      <RsDrawer v-model:open="footerOpen" title="个人资料" description="更新头像与显示名称。">
        <p class="body-text">表单字段放在 body，底部操作走 footer。</p>
        <template #footer>
          <RsButton variant="default" @click="footerOpen = false">取消</RsButton>
          <RsButton @click="footerOpen = false">保存</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="modal / overlay / 点外关闭（语义矩阵）">
      <p class="hint">
        三者解耦：<code>modal</code> 管焦点与背后交互，<code>showOverlay</code> 管遮罩视觉，
        <code>closeOnOverlayClick</code> 管点外 dismiss。未传 <code>modal</code> 时跟随
        <code>showOverlay</code>。
      </p>
      <div class="row">
        <RsButton
          size="sm"
          @click="
            openModalMatrix({
              showOverlay: true,
              closeOnOverlayClick: true,
              label: '默认：有遮罩 + 可点外关',
            })
          "
        >
          默认
        </RsButton>
        <RsButton
          size="sm"
          variant="default"
          @click="
            openModalMatrix({
              showOverlay: true,
              closeOnOverlayClick: false,
              label: '有遮罩 · 禁止点外关',
            })
          "
        >
          遮罩不可关
        </RsButton>
        <RsButton
          size="sm"
          variant="default"
          @click="
            openModalMatrix({
              modal: false,
              showOverlay: false,
              closeOnOverlayClick: false,
              label: '非模态 · 无遮罩 · 点外不关（页内嵌面板）',
            })
          "
        >
          页内嵌面板
        </RsButton>
        <RsButton
          size="sm"
          variant="default"
          @click="
            openModalMatrix({
              modal: false,
              showOverlay: false,
              closeOnOverlayClick: true,
              label: '非模态 · 无遮罩 · 点外可关',
            })
          "
        >
          无遮罩可点外关
        </RsButton>
      </div>
      <RsDrawer
        v-model:open="modalMatrixOpen"
        title="语义矩阵"
        :description="modalMatrix.label"
        :modal="modalMatrix.modal"
        :show-overlay="modalMatrix.showOverlay"
        :close-on-overlay-click="modalMatrix.closeOnOverlayClick"
      >
        <p class="body-text">
          modal=<code>{{ modalMatrix.modal ?? '(跟随 showOverlay)' }}</code>，
          showOverlay=<code>{{ modalMatrix.showOverlay }}</code>，
          closeOnOverlayClick=<code>{{ modalMatrix.closeOnOverlayClick }}</code>
        </p>
        <template #footer>
          <RsButton @click="modalMatrixOpen = false">关闭</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="点击遮罩关闭 / Esc">
      <p class="hint">
        默认 <code>close-on-overlay-click</code> 与 <code>close-on-esc</code> 均为
        <code>true</code>。
      </p>
      <div class="row">
        <RsButton variant="default" @click="overlayCloseOpen = true">默认可点遮罩关闭</RsButton>
        <RsButton variant="default" @click="noOverlayCloseOpen = true">禁止点遮罩关闭</RsButton>
        <RsButton variant="default" @click="noEscOpen = true">禁止 Esc</RsButton>
      </div>
      <RsDrawer
        v-model:open="overlayCloseOpen"
        title="快捷预览"
        description="点击遮罩即可关闭。"
      >
        <p class="body-text">适合轻量预览场景。</p>
      </RsDrawer>
      <RsDrawer
        v-model:open="noOverlayCloseOpen"
        title="未保存的更改"
        :close-on-overlay-click="false"
        description="必须明确选择操作。"
      >
        <p class="body-text">防止误触遮罩导致数据丢失。</p>
        <template #footer>
          <RsButton variant="default" @click="noOverlayCloseOpen = false">放弃</RsButton>
          <RsButton @click="noOverlayCloseOpen = false">保存并关闭</RsButton>
        </template>
      </RsDrawer>
      <RsDrawer
        v-model:open="noEscOpen"
        title="禁止 Esc 关闭"
        :close-on-esc="false"
        description="按 Esc 不会关闭。"
      >
        <p class="body-text">请用右上角或 footer 关闭。</p>
        <template #footer>
          <RsButton @click="noEscOpen = false">关闭</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="遮罩深度 overlayOpacity / overlayBlur">
      <p class="hint">覆盖主题默认遮罩；与 Dialog 同源解析，写入 <code>--rs-drawer-overlay-*</code>。</p>
      <RsButton @click="overlayStyleOpen = true">opacity 0.45 · blur 8px</RsButton>
      <RsDrawer
        v-model:open="overlayStyleOpen"
        title="加深遮罩"
        :overlay-opacity="0.45"
        :overlay-blur="8"
      >
        <p class="body-text">背后内容应更暗且略模糊。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="无遮罩 / 无关闭按钮">
      <p class="hint">
        <code>show-overlay</code> 与 <code>show-close</code> 可独立配置；关闭按钮 tooltip 随
        Playground 语言切换。
      </p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="noOverlayOpen = true">无遮罩</RsButton>
        <RsButton size="sm" variant="default" @click="noCloseOpen = true">无关闭按钮</RsButton>
      </div>
      <RsDrawer v-model:open="noOverlayOpen" title="嵌入式面板" :show-overlay="false">
        <p class="body-text">背景页面仍可交互，适合分栏内嵌场景。</p>
        <template #footer>
          <RsButton @click="noOverlayOpen = false">完成</RsButton>
        </template>
      </RsDrawer>
      <RsDrawer v-model:open="noCloseOpen" title="引导流程" :show-close="false">
        <p class="body-text">用户需完成步骤后通过 footer 关闭。</p>
        <template #footer>
          <RsButton @click="noCloseOpen = false">下一步</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="beforeClose 拦截关闭">
      <p class="hint">
        返回 <code>false</code> 阻止关闭（支持 async）。关闭按钮、Esc、点外、expose.close 均走同一路径。
      </p>
      <RsButton @click="beforeCloseOpen = true">打开（可拦截）</RsButton>
      <RsDrawer
        ref="beforeCloseDrawerRef"
        v-model:open="beforeCloseOpen"
        title="关闭拦截"
        description="勾选后无法关闭。"
        :before-close="() => !beforeCloseBlocked"
        :close-on-overlay-click="false"
      >
        <label class="row check">
          <input v-model="beforeCloseBlocked" type="checkbox" />
          阻止关闭（勾选时 beforeClose 返回 false）
        </label>
        <template #footer>
          <RsButton @click="beforeCloseDrawerRef?.close('close')">尝试关闭</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="生命周期 afterOpen / afterClose">
      <p class="hint">
        <code>afterOpen</code> 略晚于滑入动画；<code>afterClose</code> 带
        <code>reason</code>（close / overlay / escape / programmatic…）。
      </p>
      <div class="row">
        <RsButton @click="lifecycleOpen = true">打开并观察日志</RsButton>
        <RsButton size="sm" variant="ghost" @click="lifecycleLog = []">清空</RsButton>
      </div>
      <ul v-if="lifecycleLog.length" class="log">
        <li v-for="(line, i) in lifecycleLog" :key="i">{{ line }}</li>
      </ul>
      <RsDrawer
        v-model:open="lifecycleOpen"
        title="生命周期"
        description="关闭后查看 reason。"
        @open-change="(v) => pushLog(`openChange → ${v}`)"
        @after-open="() => pushLog('afterOpen')"
        @after-close="(reason) => pushLog(`afterClose → ${reason}`)"
      >
        <p class="body-text">试着用关闭按钮、Esc 或点遮罩关闭，对比 reason。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="expose：openDrawer / close">
      <p class="hint"><code>close()</code> 走 beforeClose；可用 ref 做命令式控制。</p>
      <div class="row">
        <RsButton size="sm" @click="drawerRef?.openDrawer()">openDrawer()</RsButton>
        <RsButton size="sm" variant="default" @click="drawerRef?.close('programmatic')">
          close('programmatic')
        </RsButton>
      </div>
      <RsDrawer ref="drawerRef" v-model:open="exposeOpen" title="命令式 API">
        <p class="body-text">通过组件实例方法打开/关闭。</p>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="自定义 header 插槽">
      <RsButton @click="headerSlotOpen = true">打开</RsButton>
      <RsDrawer v-model:open="headerSlotOpen" title="升级方案">
        <template #header>
          <div class="custom-header">
            <span class="custom-header__badge">Pro</span>
            <h3 class="custom-header__title">升级方案</h3>
            <p class="custom-header__desc">完全接管 header，适合 Tab 或步骤条。</p>
          </div>
        </template>
        <p class="body-text">使用 header 插槽时 title / description props 被插槽内容替代。</p>
        <template #footer>
          <RsButton variant="default" @click="headerSlotOpen = false">稍后再说</RsButton>
          <RsButton @click="headerSlotOpen = false">立即升级</RsButton>
        </template>
      </RsDrawer>
    </DemoBlock>

    <DemoBlock title="teleportTo 容器内挂载（多页签模拟）">
      <p class="hint">
        挂到非 body 容器时自动 <code>contained</code>（absolute），避免盖住布局顶栏。切换 A/B
        后抽屉仅在对应挂载点内。
      </p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="scopedPanel = 'A'">切到 Panel A</RsButton>
        <RsButton size="sm" variant="default" @click="scopedPanel = 'B'">切到 Panel B</RsButton>
        <span class="meta">当前：<code>{{ scopedPanel }}</code></span>
      </div>

      <section v-if="scopedPanel === 'A'" class="scoped-card">
        <header class="scoped-card__head">Panel A</header>
        <RsButton size="sm" @click="scopedOpenA = true">打开 A 抽屉</RsButton>
        <div :id="scopedMountA" class="scoped-mount" />
        <RsDrawer
          v-model:open="scopedOpenA"
          title="Panel A 抽屉"
          :teleport-to="`#${scopedMountA}`"
          :show-overlay="false"
          :modal="false"
          :close-on-overlay-click="false"
          size="sm"
        >
          <p class="body-text">挂载到 #{{ scopedMountA }}，背后仍可点切换页签。</p>
          <template #footer>
            <RsButton size="sm" @click="scopedOpenA = false">关闭</RsButton>
          </template>
        </RsDrawer>
      </section>

      <section v-else class="scoped-card">
        <header class="scoped-card__head">Panel B</header>
        <RsButton size="sm" @click="scopedOpenB = true">打开 B 抽屉</RsButton>
        <div :id="scopedMountB" class="scoped-mount" />
        <RsDrawer
          v-model:open="scopedOpenB"
          title="Panel B 抽屉"
          :teleport-to="`#${scopedMountB}`"
          :show-overlay="false"
          :modal="false"
          :close-on-overlay-click="false"
          size="sm"
        >
          <p class="body-text">挂载到 #{{ scopedMountB }}</p>
          <template #footer>
            <RsButton size="sm" @click="scopedOpenB = false">关闭</RsButton>
          </template>
        </RsDrawer>
      </section>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: var(--rs-line-height-normal);
}
.hint code {
  font-size: 0.85em;
  color: var(--rs-text);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.row.check {
  margin-bottom: 0.75rem;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
}
.body-text {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
  line-height: var(--rs-line-height-normal);
}
.meta {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.meta code {
  color: var(--rs-text);
}
.log {
  margin: 0.75rem 0 0;
  padding: 0.5rem 0.75rem;
  list-style: none;
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
  font-size: var(--rs-font-size-xs);
  font-family: ui-monospace, monospace;
  color: var(--rs-muted);
  line-height: 1.6;
}
.custom-header__badge {
  display: inline-block;
  margin-bottom: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  color: var(--rs-primary);
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
}
.custom-header__title {
  margin: 0;
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  color: var(--rs-text);
}
.custom-header__desc {
  margin: 0.25rem 0 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
}
.scoped-card {
  border: 1px dashed var(--rs-border);
  border-radius: var(--rs-radius-sm);
  padding: var(--rs-space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  min-height: 12rem;
}
.scoped-card__head {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  font-weight: 600;
}
.scoped-mount {
  position: relative;
  flex: 1;
  min-height: 8rem;
  border-radius: var(--rs-radius-sm);
  background: color-mix(in srgb, var(--rs-muted) 6%, transparent);
}
</style>
