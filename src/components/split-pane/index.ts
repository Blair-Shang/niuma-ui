export { default as RsSplitPane } from './src/RsSplitPane.vue'
export type {
  RsSplitConstraint,
  RsSplitOrientation,
  RsSplitPaneExpose,
  RsSplitPaneInstance,
  RsSplitPaneItem,
  RsSplitPaneSize,
} from './src/split-pane-utils'
export {
  applySplitResize,
  collapseSplitPane,
  expandSplitPane,
  isRsSplitPaneAutoSize,
  isSplitPaneCollapsed,
  normalizeSplitSizes,
  resolveSplitAutoFlags,
  resolveSplitConstraints,
  splitSizesEqual,
} from './src/split-pane-utils'
