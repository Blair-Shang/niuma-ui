/**
 * Feature 运行时宿主：贡献袋 + 生命周期（对标可插拔中间件总线）。
 *
 * 贡献点（实例级，多表互不串扰）：
 * - contextMenu：右键菜单
 * - toolbar：表头工具条项
 * - overlay：浮层/旁路 UI 标记（图表容器挂载点等）
 *
 * 每个 RsTable 各自 createRsTableFeatureHost()；不要跨实例复用 host。
 */

import type { RsContextMenuItem } from '../context-menu-utils'
import type { RsTableRowData } from '../table-utils'
import type { RsTableAnalyticsSnapshot } from '../../composables/useRsTableSelectionSource'
import type { RsTableFeature, RsTableFeatureContext } from './table-features'
import { setupTableFeatures } from './table-features'

/** 动态右键菜单贡献函数 */
export type RsTableContextMenuContributor<T extends RsTableRowData> = (
  items: RsContextMenuItem[],
  ctx: { row: T | null; selectedRows: T[] },
) => void

/** 工具条贡献项 */
export interface RsTableToolbarItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  onClick?: () => void
}

export type RsTableToolbarContributor = (
  items: RsTableToolbarItem[],
) => void

/** Overlay 贡献（旁路挂载描述，不直接操作 DOM） */
export interface RsTableOverlayContribution {
  key: string
  /** 业务自定义渲染/挂载标识 */
  slot?: string
  meta?: Record<string, unknown>
}

export type RsTableOverlayContributor = (
  items: RsTableOverlayContribution[],
) => void

/**
 * 单次 setup 周期内的贡献收集器（实例私有）。
 */
export interface RsTableFeatureHost<T extends RsTableRowData = RsTableRowData> {
  createContext: (base: {
    getViewRows: () => T[]
    getSelectedRows: () => T[]
    getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
    subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  }) => RsTableFeatureContext<T>
  setup: (features: RsTableFeature<T>[], ctx: RsTableFeatureContext<T>) => () => void
  mergeContextMenuItems: (
    baseItems: RsContextMenuItem[],
    menuCtx: { row: T | null; selectedRows: T[] },
  ) => RsContextMenuItem[]
  /** 合并 toolbar 贡献 */
  getToolbarItems: () => RsTableToolbarItem[]
  /** 合并 overlay 贡献 */
  getOverlayContributions: () => RsTableOverlayContribution[]
  getActiveFeatureIds: () => string[]
}

/**
 * 创建 Feature 宿主（每个 RsTable 实例一个 —— 多表请各建各的）。
 */
export function createRsTableFeatureHost<T extends RsTableRowData>(): RsTableFeatureHost<T> {
  let menuContributors: Array<RsTableContextMenuContributor<T>> = []
  let toolbarContributors: RsTableToolbarContributor[] = []
  let overlayContributors: RsTableOverlayContributor[] = []
  let activeIds: string[] = []

  function createContext(base: {
    getViewRows: () => T[]
    getSelectedRows: () => T[]
    getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
    subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  }): RsTableFeatureContext<T> {
    return {
      getViewRows: base.getViewRows,
      getSelectedRows: base.getSelectedRows,
      getAnalyticsSnapshot: base.getAnalyticsSnapshot,
      subscribeAnalytics: base.subscribeAnalytics,
      contributeContextMenuItems(contributor) {
        if (typeof contributor === 'function') {
          menuContributors.push(contributor)
          return
        }
        const staticItems = contributor
        menuContributors.push((items) => {
          items.push(...staticItems)
        })
      },
      contributeToolbarItems(contributor) {
        if (typeof contributor === 'function') {
          toolbarContributors.push(contributor)
          return
        }
        const staticItems = contributor
        toolbarContributors.push((items) => {
          items.push(...staticItems)
        })
      },
      contributeOverlay(contributor) {
        if (typeof contributor === 'function') {
          overlayContributors.push(contributor)
          return
        }
        const staticItems = contributor
        overlayContributors.push((items) => {
          items.push(...staticItems)
        })
      },
    }
  }

  function setup(features: RsTableFeature<T>[], ctx: RsTableFeatureContext<T>): () => void {
    menuContributors = []
    toolbarContributors = []
    overlayContributors = []
    activeIds = features.map((f) => f.id)
    const dispose = setupTableFeatures(features, ctx)
    return () => {
      dispose()
      menuContributors = []
      toolbarContributors = []
      overlayContributors = []
      activeIds = []
    }
  }

  function mergeContextMenuItems(
    baseItems: RsContextMenuItem[],
    menuCtx: { row: T | null; selectedRows: T[] },
  ): RsContextMenuItem[] {
    const items = [...baseItems]
    const before = items.length
    for (const contribute of menuContributors) {
      contribute(items, menuCtx)
    }
    if (before > 0 && items.length > before && !items[before]?.separator) {
      items.splice(before, 0, { key: '__ctx-feature-sep', label: '', separator: true })
    }
    return items
  }

  function getToolbarItems(): RsTableToolbarItem[] {
    const items: RsTableToolbarItem[] = []
    for (const contribute of toolbarContributors) contribute(items)
    return items
  }

  function getOverlayContributions(): RsTableOverlayContribution[] {
    const items: RsTableOverlayContribution[] = []
    for (const contribute of overlayContributors) contribute(items)
    return items
  }

  function getActiveFeatureIds(): string[] {
    return [...activeIds]
  }

  return {
    createContext,
    setup,
    mergeContextMenuItems,
    getToolbarItems,
    getOverlayContributions,
    getActiveFeatureIds,
  }
}
