/**
 * 表格 → 图表系列纯函数（库无关）。
 *
 * 产出结构可直接喂给 ECharts / Chart.js 等：
 * - pie / 普通 bar：points[{ name, value }]
 * - 分类轴 bar：categories + values
 *
 * 不引入任何图表依赖，避免拖重内核。
 */

import type { RsTableRowData } from '../table-utils'

/** 图表意图类型（渲染层自行映射到具体库） */
export type RsTableChartKind = 'bar' | 'pie' | 'line'

/** 单点：饼图扇区 / 柱条 */
export interface RsTableChartPoint {
  /** 分类名（展示） */
  name: string
  /** 聚合值 */
  value: number
  /** 原始分类 key（与 name 通常相同，供下钻） */
  key: string
  /** 该分类下的行数（便于 tooltip） */
  count: number
}

/** 一组图表系列 */
export interface RsTableChartSeries {
  id: string
  kind: RsTableChartKind
  points: RsTableChartPoint[]
  /** 分类轴（与 points 顺序一致） */
  categories: string[]
  /** 数值轴（与 points 顺序一致） */
  values: number[]
}

export type RsTableChartValueAgg = 'count' | 'sum' | 'avg' | 'min' | 'max'

/**
 * 图表系列定义。
 * - categoryField：分组字段
 * - valueField + valueAgg：度量；仅 count 时可省略 valueField
 */
export interface RsTableChartSeriesDef {
  id: string
  kind: RsTableChartKind
  categoryField: string
  valueField?: string
  valueAgg?: RsTableChartValueAgg
  /** 最多保留前 N 类，其余合并为 otherLabel；0/不传表示不截断 */
  topN?: number
  otherLabel?: string
  /** 空分类展示名 */
  emptyCategoryLabel?: string
}

function readField(row: RsTableRowData, field: string): unknown {
  return (row as Record<string, unknown>)[field]
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function categoryKey(raw: unknown, emptyLabel: string): string {
  if (raw == null || raw === '') return emptyLabel
  return String(raw)
}

interface Bucket {
  key: string
  name: string
  count: number
  nums: number[]
}

function aggregateBucket(bucket: Bucket, agg: RsTableChartValueAgg): number {
  if (agg === 'count') return bucket.count
  if (!bucket.nums.length) return 0
  if (agg === 'sum') return bucket.nums.reduce((a, b) => a + b, 0)
  if (agg === 'avg') return bucket.nums.reduce((a, b) => a + b, 0) / bucket.nums.length
  if (agg === 'min') return Math.min(...bucket.nums)
  if (agg === 'max') return Math.max(...bucket.nums)
  return 0
}

/**
 * 按分类字段对行做聚合，生成库无关图表系列。
 *
 * @param rows 通常为 SelectionSource.sourceRows（选中优先）
 * @param def 系列定义
 */
export function buildTableChartSeries<T extends RsTableRowData>(
  rows: readonly T[],
  def: RsTableChartSeriesDef,
): RsTableChartSeries {
  const emptyLabel = def.emptyCategoryLabel ?? '(空)'
  const agg = def.valueAgg ?? (def.valueField ? 'sum' : 'count')
  const map = new Map<string, Bucket>()

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] as T
    const key = categoryKey(readField(row, def.categoryField), emptyLabel)
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { key, name: key, count: 0, nums: [] }
      map.set(key, bucket)
    }
    bucket.count += 1
    if (def.valueField && agg !== 'count') {
      const n = toNumber(readField(row, def.valueField))
      if (n != null) bucket.nums.push(n)
    }
  }

  let points: RsTableChartPoint[] = [...map.values()].map((bucket) => ({
    key: bucket.key,
    name: bucket.name,
    value: aggregateBucket(bucket, agg),
    count: bucket.count,
  }))

  // 按 value 降序，便于 topN / 饼图可读性
  points.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))

  const topN = def.topN ?? 0
  if (topN > 0 && points.length > topN) {
    const head = points.slice(0, topN)
    const rest = points.slice(topN)
    const otherValue = rest.reduce((s, p) => s + p.value, 0)
    const otherCount = rest.reduce((s, p) => s + p.count, 0)
    head.push({
      key: '__other__',
      name: def.otherLabel ?? '其他',
      value: otherValue,
      count: otherCount,
    })
    points = head
  }

  return {
    id: def.id,
    kind: def.kind,
    points,
    categories: points.map((p) => p.name),
    values: points.map((p) => p.value),
  }
}

/**
 * 批量构建多组系列（同一 sourceRows，多套分组/度量）。
 */
export function buildTableChartSeriesList<T extends RsTableRowData>(
  rows: readonly T[],
  defs: readonly RsTableChartSeriesDef[],
): RsTableChartSeries[] {
  return defs.map((def) => buildTableChartSeries(rows, def))
}
