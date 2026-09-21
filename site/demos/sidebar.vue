<script setup lang="ts">
import { ref } from 'vue'
import { RsSidebar, RsSidebarGroup, RsSidebarItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const collapsed = ref(false)
const active = ref('dashboard')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="可折叠侧栏"
    description="collapsible + v-model:collapsed。子项通过默认插槽的 collapsed 参数同步收起态。"
  >
    <div class="frame">
      <RsSidebar v-model:collapsed="collapsed" title="弱水" subtitle="控制台" collapsible>
        <template #default="{ collapsed: isCollapsed }">
          <RsSidebarGroup title="工作区" :collapsed="isCollapsed">
            <RsSidebarItem
              label="仪表盘"
              icon="layout-dashboard"
              :active="active === 'dashboard'"
              :collapsed="isCollapsed"
              @click="active = 'dashboard'"
            />
            <RsSidebarItem
              label="项目"
              icon="folder"
              :active="active === 'projects'"
              :collapsed="isCollapsed"
              @click="active = 'projects'"
            />
            <RsSidebarItem label="设置" icon="settings" :collapsed="isCollapsed" @click="active = 'settings'" />
          </RsSidebarGroup>
        </template>
      </RsSidebar>
    </div>
  </DocDemo>
</template>

<style scoped>
.frame {
  display: flex;
  min-height: 16rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}
</style>
