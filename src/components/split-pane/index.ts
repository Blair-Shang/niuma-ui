export { default as RsSplitPane } from './src/RsSplitPane.vue'
export type {
  RsSplitConstraint,
  RsSplitOrientation,
  RsSplitPaneExpose,
  RsSplitPaneInstance,
  RsSplitPaneItem,
  RsSplitPaneSize,
  RsSplitPaneSlot,
} from './src/split-pane-utils'
export {
  applySplitResize,
  collapseSplitPane,
  expandSplitPane,
  invertSplitAxisDelta,
  isRsSplitPaneAutoSize,
  isSplitPaneCollapsed,
  isSplitResizerInteractive,
  normalizeSplitSizes,
  resolveSplitAutoFlags,
  resolveSplitConstraints,
  splitPaneDomId,
  splitSizesEqual,
} from './src/split-pane-utils'
