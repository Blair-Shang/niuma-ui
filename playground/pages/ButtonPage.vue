<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { RsButton } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const buttonApi: DemoApiRow[] = [
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'default' | 'ghost' | 'danger' | 'link' | 'text'",
    default: "'primary'",
    description: '视觉变体；secondary 等价 default（轮廓次要按钮）',
  },
  { name: 'size', type: "'ssm' | 'sm' | 'md' | 'lg'", default: "'md'", description: '控件尺寸' },
  {
    name: 'bordered',
    type: 'boolean',
    default: 'text/link 为 false，其余 true',
    description: '是否显示外边框',
  },
  { name: 'loading', type: 'boolean', default: 'false', description: '加载中，展示旋转指示并禁用点击' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '禁用' },
  { name: 'icon', type: 'string', description: '前缀图标（Lucide kebab-case）' },
  { name: 'iconOnly', type: 'boolean', default: 'false', description: '仅图标模式' },
  { name: 'tooltip', type: 'string', description: '悬浮提示文案' },
  { name: 'revealLabel', type: 'boolean', default: 'false', description: '默认收起文字，悬停展开' },
]

const variantsCode = `<RsButton>主要</RsButton>
<RsButton variant="secondary">次要</RsButton>
<RsButton variant="default">默认（同 secondary）</RsButton>
<RsButton variant="ghost">幽灵</RsButton>`

const formActionsCode = `<RsButton variant="primary">保存</RsButton>
<RsButton variant="secondary">重置</RsButton>`

const tokenOverrideCode = `/* 业务 brand.css / 局部容器覆盖即可 */
.panel-strong {
  --rs-btn-outline-border: #4b5563;
  --rs-btn-secondary-bg: #e5e7eb;
  --rs-btn-secondary-bg-hover: #ddd6fe;
  --rs-btn-secondary-bg-active: #c4b5fd;
}`

const iconCode = `<RsButton icon="plus">新建对话</RsButton>
<RsButton icon="search" icon-only tooltip="搜索" />
<RsButton icon="folder" reveal-label>打开项目</RsButton>`

const loadingShort = ref(false)
const loadingLong = ref(false)
const loadingSecondary = ref(false)
const loadingToggle = ref(false)
const elapsedMs = ref(0)
let timerId: ReturnType<typeof setInterval> | undefined

function clearTimer() {
  if (timerId !== undefined) {
    clearInterval(timerId)
    timerId = undefined
  }
}

function startLoading(target: Ref<boolean>, durationMs: number) {
  clearTimer()
  elapsedMs.value = 0
  target.value = true
  const started = performance.now()
  timerId = setInterval(() => {
    elapsedMs.value = Math.round(performance.now() - started)
  }, 100)
  globalThis.setTimeout(() => {
    target.value = false
    clearTimer()
  }, durationMs)
}

function runSecondaryLoad() {
  startLoading(loadingSecondary, 5000)
}

function runShortLoad() {
  startLoading(loadingShort, 2000)
}

function runLongLoad() {
  startLoading(loadingLong, 10000)
}
</script>

<template>
  <DemoPage title="RsButton" :api="buttonApi">
    <DemoBlock title="主次操作（表单）" :code="formActionsCode">
      <p class="hint">
        主操作 <code>primary</code>，次操作 <code>secondary</code>（= default）。切换 playground 明暗主题，确认轮廓与悬浮底色跟随
        <code>--rs-btn-*</code>。
      </p>
      <div class="row surface-panel">
        <RsButton variant="primary">保存</RsButton>
        <RsButton variant="secondary">重置</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="变体" :code="variantsCode">
      <div class="row">
        <RsButton>primary</RsButton>
        <RsButton variant="secondary">secondary</RsButton>
        <RsButton variant="default">default</RsButton>
        <RsButton variant="ghost">ghost</RsButton>
        <RsButton variant="danger">danger</RsButton>
        <RsButton variant="text">text</RsButton>
        <RsButton variant="link">link</RsButton>
        <RsButton disabled>禁用</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="白底表面 · 轮廓对比">
      <p class="hint">
        白/浅底上 secondary 必须能看清边框。默认 token：亮色
        <code>--rs-btn-outline-border: #6e6e73</code>，暗色 <code>#a3a3a3</code>。
      </p>
      <div class="compare-grid">
        <div class="surface-panel">
          <span class="label">默认 token</span>
          <RsButton variant="secondary">重置</RsButton>
        </div>
        <div class="surface-panel">
          <span class="label">bordered=false</span>
          <RsButton variant="secondary" :bordered="false">重置</RsButton>
        </div>
        <div class="surface-panel">
          <span class="label">ghost + bordered</span>
          <RsButton variant="ghost" :bordered="true">幽灵描边</RsButton>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="Token 覆盖（业务 brand / 局部容器）" :code="tokenOverrideCode">
      <p class="hint">
        无需改组件：在父级设置 <code>--rs-btn-outline-border</code> /
        <code>--rs-btn-secondary-bg(-hover|-active)</code>。左侧为默认，右侧为局部覆盖。
      </p>
      <div class="compare-grid">
        <div class="surface-panel">
          <span class="label">preset 默认</span>
          <div class="row">
            <RsButton variant="primary" size="sm">保存</RsButton>
            <RsButton variant="secondary" size="sm">重置</RsButton>
          </div>
        </div>
        <div class="surface-panel panel-token-strong">
          <span class="label">覆盖：更深描边 + 品牌悬浮</span>
          <div class="row">
            <RsButton variant="primary" size="sm">保存</RsButton>
            <RsButton variant="secondary" size="sm">重置</RsButton>
          </div>
        </div>
        <div class="surface-panel panel-token-soft">
          <span class="label">覆盖：柔和描边</span>
          <div class="row">
            <RsButton variant="secondary" size="sm">取消</RsButton>
            <RsButton variant="ghost" size="sm">更多</RsButton>
          </div>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="悬浮 / 按下（看背景是否跟主题）">
      <p class="hint">悬停应出现主色浅底（<code>--rs-btn-secondary-bg-hover</code>），明暗主题各自可读。</p>
      <div class="row surface-panel">
        <RsButton variant="secondary">悬停我</RsButton>
        <RsButton variant="secondary" size="sm">sm</RsButton>
        <RsButton variant="secondary" size="lg">lg</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="Loading 转圈（连接对话框同款）">
      <p class="hint">
        模拟 FTP「测试连接」：loading 期间转圈应持续旋转直至结束（Windows 关闭「动画效果」时亦如此）。
      </p>
      <p v-if="loadingShort || loadingLong || loadingSecondary" class="timer">
        已等待 {{ elapsedMs }} ms
      </p>
      <div class="row">
        <RsButton
          variant="secondary"
          class="test-conn-btn"
          :loading="loadingSecondary"
          @click="runSecondaryLoad"
        >
          测试连接
        </RsButton>
        <RsButton variant="default" :loading="loadingShort" @click="runShortLoad">
          短加载 2s
        </RsButton>
        <RsButton variant="primary" :loading="loadingLong" @click="runLongLoad">
          长加载 10s
        </RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="Loading 开关">
      <p class="hint">切换 loading 时不应出现 disabled 导致的动画停滞。</p>
      <div class="row">
        <RsButton variant="secondary" @click="loadingToggle = !loadingToggle">
          {{ loadingToggle ? '停止 loading' : '开始 loading' }}
        </RsButton>
        <RsButton variant="ghost" :loading="loadingToggle">保存</RsButton>
        <RsButton variant="primary" :loading="loadingToggle" icon="check">提交</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸">
      <div class="row row-align">
        <RsButton variant="secondary" size="ssm">ssm</RsButton>
        <RsButton variant="secondary" size="sm">sm</RsButton>
        <RsButton variant="secondary" size="md">md</RsButton>
        <RsButton variant="secondary" size="lg">lg</RsButton>
        <RsButton size="ssm">ssm</RsButton>
        <RsButton size="sm">sm</RsButton>
        <RsButton size="md">md</RsButton>
        <RsButton size="lg">lg</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="前缀图标 + 文字" :code="iconCode">
      <div class="row">
        <RsButton icon="plus">新建对话</RsButton>
        <RsButton icon="refresh-cw" variant="secondary">刷新</RsButton>
        <RsButton icon="search" variant="ghost">搜索</RsButton>
        <RsButton icon="settings" disabled>设置（禁用）</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="仅图标 · 悬浮 tooltip">
      <div class="row">
        <RsButton icon="plus" icon-only tooltip="新建对话" />
        <RsButton icon="refresh-cw" icon-only tooltip="刷新" variant="secondary" />
        <RsButton icon="search" icon-only tooltip="搜索" variant="ghost" />
        <RsButton icon="settings" icon-only tooltip="设置" disabled />
      </div>
    </DemoBlock>

    <DemoBlock title="图标 + 悬浮展开文字（reveal-label）">
      <div class="row">
        <RsButton icon="plus" reveal-label>新建对话</RsButton>
        <RsButton icon="folder" reveal-label variant="secondary">打开项目</RsButton>
        <RsButton icon="user" reveal-label variant="ghost">个人中心</RsButton>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.row-align {
  align-items: flex-end;
}
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: 1.5;
}
.hint code {
  font-size: 0.7rem;
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--rs-muted) 12%, transparent);
}
.timer {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--rs-primary);
}
.test-conn-btn {
  min-width: 7.5rem;
}
.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.75rem;
}
.surface-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 1rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  border: 1px dashed var(--rs-border);
}
.label {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
/* 局部 token 覆盖：演示业务 brand 写法 */
.panel-token-strong {
  --rs-btn-outline-border: #4b5563;
  --rs-btn-secondary-bg: color-mix(in srgb, var(--rs-text) 8%, var(--rs-surface));
  --rs-btn-secondary-bg-hover: var(--rs-primary-container);
  --rs-btn-secondary-bg-active: color-mix(in srgb, var(--rs-primary) 18%, var(--rs-surface-hover));
}
.panel-token-soft {
  --rs-btn-outline-border: color-mix(in srgb, var(--rs-text) 28%, transparent);
  --rs-btn-secondary-bg: transparent;
  --rs-btn-secondary-bg-hover: color-mix(in srgb, var(--rs-primary) 10%, transparent);
}
</style>
