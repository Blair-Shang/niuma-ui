<script setup lang="ts">
import { ref } from 'vue'
import { RsDynamicTags, type RsDynamicTagsRejectReason } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const basic = ref(['Vue', 'TypeScript'])
const always = ref(['设计', '研发'])
const limited = ref(['A', 'B'])
const dup = ref(['alpha'])
const lastReject = ref('')

const api: DemoApiRow[] = [
  { name: 'inputMode', type: "'trigger' | 'always'", default: "'trigger'", description: 'trigger 点击 + 再输入；always 常驻输入框' },
  { name: 'max', type: 'number', description: '标签数量上限' },
  { name: 'maxlength', type: 'number', description: '单标签最大字符数' },
  { name: 'allowDuplicate', type: 'boolean', default: 'false', description: '是否允许重复' },
  { name: 'commitOnBlur', type: 'boolean', default: 'true', description: '失焦时提交当前输入' },
  { name: 'tagVariant', type: 'RsTagVariant', default: "'default'", description: '标签变体' },
]

function onReject(reason: RsDynamicTagsRejectReason, value: string): void {
  lastReject.value = reason === 'duplicate' ? `重复：${value}` : '已达上限'
}
</script>

<template>
  <DemoPage title="RsDynamicTags" test-file="RsDynamicTags.spec.ts" :api="api">
    <DemoBlock title="触发式创建（默认，对齐 Naive）">
      <p class="hint">点击「+」输入，Enter 添加，Esc 取消；空输入 Backspace 删除末尾标签。</p>
      <RsDynamicTags v-model="basic" @reject="onReject" />
      <p class="hint">当前：{{ basic.join(', ') || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="常驻输入（input-mode=always）">
      <RsDynamicTags v-model="always" input-mode="always" tag-variant="primary" />
    </DemoBlock>

    <DemoBlock title="数量上限与重复反馈">
      <p class="hint">
        max=3；重复标签会抖动并触发 reject。
        <span v-if="lastReject">最近拒绝：{{ lastReject }}</span>
      </p>
      <RsDynamicTags v-model="limited" :max="3" placeholder="最多 3 个" @reject="onReject" />
    </DemoBlock>

    <DemoBlock title="允许重复">
      <RsDynamicTags v-model="dup" allow-duplicate input-mode="always" />
    </DemoBlock>

    <DemoBlock title="禁用">
      <RsDynamicTags :model-value="['只读', '标签']" disabled />
    </DemoBlock>

    <DemoBlock title="尺寸">
      <div class="stack">
        <RsDynamicTags v-model="basic" size="sm" />
        <RsDynamicTags v-model="basic" size="md" />
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hint {
  margin: 0 0 0.75rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
