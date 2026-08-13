/**
 * RsTable 列汇总纯函数：聚合算法、footer 单元格构建、兼容性警告。
 *
 * 不依赖 Vue；由 RsTable 在 computed 中调用。
 * 聚合范围约定为「当前 viewRows」（筛选/排序后的业务行），不含 group/expand 伪行。
 */

import type { RsTableColumn, RsTableRowData } from '../table-utils'
import { resolveColumnRawValue } from './table-edit-utils'

/** 列汇总类型：内置数值聚合 + custom reduce */
export type RsTableSummaryType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom'

/**
 * 列级汇总配置（挂在 `RsTableColumn.summary`）。
 *
 * - sum/avg/min/max：从行字段取可解析数字；无可解析值时单元格为空
 * - count：行数（不读字段）
 * - custom：必须提供 `reduce`
 */
export interface RsTableColumnSummary<T extends RsTableRowData = RsTableRowData> {
  type: RsTableSummaryType
  /** 展示格式化；未传时用默认 String(value) */
  formatter?: (value: number | string, rows: T[]) => string
  /** type=custom 时必填；返回值再经 formatter（若有） */
  reduce?: (rows: T[]) => string | number
}

/**
 * 汇总数据来源：
 * - client：本地对 viewRows 聚合
 * - server：直接展示业务传入的 summaryData，不做本地 reduce
 */
export type RsTableSummaryMode = 'client' | 'server'

/** 服务端汇总：列 key → 展示值（null/undefined 显示为空） */
export type RsTableSummaryData = Record<string, string | number | null | undefined>

/** 单列汇总单元格结果（供 footer 行渲染） */
export interface RsTableSummaryCell {
  key: string
  /** 原始聚合值；无数据时为 null */
  value: string | number | null
  /** 已格式化的展示文案 */
  text: string
}

/** 将未知值解析为有限数字；失败返回 null（跳过该行） */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * 收集列上可解析的数值序列。
 * 取值路径与编辑/复制一致：resolveColumnRawValue（dataIndex / key）。
 */
function collectNumericValues<T extends RsTableRowData>(
  rows: readonly T[],
  column: RsTableColumn<T>,
): number[] {
  const nums: number[] = []
  for (let i = 0; i < rows.length; i += 1) {
    const raw = resolveColumnRawValue(rows[i] as T, column, i)
    const n = toNumber(raw)
    if (n != null) nums.push(n)
  }
  return nums
}

/**
 * 对单列做汇总。列未配置 `summary` 时返回 null（由调用方填空单元格）。
 *
 * @param column 含可选 summary 的列定义
 * @param rows 参与聚合的业务行（通常为 Engine.viewRows）
 */
export function aggregateColumnSummary<T extends RsTableRowData>(
  column: RsTableColumn<T> & { summary?: RsTableColumnSummary<T> },
  rows: readonly T[],
): RsTableSummaryCell | null {
  const config = column.summary
  if (!config) return null

  let value: string | number | null = null

  if (config.type === 'custom') {
    value = config.reduce ? config.reduce(rows as T[]) : null
  } else if (config.type === 'count') {
    value = rows.length
  } else {
    const nums = collectNumericValues(rows, column)
    if (nums.length === 0) {
      value = null
    } else if (config.type === 'sum') {
      value = nums.reduce((a, b) => a + b, 0)
    } else if (config.type === 'avg') {
      value = nums.reduce((a, b) => a + b, 0) / nums.length
    } else if (config.type === 'min') {
      value = Math.min(...nums)
    } else if (config.type === 'max') {
      value = Math.max(...nums)
    }
  }

  const text =
    value == null
      ? ''
      : config.formatter
        ? config.formatter(value, rows as T[])
        : String(value)

  return { key: column.key, value, text }
}

/**
 * 计算整行 footer 汇总单元格（与 displayColumns 一一对应）。
 *
 * - client：按 columns.summary 对 rows 聚合；无 summary 的列 text 为空
 * - server：优先读 summaryData[key]；仍可用列上 formatter；忽略本地 sum/avg 等
 *
 * @returns 与 columns 等长的单元格数组
 */
export function buildTableSummaryCells<T extends RsTableRowData>(options: {
  columns: Array<RsTableColumn<T> & { summary?: RsTableColumnSummary<T> }>
  rows: readonly T[]
  mode: RsTableSummaryMode
  summaryData?: RsTableSummaryData | null
}): RsTableSummaryCell[] {
  const { columns, rows, mode, summaryData } = options
  if (mode === 'server') {
    return columns.map((column) => {
      if (!column.summary && summaryData?.[column.key] === undefined) {
        return { key: column.key, value: null, text: '' }
      }
      const raw = summaryData?.[column.key]
      const value = raw == null ? null : raw
      const text =
        value == null
          ? ''
          : column.summary?.formatter
            ? column.summary.formatter(value as string | number, rows as T[])
            : String(value)
      return { key: column.key, value, text }
    })
  }

  return columns.map((column) => {
    const cell = aggregateColumnSummary(column, rows)
    return cell ?? { key: column.key, value: null, text: '' }
  })
}

/**
 * 是否存在任何可展示的汇总配置。
 *
 * - client：任一列带 summary
 * - server：summaryData 非空对象
 *
 * 用于决定是否启用 summary feature / 渲染内置汇总行。
 */
export function hasTableSummaryConfig<T extends RsTableRowData>(options: {
  columns: Array<RsTableColumn<T> & { summary?: RsTableColumnSummary<T> }>
  mode: RsTableSummaryMode
  summaryData?: RsTableSummaryData | null
}): boolean {
  if (options.mode === 'server') {
    return Boolean(options.summaryData && Object.keys(options.summaryData).length > 0)
  }
  return options.columns.some((column) => Boolean(column.summary))
}

/**
 * summary 与互斥/易误解能力的兼容矩阵检查（仅 DEV 警告）。
 *
 * - tree：合计基于已展开的 viewRows，不含折叠子节点
 * - detail expandable：合计不含 expand 明细槽内容
 */
export function warnSummaryCompatibility(flags: {
  summaryEnabled: boolean
  tree: boolean
  detailExpandable: boolean
}): void {
  if (!flags.summaryEnabled) return
  if (flags.tree) {
    console.warn('[RsTable] summary 与 treeConfig 同开时，合计基于展平行 viewRows，不含折叠子节点')
  }
  if (flags.detailExpandable) {
    console.warn('[RsTable] summary 与 detail expandable 同开时，合计不含 expand 明细槽内容')
  }
}
