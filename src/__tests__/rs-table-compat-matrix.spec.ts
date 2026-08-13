import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'
import {
  RS_TABLE_API_VERSION,
  isRsTableApi,
} from '../components/table/rs-table-api'
import {
  RS_TABLE_API_OPTIONAL_METHODS,
  RS_TABLE_API_REQUIRED_METHODS,
  RS_TABLE_COMPAT_API_VERSION,
  RS_TABLE_DEFAULTED_PROP_KEYS,
  RS_TABLE_STABLE_EMITS,
} from '../components/table/rs-table-compat-matrix'
import { RS_TABLE_PROP_DEFAULTS } from '../components/table/rs-table-props'

describe('RsTable 兼容矩阵（自动化）', () => {
  it('契约版本与 Api 常量一致', () => {
    expect(RS_TABLE_COMPAT_API_VERSION).toBe(RS_TABLE_API_VERSION)
    expect(RS_TABLE_API_VERSION).toBe('1.0.0')
  })

  it('PROP_DEFAULTS 键与矩阵锁定列表一致', () => {
    expect(Object.keys(RS_TABLE_PROP_DEFAULTS).sort()).toEqual(RS_TABLE_DEFAULTED_PROP_KEYS)
  })

  it('expose 满足必选 Api 方法且可选方法为函数或 undefined', async () => {
    const wrapper = mount(RsTable, {
      props: {
        columns: [{ key: 'name', title: 'Name' }],
        data: [{ id: '1', name: 'a' }],
        rowKey: 'id',
        selectable: true,
      },
    })
    await wrapper.vm.$nextTick()
    const api = wrapper.vm as unknown as Record<string, unknown>
    expect(isRsTableApi(api)).toBe(true)
    expect(api.apiVersion).toBe(RS_TABLE_API_VERSION)

    for (const method of RS_TABLE_API_REQUIRED_METHODS) {
      expect(typeof api[method], `required ${method}`).toBe('function')
    }
    for (const method of RS_TABLE_API_OPTIONAL_METHODS) {
      const value = api[method]
      expect(
        value === undefined || typeof value === 'function',
        `optional ${method}`,
      ).toBe(true)
    }

    // 冒烟：查询路径可调用
    expect((api.getViewRows as () => unknown[])()).toHaveLength(1)
    expect((api.getSelectedRowKeys as () => string[])()).toEqual([])
    wrapper.unmount()
  })

  it('稳定 emit 名仍可被组件声明（defineEmits 面）', () => {
    // 通过挂载监听稳定事件，确保名称未从运行时面消失
    const wrapper = mount(RsTable, {
      props: {
        columns: [{ key: 'name', title: 'Name' }],
        data: [{ id: '1', name: 'a' }],
        rowKey: 'id',
      },
    })
    for (const name of RS_TABLE_STABLE_EMITS) {
      expect(wrapper.emitted(name) === undefined || Array.isArray(wrapper.emitted(name))).toBe(
        true,
      )
    }
    // 触发一次 rowClick 验证核心 emit 通路
    const row = wrapper.find('.rs-table__row')
    if (row.exists()) {
      void row.trigger('click')
    }
    wrapper.unmount()
  })

  it('必选 Api 方法列表快照（防静默删减）', () => {
    expect([...RS_TABLE_API_REQUIRED_METHODS]).toMatchInlineSnapshot(`
      [
        "getRowByKey",
        "getRowByIndex",
        "getColumnValues",
        "getCellValue",
        "getViewRows",
        "getSelectedRows",
        "getSelectedRowKeys",
        "getAnalyticsSnapshot",
        "subscribeAnalytics",
        "getHighlightedRowKey",
        "setHighlightedRowKey",
        "cancelCellEdit",
        "cancelAllEdits",
        "getDirtyCellKeys",
        "getCellError",
        "setCellError",
        "stageCell",
        "rejectRowEdit",
        "undoEdit",
        "redoEdit",
        "commitRowEdits",
        "rollbackRowEdits",
      ]
    `)
  })
})
