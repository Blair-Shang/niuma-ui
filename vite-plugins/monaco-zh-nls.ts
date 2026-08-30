/**
 * Vite 插件：将 Monaco Editor 0.55 内置的官方中文 NLS 注入 `nls.messages.js`。
 *
 * localize() 使用数字索引，需设置 globalThis._VSCODE_NLS_MESSAGES。
 * 官方文件：monaco-editor/min/vs/nls.messages.zh-cn.js.js。
 *
 * 两阶段 load：
 *  1. config + rolldown plugin → Vite 8 optimizeDeps
 *  2. Rollup load → 生产构建 / 未预构建的 dev
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

/** MonacoZhNlsOptions 预留扩展（例如后续 locale）。 */
export type MonacoZhNlsOptions = object

function extractZhCnMessages(): string {
  try {
    const require = createRequire(import.meta.url)
    const zhCnPath = require.resolve('monaco-editor/min/vs/nls.messages.zh-cn.js.js')
    const raw = readFileSync(zhCnPath, 'utf8')

    const start = raw.indexOf('_VSCODE_NLS_MESSAGES=[')
    if (start === -1) return ''

    const arrStart = raw.indexOf('[', start)
    let depth = 0
    let arrEnd = -1
    for (let i = arrStart; i < raw.length; i++) {
      if (raw[i] === '[') depth++
      else if (raw[i] === ']') {
        depth--
        if (depth === 0) {
          arrEnd = i
          break
        }
      }
    }
    return arrEnd !== -1 ? raw.slice(arrStart, arrEnd + 1) : ''
  } catch (e) {
    console.warn('[monaco-zh-nls] 无法加载 Monaco 官方中文 NLS:', e)
    return ''
  }
}

/**
 * MonacoZhNlsPlugin 用官方中文 NLS 替换 monaco-editor 的 nls.messages.js。
 */
export function monacoZhNlsPlugin(_options: MonacoZhNlsOptions = {}): Plugin {
  const messagesCode = extractZhCnMessages()

  if (!messagesCode) {
    console.warn('[monaco-zh-nls] 中文 NLS 数组提取失败，跳过插件')
    return { name: 'monaco-zh-nls' }
  }

  const nlsModuleCode = `
/* monaco-zh-nls: Monaco 0.55 官方中文翻译 */
globalThis._VSCODE_NLS_MESSAGES = ${messagesCode};
globalThis._VSCODE_NLS_LANGUAGE = 'zh-cn';
export function getNLSMessages() { return globalThis._VSCODE_NLS_MESSAGES; }
export function getNLSLanguage() { return globalThis._VSCODE_NLS_LANGUAGE; }
`

  const nlsFileFilter = /monaco-editor[/\\]esm[/\\]vs[/\\]nls\.messages\.js$/

  const rolldownPlugin = {
    name: 'monaco-zh-nls-rolldown',
    load(id: string) {
      if (nlsFileFilter.test(id)) return nlsModuleCode
      return undefined
    },
  }

  return {
    name: 'monaco-zh-nls',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          rolldownOptions: {
            plugins: [rolldownPlugin],
          },
        },
      }
    },
    load(id: string) {
      if (nlsFileFilter.test(id)) return nlsModuleCode
    },
  }
}
