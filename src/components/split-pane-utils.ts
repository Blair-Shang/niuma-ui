/** 面板分割方向：horizontal 左右排布（拖动横向）· vertical 上下排布（拖动纵向） */
export type RsSplitOrientation = 'horizontal' | 'vertical'

/** 面板尺寸：数字为占比百分比；'auto' 按内容自适应（不占百分比配额） */
export type RsSplitPaneSize = number | 'auto'

/** 单个面板定义；百分比尺寸单位为 0~100 */
export interface RsSplitPaneItem {
  /** 唯一标识，用于插槽名与 v-model:sizes 的顺序映射 */
  key: string
  /**
   * 初始尺寸
   * - number：占比百分比
   * - 'auto'：按内容自适应（flex-basis: auto）
   * - 缺省：在「非 auto」面板的剩余百分比内均分
   */
  size?: RsSplitPaneSize
  /** 最小尺寸（百分比），默认 0；auto 面板可作为 min-height/min-width % */
  min?: number
  /** 最大尺寸（百分比），默认 100；auto 面板可作为 max-height/max-width % */
  max?: number
  /** 是否可折叠：拖动越过阈值时吸附到 collapsedSize */
  collapsible?: boolean
  /** 折叠后的尺寸（百分比），默认 0；会被限制在 [0, min] */
  collapsedSize?: number
  /** 本面板右侧分隔条是否显示抓手；缺省时继承 RsSplitPane.withHandle */
  resizerHandle?: boolean
}

/**
 * RsSplitPane 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsSplitPane>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsSplitPaneExpose {
  collapse: (key: string) => void
  expand: (key: string, toSize?: number) => void
  reset: () => void
  getSizes: () => number[]
}

/** 模板 ref 实例：expose + 根节点 */
export type RsSplitPaneInstance = RsSplitPaneExpose & { $el: HTMLElement }

/** 由 RsSplitPaneItem 解析出的规范化约束 */
export interface RsSplitConstraint {
  min: number
  max: number
  collapsible: boolean
  collapsedSize: number
}

const clamp = (value: number, lower: number, upper: number): number =>
  Math.min(Math.max(value, lower), upper)

/** 保留有限位小数，消除浮点毛刺 */
export function roundSize(value: number, precision = 4): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/** 是否为内容自适应尺寸 */
export function isRsSplitPaneAutoSize(size: RsSplitPaneSize | undefined): size is 'auto' {
  return size === 'auto'
}

/** 各面板是否声明为 auto（忽略受控 provided 时的瞬时物化） */
export function resolveSplitAutoFlags(panes: RsSplitPaneItem[]): boolean[] {
  return panes.map((pane) => isRsSplitPaneAutoSize(pane.size))
}

/** 将面板定义解析为规范化约束，保证 0 ≤ min ≤ max ≤ 100 且 collapsedSize ≤ min */
export function resolveSplitConstraints(panes: RsSplitPaneItem[]): RsSplitConstraint[] {
  return panes.map((pane) => {
    const rawMin = clamp(pane.min ?? 0, 0, 100)
    const rawMax = clamp(pane.max ?? 100, 0, 100)
    const min = Math.min(rawMin, rawMax)
    const max = Math.max(rawMin, rawMax)
    const collapsedSize = clamp(pane.collapsedSize ?? 0, 0, min)
    return {
      min,
      max,
      collapsible: pane.collapsible ?? false,
      collapsedSize,
    }
  })
}

/** 按比例把一组尺寸缩放到总和为 100 */
function rescaleTo100(sizes: number[]): number[] {
  if (!sizes.length) return []
  const sum = sizes.reduce((acc, value) => acc + Math.max(0, value), 0)
  if (sum <= 0) {
    const each = 100 / sizes.length
    return sizes.map(() => each)
  }
  return sizes.map((value) => (Math.max(0, value) / sum) * 100)
}

/**
 * 计算初始尺寸数组（非 auto 面板总和 100；auto 位为 0 占位，样式层不使用 flex-grow）。
 * 优先使用 provided（受控值），其次面板自身的 number size，未指定的非 auto 项在剩余空间内均分。
 */
export function normalizeSplitSizes(
  panes: RsSplitPaneItem[],
  provided?: number[] | null,
): number[] {
  const count = panes.length
  if (count === 0) return []

  const autoFlags = resolveSplitAutoFlags(panes)
  // 受控 sizes 一旦提供完整数组，视为已全部物化为百分比（含原 auto）
  const fullyControlled =
    Array.isArray(provided) &&
    provided.length === count &&
    provided.every((value) => typeof value === 'number' && Number.isFinite(value))

  if (fullyControlled) {
    return rescaleTo100(provided!.map((value) => Math.max(0, value))).map((value) =>
      roundSize(value),
    )
  }

  const seed: (number | null)[] = panes.map((pane, index) => {
    if (autoFlags[index]) return 0
    const candidate = provided?.[index] ?? (typeof pane.size === 'number' ? pane.size : null)
    return typeof candidate === 'number' && Number.isFinite(candidate)
      ? Math.max(0, candidate)
      : null
  })

  const flexibleIndices = panes
    .map((_, index) => index)
    .filter((index) => !autoFlags[index])

  if (flexibleIndices.length === 0) {
    // 全部 auto：占位全 0，由内容撑开
    return panes.map(() => 0)
  }

  const missing = flexibleIndices.filter((index) => seed[index] === null).length
  const knownSum = flexibleIndices.reduce<number>((acc, index) => acc + (seed[index] ?? 0), 0)
  const each = missing > 0 ? Math.max(0, 100 - knownSum) / missing : 0

  const filled = seed.map((value, index) => {
    if (autoFlags[index]) return 0
    return value ?? each
  })

  // 只对非 auto 部分缩放到 100
  const flexibleValues = flexibleIndices.map((index) => filled[index] ?? 0)
  const scaledFlexible = rescaleTo100(flexibleValues)
  const next = filled.slice()
  flexibleIndices.forEach((paneIndex, i) => {
    next[paneIndex] = roundSize(scaledFlexible[i] ?? 0)
  })
  return next
}

/** 判断某面板当前是否处于折叠态 */
export function isSplitPaneCollapsed(size: number, constraint: RsSplitConstraint): boolean {
  if (!constraint.collapsible) return false
  return size <= constraint.collapsedSize + 0.01
}

/**
 * 在第 index 个分隔条（介于 pane[index] 与 pane[index+1] 之间）上拖动 deltaPercent。
 * 仅调整相邻两个面板，遵守各自 min/max，并在可折叠时吸附到 collapsedSize。
 * 返回新的尺寸数组（引用不同，总和保持不变）。
 */
export function applySplitResize(
  sizes: number[],
  constraints: RsSplitConstraint[],
  index: number,
  deltaPercent: number,
): number[] {
  if (index < 0 || index >= sizes.length - 1) return sizes
  const a = sizes[index]
  const b = sizes[index + 1]
  const ca = constraints[index]
  const cb = constraints[index + 1]
  if (a === undefined || b === undefined || !ca || !cb) return sizes

  const total = a + b
  let nextA = a + deltaPercent

  // 收缩 A：越过阈值吸附折叠
  if (ca.collapsible && deltaPercent < 0 && nextA < ca.min) {
    nextA = nextA <= (ca.min + ca.collapsedSize) / 2 ? ca.collapsedSize : ca.min
  }

  // 收缩 B（即放大 A）：越过阈值吸附折叠 B
  if (cb.collapsible && deltaPercent > 0) {
    const nextB = total - nextA
    if (nextB < cb.min) {
      const snappedB = nextB <= (cb.min + cb.collapsedSize) / 2 ? cb.collapsedSize : cb.min
      nextA = total - snappedB
    }
  }

  // 硬约束：A 的可行区间需同时满足 A 与 B 的 min/max
  const lowerA = Math.max(ca.collapsible ? ca.collapsedSize : ca.min, total - cb.max)
  const upperA = Math.min(ca.max, total - (cb.collapsible ? cb.collapsedSize : cb.min))
  nextA = clamp(nextA, Math.min(lowerA, upperA), Math.max(lowerA, upperA))

  const next = sizes.slice()
  next[index] = roundSize(nextA)
  next[index + 1] = roundSize(total - nextA)
  return next
}

/** 把 pane[index] 设为 target，差额从相邻面板（优先右侧）补偿 */
function redistribute(sizes: number[], index: number, target: number): number[] {
  const current = sizes[index]
  if (current === undefined) return sizes
  const neighbor = index + 1 < sizes.length ? index + 1 : index - 1
  if (neighbor < 0) return sizes
  const next = sizes.slice()
  const delta = target - current
  next[index] = roundSize(target)
  next[neighbor] = roundSize(Math.max(0, (next[neighbor] ?? 0) - delta))
  return next
}

/** 折叠 pane[index]（可折叠→collapsedSize，否则→min） */
export function collapseSplitPane(
  sizes: number[],
  constraints: RsSplitConstraint[],
  index: number,
): number[] {
  const constraint = constraints[index]
  if (!constraint || sizes[index] === undefined) return sizes
  const target = constraint.collapsible ? constraint.collapsedSize : constraint.min
  return redistribute(sizes, index, target)
}

/** 展开 pane[index]（toSize 缺省时回到 min 或均分值），并夹紧到 [min, max] */
export function expandSplitPane(
  sizes: number[],
  constraints: RsSplitConstraint[],
  index: number,
  toSize?: number,
): number[] {
  const constraint = constraints[index]
  if (!constraint || sizes[index] === undefined) return sizes
  const fallback = constraint.min > 0 ? constraint.min : 100 / Math.max(1, sizes.length)
  const target = clamp(toSize ?? fallback, constraint.min, constraint.max)
  return redistribute(sizes, index, target)
}

/** 两组尺寸是否近似相等（用于受控回写时避免抖动） */
export function splitSizesEqual(a: number[], b: number[], epsilon = 0.01): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => Math.abs(value - (b[index] ?? 0)) <= epsilon)
}
