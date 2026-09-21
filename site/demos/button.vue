<script setup lang="ts">
import { ref } from 'vue'
import { RsButton } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const loading = ref(false)

function runLoad() {
  loading.value = true
  globalThis.setTimeout(() => {
    loading.value = false
  }, 2000)
}

const typeCode = `<RsButton variant="primary">主要</RsButton>
<RsButton variant="default">次要</RsButton>
<RsButton variant="ghost">幽灵</RsButton>
<RsButton variant="text">文字</RsButton>
<RsButton variant="link">链接</RsButton>
<RsButton disabled>禁用</RsButton>`

const toneCode = `<RsButton variant="default" tone="warning">警告</RsButton>
<RsButton variant="primary" tone="success">成功</RsButton>
<RsButton variant="ghost" tone="danger">危险</RsButton>`

const iconCode = `<RsButton icon="plus">新建</RsButton>
<RsButton icon="search" icon-only tooltip="搜索" />
<RsButton icon="folder" reveal-label>打开项目</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-type"
    title="按钮类型"
    description="主按钮用于页面最重要的操作；次按钮（default / secondary）用于取消、重置；幽灵、文字、链接用于更轻的操作。"
    :code="typeCode"
  >
    <div class="row">
      <RsButton variant="primary">主要</RsButton>
      <RsButton variant="default">次要</RsButton>
      <RsButton variant="ghost">幽灵</RsButton>
      <RsButton variant="danger">危险</RsButton>
      <RsButton variant="text">文字</RsButton>
      <RsButton variant="link">链接</RsButton>
      <RsButton disabled>禁用</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="语义色"
    description="tone 只改色相，variant 只管形态。描边警告按钮写 variant=&quot;default&quot; tone=&quot;warning&quot; 即可。"
    :code="toneCode"
  >
    <div class="row">
      <RsButton variant="default" tone="primary">primary</RsButton>
      <RsButton variant="default" tone="success">success</RsButton>
      <RsButton variant="default" tone="warning">warning</RsButton>
      <RsButton variant="default" tone="danger">danger</RsButton>
      <RsButton variant="default" tone="info">info</RsButton>
    </div>
    <div class="row">
      <RsButton variant="primary" tone="success">实心成功</RsButton>
      <RsButton variant="ghost" tone="danger">幽灵危险</RsButton>
      <RsButton variant="text" tone="info">文字信息</RsButton>
    </div>
  </DocDemo>

  <DocDemo id="demo-size" title="尺寸" description="ssm / sm / md / lg 四档，高度走 --rs-control-height-*。">
    <div class="row">
      <RsButton size="ssm">ssm</RsButton>
      <RsButton size="sm">sm</RsButton>
      <RsButton size="md">md</RsButton>
      <RsButton size="lg">lg</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-icon"
    title="图标按钮"
    description="仅图标必须提供 tooltip 或 aria-label。reveal-label 适合工具栏：默认收起文字，悬停展开。"
    :code="iconCode"
  >
    <div class="row">
      <RsButton icon="plus">新建对话</RsButton>
      <RsButton icon="refresh-cw" variant="default">刷新</RsButton>
      <RsButton icon="search" icon-only tooltip="搜索" />
      <RsButton icon="settings" icon-only tooltip="设置" variant="ghost" />
      <RsButton icon="folder" reveal-label variant="default">打开项目</RsButton>
    </div>
  </DocDemo>

  <DocDemo id="demo-loading" title="加载中" description="loading 期间保持旋转，并禁止重复点击。不要另外加 disabled。">
    <div class="row">
      <RsButton :loading="loading" @click="runLoad">保存</RsButton>
      <RsButton variant="default" :loading="true">提交中</RsButton>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.row + .row {
  margin-top: 0.75rem;
}
</style>
