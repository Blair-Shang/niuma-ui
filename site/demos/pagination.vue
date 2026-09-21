<script setup lang="ts">
import { ref } from 'vue'
import { RsPagination } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const page = ref(1)
const pageSize = ref(20)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基础分页"
    description="v-model:page 与 v-model:page-size。默认展示汇总。可再开 show-page-size / show-quick-jumper。"
  >
    <RsPagination v-model:page="page" v-model:page-size="pageSize" :total="86" show-page-size />
  </DocDemo>
</template>
