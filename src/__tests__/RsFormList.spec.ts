import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsForm from '../components/RsForm.vue'
import RsFormItem from '../components/RsFormItem.vue'
import RsFormList from '../components/RsFormList.vue'
import RsInput from '../components/RsInput.vue'

describe('RsFormList', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('adds and removes rows on Form.model', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsFormList, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const model = ref<{ users: Array<{ name: string }> }>({ users: [] })
        return { formRef, model }
      },
      template: `
        <RsForm ref="formRef" :model="model">
          <RsFormList name="users">
            <template #default="{ fields, add, remove }">
              <div v-for="field in fields" :key="field.key" class="row">
                <RsFormItem :name="[field.name, 'name']" required>
                  <RsInput />
                </RsFormItem>
                <button type="button" class="remove" @click="remove(field.index)">x</button>
              </div>
              <button type="button" class="add" @click="add({ name: '' })">add</button>
            </template>
          </RsFormList>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    await wrapper.find('.add').trigger('click')
    await flushPromises()
    expect(wrapper.vm.model.users).toEqual([{ name: '' }])

    const invalid = await wrapper.vm.formRef!.validate()
    expect(invalid.valid).toBe(false)
    expect(invalid.errors['users.0.name']).toBe('此项为必填')

    wrapper.find('input').setValue('Ada')
    await flushPromises()
    const ok = await wrapper.vm.formRef!.validate()
    expect(ok.valid).toBe(true)
    expect(wrapper.vm.model.users[0]?.name).toBe('Ada')

    await wrapper.find('.remove').trigger('click')
    await flushPromises()
    expect(wrapper.vm.model.users).toEqual([])
    wrapper.unmount()
  })

  it('resolves list-relative dependencies and getFieldValue', async () => {
    const Host = defineComponent({
      components: { RsForm, RsFormItem, RsFormList, RsInput },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const model = ref({
          users: [{ password: 'aa', confirm: 'bb' }],
        })
        return { formRef, model }
      },
      template: `
        <RsForm ref="formRef" :model="model">
          <RsFormList name="users">
            <template #default="{ fields }">
              <div v-for="field in fields" :key="field.key">
                <RsFormItem :name="[field.name, 'password']">
                  <RsInput />
                </RsFormItem>
                <RsFormItem
                  :name="[field.name, 'confirm']"
                  :dependencies="[[field.name, 'password']]"
                  :rules="[{
                    validator(value, ctx) {
                      if (String(value) !== String(ctx.getFieldValue([field.name, 'password']))) {
                        return '两次密码不一致'
                      }
                      return true
                    }
                  }]"
                >
                  <RsInput />
                </RsFormItem>
              </div>
            </template>
          </RsFormList>
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    await flushPromises()
    const invalid = await wrapper.vm.formRef!.validate()
    expect(invalid.valid).toBe(false)
    expect(invalid.errors['users.0.confirm']).toBe('两次密码不一致')

    wrapper.vm.model.users[0]!.password = 'bb'
    await flushPromises()
    expect(wrapper.findAll('.rs-form-item__error').length).toBe(0)
    wrapper.unmount()
  })
})
