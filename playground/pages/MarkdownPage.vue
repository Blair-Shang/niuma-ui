<script setup lang="ts">
import { ref } from 'vue'
import { RsMarkdown, type RsMarkdownMode } from '@ruoshui/ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const sample = `# 1.0.1 更新说明

## 新功能
- 支持应用内检查更新
- 发布渠道区分 \`stable\` / \`beta\`

## 修复
1. 修复启动闪退
2. 修复部分机器校验失败

> 安装包请从官网或客户端内下载。

\`\`\`bash
# 校验 SHA-256（PowerShell）
Get-FileHash .\\Setup.exe -Algorithm SHA256
\`\`\`

| 平台 | 架构 |
| --- | --- |
| Windows | x64 |
| macOS | arm64 |

[了解更多](https://example.com)
`

const basic = ref(sample)
const basicMode = ref<RsMarkdownMode>('edit')

const split = ref(sample)
const splitMode = ref<RsMarkdownMode>('split')

const previewOnly = ref(`## 只读预览

此模式隐藏编辑器，适合展示已发布的说明。

- GFM 列表
- **加粗** 与 \`行内代码\`
`)

const compact = ref('### 紧凑高度\n\n用于表单内嵌。')
const compactMode = ref<RsMarkdownMode>('edit')
</script>

<template>
  <DemoPage title="RsMarkdown" test-file="RsMarkdown.spec.ts">
    <DemoBlock title="编辑 / 预览 / 分栏">
      <p class="hint">
        组合 <code>RsCodeEditor</code>（Markdown 语法高亮）与消毒后的预览 HTML。通过
        <code>v-model</code> 绑定源码，<code>v-model:mode</code> 控制视图。
      </p>
      <RsMarkdown v-model="basic" v-model:mode="basicMode" :height="320" />
      <p class="meta">当前模式：{{ basicMode }} · 字符数：{{ basic.length }}</p>
    </DemoBlock>

    <DemoBlock title="默认分栏">
      <p class="hint">适合撰写发布说明：左侧改源码，右侧实时预览。</p>
      <RsMarkdown v-model="split" v-model:mode="splitMode" :height="280" />
    </DemoBlock>

    <DemoBlock title="只读预览">
      <p class="hint">
        <code>readonly</code> 强制预览并隐藏模式切换；外链在新标签打开并经过协议校验 +
        DOMPurify。
      </p>
      <RsMarkdown v-model="previewOnly" readonly :height="200" />
    </DemoBlock>

    <DemoBlock title="表单内嵌（紧凑）">
      <RsMarkdown
        v-model="compact"
        v-model:mode="compactMode"
        :height="160"
        placeholder="## 新功能&#10;- …"
      />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  line-height: 1.55;
}
.hint code {
  font-family: var(--rs-font-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 0.9em;
}
.meta {
  margin: 0.6rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}
</style>
