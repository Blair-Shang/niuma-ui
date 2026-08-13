/**
 * RsTable 公开契约兼容矩阵（单一真源）。
 *
 * - 测试锁定这些键：删除/改名 = 失败，须 bump RS_TABLE_API_VERSION
 * - 文档与 CI 共用，避免矩阵与实现漂移
 */

import { RS_TABLE_API_VERSION } from './rs-table-api'
import { RS_TABLE_PROP_DEFAULTS } from './rs-table-props'

/** 当前锁定的 API 契约版本（与 createRsTableApi 一致） */
export const RS_TABLE_COMPAT_API_VERSION = RS_TABLE_API_VERSION

/**
 * 1.0.x 必选 Api 方法（加性可选方法不在此列）。
 * 删减任一项视为 breaking。
 */
export const RS_TABLE_API_REQUIRED_METHODS = [
  'getRowByKey',
  'getRowByIndex',
  'getColumnValues',
  'getCellValue',
  'getViewRows',
  'getSelectedRows',
  'getSelectedRowKeys',
  'getAnalyticsSnapshot',
  'subscribeAnalytics',
  'getHighlightedRowKey',
  'setHighlightedRowKey',
  'cancelCellEdit',
  'cancelAllEdits',
  'getDirtyCellKeys',
  'getCellError',
  'setCellError',
  'stageCell',
  'rejectRowEdit',
  'undoEdit',
  'redoEdit',
  'commitRowEdits',
  'rollbackRowEdits',
] as const

/** 1.0.x 加性可选 Api（可缺省，但若存在须为函数） */
export const RS_TABLE_API_OPTIONAL_METHODS = [
  'getActiveFeatureIds',
  'getToolbarItems',
  'getOverlayContributions',
] as const

/**
 * 稳定 emit 名（同主版本不删）。
 * 新增 emit 可追加到测试期望的超集校验。
 */
export const RS_TABLE_STABLE_EMITS = [
  'rowClick',
  'rowDblclick',
  'cellView',
  'update:selectedRowKeys',
  'selectionChange',
  'loadMore',
  'cellEditCommit',
  'cellEditCancel',
  'rowEditCommit',
  'rowEditRollback',
] as const

/** 带默认值的 props 键（与 RS_TABLE_PROP_DEFAULTS 同步校验） */
export const RS_TABLE_DEFAULTED_PROP_KEYS = Object.keys(RS_TABLE_PROP_DEFAULTS).sort()

export type RsTableApiRequiredMethod = (typeof RS_TABLE_API_REQUIRED_METHODS)[number]
export type RsTableApiOptionalMethod = (typeof RS_TABLE_API_OPTIONAL_METHODS)[number]
