<script setup lang="ts">
import { ref } from 'vue'
import { RsMenu, type RsMenuItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const active = ref('projects')
const items: RsMenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      { key: 'projects', label: '项目' },
      { key: 'docs', label: '文档' },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="导航菜单"
    description="v-model 绑定叶子 key。带子级时点击父项展开。侧栏导航用 Sidebar。"
  >
    <div class="frame">
      <RsMenu v-model="active" :items="items" />
    </div>
  </DocDemo>
</template>

<style scoped>
.frame {
  max-width: 14rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  padding: 0.35rem;
}
</style>
