import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import RsConfigProvider from '../components/RsConfigProvider.vue'
import RsForm from '../components/RsForm.vue'
import RsSelect from '../components/RsSelect.vue'
import {
  filterSelectOptions,
  fromComboboxValue,
  normalizeSelectOptions,
  optionDisplayLabel,
  packSelectModel,
  restoreSelectValue,
  sortSelectOptions,
  splitByTokenSeparators,
  toComboboxValue,
  RS_SELECT_EMPTY_VALUE,
} from '../components/select-utils'

describe('RsSelect', () => {
  const options = [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'Claude', value: 'claude' },
  ]

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders trigger with custom placeholder', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', placeholder: '选择模型' },
    })
    expect(wrapper.find('.rs-select__trigger').exists()).toBe(true)
    expect(wrapper.find('.rs-select__placeholder').text()).toBe('选择模型')
  })

  it('uses zh-CN default placeholder', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
    })
    expect(wrapper.find('.rs-select__placeholder').text()).toBe('请选择')
  })

  it('keeps numeric option values on v-model including 0', async () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    const wrapper = mount(RsSelect, {
      props: { options: numeric, modelValue: 0 },
    })
    expect(wrapper.find('.rs-select__single-label').text()).toBe('静态配置')
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', '1')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('collapses overflow tags with maxTagCount', () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: ['gpt-4o', 'claude'],
        multiple: true,
        maxTagCount: 1,
      },
    })
    expect(wrapper.findAll('.rs-select__tag')).toHaveLength(2)
    expect(wrapper.find('.rs-select__tag--rest').text()).toBe('+1')
  })

  it('renders prefix and option slots', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
      slots: {
        prefix: () => h('span', { class: 'pref' }, 'P'),
        option: ({ option }: { option: { label: string } }) =>
          h('span', { class: 'opt' }, option.label),
      },
      attachTo: document.body,
    })
    expect(wrapper.find('.pref').text()).toBe('P')
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.opt')?.textContent).toContain('GPT-4o')
    wrapper.unmount()
  })

  it('marks invalid on the trigger instead of the combobox root', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', invalid: true },
    })
    expect(wrapper.find('.rs-select__trigger').classes()).toContain('rs-select__trigger--invalid')
    expect(wrapper.find('.rs-select__trigger').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.rs-select').attributes('aria-invalid')).toBeUndefined()
  })

  it('uses en-US default placeholder inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsSelect, { options, modelValue: '' }),
      },
    })
    expect(wrapper.find('.rs-select__placeholder').text()).toBe('Select')
  })

  it('forwards v-model through Reka ComboboxRoot', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', 'claude')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['claude'])
  })

  it('shows selected option label in single mode', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'claude' },
    })
    expect(wrapper.find('.rs-select__single-label').text()).toBe('Claude')
  })

  it('applies modifier classes for multiple and searchable', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: [], multiple: true, searchable: true },
    })
    expect(wrapper.find('.rs-select').classes()).toContain('rs-select--multiple')
    expect(wrapper.find('.rs-select').classes()).toContain('rs-select--searchable')
  })

  it('does not render search input while dropdown is closed', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', searchable: true },
    })
    expect(wrapper.find('.rs-select__search').exists()).toBe(false)
  })

  it('shows clear button when clearable and has value', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'gpt-4o', clearable: true },
    })
    expect(wrapper.find('.rs-select__clear').exists()).toBe(true)
  })

  it('clears value when clear button is clicked', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'gpt-4o', clearable: true },
    })
    await wrapper.find('.rs-select__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('maps empty option value through sentinel without crashing', async () => {
    const withEmpty = [
      { label: '空串项', value: '' },
      { label: 'Claude', value: 'claude' },
    ]
    const wrapper = mount(RsSelect, {
      props: { options: withEmpty, modelValue: '', clearable: true },
      attachTo: document.body,
    })
    expect(wrapper.find('.rs-select__placeholder').exists()).toBe(true)
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('空串项')
    wrapper.unmount()
  })

  it('selecting empty sentinel emits empty string', async () => {
    const withEmpty = [
      { label: '空串项', value: '' },
      { label: 'Claude', value: 'claude' },
    ]
    const wrapper = mount(RsSelect, {
      props: { options: withEmpty, modelValue: 'claude', clearable: true },
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', '__rs_select_empty__')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('supports multiple mode tags', () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: ['gpt-4o', 'claude'],
        multiple: true,
      },
    })
    expect(wrapper.find('.rs-select__tag').exists()).toBe(true)
    expect(wrapper.findAll('.rs-select__tag')).toHaveLength(2)
  })

  it('removes tag in multiple mode', async () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: ['gpt-4o', 'claude'],
        multiple: true,
      },
    })
    await wrapper.find('.rs-select__tag-remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['claude']])
  })

  it('setValue via defineExpose updates model', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
    })
    const exposed = wrapper.vm as InstanceType<typeof RsSelect>
    exposed.setValue('claude')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['claude'])
  })

  it('setValue supports multiple mode', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: [], multiple: true },
    })
    const exposed = wrapper.vm as InstanceType<typeof RsSelect>
    exposed.setValue(['gpt-4o', 'claude'])
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['gpt-4o', 'claude']])
  })

  it('shows loading status text when dropdown is open', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', loading: true, searchable: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-select__status')?.textContent).toBe('加载中…')
    wrapper.unmount()
  })

  it('uses custom loading text when dropdown is open', async () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: '',
        loading: true,
        loadingText: 'Fetching…',
        searchable: true,
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-select__status')?.textContent).toBe('Fetching…')
    wrapper.unmount()
  })

  it('disables trigger when disabled', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'gpt-4o', disabled: true },
    })
    expect(wrapper.find('.rs-select__trigger').attributes('data-disabled')).toBeDefined()
  })

  it('validates required field inside RsForm', async () => {
    const Host = defineComponent({
      components: { RsForm, RsSelect },
      setup() {
        const formRef = ref<InstanceType<typeof RsForm> | null>(null)
        const role = ref('')
        return { formRef, role, roleOptions: options }
      },
      template: `
        <RsForm ref="formRef">
          <RsSelect v-model="role" name="role" :options="roleOptions" required />
        </RsForm>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const invalid = await wrapper.vm.formRef!.validate()
    expect(invalid.valid).toBe(false)
    wrapper.vm.role = 'claude'
    await flushPromises()
    const valid = await wrapper.vm.formRef!.validate()
    expect(valid.valid).toBe(true)
    wrapper.unmount()
  })

  it('enables manual filter when remote', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', searchable: true, remote: true },
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    expect(root.props('ignoreFilter')).toBe(true)
  })

  it('enables manual filter when searchable so query hides non-matches', async () => {
    const typeOptions = [
      { label: 'INT', value: 'INT' },
      { label: 'BIGINT', value: 'BIGINT' },
      { label: 'NVARCHAR', value: 'NVARCHAR' },
      { label: 'NVARCHAR(MAX)', value: 'NVARCHAR(MAX)' },
    ]
    const wrapper = mount(RsSelect, {
      props: {
        options: typeOptions,
        modelValue: 'BIGINT',
        searchable: true,
        creatable: true,
      },
      attachTo: document.body,
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    expect(root.props('ignoreFilter')).toBe(true)

    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input).toBeTruthy()
    input!.value = 'NVA'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const labels = [...document.querySelectorAll('.rs-select__item-label')].map(
      (el) => el.textContent?.trim() ?? '',
    )
    expect(labels).toContain('NVARCHAR')
    expect(labels).toContain('NVARCHAR(MAX)')
    expect(labels).not.toContain('INT')
    expect(labels).not.toContain('BIGINT')
    expect(document.querySelector('.rs-select__item--create')?.textContent).toContain('NVA')
    wrapper.unmount()
  })

  it('filterOption false keeps the full list while typing', async () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: '',
        searchable: true,
        filterOption: false,
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    input!.value = 'zzz'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    const labels = [...document.querySelectorAll('.rs-select__item-label')].map(
      (el) => el.textContent?.trim() ?? '',
    )
    expect(labels).toContain('GPT-4o')
    expect(labels).toContain('Claude')
    wrapper.unmount()
  })

  it('creatable enables search and commits typed value on Enter', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', creatable: true },
      attachTo: document.body,
    })
    expect(wrapper.find('.rs-select').classes()).toContain('rs-select--searchable')
    expect(wrapper.find('.rs-select').classes()).toContain('rs-select--creatable')

    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input).toBeTruthy()
    input!.value = 'CITEXT'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const createItem = document.querySelector('.rs-select__item--create')
    expect(createItem?.textContent).toContain('CITEXT')

    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['CITEXT'])
    wrapper.unmount()
  })

  it('creatable does not offer create when query matches an option', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', creatable: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    input!.value = 'claude'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect(document.querySelector('.rs-select__item--create')).toBeNull()
    wrapper.unmount()
  })

  it('defaults to content wider than trigger; matchTriggerWidth locks equal width', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const content = document.querySelector('.rs-select__content')
    expect(content).toBeTruthy()
    expect(content!.classList.contains('rs-select__content--match-trigger')).toBe(false)

    await wrapper.setProps({ matchTriggerWidth: true })
    await flushPromises()
    const matched = document.querySelector('.rs-select__content')
    expect(matched!.classList.contains('rs-select__content--match-trigger')).toBe(true)
    wrapper.unmount()
  })

  it('packs labelInValue including numeric 0', async () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    const wrapper = mount(RsSelect, {
      props: { options: numeric, modelValue: '', labelInValue: true },
    })
    expect(wrapper.find('.rs-select__placeholder').exists()).toBe(true)
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', '0')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      { label: '静态配置', value: 0 },
    ])
  })

  it('echoes labelInValue snapshot for number 0', () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    const wrapper = mount(RsSelect, {
      props: {
        options: numeric,
        modelValue: { label: '静态配置', value: 0 },
        labelInValue: true,
      },
    })
    expect(wrapper.find('.rs-select__single-label').text()).toBe('静态配置')
  })

  it('packs labelInValue arrays in multiple mode', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: [], multiple: true, labelInValue: true },
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', ['gpt-4o'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      [{ label: 'GPT-4o', value: 'gpt-4o' }],
    ])
  })

  it('emits select, deselect and clear', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', clearable: true },
    })
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', 'claude')
    expect(wrapper.emitted('select')?.at(-1)?.[0]).toBe('claude')

    await wrapper.setProps({ modelValue: 'claude' })
    await root.vm.$emit('update:modelValue', 'gpt-4o')
    expect(wrapper.emitted('deselect')?.at(-1)?.[0]).toBe('claude')
    expect(wrapper.emitted('select')?.at(-1)?.[0]).toBe('gpt-4o')

    await wrapper.setProps({ modelValue: 'gpt-4o' })
    await wrapper.find('.rs-select__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('truncates tag text with maxTagTextLength', () => {
    const wrapper = mount(RsSelect, {
      props: {
        options: [{ label: 'TypeScript', value: 'ts' }],
        modelValue: ['ts'],
        multiple: true,
        maxTagTextLength: 4,
      },
    })
    expect(wrapper.find('.rs-select__tag-label').text()).toBe('Type…')
  })

  it('applies warning status on the trigger', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', status: 'warning' },
    })
    expect(wrapper.find('.rs-select__trigger').classes()).toContain('rs-select__trigger--warning')
    expect(wrapper.find('.rs-select__trigger').classes()).not.toContain(
      'rs-select__trigger--invalid',
    )
  })

  it('treats status error as invalid', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', status: 'error' },
    })
    expect(wrapper.find('.rs-select__trigger').classes()).toContain('rs-select__trigger--invalid')
    expect(wrapper.find('.rs-select__trigger').classes()).not.toContain(
      'rs-select__trigger--warning',
    )
  })

  it('hides arrow when showArrow is false', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', showArrow: false },
    })
    expect(wrapper.find('.rs-select__suffix').exists()).toBe(false)
  })

  it('sorts options with filterSort', async () => {
    const unsorted = [
      { label: 'Zulu', value: 'z' },
      { label: 'Alpha', value: 'a' },
    ]
    const wrapper = mount(RsSelect, {
      props: {
        options: unsorted,
        modelValue: '',
        filterSort: (a, b) => String(a.label).localeCompare(String(b.label)),
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const items = [...document.body.querySelectorAll('.rs-select__item-label')].map(
      (el) => el.textContent?.trim(),
    )
    expect(items[0]).toBe('Alpha')
    expect(items[1]).toBe('Zulu')
    wrapper.unmount()
  })

  it('renders header and footer slots', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
      slots: {
        header: () => h('div', { class: 'sel-head' }, 'HEAD'),
        footer: () => h('div', { class: 'sel-foot' }, 'FOOT'),
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.sel-head')?.textContent).toBe('HEAD')
    expect(document.body.querySelector('.sel-foot')?.textContent).toBe('FOOT')
    wrapper.unmount()
  })

  it('applies popupClassName and listHeight on the panel', async () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: '',
        popupClassName: 'extra-popup',
        listHeight: 120,
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const content = document.body.querySelector('.rs-select__content') as HTMLElement | null
    expect(content?.classList.contains('extra-popup')).toBe(true)
    expect(content?.style.getPropertyValue('--rs-select-list-height')).toBe('120px')
    wrapper.unmount()
  })

  it('commits tokens when typing a separator', async () => {
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: [],
        multiple: true,
        searchable: true,
        tokenSeparators: [','],
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input).toBeTruthy()
    input!.value = 'gpt-4o,'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['gpt-4o']])
    wrapper.unmount()
  })

  it('maps fieldNames including numeric 0', async () => {
    const raw = [
      { name: '静态配置', id: 0 },
      { name: '服务发现', id: 1 },
    ]
    const wrapper = mount(RsSelect, {
      props: {
        options: raw,
        modelValue: 0,
        fieldNames: { label: 'name', value: 'id' },
      },
    })
    expect(wrapper.find('.rs-select__single-label').text()).toBe('静态配置')
    const root = wrapper.getComponent({ name: 'ComboboxRoot' })
    await root.vm.$emit('update:modelValue', '1')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('shows optionLabelProp on the trigger', () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'claude', optionLabelProp: 'value' },
    })
    expect(wrapper.find('.rs-select__single-label').text()).toBe('claude')
  })

  it('binds searchValue and emits updates', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '', searchable: true, searchValue: 'cla' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input?.value).toBe('cla')
    input!.value = 'gpt'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update:searchValue')?.at(-1)).toEqual(['gpt'])
    wrapper.unmount()
  })

  it('does not fill search with the selected value when opening', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'claude', searchable: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input?.value).toBe('')
    const labels = [...document.querySelectorAll('.rs-select__item-label')].map(
      (el) => el.textContent?.trim() ?? '',
    )
    expect(labels).toContain('GPT-4o')
    expect(labels).toContain('Claude')
    wrapper.unmount()
  })

  it('fills search with the selected label when fillSearchWithValue', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: 'claude', searchable: true, fillSearchWithValue: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    const input = document.querySelector('.rs-select__search') as HTMLInputElement | null
    expect(input?.value).toBe('Claude')
    const labels = [...document.querySelectorAll('.rs-select__item-label')].map(
      (el) => el.textContent?.trim() ?? '',
    )
    expect(labels).toContain('Claude')
    expect(labels).not.toContain('GPT-4o')
    wrapper.unmount()
  })

  it('renders dropdownRender instead of the default panel body', async () => {
    const wrapper = mount(RsSelect, {
      props: { options, modelValue: '' },
      slots: {
        dropdownRender: () => h('div', { class: 'custom-dd' }, 'CUSTOM'),
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.custom-dd')?.textContent).toBe('CUSTOM')
    expect(document.body.querySelector('.rs-select__item')).toBeNull()
    wrapper.unmount()
  })

  it('mounts the panel into getPopupContainer', async () => {
    const host = document.createElement('div')
    host.id = 'rs-select-portal-host'
    document.body.appendChild(host)
    const wrapper = mount(RsSelect, {
      props: {
        options,
        modelValue: '',
        getPopupContainer: () => host,
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-select__trigger').trigger('click')
    await flushPromises()
    expect(host.querySelector('.rs-select__content')).toBeTruthy()
    wrapper.unmount()
    host.remove()
  })
})

describe('select-utils', () => {
  const contains = (text: string, search: string) =>
    text.toLowerCase().includes(search.toLowerCase())

  it('maps empty string to combobox sentinel and back', () => {
    expect(toComboboxValue('')).toBe(RS_SELECT_EMPTY_VALUE)
    expect(toComboboxValue('claude')).toBe('claude')
    expect(toComboboxValue(0)).toBe('0')
    expect(fromComboboxValue(RS_SELECT_EMPTY_VALUE)).toBe('')
    expect(fromComboboxValue('claude')).toBe('claude')
  })

  it('restoreSelectValue keeps option number type', () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    expect(restoreSelectValue('0', numeric)).toBe(0)
    expect(restoreSelectValue('1', numeric)).toBe(1)
    expect(restoreSelectValue('custom', numeric)).toBe('custom')
  })

  it('filterSelectOptions honors filterOption and optionFilterProp', () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    const byValue = filterSelectOptions(numeric, '0', contains, true, 'value')
    expect(byValue).toHaveLength(1)
    expect(byValue[0]).toMatchObject({ value: 0 })

    const custom = filterSelectOptions(numeric, '发现', contains, (q, opt) =>
      String(opt.label).includes(q),
    )
    expect(custom).toHaveLength(1)
    expect(custom[0]).toMatchObject({ value: 1 })

    const unfiltered = filterSelectOptions(numeric, 'zzz', contains, false)
    expect(unfiltered).toHaveLength(2)
  })

  it('packSelectModel keeps number 0 and labelInValue', () => {
    const numeric = [
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ]
    expect(packSelectModel([0], numeric, false, false)).toBe(0)
    expect(packSelectModel([0], numeric, false, true)).toEqual({
      label: '静态配置',
      value: 0,
    })
    expect(packSelectModel([0, 1], numeric, true, true)).toEqual([
      { label: '静态配置', value: 0 },
      { label: '服务发现', value: 1 },
    ])
    expect(packSelectModel([], numeric, false, true)).toBe('')
  })

  it('sortSelectOptions sorts flat and grouped lists', () => {
    const flat = [
      { label: 'Zulu', value: 'z' },
      { label: 'Alpha', value: 'a' },
    ]
    const sorted = sortSelectOptions(flat, (a, b) => String(a.label).localeCompare(String(b.label)))
    expect(sorted.map((item) => ('value' in item ? item.value : ''))).toEqual(['a', 'z'])

    const grouped = [
      {
        label: '后端',
        options: [
          { label: 'Go', value: 'go' },
          { label: 'Ada', value: 'ada' },
        ],
      },
    ]
    const groupedSorted = sortSelectOptions(grouped, (a, b) =>
      String(a.label).localeCompare(String(b.label)),
    )
    expect(groupedSorted[0]).toMatchObject({ label: '后端' })
    if ('options' in groupedSorted[0]) {
      expect(groupedSorted[0].options.map((opt) => opt.value)).toEqual(['ada', 'go'])
    }
  })

  it('splitByTokenSeparators splits on the first matching separator', () => {
    expect(splitByTokenSeparators('a,b,c', [','])).toEqual(['a', 'b', 'c'])
    expect(splitByTokenSeparators('ab', [','])).toBeNull()
    expect(splitByTokenSeparators('a;b', [',', ';'])).toEqual(['a', 'b'])
  })

  it('normalizeSelectOptions maps fieldNames and keeps number 0', () => {
    const raw = [
      { name: '静态配置', id: 0 },
      {
        name: '后端',
        children: [
          { name: 'Go', id: 'go' },
          { name: 'Ada', id: 'ada' },
        ],
      },
    ]
    const normalized = normalizeSelectOptions(raw, {
      label: 'name',
      value: 'id',
      options: 'children',
    })
    expect(normalized[0]).toMatchObject({ label: '静态配置', value: 0 })
    expect(normalized[1]).toMatchObject({ label: '后端' })
    if ('options' in normalized[1]) {
      expect(normalized[1].options.map((opt) => opt.value)).toEqual(['go', 'ada'])
    }
  })

  it('optionDisplayLabel reads optionLabelProp', () => {
    const option = { label: 'Claude', value: 'claude', code: 'CL' }
    expect(optionDisplayLabel(option)).toBe('Claude')
    expect(optionDisplayLabel(option, 'value')).toBe('claude')
    expect(optionDisplayLabel(option, 'code')).toBe('CL')
  })

  it('filterSelectOptions filters flat and grouped options', () => {
    const grouped = [
      {
        label: '前端',
        options: [
          { label: 'Vue', value: 'vue' },
          { label: 'React', value: 'react' },
        ],
      },
      {
        label: '后端',
        options: [{ label: 'Go', value: 'go' }],
      },
    ]
    const result = filterSelectOptions(grouped, 'vue', contains)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ label: '前端' })
    if ('options' in result[0]) {
      expect(result[0].options).toHaveLength(1)
      expect(result[0].options[0]?.value).toBe('vue')
    }
  })
})
