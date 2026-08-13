import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useRsTableCore } from '../composables/useRsTableCore'
import type { RsTableColumn, RsTableRowData } from '../components/table-utils'

type Row = RsTableRowData & { id: string; name: string }

const columns: RsTableColumn<Row>[] = [{ key: 'name', title: 'Name' }]

describe('useRsTableCore performance guards', () => {
  it('选中变化不重绑 analytics feature（避免图表订阅抖动）', async () => {
    const setupCount = { n: 0 }
    const data = ref<Row[]>([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ])
    const selected = ref<string[]>([])

    const Host = defineComponent({
      setup() {
        const core = useRsTableCore<Row>({
          columns: () => columns,
          data: () => data.value,
          rowKey: () => 'id',
          compact: () => false,
          size: () => 'md',
          columnOrder: () => undefined,
          defaultColumnOrder: [],
          columnFilters: () => undefined,
          defaultColumnFilters: {},
          initialColumnWidths: () => undefined,
          resizable: () => false,
          columnLayout: () => 'auto',
          sort: () => undefined,
          defaultSort: null,
          sorts: () => undefined,
          defaultSorts: [],
          multiSort: () => false,
          remoteSort: () => false,
          filterText: () => undefined,
          filterKeys: () => undefined,
          groupBy: () => undefined,
          groupLabel: () => undefined,
          treeConfig: () => undefined,
          expandable: () => false,
          rowExpandable: () => undefined,
          selectedRowKeys: () => selected.value,
          defaultSelectedRowKeys: [],
          expandedRowKeys: () => undefined,
          defaultExpandedRowKeys: [],
          rowSelectable: () => undefined,
          height: () => 320,
          layoutActive: () => true,
          viewKey: () => undefined,
          virtual: () => true,
          virtualAutoThreshold: () => 50,
          fill: () => false,
          infinite: () => false,
          virtualOnInfinite: () => true,
          overscan: () => 4,
          expandRowHeight: () => undefined,
          rowHeight: () => undefined,
          selectable: () => true,
          editable: () => false,
          contextMenu: () => true,
          summaryFeatureEnabled: () => false,
          features: () => [
            {
              id: 'probe',
              setup() {
                setupCount.n += 1
              },
            },
          ],
          emit: vi.fn() as any,
        })
        return () => h('div', { 'data-view': core.viewRows.value.length })
      },
    })

    const wrapper = mount(Host)
    expect(setupCount.n).toBe(1)

    selected.value = ['1']
    await nextTick()
    selected.value = ['1', '2']
    await nextTick()
    expect(setupCount.n).toBe(1)

    // data 引用替换不应因选中之外的原因反复拆 feature；仅 features 签名变化才重绑
    data.value = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
      { id: '3', name: 'c' },
    ]
    await nextTick()
    expect(setupCount.n).toBe(1)

    wrapper.unmount()
  })

  it('viewRows 与 dataRows 同源同趟（引用长度一致）', () => {
    const Host = defineComponent({
      setup() {
        const core = useRsTableCore<Row>({
          columns: () => columns,
          data: () => [
            { id: '1', name: 'a' },
            { id: '2', name: 'b' },
          ],
          rowKey: () => 'id',
          compact: () => false,
          size: () => 'md',
          columnOrder: () => undefined,
          defaultColumnOrder: [],
          columnFilters: () => undefined,
          defaultColumnFilters: {},
          initialColumnWidths: () => undefined,
          resizable: () => false,
          columnLayout: () => 'auto',
          sort: () => undefined,
          defaultSort: null,
          sorts: () => undefined,
          defaultSorts: [],
          multiSort: () => false,
          remoteSort: () => false,
          filterText: () => undefined,
          filterKeys: () => undefined,
          groupBy: () => undefined,
          groupLabel: () => undefined,
          treeConfig: () => undefined,
          expandable: () => false,
          rowExpandable: () => undefined,
          selectedRowKeys: () => undefined,
          defaultSelectedRowKeys: [],
          expandedRowKeys: () => undefined,
          defaultExpandedRowKeys: [],
          rowSelectable: () => undefined,
          height: () => 320,
          layoutActive: () => true,
          viewKey: () => undefined,
          virtual: () => false,
          virtualAutoThreshold: () => 50,
          fill: () => false,
          infinite: () => false,
          virtualOnInfinite: () => true,
          overscan: () => 4,
          expandRowHeight: () => undefined,
          rowHeight: () => undefined,
          selectable: () => false,
          editable: () => false,
          contextMenu: () => true,
          summaryFeatureEnabled: () => false,
          features: () => undefined,
          emit: vi.fn() as any,
        })
        const ok = computed(
          () =>
            core.viewRows.value.length === core.dataRows.value.length &&
            core.viewRows.value[0] === core.dataRows.value[0]?.row,
        )
        return () => h('div', { 'data-ok': String(ok.value) })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.attributes('data-ok')).toBe('true')
    wrapper.unmount()
  })
})
