<script setup lang="ts">
import { ref } from 'vue'
import { RsInputNumber } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const qty = ref<number | null>(3)
const price = ref<number | null>(19.9)
const age = ref<number | null>(18)
const big = ref<string | null>('9007199254740993')
const percent = ref<number | null>(50)
const wheelQty = ref<number | null>(10)
</script>

<template>
  <DemoPage title="RsInputNumber" test-file="RsInputNumber.spec.ts">
    <DemoBlock title="基础（number | null）">
      <p class="hint">
        对齐 Ant Design <code>InputNumber</code>：受控值为 <code>number | null</code>，输入过程允许中间态，失焦再规范化。
      </p>
      <div class="row">
        <RsInputNumber v-model="qty" label="数量" :min="0" :max="99" :step="1" />
        <RsInputNumber
          v-model="price"
          label="单价"
          :min="0"
          :step="0.1"
          :precision="2"
        />
      </div>
      <p class="meta">qty={{ qty }} · price={{ price }}</p>
    </DemoBlock>

    <DemoBlock title="滚轮改值（changeOnWheel）">
      <p class="hint">
        默认关闭（防误触 / 避免 Chrome non-passive wheel 告警）。开启后需先<strong>聚焦</strong>输入框，再滚动滚轮步进。
      </p>
      <div class="row">
        <RsInputNumber
          v-model="qty"
          label="默认关滚轮"
          :min="0"
          :max="99"
          hint="聚焦后滚轮不应改值"
        />
        <RsInputNumber
          v-model="wheelQty"
          label="开启 changeOnWheel"
          change-on-wheel
          :min="0"
          :max="99"
          :step="1"
          hint="点击聚焦后滚动鼠标滚轮"
        />
      </div>
      <p class="meta">qty={{ qty }} · wheelQty={{ wheelQty }}</p>
    </DemoBlock>

    <DemoBlock title="边界 · 步进 · 尺寸">
      <div class="row">
        <RsInputNumber v-model="age" label="年龄" size="sm" :min="0" :max="120" />
        <RsInputNumber v-model="age" label="年龄 md" :min="0" :max="120" />
        <RsInputNumber v-model="age" label="年龄 lg" size="lg" :min="0" :max="120" />
      </div>
    </DemoBlock>

    <DemoBlock title="stringMode（高精度）">
      <p class="hint">
        对齐 Ant <code>stringMode</code>：大整数不以 JS number 传输，避免精度丢失。表格数字列编辑也走此模式。
      </p>
      <RsInputNumber v-model="big" label="大整数 ID" string-mode :controls="false" />
      <p class="meta">value={{ big }} · typeof={{ typeof big }}</p>
    </DemoBlock>

    <DemoBlock title="无步进按钮 · 键盘上下">
      <RsInputNumber
        v-model="percent"
        label="百分比"
        :min="0"
        :max="100"
        :controls="false"
        hint="可用 ↑ / ↓ 调整"
      />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 12px;
  color: var(--rs-fg-muted);
  font-size: 13px;
  line-height: 1.5;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.row > * {
  flex: 1;
  min-width: 180px;
}
.meta {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--rs-fg-muted);
  font-family: var(--rs-font-mono, ui-monospace, monospace);
}
</style>
