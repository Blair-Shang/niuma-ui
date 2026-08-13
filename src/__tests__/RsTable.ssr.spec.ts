import { defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'
import { createChartSeriesTableFeature } from '../components/table/table-features'
import { useRsTableHeadless } from '../composables/useRsTableHeadless'
import type { RsTableRowData } from '../components/table-utils'

type Row = RsTableRowData & { id: string; name: string; status: string }

const columns = [
  { key: 'name', title: 'Name' },
  { key: 'status', title: 'Status' },
]

const rows: Row[] = [
  { id: '1', name: 'a', status: 'ok' },
  { id: '2', name: 'b', status: 'wait' },
]

describe('RsTable SSR', () => {
  it('renderToString 产出 grid 语义与行数据（轻量只读）', async () => {
    const App = defineComponent({
      setup() {
        return () =>
          h(RsTable, {
            columns,
            data: rows,
            rowKey: 'id',
            virtual: false,
            editable: false,
            contextMenu: false,
            cellTooltip: false,
            ariaLabel: 'SSR 表',
          })
      },
    })
    const html = await renderToString(h(App))
    expect(html).toContain('role="region"')
    expect(html).toContain('role="grid"')
    expect(html).toContain('aria-label="SSR 表"')
    expect(html).toContain('role="gridcell"')
    expect(html).toContain('>a<')
    expect(html).toContain('>b<')
  })

  it('useRsTableHeadless 在无 document 依赖下可算 viewRows + series', async () => {
    let seriesIds: string[] = []
    const Host = defineComponent({
      setup() {
        const { api } = useRsTableHeadless<Row>({
          columns: () => columns,
          data: () => rows,
          rowKey: 'id',
          features: () => [
            createChartSeriesTableFeature({
              seriesDefs: [{ id: 'by-status', kind: 'pie', categoryField: 'status' }],
              onSeries: (series) => {
                seriesIds = series.map((s) => s.id)
              },
            }),
          ],
        })
        return () => h('div', { 'data-count': String(api.getViewRows().length) })
      },
    })
    const html = await renderToString(h(Host))
    expect(html).toContain('data-count="2"')
    expect(seriesIds).toEqual(['by-status'])
  })
})
