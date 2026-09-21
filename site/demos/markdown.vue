<script setup lang="ts">
import { ref } from 'vue'
import { RsMarkdown, type RsMarkdownMode } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const source = ref('## 发布说明\n\n- 支持应用内更新\n- 修复启动闪退\n')
const mode = ref<RsMarkdownMode>('split')
const preview = ref('只读预览。外链会新开标签并经过消毒。')
</script>

<template>
  <DocDemo
    id="demo-split"
    title="分栏撰写"
    description="v-model 绑定源码，v-model:mode 切换 edit / preview / split。"
  >
    <RsMarkdown v-model="source" v-model:mode="mode" :height="200" />
  </DocDemo>

  <DocDemo id="demo-readonly" title="只读预览" description="readonly 强制预览并隐藏模式切换。">
    <RsMarkdown v-model="preview" readonly :height="120" />
  </DocDemo>
</template>
