import { EditorView, ViewPlugin } from '@codemirror/view'

/** 已 destroy 的 EditorView 再 dispatch 会抛错。用 DOM 是否还在文档里判断。 */
export function isEditorViewAlive(view: EditorView | null | undefined): view is EditorView {
  if (!view) return false
  const dom = view.dom
  return !!dom && dom.isConnected
}

/**
 * 异步补全 / 悬停 / 跳转各持有一个 AbortController。
 * 下一次请求或视图 destroy 时 abort，避免卸载后继续 dispatch。
 */
export function editorAbortSession(onDestroy?: () => void) {
  return ViewPlugin.fromClass(
    class {
      private controller: AbortController | null = null

      constructor(_view: EditorView) {}

      nextSignal(): AbortSignal {
        this.controller?.abort()
        this.controller = new AbortController()
        return this.controller.signal
      }

      destroy() {
        this.controller?.abort()
        this.controller = null
        onDestroy?.()
      }
    },
  )
}
