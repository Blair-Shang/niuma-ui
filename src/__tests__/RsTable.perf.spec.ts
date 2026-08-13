import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'
import { assertWithinBudget, RS_TABLE_PERF_BUDGETS } from './perf-budgets'

function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `row-${i}`,
    count: i % 100,
    status: i % 2 === 0 ? 'ok' : 'wait',
  }))
}

const columns = [
  { key: 'name', title: '名称', width: 120 },
  { key: 'count', title: '数量', width: 80, align: 'right' as const },
  { key: 'status', title: '状态', width: 80 },
]

const editableColumns = [
  { key: 'name', title: '名称', width: 120, editable: true },
  { key: 'count', title: '数量', width: 80, align: 'right' as const, editable: true, valueType: 'number' as const },
  {
    key: 'status',
    title: '状态',
    width: 100,
    editable: true,
    valueType: 'select' as const,
    editorOptions: {
      options: [
        { value: 'ok', label: 'OK' },
        { value: 'wait', label: 'Wait' },
      ],
    },
  },
]

describe('RsTable performance baselines', () => {
  it('mounts 3000 readonly rows within budget', () => {
    const data = makeRows(3000)
    const started = performance.now()
    const wrapper = mount(RsTable, {
      props: {
        columns,
        data,
        rowKey: 'id',
        virtual: true,
        height: 480,
      },
    })
    const elapsed = performance.now() - started
    expect(wrapper.find('.rs-table').exists()).toBe(true)
    assertWithinBudget(elapsed, RS_TABLE_PERF_BUDGETS.mountReadonly3k, 'mountReadonly3k')
    wrapper.unmount()
  })

  it('editable flag does not explode mount cost vs readonly', () => {
    const data = makeRows(2000)
    const readonlyStart = performance.now()
    const readonlyWrapper = mount(RsTable, {
      props: { columns, data, rowKey: 'id', virtual: true, height: 480 },
    })
    const readonlyElapsed = performance.now() - readonlyStart
    readonlyWrapper.unmount()

    const editableStart = performance.now()
    const editableWrapper = mount(RsTable, {
      props: {
        columns: editableColumns,
        data,
        rowKey: 'id',
        editable: true,
        virtual: true,
        height: 480,
      },
    })
    const editableElapsed = performance.now() - editableStart
    const limit =
      readonlyElapsed * RS_TABLE_PERF_BUDGETS.editableVsReadonlyRatio +
      RS_TABLE_PERF_BUDGETS.editableVsReadonlySlackMs
    assertWithinBudget(editableElapsed, limit, 'editableVsReadonly')
    expect(editableWrapper.find('.rs-table-cell-editor').exists()).toBe(false)
    editableWrapper.unmount()
  })

  it('dual tables mount within budget (isolation + ViewContext)', () => {
    const data = makeRows(1500)
    const started = performance.now()
    const a = mount(RsTable, {
      props: { columns, data, rowKey: 'id', virtual: true, height: 320, ariaLabel: 'A' },
    })
    const b = mount(RsTable, {
      props: { columns, data, rowKey: 'id', virtual: true, height: 320, ariaLabel: 'B' },
    })
    const elapsed = performance.now() - started
    expect(a.find('.rs-table-shell').attributes('aria-label')).toBe('A')
    expect(b.find('.rs-table-shell').attributes('aria-label')).toBe('B')
    assertWithinBudget(elapsed, RS_TABLE_PERF_BUDGETS.mountDual1k5, 'mountDual1k5')
    a.unmount()
    b.unmount()
  })

  it('opening one editor keeps editor count at 1', async () => {
    const data = makeRows(500)
    const wrapper = mount(RsTable, {
      props: {
        columns: editableColumns,
        data,
        rowKey: 'id',
        editable: true,
        virtual: true,
        height: 480,
      },
    })
    const cells = wrapper.findAll('.rs-table__cell-body--editable')
    expect(cells.length).toBeGreaterThan(0)
    await cells[0]!.trigger('dblclick')
    expect(wrapper.findAll('.rs-table-cell-editor')).toHaveLength(1)
    wrapper.unmount()
  })
})
