<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  RsButton,
  RsCard,
  RsDialog,
  RsFieldset,
  RsForm,
  RsFormItem,
  RsInput,
  RsRadio,
  RsRadioItem,
  RsSelect,
  RsSwitch,
  RsTag,
  RsTextarea,
  type RsFieldsetBorderStyle,
  type RsFieldsetBorderTone,
  type RsFieldsetSize,
  type RsFieldsetTitleSize,
  type RsFieldsetTitleTone,
  type RsFontWeight,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const fieldsetApi: DemoApiRow[] = [
  { name: 'legend', type: 'string', description: '分组标题，原生 legend（WHATWG / WCAG 组名）' },
  { name: 'tooltip', type: 'string', description: '分组说明，标题旁帮助图标（对齐 Form.Item tooltip）' },
  { name: 'description', type: 'string', description: '已弃用，等同 tooltip' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '禁用整组；在 RsForm disabled 内也会跟上' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '密度。对话框用 sm' },
  { name: 'name', type: 'string', description: '原生 fieldset name' },
  { name: 'form', type: 'string', description: '关联外部 form id' },
  { name: 'id', type: 'string', description: '根 fieldset id' },
  { name: 'required', type: 'boolean', default: 'false', description: '组名旁必填星号' },
  { name: 'invalid', type: 'boolean', default: 'false', description: '组级失败描边' },
  { name: 'error', type: 'string', description: '组级错误文案' },
  { name: 'borderStyle', type: "'solid' | 'dashed' | 'dotted'", default: "'solid'", description: '边框线型' },
  { name: 'borderTone', type: "'default' | 'subtle' | 'faded'", default: "'default'", description: '边框浓度；faded 虚化' },
  { name: 'titleWeight', type: "'regular' | 'medium' | 'semibold' | 'bold'", default: "'semibold'", description: '标题字重（清晰度）' },
  { name: 'titleTone', type: "'strong' | 'default' | 'muted'", default: "'default'", description: '标题对比（清晰度）' },
  { name: 'titleSize', type: "'xs' | 'sm' | 'base'", default: "'sm'", description: '标题字号' },
  { name: '#legend', type: 'slot', description: '自定义标题' },
  { name: '#tooltip', type: 'slot', description: '自定义 tip 内容' },
  { name: '#extra', type: 'slot', description: '标题右侧附加（数量、状态）' },
  { name: '#error', type: 'slot', description: '自定义组错误' },
  { name: 'default', type: 'slot', description: '分组内容' },
]

const dialogCode = `<RsFieldset legend="推送对象" tooltip="将上传这些文件" size="sm">
  …
</RsFieldset>
<RsFieldset legend="推送配置" tooltip="写入远程目录" size="sm">
  <RsFormItem label="环境" required>…</RsFormItem>
</RsFieldset>`

const env = ref('ftp-prod')
const path = ref('/update')
const backup = ref('/backup')
const pusher = ref('张三')
const taskRef = ref('TASK-128')
const detail = ref('')
const account = reactive({ name: '弱水工作室', email: 'team@ruoshui.app' })
const notify = reactive({ channel: 'mail', to: 'ops@example.com' })
const protocol = ref('sftp')
const formDisabled = ref(false)
const dialogOpen = ref(false)
const windowOpen = ref(false)
const advancedOpen = ref(true)
const nestedHost = ref('deploy.example.com')
const nestedPort = ref('22')
const profileName = ref('生产发布')
const validateFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const validateModel = reactive({ displayName: '', email: '' })
const validateResult = ref('')

const borderStyle = ref<RsFieldsetBorderStyle>('solid')
const borderTone = ref<RsFieldsetBorderTone>('default')
const titleWeight = ref<RsFontWeight>('semibold')
const titleTone = ref<RsFieldsetTitleTone>('default')
const titleSize = ref<RsFieldsetTitleSize>('sm')

const envs = [
  { label: '生产 FTP', value: 'ftp-prod' },
  { label: '预发 SFTP', value: 'sftp-stage' },
]
const styleOptions = [
  { label: '实线 solid', value: 'solid' },
  { label: '虚线 dashed', value: 'dashed' },
  { label: '点线 dotted', value: 'dotted' },
]
const toneOptions = [
  { label: '默认 default', value: 'default' },
  { label: '弱分隔 subtle', value: 'subtle' },
  { label: '虚化 faded', value: 'faded' },
]
const weightOptions = [
  { label: 'regular', value: 'regular' },
  { label: 'medium', value: 'medium' },
  { label: 'semibold', value: 'semibold' },
  { label: 'bold', value: 'bold' },
]
const titleToneOptions = [
  { label: 'strong', value: 'strong' },
  { label: 'default', value: 'default' },
  { label: 'muted', value: 'muted' },
]
const titleSizeOptions = [
  { label: 'xs', value: 'xs' },
  { label: 'sm', value: 'sm' },
  { label: 'base', value: 'base' },
]

const borderStyles: RsFieldsetBorderStyle[] = ['solid', 'dashed', 'dotted']
const borderTones: RsFieldsetBorderTone[] = ['default', 'subtle', 'faded']
const titleWeights: RsFontWeight[] = ['regular', 'medium', 'semibold', 'bold']
const titleTones: RsFieldsetTitleTone[] = ['strong', 'default', 'muted']
const titleSizes: RsFieldsetTitleSize[] = ['xs', 'sm', 'base']
const densities: { id: RsFieldsetSize; hint: string }[] = [
  { id: 'sm', hint: '对话框、抽屉、侧栏表单' },
  { id: 'md', hint: '设置页、独立配置面板' },
]

async function runValidate(): Promise<void> {
  const result = await validateFormRef.value?.validate()
  validateResult.value = result?.valid ? '校验通过' : JSON.stringify(result?.errors ?? {})
}
</script>

<template>
  <DemoPage title="RsFieldset" :api="fieldsetApi">
    <DemoBlock title="与 RsCard 的分工">
      <p class="hint">
        <code>RsCard</code> 是内容表面（列表、指标、封面）。
        <code>RsFieldset</code> 是表单分区：原生 <code>fieldset</code> / <code>legend</code>
        （WHATWG、WCAG 1.3.1）。说明走标题旁 tip，不另起一行。
      </p>
      <div class="compare">
        <RsCard title="发布记录" description="卡片：表面 + 标题栏" variant="outlined" size="sm">
          <p class="body-text">适合列表、统计、操作入口，不是字段分组。</p>
        </RsCard>
        <RsFieldset legend="推送配置" tooltip="字段分组，不是卡片" size="sm">
          <RsFormItem label="远程路径">
            <RsInput model-value="/update" />
          </RsFormItem>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="对话框分区" :code="dialogCode">
      <p class="hint">同一对话框里「对象 / 配置」两块分区。也可点开真实 Dialog / Window。</p>
      <div class="row">
        <RsButton size="sm" @click="dialogOpen = true">打开 form 对话框</RsButton>
        <RsButton size="sm" variant="default" @click="windowOpen = true">打开 window 对话框</RsButton>
      </div>
      <div class="dialog-stack">
        <RsFieldset legend="推送对象" tooltip="将上传这些产物" size="sm">
          <template #extra>
            <RsTag size="sm" round>2</RsTag>
          </template>
          <ul class="chips">
            <li>app-1.2.0.zip</li>
            <li>release-notes.md</li>
          </ul>
        </RsFieldset>
        <RsFieldset legend="推送配置" tooltip="写入远程目录并记录备份" size="sm">
          <RsFormItem label="环境" required>
            <RsSelect v-model="env" :options="envs" />
          </RsFormItem>
          <RsFormItem label="远程路径" required>
            <RsInput v-model="path" />
          </RsFormItem>
          <div class="pair">
            <RsFormItem label="推送人" required>
              <RsInput v-model="pusher" />
            </RsFormItem>
            <RsFormItem label="任务单" required>
              <RsInput v-model="taskRef" />
            </RsFormItem>
          </div>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="密度 size">
      <p class="hint">只改内边距与组内间距，不改控件高度。对话框用 sm，设置页用 md。</p>
      <div class="compare">
        <RsFieldset
          v-for="item in densities"
          :key="item.id"
          :legend="`size=${item.id}`"
          :tooltip="item.hint"
          :size="item.id"
        >
          <RsFormItem label="显示名称">
            <RsInput :model-value="account.name" />
          </RsFormItem>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="边框线型 borderStyle">
      <div class="matrix">
        <RsFieldset
          v-for="style in borderStyles"
          :key="style"
          :legend="style"
          tooltip="CSS border-style"
          :border-style="style"
          size="sm"
        >
          <p class="body-text">实线 / 虚线 / 点线</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="边框浓度 borderTone">
      <div class="matrix">
        <RsFieldset
          v-for="tone in borderTones"
          :key="tone"
          :legend="tone"
          :tooltip="tone === 'faded' ? '虚化：降低边框不透明度' : '分隔线浓度'"
          :border-tone="tone"
          size="sm"
        >
          <p class="body-text">{{ tone === 'faded' ? '虚化边框' : '分隔浓度' }}</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="线型 × 浓度">
      <div class="matrix matrix--wide">
        <RsFieldset
          v-for="style in borderStyles"
          :key="`${style}-faded`"
          :legend="`${style} · faded`"
          tooltip="虚线/点线叠虚化，适合次要分组"
          :border-style="style"
          border-tone="faded"
          size="sm"
        >
          <p class="body-text">次要分区</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="标题字重 titleWeight">
      <div class="matrix">
        <RsFieldset
          v-for="weight in titleWeights"
          :key="weight"
          :legend="weight"
          tooltip="标题清晰度 · 字重"
          :title-weight="weight"
          size="sm"
        >
          <p class="body-text">字重 {{ weight }}</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="标题对比 titleTone">
      <div class="matrix">
        <RsFieldset
          v-for="tone in titleTones"
          :key="tone"
          :legend="tone"
          tooltip="标题清晰度 · 对比"
          :title-tone="tone"
          size="sm"
        >
          <p class="body-text">对比 {{ tone }}</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="标题字号 titleSize">
      <div class="matrix">
        <RsFieldset
          v-for="size in titleSizes"
          :key="size"
          :legend="size"
          tooltip="标题清晰度 · 字号"
          :title-size="size"
          size="sm"
        >
          <p class="body-text">字号 {{ size }}</p>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="组合调节">
      <div class="controls">
        <RsFormItem label="线型">
          <RsSelect v-model="borderStyle" :options="styleOptions" />
        </RsFormItem>
        <RsFormItem label="浓度">
          <RsSelect v-model="borderTone" :options="toneOptions" />
        </RsFormItem>
        <RsFormItem label="字重">
          <RsSelect v-model="titleWeight" :options="weightOptions" />
        </RsFormItem>
        <RsFormItem label="对比">
          <RsSelect v-model="titleTone" :options="titleToneOptions" />
        </RsFormItem>
        <RsFormItem label="字号">
          <RsSelect v-model="titleSize" :options="titleSizeOptions" />
        </RsFormItem>
      </div>
      <RsFieldset
        legend="推送配置"
        tooltip="边框线型 / 虚化与标题清晰度可按场景调整"
        :border-style="borderStyle"
        :border-tone="borderTone"
        :title-weight="titleWeight"
        :title-tone="titleTone"
        :title-size="titleSize"
        size="sm"
      >
        <RsFormItem label="远程路径">
          <RsInput v-model="backup" />
        </RsFormItem>
      </RsFieldset>
    </DemoBlock>

    <DemoBlock title="设置页多分组">
      <RsForm max-width="md" gap="lg">
        <RsFieldset legend="账号" tooltip="登录与显示名称">
          <RsFormItem label="显示名称" required>
            <RsInput v-model="account.name" />
          </RsFormItem>
          <RsFormItem label="邮箱" required>
            <RsInput v-model="account.email" type="email" />
          </RsFormItem>
        </RsFieldset>
        <RsFieldset legend="通知" border-tone="subtle">
          <RsFormItem label="渠道">
            <RsSelect
              v-model="notify.channel"
              :options="[
                { label: '邮件', value: 'mail' },
                { label: '不通知', value: 'off' },
              ]"
            />
          </RsFormItem>
          <RsFormItem label="收件人">
            <RsInput v-model="notify.to" placeholder="ops@example.com" />
          </RsFormItem>
        </RsFieldset>
        <RsButton variant="primary">保存</RsButton>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="单选分组（fieldset 经典场景）">
      <p class="hint">协议一组选项，legend 是组名。这是 HTML fieldset 的原始用途。</p>
      <RsFieldset legend="传输协议" tooltip="决定远程推送使用的通道" name="protocol" required size="sm">
        <RsRadio v-model="protocol" orientation="vertical">
          <RsRadioItem value="ftp">FTP</RsRadioItem>
          <RsRadioItem value="sftp">SFTP</RsRadioItem>
          <RsRadioItem value="ssh">SSH</RsRadioItem>
        </RsRadio>
      </RsFieldset>
    </DemoBlock>

    <DemoBlock title="组级必填 / 错误">
      <p class="hint">required 只画星号。invalid / error 是组级展示，不代替 Form.validate。</p>
      <RsFieldset legend="传输协议" required invalid error="请选择一种协议" size="sm">
        <RsRadio v-model="protocol" orientation="vertical">
          <RsRadioItem value="ftp">FTP</RsRadioItem>
          <RsRadioItem value="sftp">SFTP</RsRadioItem>
        </RsRadio>
      </RsFieldset>
    </DemoBlock>

    <DemoBlock title="插槽：#legend / #tooltip / #extra">
      <RsFieldset size="sm">
        <template #legend>
          <span class="custom-legend">发布档案</span>
        </template>
        <template #tooltip>
          <p class="tip-block">自定义 tip：可放短段落，不必只是一行字符串。</p>
        </template>
        <template #extra>
          <RsTag size="sm" variant="success" round>已同步</RsTag>
        </template>
        <RsFormItem label="档案名">
          <RsInput v-model="profileName" />
        </RsFormItem>
      </RsFieldset>
    </DemoBlock>

    <DemoBlock title="无标题 / description 别名">
      <div class="compare">
        <RsFieldset size="sm">
          <RsFormItem label="备注">
            <RsTextarea :rows="2" placeholder="匿名分组：没有 legend" />
          </RsFormItem>
        </RsFieldset>
        <RsFieldset legend="兼容 description" description="已弃用，仍映射到同一 tip" size="sm">
          <RsFormItem label="兼容字段">
            <RsInput model-value="description → tooltip" />
          </RsFormItem>
        </RsFieldset>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用：自身 / 部分 / 跟随 Form">
      <div class="stack">
        <RsFieldset legend="自身 disabled" tooltip="任务进行中不可改" disabled size="sm">
          <RsFormItem label="远程路径">
            <RsInput model-value="/update" />
          </RsFormItem>
        </RsFieldset>
        <div class="compare">
          <RsFieldset legend="可编辑" size="sm">
            <RsFormItem label="推送人">
              <RsInput v-model="pusher" />
            </RsFormItem>
          </RsFieldset>
          <RsFieldset legend="只读分区" tooltip="仅这一组禁用" disabled size="sm">
            <RsFormItem label="备份目录">
              <RsInput v-model="backup" />
            </RsFormItem>
          </RsFieldset>
        </div>
        <div class="toggle">
          <RsSwitch v-model="formDisabled" />
          <span>RsForm disabled（整表禁用，fieldset 跟随）</span>
        </div>
        <RsForm :disabled="formDisabled" max-width="md">
          <RsFieldset legend="跟随 Form" tooltip="Form disabled 时整组原生控件不可用" size="sm">
            <RsFormItem label="显示名称">
              <RsInput v-model="account.name" />
            </RsFormItem>
          </RsFieldset>
        </RsForm>
      </div>
    </DemoBlock>

    <DemoBlock title="嵌套：基础 + 高级">
      <RsFieldset legend="连接" tooltip="基础项始终可见" size="sm">
        <RsFormItem label="主机" required>
          <RsInput v-model="nestedHost" />
        </RsFormItem>
        <div class="toggle">
          <RsSwitch v-model="advancedOpen" />
          <span>显示高级选项</span>
        </div>
        <RsFieldset
          v-if="advancedOpen"
          legend="高级"
          tooltip="次要参数用虚化边框"
          border-style="dashed"
          border-tone="faded"
          title-tone="muted"
          title-weight="medium"
          size="sm"
        >
          <RsFormItem label="端口">
            <RsInput v-model="nestedPort" />
          </RsFormItem>
        </RsFieldset>
      </RsFieldset>
    </DemoBlock>

    <DemoBlock title="分组内校验">
      <RsForm ref="validateFormRef" :model="validateModel" max-width="md" gap="md">
        <RsFieldset legend="联系人" tooltip="分组不代替字段校验，必填仍在 FormItem" size="sm">
          <RsFormItem name="displayName" label="显示名称" required>
            <RsInput v-model="validateModel.displayName" />
          </RsFormItem>
          <RsFormItem name="email" label="邮箱" required>
            <RsInput v-model="validateModel.email" type="email" />
          </RsFormItem>
        </RsFieldset>
        <div class="row">
          <RsButton variant="primary" @click="runValidate">校验</RsButton>
          <span class="body-text">{{ validateResult }}</span>
        </div>
      </RsForm>
    </DemoBlock>
  </DemoPage>

  <RsDialog v-model:open="dialogOpen" layout="form" width="md" title="远程推送" description="form 布局里的两组 fieldset">
    <template #body>
      <div class="dialog-stack">
        <RsFieldset legend="推送对象" tooltip="将上传这些产物" size="sm">
          <template #extra>
            <RsTag size="sm" round>2</RsTag>
          </template>
          <ul class="chips">
            <li>app-1.2.0.zip</li>
            <li>release-notes.md</li>
          </ul>
        </RsFieldset>
        <RsFieldset legend="推送配置" tooltip="写入远程目录并记录备份" size="sm">
          <RsFormItem label="环境" required>
            <RsSelect v-model="env" :options="envs" />
          </RsFormItem>
          <RsFormItem label="远程路径" required>
            <RsInput v-model="path" />
          </RsFormItem>
          <RsFormItem label="说明">
            <RsTextarea v-model="detail" :rows="2" placeholder="可选备注" />
          </RsFormItem>
        </RsFieldset>
      </div>
    </template>
    <template #footer>
      <RsButton variant="ghost" @click="dialogOpen = false">取消</RsButton>
      <RsButton @click="dialogOpen = false">执行</RsButton>
    </template>
  </RsDialog>

  <RsDialog
    v-model:open="windowOpen"
    layout="window"
    width="40rem"
    height="28rem"
    draggable
    resizable
    title="远程推送"
    description="window 布局：legend 背景跟随对话框表面"
  >
    <template #body>
      <div class="dialog-stack">
        <RsFieldset legend="推送对象" tooltip="window 里的分组" size="sm">
          <ul class="chips">
            <li>app-1.2.0.zip</li>
          </ul>
        </RsFieldset>
        <RsFieldset legend="推送配置" size="sm">
          <RsFormItem label="任务单" required>
            <RsInput v-model="taskRef" />
          </RsFormItem>
        </RsFieldset>
      </div>
    </template>
  </RsDialog>
</template>

<style scoped>
.hint {
  margin: 0 0 var(--rs-space-md);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}
.body-text {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}
.dialog-stack,
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-md);
}
.pair,
.compare,
.matrix {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rs-space-md);
}
.matrix {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.matrix--wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.controls {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--rs-space-md);
  margin-bottom: var(--rs-space-md);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}
.chips li {
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-full);
  background: var(--rs-bg);
  color: var(--rs-text);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}
.custom-legend {
  font-weight: inherit;
}
.tip-block {
  margin: 0;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
}
@media (max-width: 48rem) {
  .pair,
  .compare,
  .matrix,
  .matrix--wide,
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
