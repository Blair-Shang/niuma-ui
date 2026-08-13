/**
 * RsTable 特性插件协议。
 *
 * 目标：新能力以 feature 注册，避免继续向 RsTable.vue 堆分支。
 *
 * 已迁出 composable 的内置能力（行为真源）：
 * - virtual → useRsTableVirtual + useRsTableColumnVirtual + useRsTableScrollLayout
 * - contextMenu → useRsTableContextMenu
 * - summary → useRsTableSummary
 * - sort/selection/filter/tree → useRsTableEngine / useRsTableColumns / useRsTableInteraction
 * - edit → useTableEdit + useRsTableEditActions
 * - analytics / chart → useRsTableSelectionSource + useRsTableChartBridge（表外）
 *
 * Feature.setup 用于生命周期登记与扩展点；重逻辑不在此重复执行。
 *
 * 视图分层（世界级演进）：
 * - Core / Shell / EditLayer = 行为真源
 * - RsTableColGroup / Header / Body / BodyRow = 纯视图，不持业务状态
 */

import type { RsContextMenuItem } from '../context-menu-utils'
import type { RsTableRowData } from '../table-utils'
import type { RsTableAnalyticsSnapshot } from '../../composables/useRsTableSelectionSource'
import type {
  RsTableOverlayContribution,
  RsTableToolbarItem,
} from './rs-table-feature-host'
import {
  buildTableChartSeriesList,
  type RsTableChartSeries,
  type RsTableChartSeriesDef,
} from './table-chart-utils'

/**
 * 表格特性插件上下文（只读查询 + 订阅 + 有限贡献点）。
 * Feature 不得直接操作表格 DOM；图表/指标通过 snapshot / subscribe 接入。
 */
export interface RsTableFeatureContext<T extends RsTableRowData = RsTableRowData> {
  /** 当前筛选/排序后的业务行（Engine.viewRows） */
  getViewRows: () => T[]
  /** 当前选中行 */
  getSelectedRows: () => T[]
  /**
   * 分析快照：含 sourceRows（选中优先）与 sourceMode。
   * 柱状图/饼图等应消费 sourceRows，而不是直接绑原始 data。
   */
  getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
  /**
   * 订阅分析快照变化（浅层：view/selected 引用或 sourceMode）。
   * @returns teardown
   */
  subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  /**
   * 向右键菜单贡献项（setup 时调用）。
   * - 传入数组：静态追加
   * - 传入函数：每次打开菜单时动态贡献（可 push 到 items）
   */
  contributeContextMenuItems?: (
    contributor:
      | RsContextMenuItem[]
      | ((
          items: RsContextMenuItem[],
          menuCtx: { row: T | null; selectedRows: T[] },
        ) => void),
  ) => void
  /**
   * 向工具条贡献项（实例级；多表互不共享贡献袋）。
   */
  contributeToolbarItems?: (
    contributor: RsTableToolbarItem[] | ((items: RsTableToolbarItem[]) => void),
  ) => void
  /**
   * 向 overlay 旁路贡献挂载描述（图表壳等，不直接改表格 DOM）。
   */
  contributeOverlay?: (
    contributor:
      | RsTableOverlayContribution[]
      | ((items: RsTableOverlayContribution[]) => void),
  ) => void
}

/**
 * 企业级表格特性插件接口。
 *
 * @property id 稳定标识，与 props 开关 / 遥测对齐
 * @property setup 挂载时调用；可返回 teardown
 */
export interface RsTableFeature<T extends RsTableRowData = RsTableRowData> {
  id: string
  setup(ctx: RsTableFeatureContext<T>): void | (() => void)
}

/**
 * 内置特性 id（与 RsTable props 开关映射）。
 * analytics 不进内置 props 开关：由业务通过 ChartBridge / Feature 外挂。
 */
export type RsTableBuiltinFeatureId =
  | 'selection'
  | 'sort'
  | 'filter'
  | 'virtual'
  | 'edit'
  | 'tree'
  | 'contextMenu'
  | 'summary'

/** 已有独立 composable 承载的内置 id（feature 仅作登记） */
export const RS_TABLE_FEATURE_COMPOSABLE_MAP: Record<
  RsTableBuiltinFeatureId,
  string | null
> = {
  selection: 'useRsTableEngine',
  sort: 'useRsTableEngine',
  filter: 'useRsTableEngine',
  virtual: 'useRsTableVirtual+useRsTableColumnVirtual+useRsTableScrollLayout',
  edit: 'useTableEdit+useRsTableEditActions',
  tree: 'useRsTableEngine+useRsTableInteraction',
  contextMenu: 'useRsTableContextMenu',
  summary: 'useRsTableSummary',
}

/** 列布局/拖拽非 builtin feature id，但属内核横切能力 */
export const RS_TABLE_COLUMN_SHELL = {
  layout: 'useRsTableColumnLayout',
  resize: 'useRsTableColumnResize',
} as const

/** 表外分析/图表扩展入口（不进 RsTable 内核渲染） */
export const RS_TABLE_ANALYTICS_SHELL = {
  selectionSource: 'useRsTableSelectionSource',
  chartBridge: 'useRsTableChartBridge',
  chartUtils: 'table-chart-utils',
} as const

/**
 * 按 props 开关解析应启用的内置特性 id 列表。
 */
export function resolveBuiltinTableFeatures(flags: {
  selectable?: boolean
  sortableColumns?: boolean
  filterable?: boolean
  virtual?: boolean | 'auto'
  editable?: boolean
  tree?: boolean
  contextMenu?: boolean
  summary?: boolean
}): RsTableBuiltinFeatureId[] {
  const ids: RsTableBuiltinFeatureId[] = []
  if (flags.selectable) ids.push('selection')
  if (flags.sortableColumns !== false) ids.push('sort')
  if (flags.filterable) ids.push('filter')
  if (flags.virtual !== false) ids.push('virtual')
  if (flags.editable) ids.push('edit')
  if (flags.tree) ids.push('tree')
  if (flags.contextMenu !== false) ids.push('contextMenu')
  if (flags.summary) ids.push('summary')
  return ids
}

/**
 * 依次 setup 特性列表，并返回统一 teardown（逆序 dispose）。
 */
export function setupTableFeatures<T extends RsTableRowData>(
  features: RsTableFeature<T>[],
  ctx: RsTableFeatureContext<T>,
): () => void {
  const teardowns: Array<() => void> = []
  for (const feature of features) {
    const dispose = feature.setup(ctx)
    if (typeof dispose === 'function') teardowns.push(dispose)
  }
  return () => {
    for (const dispose of teardowns.reverse()) dispose()
  }
}

/**
 * 创建已绑定 composable 真源的内置 feature。
 */
export function createBuiltinTableFeatures<T extends RsTableRowData>(
  ids: RsTableBuiltinFeatureId[],
): RsTableFeature<T>[] {
  return ids.map((id) => ({
    id,
    setup(ctx) {
      if (import.meta.env.DEV && id === 'summary') {
        void ctx.getAnalyticsSnapshot()
      }
    },
  }))
}

/**
 * 创建分析/图表旁路 feature：setup 时订阅 snapshot，交由业务 listener。
 * 用于把「选中 → 图表」挂到统一生命周期，而不改 RsTable 模板。
 */
export function createAnalyticsTableFeature<T extends RsTableRowData>(options: {
  id?: string
  onSnapshot: (snap: RsTableAnalyticsSnapshot<T>) => void
}): RsTableFeature<T> {
  return {
    id: options.id ?? 'analytics',
    setup(ctx) {
      return ctx.subscribeAnalytics(options.onSnapshot)
    },
  }
}

/**
 * 创建右键菜单贡献 feature（静态项或动态函数）。
 */
export function createContextMenuTableFeature<T extends RsTableRowData>(options: {
  id?: string
  items:
    | RsContextMenuItem[]
    | ((
        items: RsContextMenuItem[],
        menuCtx: { row: T | null; selectedRows: T[] },
      ) => void)
}): RsTableFeature<T> {
  return {
    id: options.id ?? 'contextMenuExtra',
    setup(ctx) {
      ctx.contributeContextMenuItems?.(options.items)
    },
  }
}

/** 创建工具条贡献 feature */
export function createToolbarTableFeature(options: {
  id?: string
  items: RsTableToolbarItem[] | ((items: RsTableToolbarItem[]) => void)
}): RsTableFeature {
  return {
    id: options.id ?? 'toolbarExtra',
    setup(ctx) {
      ctx.contributeToolbarItems?.(options.items)
    },
  }
}

/** 创建 overlay 贡献 feature（图表旁路挂载点等） */
export function createOverlayTableFeature(options: {
  id?: string
  items:
    | RsTableOverlayContribution[]
    | ((items: RsTableOverlayContribution[]) => void)
}): RsTableFeature {
  return {
    id: options.id ?? 'overlayExtra',
    setup(ctx) {
      ctx.contributeOverlay?.(options.items)
    },
  }
}

/**
 * 官方图表 Feature：订阅 analytics → 库无关 series，并登记 overlay 挂载点。
 * 不捆绑 ECharts/Chart.js；业务用 onSeries 映射 option。
 */
export function createChartSeriesTableFeature<T extends RsTableRowData>(options: {
  id?: string
  seriesDefs: RsTableChartSeriesDef[] | (() => RsTableChartSeriesDef[])
  onSeries: (
    series: RsTableChartSeries[],
    snap: RsTableAnalyticsSnapshot<T>,
  ) => void
  /** overlay 登记；默认 key=chart / slot=chart */
  overlay?: RsTableOverlayContribution
}): RsTableFeature<T> {
  return {
    id: options.id ?? 'chartSeries',
    setup(ctx) {
      ctx.contributeOverlay?.([
        options.overlay ?? { key: 'chart', slot: 'chart', meta: { kind: 'series' } },
      ])
      return ctx.subscribeAnalytics((snap) => {
        const defs =
          typeof options.seriesDefs === 'function' ? options.seriesDefs() : options.seriesDefs
        options.onSeries(buildTableChartSeriesList(snap.sourceRows, defs), snap)
      })
    },
  }
}
