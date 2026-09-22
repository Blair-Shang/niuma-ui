import { keymap } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { clearGhostCompletion, setGhostCompletion } from './code-mirror-ghost'
import { posToLineColumn } from './code-mirror-intel'
import { editorAbortSession, isEditorViewAlive } from './code-mirror-session'

export interface CodeMirrorCompletionHandlers {
  completionRequest?: (
    prefix: string,
    suffix: string,
    line: number,
    column: number,
    signal?: AbortSignal,
  ) => Promise<string | null>
}

export function codeMirrorCompletionExtensions(handlers: () => CodeMirrorCompletionHandlers): Extension[] {
  const session = editorAbortSession()
  return [
    session,
    keymap.of([
      {
        key: 'Ctrl-Space',
        mac: 'Cmd-Space',
        run: (view) => {
          const h = handlers()
          if (!h.completionRequest || !isEditorViewAlive(view)) return false
          clearGhostCompletion(view)
          const pos = view.state.selection.main.head
          const prefix = view.state.doc.sliceString(0, pos)
          const suffix = view.state.doc.sliceString(pos)
          const { line, column } = posToLineColumn(view, pos)
          const signal = view.plugin(session)?.nextSignal()
          void Promise.resolve(h.completionRequest(prefix, suffix, line, column, signal))
            .then((text) => {
              if (signal?.aborted || !text?.trim() || !isEditorViewAlive(view)) return
              const latestPos = view.state.selection.main.head
              if (view.state.doc.sliceString(latestPos) !== suffix) return
              view.dispatch({
                changes: { from: latestPos, to: latestPos, insert: text },
                selection: { anchor: latestPos + text.length },
                effects: setGhostCompletion.of(null),
              })
              view.focus()
            })
            .catch(() => {})
          return true
        },
      },
    ]),
  ]
}
