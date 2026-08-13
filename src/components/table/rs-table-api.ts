/**
 * RsTable 公开 API 契约（对标 AG Grid GridApi / TanStack table 实例）。
 *
 * 设计原则（大厂共性）：
 * - 业务与第三方只依赖本接口，不依赖 SFC 内部变量
 * - 加性演进：新增方法用可选字段或 bump RS_TABLE_API_VERSION
 * - 查询与命令分离：getXxx 无副作用；setXxx / commitXxx 为命令
 *
 * 兼容承诺：同主版本内不删除、不改语义已有方法签名。
 */

import type { RsTableStagedCell } from '../../composables/useTableEdit'
import type { RsTableAnalyticsSnapshot } from '../../composables/useRsTableSelectionSource'
import type { RsTableColumn, RsTableRowData } from '../table-utils'

/** 公开 API 语义版本（与 package 版本解耦，专指 TableApi 契约） */
export const RS_TABLE_API_VERSION = '1.0.0' as const

/**
 * 表格实例 API：ref / expose / provide / inject 共用同一形状。
 */
export interface RsTableApi<T extends RsTableRowData = RsTableRowData> {
  readonly apiVersion: typeof RS_TABLE_API_VERSION

  // -- 行查询 --
  getRowByKey: (rowKey: string) => T | undefined
  getRowByIndex: (index: number) => T | undefined
  getColumnValues: (colKey: string) => unknown[]
  getCellValue: (rowKey: string, colKey: string) => unknown

  // -- 视图 / 选中（分析与图表真源）--
  /** 筛选/排序后的业务行（不含 group/expand 伪行） */
  getViewRows: () => T[]
  getSelectedRows: () => T[]
  getSelectedRowKeys: () => string[]
  getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
  subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void

  // -- 高亮 --
  getHighlightedRowKey: () => string | undefined
  setHighlightedRowKey: (key: string | undefined) => void

  // -- 编辑 --
  cancelCellEdit: () => void
  cancelAllEdits: () => void
  getDirtyCellKeys: () => string[]
  getCellError: (rowKey: string, colKey: string) => string | undefined
  setCellError: (rowKey: string, colKey: string, message: string | null) => void
  stageCell: (cell: RsTableStagedCell) => void
  rejectRowEdit: (rowKey: string, reason?: string) => void
  undoEdit: () => void
  redoEdit: () => void
  commitRowEdits: (rowKey: string) => void
  rollbackRowEdits: (rowKey: string) => void

  // -- 扩展元数据（可选，便于遥测）--
  getActiveFeatureIds?: () => string[]
  /** 实例 Feature 贡献的工具条项 */
  getToolbarItems?: () => import('./rs-table-feature-host').RsTableToolbarItem[]
  /** 实例 Feature 贡献的 overlay 描述 */
  getOverlayContributions?: () => import('./rs-table-feature-host').RsTableOverlayContribution[]
}

/** provide/inject 键：子组件或插槽内拿表格 API */
export const RS_TABLE_API_KEY: unique symbol = Symbol('rsTableApi')

/**
 * 由 RsTable 内部装配公开 API（单一出口，避免 expose 与 inject 漂移）。
 */
export function createRsTableApi<T extends RsTableRowData>(
  impl: Omit<RsTableApi<T>, 'apiVersion'> & { apiVersion?: typeof RS_TABLE_API_VERSION },
): RsTableApi<T> {
  return {
    apiVersion: impl.apiVersion ?? RS_TABLE_API_VERSION,
    ...impl,
  }
}

/** 类型守卫：判断未知对象是否像 RsTableApi */
export function isRsTableApi<T extends RsTableRowData = RsTableRowData>(
  value: unknown,
): value is RsTableApi<T> {
  if (!value || typeof value !== 'object') return false
  const api = value as Partial<RsTableApi<T>>
  return (
    typeof api.getViewRows === 'function' &&
    typeof api.getSelectedRows === 'function' &&
    typeof api.getAnalyticsSnapshot === 'function'
  )
}

/** 列定义辅助：标记某列参与图表分类（文档/约定，不强制运行时） */
export type RsTableColumnChartMeta = {
  chartCategory?: boolean
  chartValue?: boolean
}

export type RsTableColumnWithChartMeta<T extends RsTableRowData = RsTableRowData> = RsTableColumn<T> &
  RsTableColumnChartMeta
