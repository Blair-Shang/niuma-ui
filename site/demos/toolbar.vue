<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsIcon, RsToolbar } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const running = ref(false)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="查询顶栏"
    description="仅布局壳：#left / #center / #right。业务按钮自行放入。elevated 加底部分隔。"
  >
    <div class="frame">
      <RsToolbar label="查询工具栏" elevated>
        <template #left>
          <RsIcon name="database" :size="15" />
          <span class="id">prod / orders</span>
        </template>
        <template #right>
          <RsButton variant="ghost" size="sm">格式化</RsButton>
          <RsButton variant="primary" size="sm" @click="running = !running">
            {{ running ? '取消' : '运行' }}
          </RsButton>
        </template>
      </RsToolbar>
      <div class="body">结果区</div>
    </div>
  </DocDemo>
</template>

<style scoped>
.frame {
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}
.id {
  font-size: var(--rs-font-size-sm);
}
.body {
  padding: 1.25rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
