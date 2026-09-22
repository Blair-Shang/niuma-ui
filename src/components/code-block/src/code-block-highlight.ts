import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view'
import { normalizeHighlightLines } from './code-block-utils'

const setHighlight = StateEffect.define<readonly number[]>()

function buildHighlight(
  doc: { lines: number; line: (n: number) => { from: number } },
  lines: readonly number[],
): DecorationSet {
  const wanted = normalizeHighlightLines(lines, doc.lines)
  if (!wanted.length) return Decoration.none
  const builder = new RangeSetBuilder<Decoration>()
  for (const lineNo of wanted) {
    const line = doc.line(lineNo)
    builder.add(line.from, line.from, Decoration.line({ class: 'cm-rs-code-line--highlight' }))
  }
  return builder.finish()
}

const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlight)) return buildHighlight(tr.state.doc, effect.value)
    }
    if (tr.docChanged) return deco.map(tr.changes)
    return deco
  },
  provide: (field) => EditorView.decorations.from(field),
})

export function codeBlockHighlightExtension() {
  return highlightField
}

export function highlightCodeBlockLines(lines: readonly number[] | undefined) {
  return setHighlight.of(lines ?? [])
}
