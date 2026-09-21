export { default as RsTabs } from './src/RsTabs.vue'
export type {
  RsTabItem,
  RsTabsCloseAction,
  RsTabsContentGap,
  RsTabsOverflow,
  RsTabsSize,
  RsTabsJustify,
  RsTabsVariant,
} from './src/tabs-utils'
export {
  buildTabContextMenuItems,
  getNextTabAfterBatchClose,
  getNextTabAfterClose,
  isTabClosable,
  isTabFixed,
  isTabRenamable,
  reorderTabItems,
  resolveTabsToClose,
  resolveVisibleTabValues,
} from './src/tabs-utils'
