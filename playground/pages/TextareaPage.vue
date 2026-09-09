<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsForm, RsTextarea, type RsTextareaExpose } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const note = ref('mvn -B -DskipTests package')
const autoNote = ref('第一行。再输入几行，高度会跟着长，超过 maxRows 后内部滚动。')
const countNote = ref('部署完成后发版公告。')
const countOnly = ref('只统计字数，不截断。')
const clearNote = ref('点右上角清除。')
const requiredNote = ref('')
const invite = ref('')
const taken = ref('已占用的简介')
const disabledNote = ref('当前环境由管理员锁定，不可改。')
const readonlyNote = ref('ssh -o StrictHostKeyChecking=no user@host')
const leftNote = ref('')
const formNote = ref('')
const formDesc = ref('')
const enterLog = ref('Enter 换行；Ctrl / ⌘ + Enter 当作提交。')
const sizeNote = ref('同一内容，看三种尺寸。')
const textareaRef = ref<RsTextareaExpose | null>(null)

const api: DemoApiRow[] = [
  { name: 'v-model', type: 'string', default: "''", description: '文本值；外部误传 null / number 会收成字符串' },
  { name: 'label', type: 'string', description: '内置标签；表单字段优先用这个，不必再包 RsLabel' },
  { name: 'hint', type: 'string', description: '标签下的次要说明，错误出现时仍保留' },
  { name: 'placeholder', type: 'string', description: '空值占位' },
  { name: 'required', type: 'boolean', default: 'false', description: '必填；失焦 / 提交时走与 RsInput 同一套规则' },
  { name: 'rows', type: 'number', default: '3', description: '固定行数；autosize 未写 minRows 时也作起始行数' },
  {
    name: 'autosize',
    type: 'boolean | { minRows?: number; maxRows?: number }',
    default: 'false',
    description: '自适应高度。对齐 Ant autoSize / Element autosize；开启后 resize 强制 none',
  },
  {
    name: 'resize',
    type: "'none' | 'horizontal' | 'vertical' | 'both'",
    default: "'vertical'",
    description: '用户拖拽方向；autosize 时忽略',
  },
  { name: 'maxlength', type: 'number', description: '原生上限；有值时统计显示 n / max' },
  { name: 'minlength', type: 'number', description: '原生下限，交给浏览器约束' },
  { name: 'showCount', type: 'boolean', default: 'false', description: '框内右下角字数；无 maxlength 只显示当前长度' },
  { name: 'clearable', type: 'boolean', default: 'false', description: '有内容时右上角清除；对齐 RsInput / Ant allowClear' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '禁用；也可被外层 RsForm disabled 带上' },
  { name: 'readonly', type: 'boolean', default: 'false', description: '只读，可选中复制' },
  { name: 'invalid', type: 'boolean', default: 'false', description: '受控错误态' },
  { name: 'errorMessage', type: 'string', description: '受控错误文案；绑在 RsFormItem 上时由表单项展示' },
  { name: 'rule', type: 'RsInputRule', description: '内置规则，与 RsInput 相同（email / url / …）' },
  { name: 'validator', type: '(value: string) => boolean | string', description: '自定义校验；返回 true 或错误文案' },
  {
    name: 'validateTrigger',
    type: "'blur' | 'input' | 'both'",
    default: "'blur'",
    description: '何时跑本地规则',
  },
  { name: 'name', type: 'string', description: '表单字段名，供 RsForm / RsFormItem 收集' },
  { name: 'size', type: "'ssm' | 'sm' | 'md' | 'lg'", default: "'md'", description: '控件尺寸，跟 RsInput 同一套 token' },
  { name: 'radius', type: 'RsRadius', description: '圆角；默认同 Input 的 sm' },
  { name: 'labelPosition', type: "'top' | 'left'", description: '字段级标签位置；不写则跟 RsForm' },
  { name: 'showValidateMessage', type: 'boolean', default: 'true', description: '是否渲染字段下方错误文案' },
  { name: 'id', type: 'string', description: '原生 id；不写则自动生成并挂到 label.for' },
  { name: 'update:modelValue', type: '(value: string) => void', description: 'v-model' },
  { name: 'focus / blur', type: '(event: FocusEvent) => void', description: '焦点进出' },
  {
    name: 'pressEnter',
    type: '(event: KeyboardEvent) => void',
    description: '按下 Enter（含换行）。提交请判断 event.ctrlKey || event.metaKey。IME 合成中不触发',
  },
  { name: 'clear', type: '() => void', description: '点清除之后' },
  { name: 'validate', type: '(payload) => void', description: '{ valid, message? }' },
  { name: '#count', type: '{ value, count, maxlength }', description: '自定义字数展示' },
  { name: '#error', type: '{ message }', description: '自定义错误文案' },
  { name: 'focus() / blur()', type: 'expose', description: '命令式聚焦 / 失焦' },
  { name: 'validate() / clearValidation()', type: 'expose', description: '手动校验 / 清掉错误态' },
  { name: 'setValue() / setError()', type: 'expose', description: '写入值 / 写入错误（给表单编排用）' },
]

const basicCode = `<RsTextarea
  v-model="note"
  label="构建命令"
  required
  :rows="4"
  hint="在检出目录执行"
  placeholder="mvn -B -DskipTests package"
/>`

const autosizeCode = `<RsTextarea
  v-model="note"
  label="发布说明"
  :autosize="{ minRows: 3, maxRows: 8 }"
  placeholder="输入时高度跟着走"
/>`

const countCode = `<RsTextarea
  v-model="note"
  label="公告"
  :maxlength="80"
  show-count
  clearable
/>`

const enterCode = `<RsTextarea
  v-model="note"
  label="备注"
  :autosize="{ minRows: 3, maxRows: 6 }"
  @press-enter="onPressEnter"
/>

function onPressEnter(event: KeyboardEvent) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  submit()
}`

const formCode = `<RsForm label-position="left" label-width="5rem" max-width="lg" gap="md">
  <RsTextarea v-model="title" label="标题" required />
  <RsTextarea
    v-model="body"
    label="正文"
    required
    :autosize="{ minRows: 4, maxRows: 10 }"
    :maxlength="200"
    show-count
  />
</RsForm>`

function onPressEnter(event: KeyboardEvent) {
  if (!event.ctrlKey && !event.metaKey) return
  enterLog.value = `提交 @ ${new Date().toLocaleTimeString()} · ${note.value.length} 字`
}

function focusDemo() {
  textareaRef.value?.focus()
}
</script>

<template>
  <DemoPage
    title="RsTextarea"
    test-file="RsTextarea.spec.ts"
    description="多行输入，和 RsInput 同一套 token、校验、表单绑定。对齐 Ant Design Input.TextArea 与 Element Plus textarea：autosize、showCount、clearable、pressEnter、focus / blur。"
    :api="api"
  >
    <DemoBlock title="推荐用法 · 内置 label" :code="basicCode">
      <p class="hint">
        表单字段用 <code>label</code> / <code>hint</code> / <code>required</code>，不要再包
        <code>RsLabel</code>。单行请用 <code>RsInput</code>，不要拿 Input 假装多行。
      </p>
      <RsTextarea
        v-model="note"
        label="构建命令"
        required
        :rows="4"
        hint="在检出目录执行"
        placeholder="mvn -B -DskipTests package"
      />
    </DemoBlock>

    <DemoBlock title="autosize · 自适应高度" :code="autosizeCode">
      <p class="hint">
        <code>autosize</code> 对齐 Ant <code>autoSize</code>、Element
        <code>autosize</code>。传 <code>true</code> 从 <code>rows</code> 往下长；传对象可锁
        <code>minRows</code> / <code>maxRows</code>。开启后不能拖拽改高。
      </p>
      <div class="stack">
        <RsTextarea
          v-model="autoNote"
          label="发布说明"
          :autosize="{ minRows: 3, maxRows: 8 }"
          placeholder="输入时高度跟着走"
        />
        <RsTextarea
          v-model="autoNote"
          label="仅开启（boolean）"
          :autosize="true"
          :rows="2"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="showCount · clearable" :code="countCode">
      <p class="hint">
        字数叠在框内右下角（Ant 样式）。有 <code>maxlength</code> 显示
        <code>n / max</code> 并截断；没有只显示当前长度。
        <code>clearable</code> 对齐 RsInput / Ant <code>allowClear</code>。
      </p>
      <div class="stack">
        <RsTextarea
          v-model="countNote"
          label="公告"
          :maxlength="80"
          show-count
          clearable
          placeholder="最多 80 字"
        />
        <RsTextarea
          v-model="countOnly"
          label="只统计"
          show-count
          hint="没有 maxlength，不截断"
        />
        <RsTextarea v-model="clearNote" label="可清除" clearable placeholder="输入后可清除" />
      </div>
    </DemoBlock>

    <DemoBlock title="resize · 拖拽">
      <p class="hint">
        默认 <code>vertical</code>。长文本草稿用 <code>both</code>；嵌入固定卡片用
        <code>none</code>。与 <code>autosize</code> 不要一起开。
      </p>
      <div class="stack">
        <RsTextarea v-model="note" label="仅纵向（默认）" :rows="3" resize="vertical" />
        <RsTextarea v-model="note" label="双向" :rows="3" resize="both" />
        <RsTextarea v-model="note" label="禁止拖拽" :rows="3" resize="none" />
      </div>
    </DemoBlock>

    <DemoBlock title="校验 · required / validator / 受控 invalid">
      <p class="hint">
        规则和触发与 <code>RsInput</code> 相同：<code>required</code>、<code>rule</code>、<code>validator</code>、<code>validateTrigger</code>。
        业务侧已知错误用 <code>invalid</code> + <code>error-message</code>。
      </p>
      <div class="stack">
        <RsTextarea
          v-model="requiredNote"
          label="变更说明"
          required
          validate-trigger="blur"
          placeholder="失焦后校验必填"
        />
        <RsTextarea
          v-model="invite"
          label="回滚口令"
          placeholder="RUO-XXXX"
          :validator="(v) => /^RUO-[A-Z0-9]{4}$/.test(v) || '格式：RUO-XXXX'"
        />
        <RsTextarea
          v-model="taken"
          label="简介"
          invalid
          error-message="该简介已被占用"
          required
        />
      </div>
    </DemoBlock>

    <DemoBlock title="pressEnter · Ctrl / ⌘ + Enter 提交" :code="enterCode">
      <p class="hint">
        Enter 本身换行，事件仍会发（对齐 Ant <code>onPressEnter</code>）。真正提交请判断
        <code>ctrlKey</code> / <code>metaKey</code>。中文输入法合成期间不触发。
      </p>
      <RsTextarea
        v-model="note"
        label="备注"
        :autosize="{ minRows: 3, maxRows: 6 }"
        placeholder="Ctrl / ⌘ + Enter 提交"
        @press-enter="onPressEnter"
      />
      <p class="log">{{ enterLog }}</p>
    </DemoBlock>

    <DemoBlock title="disabled / readonly">
      <div class="stack">
        <RsTextarea v-model="disabledNote" label="环境说明" disabled hint="整字段 disabled" />
        <RsTextarea
          v-model="readonlyNote"
          label="连接命令"
          readonly
          hint="只读，可选中复制"
          :rows="2"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸 sm / md / lg">
      <div class="stack">
        <RsTextarea v-model="sizeNote" size="sm" label="sm" :rows="2" />
        <RsTextarea v-model="sizeNote" size="md" label="md（默认）" :rows="2" />
        <RsTextarea v-model="sizeNote" size="lg" label="lg" :rows="2" />
      </div>
    </DemoBlock>

    <DemoBlock title="左标签 · 字段级 label-position">
      <RsTextarea
        v-model="leftNote"
        label="备注"
        label-position="left"
        :rows="3"
        placeholder="不依赖 RsForm 的左标签"
      />
    </DemoBlock>

    <DemoBlock title="RsForm · 左标签 + 校验" :code="formCode">
      <p class="hint">放进 <code>RsForm</code> 后标签宽度、间距、disabled 跟其它字段对齐；错误时 label 不跳动。</p>
      <RsForm label-position="left" label-width="5rem" max-width="lg" gap="md">
        <RsTextarea v-model="formNote" label="标题" required placeholder="必填，失焦校验" />
        <RsTextarea
          v-model="formDesc"
          label="正文"
          required
          :autosize="{ minRows: 4, maxRows: 10 }"
          :maxlength="200"
          show-count
          placeholder="最多 200 字"
        />
      </RsForm>
    </DemoBlock>

    <DemoBlock title="expose · focus()">
      <p class="hint">
        模板 ref 请写 <code>RsTextareaExpose</code>，不要
        <code>InstanceType&lt;typeof RsTextarea&gt;</code>。
      </p>
      <div class="row">
        <RsButton size="sm" @click="focusDemo">聚焦下方输入</RsButton>
      </div>
      <RsTextarea ref="textareaRef" v-model="note" label="可被聚焦" :rows="3" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: var(--rs-line-height-normal);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 36rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.log {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  font-family: var(--rs-font-mono, monospace);
}
</style>
