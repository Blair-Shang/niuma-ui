export { default as RsTerminal } from './src/RsTerminal.vue'
export {
  buildAnsiColorDemo,
  containsEscapeSequence,
  getTerminalThemePalette,
  mergeTerminalTheme,
  readTerminalThemeFromCss,
  resolveTerminalTheme,
  terminalShortcutLabel,
} from './src/terminal-utils'
export type {
  RsResolvedTerminalTheme,
  RsTerminalAction,
  RsTerminalCursorStyle,
  RsTerminalExpose,
  RsTerminalGeometry,
  RsTerminalThemeMode,
} from './src/terminal-utils'
