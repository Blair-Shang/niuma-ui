<script setup lang="ts">
import { RsDivider } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage title="RsDivider" test-file="—">
    <DemoBlock title="水平">
      <div class="panel">
        <p>上方内容</p>
        <RsDivider />
        <p>下方内容</p>
      </div>
    </DemoBlock>

    <DemoBlock title="虚线与文案">
      <div class="panel">
        <RsDivider dashed />
        <RsDivider>或</RsDivider>
        <RsDivider dashed>更多选项</RsDivider>
      </div>
    </DemoBlock>

    <DemoBlock title="垂直">
      <div class="row">
        <span>左侧</span>
        <RsDivider orientation="vertical" />
        <span>中间</span>
        <RsDivider orientation="vertical" dashed />
        <span>右侧</span>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.panel p {
  margin: 0;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
}
.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2rem;
  font-size: var(--rs-font-size-sm);
}
</style>
