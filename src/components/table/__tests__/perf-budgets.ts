/**
 * RsTable / Core 性能门槛（CI 与本地共用）。
 *
 * CI（process.env.CI）用更紧预算，防止 jsdom 抖动掩盖回归；
 * 本地默认略松，避免开发机噪音误杀。
 */

const isCi = Boolean(process.env.CI)

function budget(localMs: number, ciMs: number): number {
  return isCi ? ciMs : localMs
}

/** mount 类门槛（ms） */
export const RS_TABLE_PERF_BUDGETS = {
  /** 3000 行只读虚拟表 mount */
  mountReadonly3k: budget(8000, 5000),
  /** 双表各 1500 行 mount */
  mountDual1k5: budget(12000, 8000),
  /**
   * 可编辑相对只读的倍率上限（另加 slackMs）。
   * editableElapsed < readonlyElapsed * ratio + slackMs
   */
  editableVsReadonlyRatio: 3,
  editableVsReadonlySlackMs: budget(2000, 1500),
} as const

export function assertWithinBudget(elapsedMs: number, limitMs: number, label: string): void {
  if (elapsedMs >= limitMs) {
    throw new Error(`[perf] ${label}: ${elapsedMs.toFixed(1)}ms >= budget ${limitMs}ms`)
  }
}
