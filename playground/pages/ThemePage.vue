<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsBadge, RsButton, useRsConfig } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const { theme, locale, t } = useRsConfig()

const brandActive = ref(false)

const brandLabel = computed(() =>
  brandActive.value ? '品牌紫（CSS 覆盖）' : '公共 preset（国际 SaaS）',
)

// 相对路径拆开拼接，避免依赖扫描把示例 import 当真实模块
const integrationExample = [
  '// main.ts — 顺序：先公共，后业务',
  "import 'niuma-ui/styles.css'",
  'import ' + "'./" + "theme/brand.css'",
  '',
  '// theme/brand.css',
  "[data-rs-theme='light'] {",
  '  --rs-primary: #6366f1;',
  '  --rs-primary-hover: #4f46e5;',
  '}',
  "[data-rs-theme='dark'] {",
  '  --rs-primary: #818cf8;',
  '  --rs-primary-hover: #a5b4fc;',
  '}',
  '',
  '// App.vue — JS 只负责切换明暗',
  '<RsConfigProvider theme="dark">',
  '  <App />',
  '</RsConfigProvider>',
].join('\n')

function toggleBrand() {
  brandActive.value = !brandActive.value
  if (brandActive.value) {
    document.documentElement.setAttribute('data-rs-brand', 'indigo')
  } else {
    document.documentElement.removeAttribute('data-rs-brand')
  }
}
</script>

<template>
  <DemoPage title="主题 / 多语言" test-file="RsConfigProvider">
    <DemoBlock title="当前配置">
      <p>主题：<RsBadge variant="primary">{{ theme }}</RsBadge></p>
      <p>色板：<RsBadge variant="info">{{ brandLabel }}</RsBadge></p>
      <p>语言：<RsBadge>{{ locale }}</RsBadge></p>
      <p>文案示例 select.placeholder：{{ t('select.placeholder') }}</p>
    </DemoBlock>

    <DemoBlock title="CSS 覆盖公共主题">
      <p class="text">
        色值定义在 <code>styles.css</code>；业务在<strong>之后</strong>加载自己的 CSS，
        重写 <code>--rs-*</code> 即可。JS 的 <code>setTheme</code> 只切换
        <code>data-rs-theme</code>。
      </p>
      <div class="row">
        <RsButton @click="toggleBrand">
          {{ brandActive ? '恢复公共 preset' : '切换为品牌紫' }}
        </RsButton>
        <RsButton variant="default">default 按钮</RsButton>
        <RsButton variant="ghost">ghost 按钮</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="排版阶梯 / 文字语义">
      <p class="text">
        字号 <code>--rs-font-size-*</code>、字重 <code>--rs-font-weight-*</code>、
        文字色 <code>--rs-text-primary|secondary|tertiary|disabled|link</code>。
      </p>
      <div class="type-scale">
        <div class="type-row type-3xl">Display 3xl · 展示标题</div>
        <div class="type-row type-2xl">Heading 2xl · 页面标题</div>
        <div class="type-row type-xl">Title xl · 区块标题</div>
        <div class="type-row type-lg">Emphasized lg · 强调正文</div>
        <div class="type-row type-base">Body base · 默认正文</div>
        <div class="type-row type-sm">Secondary sm · 次要说明</div>
        <div class="type-row type-xs">Caption xs · 辅助信息</div>
      </div>
      <div class="text-roles">
        <span class="role-primary">primary</span>
        <span class="role-secondary">secondary</span>
        <span class="role-tertiary">tertiary</span>
        <span class="role-disabled">disabled</span>
        <a class="role-link" href="#typography">link</a>
      </div>
    </DemoBlock>

    <DemoBlock title="接入方式">
      <pre class="code-block">{{ integrationExample }}</pre>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.text {
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-relaxed);
  margin: 0 0 0.75rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.type-scale {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.type-row {
  color: var(--rs-text-primary);
  font-family: var(--rs-font-sans);
  line-height: var(--rs-line-height-tight);
}
.type-3xl {
  font-size: var(--rs-font-size-3xl);
  font-weight: var(--rs-font-weight-bold);
}
.type-2xl {
  font-size: var(--rs-font-size-2xl);
  font-weight: var(--rs-font-weight-semibold);
}
.type-xl {
  font-size: var(--rs-font-size-xl);
  font-weight: var(--rs-font-weight-semibold);
}
.type-lg {
  font-size: var(--rs-font-size-lg);
  font-weight: var(--rs-font-weight-medium);
}
.type-base {
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-regular);
}
.type-sm {
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text-secondary);
}
.type-xs {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-tertiary);
}
.text-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: var(--rs-font-size-sm);
}
.role-primary {
  color: var(--rs-text-primary);
}
.role-secondary {
  color: var(--rs-text-secondary);
}
.role-tertiary {
  color: var(--rs-text-tertiary);
}
.role-disabled {
  color: var(--rs-text-disabled);
}
.role-link {
  color: var(--rs-text-link);
}
code {
  color: var(--rs-primary-hover);
}
.code-block {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-hover);
  color: var(--rs-text-primary);
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}
</style>
