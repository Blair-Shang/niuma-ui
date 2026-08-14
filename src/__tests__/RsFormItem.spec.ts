import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../components/RsConfigProvider.vue'
import RsForm from '../components/RsForm.vue'
import RsFormItem from '../components/RsFormItem.vue'
import RsDatePicker from '../components/RsDatePicker.vue'
import RsInput from '../components/RsInput.vue'
import RsSelect from '../components/RsSelect.vue'
import RsSwitch from '../components/RsSwitch.vue'
import RsTimePicker from '../components/RsTimePicker.vue'

describe('RsFormItem', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('validates custom slot content without rendering an input', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        return { formRef, service }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="service" name="service" required>
            <button type="button" class="picker">pick</button>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()

    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(false)
    expect(result.errors.service).toBe('此项为必填')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('.rs-form-item__error').text()).toBe('此项为必填')
    expect(wrapper.find('.picker').exists()).toBe(true)
    wrapper.unmount()
  })

  it('uses en-US required copy inside RsConfigProvider', async () => {
    const Host = defineComponent({
      components: { RsConfigProvider, RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        return { formRef, service }
      },
      template: `
        <RsConfigProvider locale="en-US">
          <RsForm ref="formRef">
            <RsFormItem v-model="service" name="service" required>
              <button type="button">pick</button>
            </RsFormItem>
          </RsForm>
        </RsConfigProvider>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(false)
    expect(result.errors.service).toBe('This field is required')
    wrapper.unmount()
  })

  it('clears error when custom value changes after submit', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        return { formRef, service }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="service" name="service" required>
            <button type="button" class="picker">pick</button>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.rs-form-item__error').exists()).toBe(true)

    wrapper.vm.service = 'svc-1'
    await flushPromises()
    expect(wrapper.find('.rs-form-item__error').exists()).toBe(false)

    wrapper.vm.service = ''
    await flushPromises()
    expect(wrapper.find('.rs-form-item__error').text()).toBe('此项为必填')
    wrapper.unmount()
  })

  it('resetFields restores the item model', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('initial')
        return { formRef, service }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="service" name="service">
            <span class="value">{{ service }}</span>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    wrapper.vm.service = 'changed'
    await flushPromises()
    wrapper.vm.formRef!.resetFields()
    await flushPromises()
    expect(wrapper.vm.service).toBe('initial')
    wrapper.unmount()
  })

  it('exposes invalid via default slot props', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        return { formRef, service }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="service" name="service" required>
            <template #default="{ invalid }">
              <button type="button" class="picker" :data-invalid="invalid">pick</button>
            </template>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    expect(wrapper.find('.picker').attributes('data-invalid')).toBe('false')
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.picker').attributes('data-invalid')).toBe('true')
    wrapper.unmount()
  })

  it('renders Form #error slot for item messages', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        const rules = {
          service: [{ required: true, message: 'pick a service' }],
        }
        return { formRef, service, rules }
      },
      template: `
        <RsForm ref="formRef" :rules="rules">
          <template #error="{ message }">
            <span class="custom-form-error">CUSTOM:{{ message }}</span>
          </template>
          <RsFormItem v-model="service" name="service">
            <button type="button">pick</button>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.find('.custom-form-error').text()).toBe('CUSTOM:pick a service')
    wrapper.unmount()
  })

  it('does not register when name is omitted', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        return { formRef }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem required>
            <button type="button">layout only</button>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
    wrapper.unmount()
  })

  it('interpolates required message with label', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const service = ref('')
        return { formRef, service }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="service" name="service" label="关联服务" required>
            <button type="button">pick</button>
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.errors.service).toBe('请填写关联服务')
    wrapper.unmount()
  })

  it('lets Form.Item own the field so nested RsInput does not show a second error', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const email = ref('')
        return { formRef, email }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="email" name="email" required>
            <RsInput />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()
    expect(wrapper.findAll('.rs-form-item__error')).toHaveLength(1)
    expect(wrapper.find('.rs-input-field__error').exists()).toBe(false)
    expect(wrapper.find('.rs-input-group--invalid').exists()).toBe(true)
    wrapper.unmount()
  })

  it('binds Form.model into nested input without child v-model', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const model = ref({ email: '' })
        return { formRef, model }
      },
      template: `
        <RsForm ref="formRef" :model="model">
          <RsFormItem name="email" required>
            <RsInput />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    wrapper.find('input').setValue('a@b.com')
    await flushPromises()
    expect(wrapper.vm.model.email).toBe('a@b.com')
    wrapper.vm.formRef!.setFieldsValue({ email: 'c@d.com' })
    await flushPromises()
    expect(wrapper.vm.model.email).toBe('c@d.com')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('c@d.com')
    wrapper.unmount()
  })

  it('renders help and extra', () => {
    const wrapper = mount(RsFormItem, {
      props: { help: '辅助说明', extra: '额外提示' },
      slots: { default: '<span class="ctrl">x</span>' },
    })
    expect(wrapper.find('.rs-form-item__help').text()).toBe('辅助说明')
    expect(wrapper.find('.rs-form-item__extra').text()).toBe('额外提示')
    wrapper.unmount()
  })

  it('revalidates when a dependency field changes', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const model = ref({ password: 'aa', confirm: 'bb' })
        return { formRef, model }
      },
      template: `
        <RsForm ref="formRef" :model="model">
          <RsFormItem name="password" label="密码" required>
            <RsInput />
          </RsFormItem>
          <RsFormItem
            name="confirm"
            label="确认密码"
            :dependencies="['password']"
            :rules="[{
              validator(value, ctx) {
                if (String(value) !== String(ctx.getFieldValue('password'))) return '两次密码不一致'
                return true
              }
            }]"
          >
            <RsInput />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const result = await wrapper.vm.formRef!.validate()
    expect(result.valid).toBe(false)
    expect(result.errors.confirm).toBe('两次密码不一致')

    wrapper.vm.model.password = 'bb'
    await flushPromises()
    expect(wrapper.findAll('.rs-form-item__error').length).toBe(0)
    wrapper.unmount()
  })

  it('does not overwrite a child that already binds v-model', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsSwitch },
      setup() {
        const model = ref({ deptAdminFlag: 'N' })
        const toBool = (v: string) => v === 'Y'
        const fromBool = (v: boolean) => (v ? 'Y' : 'N')
        return { model, toBool, fromBool }
      },
      template: `
        <RsForm :model="model">
          <RsFormItem name="deptAdminFlag">
            <RsSwitch
              :model-value="toBool(model.deptAdminFlag)"
              @update:model-value="(v) => (model.deptAdminFlag = fromBool(v))"
            />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(false)
    await wrapper.find('.rs-switch__root').trigger('click')
    await flushPromises()
    expect(wrapper.vm.model.deptAdminFlag).toBe('Y')
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(true)
    wrapper.unmount()
  })

  it('lets Form.Item inject Y/N into Switch via checkedValue', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsSwitch },
      setup() {
        const model = ref({ deptAdminFlag: 'N' })
        return { model }
      },
      template: `
        <RsForm :model="model">
          <RsFormItem name="deptAdminFlag">
            <RsSwitch checked-value="Y" unchecked-value="N" />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(false)
    await wrapper.find('.rs-switch__root').trigger('click')
    await flushPromises()
    expect(wrapper.vm.model.deptAdminFlag).toBe('Y')
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(true)
    wrapper.unmount()
  })

  it('paints DatePicker invalid on the trigger, not the field wrapper', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsDatePicker },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const expire = ref('')
        return { formRef, expire }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="expire" name="expire" required>
            <RsDatePicker />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()

    const trigger = wrapper.find('.rs-date-picker__trigger')
    expect(trigger.classes()).toContain('rs-date-picker__trigger--invalid')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.rs-date-picker').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('.rs-field').attributes('aria-invalid')).toBeUndefined()
    wrapper.unmount()
  })

  it('paints TimePicker invalid on the trigger, not the field wrapper', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsTimePicker },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const time = ref('')
        return { formRef, time }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="time" name="time" required>
            <RsTimePicker />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()

    const trigger = wrapper.find('.rs-time-picker__trigger')
    expect(trigger.classes()).toContain('rs-time-picker__trigger--invalid')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.rs-field').attributes('aria-invalid')).toBeUndefined()
    wrapper.unmount()
  })

  it('paints Select invalid on the trigger, not the combobox root', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsSelect },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const role = ref('')
        const options = [{ label: '管理员', value: 'admin' }]
        return { formRef, role, options }
      },
      template: `
        <RsForm ref="formRef">
          <RsFormItem v-model="role" name="role" required>
            <RsSelect :options="options" />
          </RsFormItem>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.vm.formRef!.validate()
    await flushPromises()

    const trigger = wrapper.find('.rs-select__trigger')
    expect(trigger.classes()).toContain('rs-select__trigger--invalid')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.rs-select').attributes('aria-invalid')).toBeUndefined()
    wrapper.unmount()
  })
})
