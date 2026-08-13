import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsForm from '../components/RsForm.vue'
import RsInput from '../components/RsInput.vue'
import RsSelect from '../components/RsSelect.vue'

const roleOptions = [
  { label: '成员', value: 'member' },
  { label: '管理员', value: 'admin' },
]

describe('RsForm', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders form element with base class', () => {
    const wrapper = mount(RsForm, {
      slots: { default: '<p class="slot">内容</p>' },
    })
    expect(wrapper.element.tagName).toBe('FORM')
    expect(wrapper.classes()).toContain('rs-form')
    expect(wrapper.find('.slot').text()).toBe('内容')
  })

  it('applies gap, maxWidth, and labelPosition classes', () => {
    const wrapper = mount(RsForm, {
      props: { gap: 'lg', maxWidth: 'sm', labelPosition: 'left' },
    })
    expect(wrapper.classes()).toContain('rs-form--gap-lg')
    expect(wrapper.classes()).toContain('rs-form--max-sm')
    expect(wrapper.classes()).toContain('rs-form--label-left')
  })

  it('defaults labelPosition class to top', () => {
    const wrapper = mount(RsForm)
    expect(wrapper.classes()).toContain('rs-form--label-top')
  })

  it('propagates labelPosition left to child inputs', async () => {
    const wrapper = mount(RsForm, {
      props: { labelPosition: 'left', labelWidth: '5rem' },
      slots: { default: '<RsInput model-value="" label="名称" />' },
      global: { components: { RsInput } },
    })
    await flushPromises()
    const field = wrapper.find('.rs-field')
    expect(field.classes()).toContain('rs-field--label-left')
    expect(field.attributes('style') ?? '').toContain('--rs-field-label-width: 5rem')
    wrapper.unmount()
  })

  it('propagates labelAlign end only when labelPosition is left', async () => {
    const leftAlign = mount(RsForm, {
      props: { labelPosition: 'left', labelAlign: 'end', labelWidth: '6rem' },
      slots: { default: '<RsInput model-value="" label="邮箱" />' },
      global: { components: { RsInput } },
    })
    await flushPromises()
    expect(leftAlign.find('.rs-field').classes()).toContain('rs-field--label-align-end')
    leftAlign.unmount()

    const topAlign = mount(RsForm, {
      props: { labelPosition: 'top', labelAlign: 'end' },
      slots: { default: '<RsInput model-value="" label="邮箱" />' },
      global: { components: { RsInput } },
    })
    await flushPromises()
    expect(topAlign.find('.rs-field').classes()).toContain('rs-field--label-top')
    expect(topAlign.find('.rs-field').classes()).not.toContain('rs-field--label-align-end')
    topAlign.unmount()
  })

  it('allows field labelPosition to override Form', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      template: `
        <RsForm label-position="left" label-width="5rem">
          <RsInput model-value="" label="继承" />
          <RsInput model-value="" label="覆盖" label-position="top" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const fields = wrapper.findAll('.rs-field')
    expect(fields[0]!.classes()).toContain('rs-field--label-left')
    expect(fields[1]!.classes()).toContain('rs-field--label-top')
    wrapper.unmount()
  })

  it('updates child label layout when Form labelPosition changes', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const labelPosition = ref<'top' | 'left'>('top')
        return { labelPosition }
      },
      template: `
        <RsForm :label-position="labelPosition" label-width="5rem">
          <RsInput model-value="" label="名称" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    expect(wrapper.find('.rs-form').classes()).toContain('rs-form--label-top')
    expect(wrapper.find('.rs-field').classes()).toContain('rs-field--label-top')

    wrapper.vm.labelPosition = 'left'
    await flushPromises()
    expect(wrapper.find('.rs-form').classes()).toContain('rs-form--label-left')
    expect(wrapper.find('.rs-field').classes()).toContain('rs-field--label-left')
    wrapper.unmount()
  })

  it('validate returns valid when all fields pass', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const email = ref('user@example.com')
        return { formRef, email }
      },
      template: `
        <RsForm ref="formRef">
          <RsInput v-model="email" rule="email" required />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(true)
    wrapper.unmount()
  })

  it('validate returns invalid when a field fails', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const email = ref('not-an-email')
        return { formRef, email }
      },
      template: `
        <RsForm ref="formRef">
          <RsInput v-model="email" rule="email" required />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(false)
    wrapper.unmount()
  })

  it('resetFields restores initial values', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const name = ref('初始值')
        return { formRef, name }
      },
      template: `
        <RsForm ref="formRef">
          <RsInput v-model="name" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    wrapper.vm.name = '已修改'
    await flushPromises()
    wrapper.vm.formRef!.resetFields()
    await flushPromises()
    expect(wrapper.vm.name).toBe('初始值')
    wrapper.unmount()
  })

  it('clearValidation clears input error state', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const email = ref('bad')
        return { formRef, email }
      },
      template: `
        <RsForm ref="formRef">
          <RsInput v-model="email" rule="email" required />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.rs-input-group--invalid').exists()).toBe(true)
    wrapper.vm.formRef!.clearValidation()
    await flushPromises()
    expect(wrapper.find('.rs-input-group--invalid').exists()).toBe(false)
    wrapper.unmount()
  })

  it('propagates disabled to child inputs', async () => {
    const wrapper = mount(RsForm, {
      props: { disabled: true },
      slots: { default: '<RsInput model-value="只读" />' },
      global: { components: { RsInput } },
    })
    await flushPromises()
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('propagates size to child inputs without explicit size', async () => {
    const wrapper = mount(RsForm, {
      props: { size: 'sm' },
      slots: { default: '<RsInput model-value="" />' },
      global: { components: { RsInput } },
    })
    await flushPromises()
    expect(wrapper.find('.rs-input-group--sm').exists()).toBe(true)
    wrapper.unmount()
  })

  it('validates required select field', async () => {
    const Host = defineComponent({
      components: { RsForm, RsSelect },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const role = ref('')
        return { formRef, role, roleOptions }
      },
      template: `
        <RsForm ref="formRef">
          <RsSelect v-model="role" :options="roleOptions" required />
        </RsForm>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const invalid = await wrapper.vm.formRef!.validate()
    expect(invalid.valid).toBe(false)
    wrapper.vm.role = 'member'
    await flushPromises()
    const valid = await wrapper.vm.formRef!.validate()
    expect(valid.valid).toBe(true)
    wrapper.unmount()
  })

  it('supports centralized rules by field name', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const userId = ref('')
        const rules = {
          userId: [
            { required: true, message: '必填' },
            { min: 3, message: '至少 3 位' },
          ],
        }
        return { formRef, userId, rules }
      },
      template: `
        <RsForm ref="formRef" :rules="rules">
          <RsInput v-model="userId" name="userId" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()

    const empty = await wrapper.vm.formRef!.validate()
    expect(empty.valid).toBe(false)
    expect(empty.errors.userId).toBe('必填')

    wrapper.vm.userId = 'ab'
    await flushPromises()
    const short = await wrapper.vm.formRef!.validate()
    expect(short.valid).toBe(false)
    expect(short.errors.userId).toBe('至少 3 位')

    wrapper.vm.userId = 'abc'
    await flushPromises()
    const ok = await wrapper.vm.formRef!.validate()
    expect(ok.valid).toBe(true)
    expect(ok.errors).toEqual({})
    wrapper.unmount()
  })

  it('validateField only checks one named field', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const userId = ref('')
        const email = ref('bad')
        const rules = {
          userId: [{ required: true, message: 'user required' }],
          email: [{ type: 'email' as const, message: 'bad email' }],
        }
        return { formRef, userId, email, rules }
      },
      template: `
        <RsForm ref="formRef" :rules="rules">
          <RsInput v-model="userId" name="userId" />
          <RsInput v-model="email" name="email" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validateField('userId')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('user required')
    expect(result.name).toBe('userId')
    wrapper.unmount()
  })

  it('supports async validator in rules', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const username = ref('admin')
        const rules = {
          username: [
            {
              async validator(value: unknown) {
                await Promise.resolve()
                if (String(value) === 'admin') return '占用'
                return true
              },
            },
          ],
        }
        return { formRef, username, rules }
      },
      template: `
        <RsForm ref="formRef" :rules="rules">
          <RsInput v-model="username" name="username" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(false)
    expect(result.errors.username).toBe('占用')
    wrapper.unmount()
  })

  it('renders custom Form #error slot content', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const name = ref('')
        const rules = {
          name: [{ required: true, message: '必填昵称' }],
        }
        return { formRef, name, rules }
      },
      template: `
        <RsForm ref="formRef" :rules="rules">
          <template #error="{ message }">
            <span class="custom-form-error">CUSTOM:{{ message }}</span>
          </template>
          <RsInput v-model="name" name="name" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.custom-form-error').text()).toBe('CUSTOM:必填昵称')
    wrapper.unmount()
  })

  it('field #error slot overrides Form errorRender', async () => {
    const Host = defineComponent({
      components: { RsForm, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const name = ref('')
        const rules = {
          name: [{ required: true, message: '必填' }],
        }
        const errorRender = () => h('span', { class: 'from-form' }, 'FORM')
        return { formRef, name, rules, errorRender }
      },
      template: `
        <RsForm ref="formRef" :rules="rules" :error-render="errorRender">
          <RsInput v-model="name" name="name">
            <template #error="{ message }">
              <span class="from-field">FIELD:{{ message }}</span>
            </template>
          </RsInput>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.from-field').text()).toBe('FIELD:必填')
    expect(wrapper.find('.from-form').exists()).toBe(false)
    wrapper.unmount()
  })
})
