import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it, beforeEach } from 'vitest'
import RsTable from '../components/RsTable.vue'
import { createRsTableFeatureHost } from '../components/table/rs-table-feature-host'
import {
  resolveInstanceFeatures,
  RsTableModuleRegistry,
} from '../components/table/rs-table-module-registry'
import {
  createOverlayTableFeature,
  createToolbarTableFeature,
} from '../components/table/table-features'
import { useRsTableHeadless } from '../composables/useRsTableHeadless'
import type { RsTableRowData } from '../components/table-utils'

type Row = RsTableRowData & { id: string; name: string }

const columns = [{ key: 'name', title: 'Name' }]

function analyticsStub() {
  return {
    getViewRows: () => [] as Row[],
    getSelectedRows: () => [] as Row[],
    getAnalyticsSnapshot: () => ({
      sourceRows: [] as Row[],
      viewRows: [] as Row[],
      selectedRows: [] as Row[],
      sourceMode: 'view' as const,
      selectedCount: 0,
      viewCount: 0,
    }),
    subscribeAnalytics: () => () => undefined,
  }
}

describe('RsTable 多表隔离', () => {
  beforeEach(() => {
    RsTableModuleRegistry.clear()
  })

  it('两个 FeatureHost 贡献袋互不污染', () => {
    const a = createRsTableFeatureHost<Row>()
    const b = createRsTableFeatureHost<Row>()
    const stub = analyticsStub()
    a.setup(
      [createToolbarTableFeature({ items: [{ key: 'a-only', label: 'A' }] })],
      a.createContext(stub),
    )
    b.setup(
      [createToolbarTableFeature({ items: [{ key: 'b-only', label: 'B' }] })],
      b.createContext(stub),
    )
    expect(a.getToolbarItems().map((i) => i.key)).toEqual(['a-only'])
    expect(b.getToolbarItems().map((i) => i.key)).toEqual(['b-only'])
  })

  it('同页两表选中与 viewRows 互不影响', async () => {
    const t1 = mount(RsTable, {
      props: {
        columns,
        data: [{ id: '1', name: 'a' }] as Row[],
        rowKey: 'id',
        selectable: true,
        selectedRowKeys: ['1'],
      },
    })
    const t2 = mount(RsTable, {
      props: {
        columns,
        data: [{ id: '2', name: 'b' }] as Row[],
        rowKey: 'id',
        selectable: true,
        selectedRowKeys: [],
      },
    })
    await nextTick()

    const api1 = t1.vm as unknown as {
      getSelectedRowKeys: () => string[]
      getViewRows: () => Row[]
      getToolbarItems: () => Array<{ key: string }>
    }
    const api2 = t2.vm as unknown as {
      getSelectedRowKeys: () => string[]
      getViewRows: () => Row[]
    }
    expect(api1.getSelectedRowKeys()).toEqual(['1'])
    expect(api2.getSelectedRowKeys()).toEqual([])
    expect(api1.getViewRows()[0]?.id).toBe('1')
    expect(api2.getViewRows()[0]?.id).toBe('2')

    t1.unmount()
    t2.unmount()
  })

  it('ModuleRegistry 全局生效；实例同 id 可覆盖', () => {
    RsTableModuleRegistry.register(
      createOverlayTableFeature({
        items: [{ key: 'global-chart', slot: 'chart' }],
      }),
    )
    const hostA = createRsTableFeatureHost<Row>()
    const hostB = createRsTableFeatureHost<Row>()
    const stub = analyticsStub()
    const featuresA = resolveInstanceFeatures<Row>([
      createOverlayTableFeature({
        id: 'overlayExtra',
        items: [{ key: 'a-chart', slot: 'chart-a' }],
      }),
    ])
    const featuresB = resolveInstanceFeatures<Row>([])
    hostA.setup(featuresA, hostA.createContext(stub))
    hostB.setup(featuresB, hostB.createContext(stub))
    expect(hostA.getOverlayContributions().map((i) => i.key)).toEqual(['a-chart'])
    expect(hostB.getOverlayContributions().map((i) => i.key)).toEqual(['global-chart'])
  })

  it('useRsTableHeadless 两实例状态与 toolbar 隔离', async () => {
    const Host = defineComponent({
      setup() {
        const h1 = useRsTableHeadless<Row>({
          columns: () => columns,
          data: () => [{ id: '1', name: 'a' }],
          rowKey: 'id',
          features: () => [
            createToolbarTableFeature({ items: [{ key: 't1', label: 'T1' }] }),
          ],
        })
        const h2 = useRsTableHeadless<Row>({
          columns: () => columns,
          data: () => [
            { id: '2', name: 'b' },
            { id: '3', name: 'c' },
          ],
          rowKey: 'id',
          features: () => [
            createToolbarTableFeature({ items: [{ key: 't2', label: 'T2' }] }),
          ],
        })
        return () =>
          h('div', {
            'data-v1': String(h1.api.getViewRows().length),
            'data-v2': String(h2.api.getViewRows().length),
            'data-t1': h1.getToolbarItems()[0]?.key ?? '',
            'data-t2': h2.getToolbarItems()[0]?.key ?? '',
          })
      },
    })
    const wrapper = mount(Host)
    await nextTick()
    expect(wrapper.attributes('data-v1')).toBe('1')
    expect(wrapper.attributes('data-v2')).toBe('2')
    expect(wrapper.attributes('data-t1')).toBe('t1')
    expect(wrapper.attributes('data-t2')).toBe('t2')
    wrapper.unmount()
  })
})
