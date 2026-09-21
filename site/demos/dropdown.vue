<script setup lang="ts">
import { ref } from 'vue'
import { RsDropdown, type RsDropdownItem, type RsDropdownItemGroup } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const scene = ref('chat')
const items: RsDropdownItem[] = [
  { label: '对话', value: 'chat', icon: 'message-square' },
  { label: '编程', value: 'code', icon: 'folder' },
  { label: '知识库', value: 'kb', icon: 'search' },
]

const mode = ref('chat')
const grouped: RsDropdownItemGroup[] = [
  {
    label: '创作',
    options: [
      { label: '对话', value: 'chat', icon: 'message-square' },
      { label: '写作', value: 'write', icon: 'pen-line' },
    ],
  },
  {
    label: '检索',
    options: [{ label: '知识库', value: 'kb', icon: 'search' }],
  },
]
</script>

<template>
  <DocDemo id="demo-basic" title="场景切换" description="带图标的一级选项，单选互斥。触发器回显当前值。">
    <div class="field">
      <RsDropdown v-model="scene" :items="items" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="分组"
    description="items 也可传入 RsDropdownItemGroup[]。操作菜单用 :show-selected=&quot;false&quot; + @select。"
  >
    <div class="field">
      <RsDropdown v-model="mode" :items="grouped" placeholder="选择模式" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 16rem;
}
</style>
