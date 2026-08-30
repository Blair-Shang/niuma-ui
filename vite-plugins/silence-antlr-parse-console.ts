/**
 * 静默 antlr4ng ConsoleErrorListener 的 parse 刷屏。
 *
 * 针对 antlr4ng（monaco-sql-languages / dt-sql-parser 依赖）：
 * createParser(input) 未传 errorListener 时不会 removeErrorListeners()，
 * 半成品 SQL 的 syntaxError 会打满 DevTools。真实诊断走 Monaco markers。
 * 该 console.error 模板随 antlr4ng 版本，升级后若失效需核对此字面量。
 */
import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import type { Plugin } from 'vite'

const ANTLR_LINE_ERROR =
  /console\.error\("line " \+ line \+ ":" \+ charPositionInLine \+ " " \+ msg\);/g

/** SilenceAntlrParseConsoleOptions 允许收窄要补丁的模块。 */
export type SilenceAntlrParseConsoleOptions = {
  include?: FilterPattern
  exclude?: FilterPattern
}

/**
 * SilenceAntlrParseConsole 去掉 antlr4ng ConsoleErrorListener 的 console.error。
 */
export function silenceAntlrParseConsole(
  options: SilenceAntlrParseConsoleOptions = {},
): Plugin {
  const filter = createFilter(options.include ?? /antlr4ng/, options.exclude)
  return {
    name: 'silence-antlr-parse-console',
    enforce: 'pre',
    transform(code, id) {
      if (!filter(id)) return null
      if (!code.includes('ConsoleErrorListener')) return null
      if (!code.includes('console.error("line "')) return null
      const s = new MagicString(code)
      s.replace(
        ANTLR_LINE_ERROR,
        '/* niuma-ui: antlr4ng ConsoleErrorListener; diagnostics via Monaco markers */',
      )
      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary', source: id }),
      }
    },
  }
}
