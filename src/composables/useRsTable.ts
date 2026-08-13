/**
 * RsTable 公开面编排（对标 AG Grid api / TanStack table instance）。
 *
 * 职责：
 * - FeatureHost：全局模块 + 实例 features 生命周期与贡献袋
 * - RsTableApi：统一 create / provide，避免 expose 与 inject 漂移
 *
 * 内核装配（Columns / Engine / Virtual）见 useRsTableCore；本文件保持公开面轻量。
 */

import { inject, provide, type InjectionKey } from 'vue'
import type { RsContextMenuItem } from '../components/context-menu-utils'
import type { RsTableRowData } from '../components/table-utils'
import {
  createRsTableApi,
  RS_TABLE_API_KEY,
  type RsTableApi,
} from '../components/table/rs-table-api'
import {
  createRsTableFeatureHost,
  type RsTableFeatureHost,
  type RsTableOverlayContribution,
  type RsTableToolbarItem,
} from '../components/table/rs-table-feature-host'
import { resolveInstanceFeatures } from '../components/table/rs-table-module-registry'
import {
  createBuiltinTableFeatures,
  type RsTableBuiltinFeatureId,
  type RsTableFeature,
} from '../components/table/table-features'
import type { RsTableAnalyticsSnapshot } from './useRsTableSelectionSource'

export type { RsTableApi }
export { RS_TABLE_API_KEY, RS_TABLE_API_VERSION, isRsTableApi } from '../components/table/rs-table-api'
export { RsTableModuleRegistry, resolveInstanceFeatures } from '../components/table/rs-table-module-registry'

/**
 * useRsTable 返回的公开面：Feature 宿主 + API 工厂。
 */
export interface UseRsTableSurface<T extends RsTableRowData = RsTableRowData> {
  featureHost: RsTableFeatureHost<T>
  /**
   * 绑定内置 id + 实例/全局 features；返回 dispose。
   * 应在 watch(immediate) 中调用，替换旧 dispose。
   */
  bindFeatures: (options: {
    builtinIds: RsTableBuiltinFeatureId[]
    instanceFeatures?: RsTableFeature<T>[] | null
    getViewRows: () => T[]
    getSelectedRows: () => T[]
    getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
    subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  }) => () => void
  /** 合并 props 自定义菜单与 feature 贡献 */
  mergeContextMenuItems: (
    baseItems: RsContextMenuItem[],
    menuCtx: { row: T | null; selectedRows: T[] },
  ) => RsContextMenuItem[]
  /** 由内部实现装配冻结 API，并可选 provide */
  createApi: (
    impl: Omit<RsTableApi<T>, 'apiVersion' | 'getActiveFeatureIds'> & {
      getActiveFeatureIds?: () => string[]
    },
    options?: { provide?: boolean },
  ) => RsTableApi<T>
  getActiveFeatureIds: () => string[]
  /** 实例级 toolbar 贡献（多表互不共享） */
  getToolbarItems: () => RsTableToolbarItem[]
  /** 实例级 overlay 贡献 */
  getOverlayContributions: () => RsTableOverlayContribution[]
}

/**
 * 创建表格公开面（每个 RsTable 实例调用一次）。
 */
export function useRsTable<T extends RsTableRowData = RsTableRowData>(): UseRsTableSurface<T> {
  const featureHost = createRsTableFeatureHost<T>()

  function bindFeatures(options: {
    builtinIds: RsTableBuiltinFeatureId[]
    instanceFeatures?: RsTableFeature<T>[] | null
    getViewRows: () => T[]
    getSelectedRows: () => T[]
    getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
    subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  }): () => void {
    // 合并顺序：全局模块 → 内置 → 实例 features（同 id 后者覆盖）
    const features = resolveInstanceFeatures<T>([
      ...createBuiltinTableFeatures<T>(options.builtinIds),
      ...(options.instanceFeatures ?? []),
    ])
    const ctx = featureHost.createContext({
      getViewRows: options.getViewRows,
      getSelectedRows: options.getSelectedRows,
      getAnalyticsSnapshot: options.getAnalyticsSnapshot,
      subscribeAnalytics: options.subscribeAnalytics,
    })
    return featureHost.setup(features, ctx)
  }

  function createApi(
    impl: Omit<RsTableApi<T>, 'apiVersion' | 'getActiveFeatureIds'> & {
      getActiveFeatureIds?: () => string[]
    },
    options?: { provide?: boolean },
  ): RsTableApi<T> {
    const api = createRsTableApi<T>({
      ...impl,
      getActiveFeatureIds: impl.getActiveFeatureIds ?? (() => featureHost.getActiveFeatureIds()),
    })
    if (options?.provide !== false) {
      provide(RS_TABLE_API_KEY as InjectionKey<RsTableApi<T>>, api)
    }
    return api
  }

  return {
    featureHost,
    bindFeatures,
    mergeContextMenuItems: (base, menuCtx) => featureHost.mergeContextMenuItems(base, menuCtx),
    createApi,
    getActiveFeatureIds: () => featureHost.getActiveFeatureIds(),
    getToolbarItems: () => featureHost.getToolbarItems(),
    getOverlayContributions: () => featureHost.getOverlayContributions(),
  }
}

/**
 * 子树内注入表格 API（插槽/子组件用）。
 * 未 provide 时返回 undefined。
 */
export function useRsTableApi<T extends RsTableRowData = RsTableRowData>(): RsTableApi<T> | undefined {
  return inject(RS_TABLE_API_KEY as InjectionKey<RsTableApi<T>>, undefined)
}
