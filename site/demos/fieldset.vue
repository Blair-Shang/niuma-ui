<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  RsButton,
  RsCard,
  RsFieldset,
  RsForm,
  RsFormItem,
  RsInput,
  RsRadio,
  RsRadioItem,
  RsSelect,
  RsSwitch,
  RsTag,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const model = reactive({
  name: 'Studio',
  env: 'prod',
  protocol: 'sftp',
  host: 'deploy.example.com',
  port: '22',
})
const formDisabled = ref(false)
const advancedOpen = ref(true)
const methodLog = ref('')
const fieldsetRef = ref<Record<string, unknown> | null>(null)

const envs = [
  { label: 'prod', value: 'prod' },
  { label: 'stage', value: 'stage' },
]

const { copy } = useSiteDemo({
  'en-US': {
    account: 'Account',
    accountTip: 'Sign-in and display name',
    displayName: 'Display name',
    push: 'Push',
    pushTip: 'Write to a remote directory',
    env: 'Environment',
    cardTitle: 'Release notes',
    cardBody: 'Card is a surface. Form groups belong on Fieldset.',
    darkSurface: 'Dark surface — fieldset tokens follow data-rs-theme, do not hard-code color',
    compact: 'Dialog, drawer, side form',
    page: 'Settings page',
    radioLegend: 'Protocol',
    radioTip: 'The channel used for remote push',
    archive: 'Release profile',
    tipBody: 'Custom tip: a short paragraph, not only one line.',
    extra: 'Synced',
    profile: 'Profile name',
    selfDisabled: 'Locked while the task runs',
    formDisabled: 'Inside a disabled form — the group inherits Form.disabled',
    requiredLegend: 'Protocol',
    requiredError: 'Pick one protocol',
    nested: 'Connection',
    nestedTip: 'Basics stay visible',
    advanced: 'Advanced',
    advancedTip: 'Secondary fields use a faded dashed border',
    host: 'Host',
    port: 'Port',
    showAdvanced: 'Show advanced',
    idle: 'RsFieldset emits nothing. A section is not a control.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no collapse() on the fieldset ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    account: '账号',
    accountTip: '登录与显示名称',
    displayName: '显示名称',
    push: '推送',
    pushTip: '写入远程目录',
    env: '环境',
    cardTitle: '发布记录',
    cardBody: 'Card 是表面。表单分组请用 Fieldset。',
    darkSurface: '深色表面 — fieldset token 跟 data-rs-theme，不要写死颜色',
    compact: '对话框、抽屉、侧栏表单',
    page: '设置页',
    radioLegend: '传输协议',
    radioTip: '远程推送使用的通道',
    archive: '发布档案',
    tipBody: '自定义 tip：可放短段落，不必只是一行。',
    extra: '已同步',
    profile: '档案名',
    selfDisabled: '任务进行中不可改',
    formDisabled: '在禁用的 Form 里 — 分组继承 Form.disabled',
    requiredLegend: '传输协议',
    requiredError: '请选择一种协议',
    nested: '连接',
    nestedTip: '基础项始终可见',
    advanced: '高级',
    advancedTip: '次要参数用虚化虚线边框',
    host: '主机',
    port: '端口',
    showAdvanced: '显示高级选项',
    idle: 'RsFieldset 不发事件。分组不是控件。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。fieldset ref 上没有 collapse()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsForm :model="model">
  <RsFieldset legend="Account" tooltip="Sign-in and display name" size="sm">
    <RsFormItem name="name" label="Display name" required>
      <RsInput v-model="model.name" />
    </RsFormItem>
  </RsFieldset>
</RsForm>`

const sizeCode = `<RsFieldset legend="Account" size="sm">…</RsFieldset>
<RsFieldset legend="Account" size="md">…</RsFieldset>`

const borderCode = `<RsFieldset legend="Push" border-style="dashed" border-tone="faded">
  Secondary or nested group.
</RsFieldset>`

const titleCode = `<RsFieldset
  legend="Account"
  title-weight="bold"
  title-tone="muted"
  title-size="xs"
/>`

const radioCode = `<RsFieldset legend="Protocol" tooltip="Remote channel" name="protocol" required>
  <RsRadio v-model="protocol" orientation="vertical">
    <RsRadioItem value="ftp">FTP</RsRadioItem>
    <RsRadioItem value="sftp">SFTP</RsRadioItem>
  </RsRadio>
</RsFieldset>`

const slotsCode = `<RsFieldset size="sm">
  <template #legend>Release profile</template>
  <template #tooltip>Custom tip: a short paragraph.</template>
  <template #extra>
    <RsTag size="sm" variant="success" round>Synced</RsTag>
  </template>
  …
</RsFieldset>`

const disabledCode = `<RsFieldset legend="Push" tooltip="Locked while the task runs" disabled>
  …
</RsFieldset>

<RsForm disabled>
  <RsFieldset legend="Account">…</RsFieldset>
</RsForm>`

const invalidCode = `<RsFieldset
  legend="Protocol"
  required
  invalid
  error="Pick one protocol"
>
  <RsRadio v-model="protocol">…</RsRadio>
</RsFieldset>`

const nestedCode = `<RsFieldset legend="Connection">
  <RsFormItem label="Host">…</RsFormItem>
  <RsFieldset
    v-if="advanced"
    legend="Advanced"
    border-style="dashed"
    border-tone="faded"
    title-tone="muted"
  >
    <RsFormItem label="Port">…</RsFormItem>
  </RsFieldset>
</RsFieldset>`

const eventsCode = `<RsFieldset legend="Account">
  A section is not a control.
</RsFieldset>`

const methodsCode = `const group = ref()
// RsFieldset has no defineExpose — group.value.collapse is undefined
<RsFieldset ref="group" legend="Account" />`

function inspectFieldsetRef() {
  const inst = fieldsetRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="表单分区"
    title-en="Form section"
    description="根是原生 fieldset / legend。说明走标题旁 tip。Card 是表面，不要用它冒充分组。"
    description-en="The root is a native fieldset / legend. Help sits on a tip beside the title. Card is a surface — do not fake a form group with it."
    :code="basicCode"
  >
    <RsForm :model="model" max-width="md">
      <RsFieldset :legend="copy.account" :tooltip="copy.accountTip" size="sm">
        <RsFormItem name="name" :label="copy.displayName" required>
          <RsInput v-model="model.name" />
        </RsFormItem>
      </RsFieldset>
      <RsFieldset :legend="copy.push" :tooltip="copy.pushTip" size="sm" border-tone="subtle">
        <RsFormItem name="env" :label="copy.env">
          <RsSelect v-model="model.env" :options="envs" />
        </RsFormItem>
      </RsFieldset>
    </RsForm>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="compare">
        <div class="stage" data-rs-theme="dark">
          <RsFieldset :legend="copy.account" :tooltip="copy.accountTip" size="sm">
            <RsFormItem :label="copy.displayName">
              <RsInput :model-value="model.name" />
            </RsFormItem>
          </RsFieldset>
        </div>
        <RsCard :title="copy.cardTitle" variant="outlined" size="sm">
          {{ copy.cardBody }}
        </RsCard>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="密度"
    title-en="Density"
    description="只改内边距与组内间距，不改控件高度。对话框用 sm，设置页用 md。没有 ssm / lg。"
    description-en="Only padding and gap change. Control height does not. Use sm in a dialog and md on a settings page. There is no ssm / lg."
    :code="sizeCode"
  >
    <div class="compare">
      <RsFieldset :legend="`size=sm`" :tooltip="copy.compact" size="sm">
        <RsFormItem :label="copy.displayName">
          <RsInput :model-value="model.name" />
        </RsFormItem>
      </RsFieldset>
      <RsFieldset :legend="`size=md`" :tooltip="copy.page" size="md">
        <RsFormItem :label="copy.displayName">
          <RsInput :model-value="model.name" />
        </RsFormItem>
      </RsFieldset>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-border"
    title="边框"
    title-en="Border"
    description="borderStyle 是线型。borderTone 是浓度。次要或嵌套分组用 dashed + faded。"
    description-en="borderStyle is the line. borderTone is the strength. A secondary or nested group uses dashed + faded."
    :code="borderCode"
  >
    <div class="matrix">
      <RsFieldset legend="solid" border-style="solid" size="sm">
        <p class="hint">solid · default</p>
      </RsFieldset>
      <RsFieldset legend="dashed" border-style="dashed" size="sm">
        <p class="hint">dashed · default</p>
      </RsFieldset>
      <RsFieldset legend="dotted · faded" border-style="dotted" border-tone="faded" size="sm">
        <p class="hint">dotted · faded</p>
      </RsFieldset>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-title"
    title="标题清晰度"
    title-en="Title"
    description="titleWeight / titleTone / titleSize 只改 legend。strong 走主文本，muted 走次要色。"
    description-en="titleWeight / titleTone / titleSize only change the legend. strong uses primary text; muted uses the secondary color."
    :code="titleCode"
  >
    <div class="matrix">
      <RsFieldset legend="semibold" title-weight="semibold" size="sm">
        <p class="hint">titleWeight</p>
      </RsFieldset>
      <RsFieldset legend="muted" title-tone="muted" size="sm">
        <p class="hint">titleTone</p>
      </RsFieldset>
      <RsFieldset legend="xs" title-size="xs" size="sm">
        <p class="hint">titleSize</p>
      </RsFieldset>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radio"
    title="单选分组"
    title-en="Radio group"
    description="一组互斥选项，legend 是组名。这是 HTML fieldset 的原始用途。"
    description-en="An exclusive choice. legend is the group name. This is the original HTML fieldset job."
    :code="radioCode"
  >
    <RsFieldset
      :legend="copy.radioLegend"
      :tooltip="copy.radioTip"
      name="protocol"
      required
      size="sm"
    >
      <RsRadio v-model="model.protocol" orientation="vertical">
        <RsRadioItem value="ftp">FTP</RsRadioItem>
        <RsRadioItem value="sftp">SFTP</RsRadioItem>
        <RsRadioItem value="ssh">SSH</RsRadioItem>
      </RsRadio>
    </RsFieldset>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#legend 覆盖组名。#tooltip 自定义 tip。#extra 放数量或状态，不要放会提交的控件。"
    description-en="#legend replaces the name. #tooltip customizes the tip. #extra is a count or status — do not put submit controls there."
    :code="slotsCode"
  >
    <RsFieldset size="sm">
      <template #legend>
        <span>{{ copy.archive }}</span>
      </template>
      <template #tooltip>
        <p class="tip">{{ copy.tipBody }}</p>
      </template>
      <template #extra>
        <RsTag size="sm" variant="success" round>{{ copy.extra }}</RsTag>
      </template>
      <RsFormItem :label="copy.profile">
        <RsInput model-value="production" />
      </RsFormItem>
    </RsFieldset>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 走原生 fieldset，组内控件不可用。也会继承 Form.disabled。此时 tip 改成可见说明，因为组内 button 会被禁用。"
    description-en="disabled is a native fieldset — controls inside cannot be used. It also inherits Form.disabled. Help becomes visible text because a button inside the group is disabled."
    :code="disabledCode"
  >
    <div class="stack">
      <RsFieldset :legend="copy.push" :tooltip="copy.selfDisabled" disabled size="sm">
        <RsFormItem :label="copy.env">
          <RsInput model-value="/update" />
        </RsFormItem>
      </RsFieldset>
      <div class="row">
        <RsSwitch v-model="formDisabled" :aria-label="copy.formDisabled" />
        <span class="hint">{{ copy.formDisabled }}</span>
      </div>
      <RsForm :disabled="formDisabled" max-width="md">
        <RsFieldset :legend="copy.account" :tooltip="copy.formDisabled" size="sm">
          <RsFormItem :label="copy.displayName">
            <RsInput v-model="model.name" />
          </RsFormItem>
        </RsFieldset>
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-invalid"
    title="必填与错误"
    title-en="Required and invalid"
    description="required 只画星号，真正约束仍在字段上。invalid / error / #error 是组级展示，不代替 Form.validate。"
    description-en="required only paints a mark. Real constraints stay on the fields. invalid / error / #error are group display — they do not replace Form.validate."
    :code="invalidCode"
  >
    <RsFieldset
      :legend="copy.requiredLegend"
      required
      invalid
      :error="copy.requiredError"
      size="sm"
    >
      <RsRadio v-model="model.protocol" orientation="vertical">
        <RsRadioItem value="ftp">FTP</RsRadioItem>
        <RsRadioItem value="sftp">SFTP</RsRadioItem>
      </RsRadio>
    </RsFieldset>
  </DocDemo>

  <DocDemo
    id="demo-nested"
    title="嵌套"
    title-en="Nested"
    description="折叠用 v-if，不要给 Fieldset 加开关。内层用虚化虚线，避免双边框抢视线。"
    description-en="Collapse with v-if. Do not put a toggle on Fieldset. The inner group uses a faded dashed border so two frames do not compete."
    :code="nestedCode"
  >
    <RsFieldset :legend="copy.nested" :tooltip="copy.nestedTip" size="sm">
      <RsFormItem :label="copy.host" required>
        <RsInput v-model="model.host" />
      </RsFormItem>
      <div class="row">
        <RsSwitch v-model="advancedOpen" :aria-label="copy.showAdvanced" />
        <span class="hint">{{ copy.showAdvanced }}</span>
      </div>
      <RsFieldset
        v-if="advancedOpen"
        :legend="copy.advanced"
        :tooltip="copy.advancedTip"
        border-style="dashed"
        border-tone="faded"
        title-tone="muted"
        title-weight="medium"
        size="sm"
      >
        <RsFormItem :label="copy.port">
          <RsInput v-model="model.port" />
        </RsFormItem>
      </RsFieldset>
    </RsFieldset>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。分组不是控件，不要给 Fieldset 绑 click。"
    description-en="No component events. A section is not a control — do not bind click on Fieldset."
    :code="eventsCode"
  >
    <RsFieldset :legend="copy.account" size="sm">
      <p class="hint">{{ copy.idle }}</p>
    </RsFieldset>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。点查看 ref，expose 键应是 none。校验走 Form。"
    description-en="No defineExpose. Inspect the ref — expose keys should be none. Validation belongs on Form."
    :code="methodsCode"
  >
    <div class="row">
      <RsFieldset ref="fieldsetRef" :legend="copy.account" size="sm">
        <RsFormItem :label="copy.displayName">
          <RsInput :model-value="model.name" />
        </RsFormItem>
      </RsFieldset>
      <RsButton variant="default" @click="inspectFieldsetRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.compare,
.matrix {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rs-space-md);
}

.matrix {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

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
}

.canvas {
  margin-block-start: 0.9rem;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-surface);
  color: var(--rs-text);
}

.hint,
.tip {
  margin: 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text);
}

@media (max-width: 48rem) {
  .compare,
  .matrix {
    grid-template-columns: 1fr;
  }
}
</style>
