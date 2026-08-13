/**
 * RsTable 模块注册表（对标 AG Grid ModuleRegistry）。
 *
 * - 全局 register：所有表格实例默认挂载（同页多表会共享这些模块）
 * - 实例 props.features：仅该实例；同 id 覆盖全局
 * - 不改内核渲染；模块通过 Feature.setup 订阅/贡献
 * - 多表隔离要点：选中/编辑/ViewContext 仍是实例私有；仅 Registry 是全局点
 */

import type { RsTableFeature } from './table-features'
import type { RsTableRowData } from '../table-utils'

const globalModules: RsTableFeature<RsTableRowData>[] = []

/**
 * 全局模块注册表。
 *
 * @example
 * ```ts
 * RsTableModuleRegistry.register(
 *   createAnalyticsTableFeature({ onSnapshot: (s) => syncCharts(s) }),
 * )
 * ```
 */
export const RsTableModuleRegistry = {
  /**
   * 注册全局 feature（幂等：同 id 覆盖）。
   */
  register<T extends RsTableRowData>(feature: RsTableFeature<T>): void {
    const id = feature.id
    const idx = globalModules.findIndex((item) => item.id === id)
    const next = feature as RsTableFeature<RsTableRowData>
    if (idx >= 0) globalModules[idx] = next
    else globalModules.push(next)
  },

  /** 按 id 注销全局模块 */
  unregister(id: string): void {
    const idx = globalModules.findIndex((item) => item.id === id)
    if (idx >= 0) globalModules.splice(idx, 1)
  },

  /** 清空（测试用） */
  clear(): void {
    globalModules.length = 0
  },

  /** 当前全局模块快照（浅拷贝） */
  getModules<T extends RsTableRowData = RsTableRowData>(): RsTableFeature<T>[] {
    return [...globalModules] as RsTableFeature<T>[]
  },

  listIds(): string[] {
    return globalModules.map((item) => item.id)
  },
}

/**
 * 合并全局模块 + 实例 features（实例同 id 覆盖全局）。
 */
export function resolveInstanceFeatures<T extends RsTableRowData>(
  instanceFeatures?: RsTableFeature<T>[] | null,
): RsTableFeature<T>[] {
  const map = new Map<string, RsTableFeature<T>>()
  for (const feature of RsTableModuleRegistry.getModules<T>()) {
    map.set(feature.id, feature)
  }
  for (const feature of instanceFeatures ?? []) {
    map.set(feature.id, feature)
  }
  return [...map.values()]
}
