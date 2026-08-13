<script setup lang="ts">
import { RsButton, RsCard } from 'niuma-ui'
import type { RsCardSize, RsCardVariant, RsRadius } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const macVariants: { id: RsCardVariant; label: string; hint: string }[] = [
  {
    id: 'grouped',
    label: 'grouped',
    hint: '系统设置式分组面板：header 微分层 + inset 高光，适合表单/配置区。',
  },
  {
    id: 'plain',
    label: 'plain',
    hint: '小组件/仪表盘：单表面、标题弱化，适合 KPI 与统计数字。',
  },
  {
    id: 'glass',
    label: 'glass',
    hint: 'Vibrancy 毛玻璃：强模糊 + 半透明，适合浮层或壁纸背景上。',
  },
]

const materialVariants: { id: RsCardVariant; label: string; hint: string }[] = [
  {
    id: 'outlined',
    label: 'outlined',
    hint: 'MD3 Outlined：1px 描边、无底色 header，后台信息面板首选。',
  },
  {
    id: 'filled',
    label: 'filled',
    hint: 'MD3 Filled：色调填充、无边框，elevated 时叠加 elevation 阴影。',
  },
]

const sizes: { id: RsCardSize; label: string; hint: string }[] = [
  { id: 'sm', label: 'sm', hint: '后台紧凑：更小 padding / 标题' },
  { id: 'md', label: 'md', hint: '默认密度：后台面板、详情块' },
  { id: 'lg', label: 'lg', hint: '前台宽松：营销面、产品介绍' },
]

const radii: { id: RsRadius; label: string }[] = [
  { id: 'none', label: 'none' },
  { id: 'sm', label: 'sm' },
  { id: 'md', label: 'md（默认）' },
  { id: 'lg', label: 'lg' },
]
</script>

<template>
  <DemoPage title="RsCard" test-file="RsCard.spec.ts">
    <DemoBlock title="场景约定：后台 vs 前台">
      <p class="hint">
        <strong>后台</strong>：CRUD 列表页通常不包 Card（Split + Search + Grid）；需要边界时用
        <code>outlined + size=md + radius=md</code>。KPI 用 <code>plain</code>。
        <br />
        <strong>前台</strong>：直接用 RsCard，<code>filled/grouped + size=lg + radius=lg</code>，需要封面时加
        <code>clip</code>。
      </p>
      <div class="preset-grid">
        <div class="preset-col">
          <p class="preset-label">后台 · 配置面板</p>
          <RsCard
            variant="outlined"
            size="md"
            radius="md"
            title="访问控制"
            description="IP / 域名 / Agent 策略"
          >
            <template #actions>
              <RsButton size="sm" variant="ghost">刷新</RsButton>
            </template>
            <p class="body-text">outlined 描边清晰，适合表格外的说明与开关组。</p>
            <template #footer>
              <RsButton size="sm" variant="ghost">取消</RsButton>
              <RsButton size="sm">保存</RsButton>
            </template>
          </RsCard>
        </div>
        <div class="preset-col">
          <p class="preset-label">后台 · KPI</p>
          <RsCard variant="plain" size="sm" radius="md" title="今日调用" elevated>
            <p class="metric">12,480</p>
            <p class="metric-hint">较昨日 +8.2%</p>
          </RsCard>
        </div>
        <div class="preset-col">
          <p class="preset-label">前台 · 产品卡</p>
          <RsCard
            variant="filled"
            size="lg"
            radius="lg"
            elevated
            hoverable
            clip
            title="边缘网关"
            description="统一接入、观测与策略下发"
          >
            <template #cover>
              <div class="cover-demo">Cover</div>
            </template>
            <p class="body-text">封面 + footer CTA，clip 保证圆角裁切封面。</p>
            <template #footer>
              <RsButton size="sm">了解更多</RsButton>
            </template>
          </RsCard>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="设计风格对比：macOS">
      <p class="hint">
        macOS 强调<strong>分层材质</strong>（grouped / glass）与<strong>内容优先</strong>（plain）。
        仪表盘数字卡推荐 <code>variant="plain"</code>，避免 header 灰底显得像工具面板。
      </p>
      <div class="style-lab style-lab--mac">
        <div v-for="item in macVariants" :key="item.id" class="style-lab__item">
          <p class="style-lab__label">{{ item.label }}</p>
          <p class="style-lab__hint">{{ item.hint }}</p>
          <RsCard :variant="item.id" :title="item.label" elevated class="card-flex">
            <p class="metric">12,480</p>
            <p class="metric-hint">较昨日 +8.2%</p>
          </RsCard>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="设计风格对比：Material 3（Google）">
      <p class="hint">
        Google Material 3 用<strong>描边 vs 填充</strong>区分层级：Outlined 靠边框、Filled 靠 surface tone；
        标题密度由 <code>size</code> 控制，圆角由 <code>radius</code> 控制。
      </p>
      <div class="style-lab style-lab--material">
        <div v-for="item in materialVariants" :key="item.id" class="style-lab__item">
          <p class="style-lab__label">{{ item.label }}</p>
          <p class="style-lab__hint">{{ item.hint }}</p>
          <RsCard
            :variant="item.id"
            :title="item.label"
            description="Material 3 card surface"
            elevated
            class="card-flex"
          >
            <p class="body-text">正文区域使用 surface 语义色，header 无 macOS 式灰底分层。</p>
          </RsCard>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="同内容 · 五风格横排">
      <div class="variant-row">
        <RsCard variant="grouped" title="grouped" elevated class="card-flex">
          <p class="metric-sm">128</p>
        </RsCard>
        <RsCard variant="plain" title="plain" elevated class="card-flex">
          <p class="metric-sm">128</p>
        </RsCard>
        <RsCard variant="outlined" title="outlined" elevated class="card-flex">
          <p class="metric-sm">128</p>
        </RsCard>
        <RsCard variant="filled" title="filled" elevated class="card-flex">
          <p class="metric-sm">128</p>
        </RsCard>
        <RsCard variant="glass" title="glass" elevated class="card-flex">
          <p class="metric-sm">128</p>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="size 密度（非控件高度）">
      <p class="hint">
        <code>size</code> 只改变 header/body/footer 的 padding 与标题字号，与 Button/Input 的
        <code>controlSize</code> 无关。
      </p>
      <div class="variant-row">
        <RsCard
          v-for="item in sizes"
          :key="item.id"
          variant="outlined"
          :size="item.id"
          :title="item.label"
          :description="item.hint"
          class="card-flex"
        >
          <p class="body-text">size="{{ item.id }}"</p>
          <template #footer>
            <RsButton size="sm" variant="ghost">操作</RsButton>
          </template>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="radius 圆角">
      <p class="hint">
        默认 <code>md</code>。卡片圆角<strong>不跟随</strong>
        <code>RsConfigProvider.controlRadius</code>，避免表单全局 sm 压扁面板。
      </p>
      <div class="variant-row">
        <RsCard
          v-for="item in radii"
          :key="item.id"
          variant="outlined"
          :radius="item.id"
          :title="item.label"
          class="card-flex"
        >
          <p class="body-text">radius="{{ item.id }}"</p>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="hoverable / elevated / clip / fill">
      <div class="feature-grid">
        <RsCard title="hoverable" hoverable variant="outlined">
          <p class="body-text">悬停抬升阴影，适合可选中卡片。</p>
        </RsCard>
        <RsCard title="elevated" elevated variant="outlined">
          <p class="body-text">常驻抬升，适合浮层感面板。</p>
        </RsCard>
        <RsCard title="clip + cover" clip variant="filled" radius="lg">
          <template #cover>
            <div class="cover-demo cover-demo--short">需 clip 裁切圆角</div>
          </template>
          <p class="body-text">默认 overflow:visible，内嵌表格更安全。</p>
        </RsCard>
        <div class="fill-stage">
          <RsCard title="fill" fill variant="outlined" :padding="false" class="fill-card">
            <div class="fill-body">height:100% + flex 伸展，适合 Pane。</div>
          </RsCard>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="毛玻璃背景预览">
      <p class="hint">将卡片置于渐变背景上，观察 <code>glass</code> 的 vibrancy 效果。</p>
      <div class="glass-stage">
        <RsCard variant="glass" title="glass · elevated" elevated>
          <template #actions>
            <RsButton size="sm" variant="ghost">详情</RsButton>
          </template>
          <p class="body-text">背景模糊 + 半透明材质，贴近 macOS Big Sur 以来的面板风格。</p>
        </RsCard>
        <RsCard variant="grouped" title="grouped · 对照" elevated>
          <p class="body-text">同背景下的实底 grouped 卡片，层次更「实」。</p>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="基础内容区">
      <p class="hint">默认 <code>variant="grouped"</code>、<code>size="md"</code>；无标题时不渲染 header。</p>
      <RsCard>
        <p class="body-text">卡片主体内容，适合承载表单、说明文字或列表。</p>
      </RsCard>
    </DemoBlock>

    <DemoBlock title="标题与描述">
      <div class="stack">
        <RsCard title="项目概览" description="查看当前工作区的运行状态与配额使用情况。">
          <p class="body-text">正文区域与 header 通过底部分割线区分。</p>
        </RsCard>
        <RsCard title="仅标题">
          <p class="body-text">未传 description 时只展示标题行。</p>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="padding 内边距">
      <div class="stack">
        <RsCard title="padding: true（默认）" variant="outlined">
          <p class="body-text">body 使用当前 size 对应的内边距。</p>
        </RsCard>
        <RsCard title="padding: false" variant="outlined" :padding="false">
          <div class="flush-content">无内边距，适合内嵌表格或全宽图表。</div>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="borderless 嵌套去框">
      <RsCard variant="outlined" title="外层面板" description="内层用 borderless 避免双边框。">
        <RsCard borderless title="内层区块" size="sm">
          <p class="body-text">嵌在已有面板里时只保留标题结构，不叠加边框阴影。</p>
        </RsCard>
      </RsCard>
    </DemoBlock>

    <DemoBlock title="actions / footer / cover / 自定义 header">
      <div class="stack">
        <RsCard title="成员管理" description="邀请协作者并分配角色。" variant="outlined">
          <template #actions>
            <RsButton size="sm" variant="ghost">导出</RsButton>
            <RsButton size="sm">邀请</RsButton>
          </template>
          <p class="body-text">header 右侧 actions，与标题同行。</p>
          <template #footer>
            <RsButton size="sm" variant="ghost">取消</RsButton>
            <RsButton size="sm">保存</RsButton>
          </template>
        </RsCard>

        <RsCard>
          <template #header>
            <div class="custom-header">
              <span class="custom-header__badge">Beta</span>
              <h3 class="custom-header__title">自定义标题区</h3>
              <p class="custom-header__desc">完全接管 header 内容，适合复杂筛选或 Tab。</p>
            </div>
          </template>
          <p class="body-text">使用 header 插槽时 title / description props 被插槽内容替代。</p>
        </RsCard>

        <RsCard title="仅 actions（无标题）" variant="outlined">
          <template #actions>
            <RsButton size="sm" variant="ghost">更多</RsButton>
          </template>
          <p class="body-text">仅有 actions 时也会渲染 header 行。</p>
        </RsCard>
      </div>
    </DemoBlock>

    <DemoBlock title="as 语义标签">
      <p class="hint">默认渲染为 <code>section</code>，可通过 <code>as</code> 改为 article 等。</p>
      <RsCard as="article" title="文章卡片" description="as=&quot;article&quot;">
        <p class="body-text">语义化标签便于无障碍与 SEO 结构。</p>
      </RsCard>
    </DemoBlock>

    <DemoBlock title="组合示例：仪表盘面板（推荐 plain）">
      <div class="dashboard">
        <RsCard variant="plain" size="sm" title="今日调用" elevated>
          <template #actions>
            <RsButton size="sm" variant="ghost">详情</RsButton>
          </template>
          <p class="metric">12,480</p>
          <p class="metric-hint">较昨日 +8.2%</p>
        </RsCard>
        <RsCard variant="plain" size="sm" title="错误率" elevated>
          <p class="metric metric--warn">0.12%</p>
          <p class="metric-hint">过去 24 小时</p>
        </RsCard>
        <RsCard variant="plain" size="sm" title="最近任务" :padding="false">
          <ul class="task-list">
            <li>索引重建 · 完成</li>
            <li>模型微调 · 进行中</li>
            <li>数据导出 · 排队中</li>
          </ul>
        </RsCard>
      </div>
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
.hint strong {
  font-weight: 600;
  color: var(--rs-text);
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.row,
.variant-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.variant-row {
  align-items: stretch;
}
.card-flex {
  flex: 1 1 10rem;
  min-width: 0;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
  align-items: start;
}
.preset-label {
  margin: 0 0 0.5rem;
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  color: var(--rs-primary);
}
.preset-col {
  min-width: 0;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.75rem;
}
.fill-stage {
  min-height: 8rem;
  border: 1px dashed var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  padding: 0.5rem;
}
.fill-card {
  height: 100%;
}
.fill-body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 5rem;
  padding: 0.75rem;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
  background: var(--rs-surface-elevated);
}
.cover-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 5.5rem;
  font-size: var(--rs-font-size-sm);
  font-weight: 600;
  color: var(--rs-primary);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--rs-primary) 22%, transparent), transparent),
    var(--rs-surface-elevated);
}
.cover-demo--short {
  height: 3.5rem;
}
.style-lab {
  display: grid;
  gap: 1rem;
}
.style-lab--mac {
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}
.style-lab--material {
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}
.style-lab__item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.style-lab__label {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  font-family: ui-monospace, monospace;
  color: var(--rs-primary);
}
.style-lab__hint {
  margin: 0 0 0.25rem;
  font-size: 0.6875rem;
  color: var(--rs-muted);
  line-height: 1.4;
}
.glass-stage {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: var(--rs-radius-lg);
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, color-mix(in srgb, var(--rs-primary) 28%, transparent), transparent),
    radial-gradient(ellipse 70% 50% at 80% 70%, color-mix(in srgb, var(--rs-success) 22%, transparent), transparent),
    linear-gradient(135deg, var(--rs-bg), var(--rs-surface-hover));
}
.body-text {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
  line-height: var(--rs-line-height-normal);
}
.flush-content {
  padding: 0.75rem 1.25rem;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
  background: var(--rs-surface-elevated);
  border-top: 1px solid var(--rs-border-subtle);
}
.custom-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.custom-header__badge {
  align-self: flex-start;
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--rs-primary);
  background: var(--rs-primary-container);
  border-radius: var(--rs-radius-sm);
}
.custom-header__title {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  font-weight: 600;
  color: var(--rs-text);
}
.custom-header__desc {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 0.75rem;
}
.metric {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--rs-text);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.metric-sm {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--rs-text);
}
.metric--warn {
  color: var(--rs-warning);
}
.metric-hint {
  margin: 0.25rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.task-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.task-list li {
  padding: 0.625rem 1.25rem;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
}
.task-list li + li {
  border-top: 1px solid var(--rs-border-subtle);
}
</style>
