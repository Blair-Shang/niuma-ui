import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach } from 'vitest'
import RsTable from '../components/RsTable.vue'
import { createRsTableApi, isRsTableApi, RS_TABLE_API_VERSION } from '../components/table/rs-table-api'
import { createRsTableFeatureHost } from '../components/table/rs-table-feature-host'
import { RsTableModuleRegistry, resolveInstanceFeatures } from '../components/table/rs-table-module-registry'
import {
  createAnalyticsTableFeature,
  createChartSeriesTableFeature,
  createContextMenuTableFeature,
} from '../components/table/table-features'
import type { RsTableRowData } from '../components/table-utils'
import { useRsTable } from '../composables/useRsTable'

type Row = RsTableRowData & { id: string; name: string }

function stubAnalytics() {
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

describe('RsTableApi / FeatureHost / ModuleRegistry', () => {
  beforeEach(() => {
    RsTableModuleRegistry.clear()
  })

  it('createRsTableApi 冻结 apiVersion 与查询方法', () => {
    const api = createRsTableApi<Row>({
      getRowByKey: () => undefined,
      getRowByIndex: () => undefined,
      getColumnValues: () => [],
      getCellValue: () => undefined,
      getViewRows: () => [],
      getSelectedRows: () => [],
      getSelectedRowKeys: () => [],
      getAnalyticsSnapshot: stubAnalytics().getAnalyticsSnapshot,
      subscribeAnalytics: stubAnalytics().subscribeAnalytics,
      getHighlightedRowKey: () => undefined,
      setHighlightedRowKey: () => undefined,
      cancelCellEdit: () => undefined,
      cancelAllEdits: () => undefined,
      getDirtyCellKeys: () => [],
      getCellError: () => undefined,
      setCellError: () => undefined,
      stageCell: () => undefined,
      rejectRowEdit: () => undefined,
      undoEdit: () => undefined,
      redoEdit: () => undefined,
      commitRowEdits: () => undefined,
      rollbackRowEdits: () => undefined,
    })
    expect(api.apiVersion).toBe(RS_TABLE_API_VERSION)
    expect(isRsTableApi(api)).toBe(true)
    expect(isRsTableApi({})).toBe(false)
  })

  it('FeatureHost 收集 contextMenu 贡献并 merge', () => {
    const host = createRsTableFeatureHost<Row>()
    const ctx = host.createContext(stubAnalytics())
    host.setup(
      [
        {
          id: 'export-row',
          setup(featureCtx) {
            featureCtx.contributeContextMenuItems?.((items) => {
              items.push({ key: 'export', label: '导出' })
            })
          },
        },
      ],
      ctx,
    )
    const merged = host.mergeContextMenuItems(
      [{ key: 'copy', label: '复制' }],
      { row: null, selectedRows: [] },
    )
    expect(merged.map((i) => i.key)).toEqual(['copy', '__ctx-feature-sep', 'export'])
    expect(host.getActiveFeatureIds()).toEqual(['export-row'])
  })

  it('ModuleRegistry 全局注册并被 resolveInstanceFeatures 合并', () => {
    const analytics = createAnalyticsTableFeature<Row>({
      onSnapshot: () => undefined,
    })
    RsTableModuleRegistry.register(analytics)
    expect(RsTableModuleRegistry.listIds()).toContain('analytics')

    const resolved = resolveInstanceFeatures<Row>([
      { id: 'local', setup() {} },
    ])
    expect(resolved.map((f) => f.id).sort()).toEqual(['analytics', 'local'])

    const override = resolveInstanceFeatures<Row>([
      {
        id: 'analytics',
        setup() {},
      },
    ])
    expect(override.find((f) => f.id === 'analytics')?.setup).not.toBe(analytics.setup)
  })

  it('useRsTable.bindFeatures 合并内置与全局模块', () => {
    RsTableModuleRegistry.register({
      id: 'plugin-a',
      setup() {},
    })
    const surface = useRsTable<Row>()
    const dispose = surface.bindFeatures({
      builtinIds: ['selection'],
      instanceFeatures: [{ id: 'local', setup() {} }],
      ...stubAnalytics(),
    })
    expect(surface.getActiveFeatureIds()).toEqual(
      expect.arrayContaining(['selection', 'plugin-a', 'local']),
    )
    dispose()
    expect(surface.getActiveFeatureIds()).toEqual([])
  })

  it('createChartSeriesTableFeature 产出 series 并登记 overlay', () => {
    const host = createRsTableFeatureHost<Row>()
    const seriesSeen: string[] = []
    const ctx = host.createContext({
      ...stubAnalytics(),
      getAnalyticsSnapshot: () => ({
        sourceRows: [
          { id: '1', name: 'a' },
          { id: '2', name: 'a' },
          { id: '3', name: 'b' },
        ] as Row[],
        viewRows: [],
        selectedRows: [],
        sourceMode: 'view',
        selectedCount: 0,
        viewCount: 0,
      }),
      subscribeAnalytics: (listener) => {
        listener({
          sourceRows: [
            { id: '1', name: 'a' },
            { id: '2', name: 'a' },
            { id: '3', name: 'b' },
          ] as Row[],
          viewRows: [],
          selectedRows: [],
          sourceMode: 'view',
          selectedCount: 0,
          viewCount: 0,
        })
        return () => undefined
      },
    })
    host.setup(
      [
        createChartSeriesTableFeature<Row>({
          seriesDefs: [{ id: 'by-name', kind: 'pie', categoryField: 'name' }],
          onSeries: (series) => {
            seriesSeen.push(...series.map((s) => s.id))
          },
        }),
      ],
      ctx,
    )
    expect(seriesSeen).toEqual(['by-name'])
    expect(host.getOverlayContributions().map((i) => i.key)).toEqual(['chart'])
  })

  it('RsTable expose 符合 RsTableApi 契约', async () => {
    const wrapper = mount(RsTable, {
      props: {
        columns: [{ key: 'name', title: 'Name' }],
        data: [{ id: '1', name: 'a' }],
        rowKey: 'id',
        selectable: true,
        features: [
          createContextMenuTableFeature({
            items: [{ key: 'ping', label: 'Ping' }],
          }),
        ],
      },
    })
    await wrapper.vm.$nextTick()
    const api = wrapper.vm as unknown as {
      apiVersion: string
      getViewRows: () => Row[]
      getSelectedRowKeys: () => string[]
      getActiveFeatureIds: () => string[]
    }
    expect(api.apiVersion).toBe(RS_TABLE_API_VERSION)
    expect(isRsTableApi(api)).toBe(true)
    expect(api.getViewRows().length).toBe(1)
    expect(api.getSelectedRowKeys()).toEqual([])
    expect(api.getActiveFeatureIds()).toEqual(expect.arrayContaining(['contextMenuExtra']))
  })
})
