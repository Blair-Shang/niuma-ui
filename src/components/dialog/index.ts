export { default as RsDialog } from './src/RsDialog.vue'
export { default as RsConfirmDialog } from './src/RsConfirmDialog.vue'
export type {
  RsConfirmBeforeClose,
  RsConfirmCloseReason,
  RsConfirmDialogExpose,
  RsConfirmDialogInstance,
  RsConfirmOptions,
  RsDialogBeforeClose,
  RsDialogCloseReason,
  RsDialogExpose,
  RsDialogInstance,
  RsDialogLayout,
  RsDialogWidth,
  RsDialogWidthPreset,
} from './src/dialog-utils'
export {
  isRsDialogWidthPreset,
  resolveDialogOverlayStyle,
  resolveRsDialogCssWidth,
  resolveRsDialogWidthPx,
  runRsConfirmBeforeClose,
  runRsDialogBeforeClose,
} from './src/dialog-utils'
