<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsForm, RsInput, RsLabel, RsSelect } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const email = ref('')
const role = ref('member')
const nickname = ref('')
const eventEmail = ref('')
const lastAction = ref('')
const methodLog = ref('')
const labelRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    email: 'Email',
    role: 'Role',
    nickname: 'Display name',
    phone: 'Phone',
    org: 'Organization ID',
    member: 'Member',
    admin: 'Admin',
    hintLogin: 'Used for sign-in and notices',
    hintSlot: 'Public profile. You can change this later.',
    hintLink: 'See the naming guide',
    disabledHint: 'This account cannot change the org id',
    formDisabled: 'Inside a disabled form — the label inherits Form.disabled',
    darkSurface: 'Dark surface — label tokens follow data-rs-theme, do not hard-code color',
    idle: 'RsLabel emits nothing. Click the label to focus the input — that is native for, not a component event.',
    focused: 'input focus — native label[for]',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no focus() on the label ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    email: '邮箱',
    role: '角色',
    nickname: '显示名称',
    phone: '手机号',
    org: '组织 ID',
    member: '成员',
    admin: '管理员',
    hintLogin: '用于登录与通知',
    hintSlot: '展示在个人资料页，可随时修改。',
    hintLink: '查看命名说明',
    disabledHint: '当前账号不可修改组织 ID',
    formDisabled: '在禁用的 Form 里 — 标签继承 Form.disabled',
    darkSurface: '深色表面 — 标签 token 跟 data-rs-theme，不要写死颜色',
    idle: 'RsLabel 不发事件。点标签聚焦输入框 — 那是原生 for，不是组件事件。',
    focused: 'input focus — 原生 label[for]',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。标签 ref 上没有 focus()。',
    methodNone: 'expose 键：none',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const roleOptions = computed(() => [
  { value: 'member', label: copy.value.member },
  { value: 'admin', label: copy.value.admin },
])

const basicCode = `<RsLabel for-id="email">Email</RsLabel>
<RsInput id="email" v-model="email" />

<RsLabel html-for="role">Role</RsLabel>
<RsSelect id="role" v-model="role" :options="options" />`

const marksCode = `<RsLabel for-id="email" required colon>Email</RsLabel>
<RsLabel for-id="phone" optional colon>Phone</RsLabel>`

const hintCode = `<RsLabel for-id="email" required hint="Used for sign-in and notices">
  Email
</RsLabel>
<RsLabel for-id="name" hint-id="hint-name">
  Display name
  <template #hint>
    Public profile.
    <a href="#/guide/i18n">See the naming guide</a>
  </template>
</RsLabel>
<RsInput id="name" :aria-describedby="'hint-name'" />`

const nowrapCode = `<RsLabel for-id="org" nowrap required>Organization ID</RsLabel>`

const disabledCode = `<RsLabel for-id="org" disabled required hint="Read only">
  Organization ID
</RsLabel>
<RsInput id="org" disabled value="org-1" />
<RsForm disabled>
  <RsLabel for-id="email">Email</RsLabel>
</RsForm>`

const eventsCode = `<RsLabel for-id="email">Email</RsLabel>
<RsInput id="email" @focus="onFocus" />
// RsLabel has no click / change — listen on the control`

const methodsCode = `const label = ref()
// RsLabel has no defineExpose — label.value.focus is undefined
<RsLabel ref="label">Email</RsLabel>`

function onInputFocus() {
  lastAction.value = copy.value.focused
}

function inspectLabelRef() {
  const inst = labelRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="关联控件"
    title-en="Associate a control"
    description="点击标签聚焦控件。Input 已有 label 时不要再包。Select 等没有内置 label 时用 for-id 或 htmlFor。"
    description-en="A click focuses the control. Do not wrap Input that already has a label. Use for-id or htmlFor for Select and other controls without a built-in label."
    :code="basicCode"
  >
    <div class="stack">
      <div class="field">
        <RsLabel for-id="doc-email">{{ copy.email }}</RsLabel>
        <RsInput id="doc-email" v-model="email" type="email" :placeholder="copy.email" />
      </div>
      <div class="field">
        <RsLabel html-for="doc-role">{{ copy.role }}</RsLabel>
        <RsSelect id="doc-role" v-model="role" :options="roleOptions" />
      </div>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <div class="field">
          <RsLabel for-id="doc-email-dark">{{ copy.email }}</RsLabel>
          <RsInput id="doc-email-dark" :placeholder="copy.email" />
        </div>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-marks"
    title="必填 / 选填 / 冒号"
    title-en="Required / optional / colon"
    description="required 画星号，读屏走 label.required。optional 给国际表单的选填标记。colon 追加本地化冒号。两者同时传时只显示必填。"
    description-en="required paints the asterisk; screen readers use label.required. optional is the international optional mark. colon appends a localized colon. required wins if both marks are set."
    :code="marksCode"
  >
    <div class="stack">
      <div class="field">
        <RsLabel for-id="doc-required" required colon>{{ copy.email }}</RsLabel>
        <RsInput id="doc-required" type="email" :placeholder="copy.email" />
      </div>
      <div class="field">
        <RsLabel for-id="doc-optional" optional colon>{{ copy.phone }}</RsLabel>
        <RsInput id="doc-optional" :placeholder="copy.phone" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-hint"
    title="说明"
    title-en="Hint"
    description="hint 是纯文本。需要链接时用 #hint。hintId 可写到控件 aria-describedby；组件不会改控件 DOM。"
    description-en="hint is plain text. Use #hint for a link. Put hintId on the control’s aria-describedby — the label does not mutate the control DOM."
    :code="hintCode"
  >
    <div class="stack">
      <div class="field">
        <RsLabel for-id="doc-hint" required :hint="copy.hintLogin">{{ copy.email }}</RsLabel>
        <RsInput id="doc-hint" type="email" :placeholder="copy.email" />
      </div>
      <div class="field">
        <RsLabel for-id="doc-hint-slot" hint-id="doc-hint-name">
          {{ copy.nickname }}
          <template #hint>
            {{ copy.hintSlot }}
            <a class="hint-link" href="#/guide/i18n">{{ copy.hintLink }}</a>
          </template>
        </RsLabel>
        <RsInput
          id="doc-hint-slot"
          v-model="nickname"
          aria-describedby="doc-hint-name"
          :placeholder="copy.nickname"
        />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-nowrap"
    title="单行"
    title-en="Nowrap"
    description="左侧标签或固定列宽时用 nowrap，避免文案折行撑破对齐。"
    description-en="Use nowrap for a left-side label or a fixed column so wrapping does not break alignment."
    :code="nowrapCode"
  >
    <div class="field field--wide">
      <RsLabel for-id="doc-nowrap" nowrap required>{{ copy.org }}</RsLabel>
      <RsInput id="doc-nowrap" value="org-ruoshui-001" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 只改标签外观。控件要自己 disabled。整表禁用时标签继承 Form.disabled。"
    description-en="disabled only changes the label look. Disable the control yourself. Inside a disabled form the label inherits Form.disabled."
    :code="disabledCode"
  >
    <div class="stack">
      <div class="field">
        <RsLabel for-id="doc-disabled" required :hint="copy.disabledHint" disabled>
          {{ copy.org }}
        </RsLabel>
        <RsInput id="doc-disabled" disabled value="org-ruoshui-001" />
      </div>
      <RsForm disabled>
        <div class="field">
          <RsLabel for-id="doc-form-disabled">{{ copy.email }}</RsLabel>
          <RsInput id="doc-form-disabled" :placeholder="copy.formDisabled" />
        </div>
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。点标签不会发 click / change。可感知的是控件获得焦点。"
    description-en="No component events. A click on the label does not emit click or change. What you can feel is the control receiving focus."
    :code="eventsCode"
  >
    <div class="field">
      <RsLabel for-id="doc-events">{{ copy.email }}</RsLabel>
      <RsInput id="doc-events" v-model="eventEmail" @focus="onInputFocus" />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。聚焦走原生 for 或控件 focus()。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Focus with native for or the control’s focus(). Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsLabel ref="labelRef" for-id="doc-methods">{{ copy.email }}</RsLabel>
      <RsButton variant="default" @click="inspectLabelRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-lg);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xs);
  max-width: 20rem;
}

.field--wide {
  max-width: 24rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-md);
}

.hint-link {
  margin-inline-start: var(--rs-space-xs);
  color: var(--rs-text-link);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-text-secondary);
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

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text);
}
</style>
