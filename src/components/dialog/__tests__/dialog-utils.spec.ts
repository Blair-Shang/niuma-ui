import { afterEach, describe, expect, it } from 'vitest'
import {
  acquireDialogScrollLock,
  dialogTargetOwnsTab,
  inertDialogSiblings,
  listDialogTabbables,
  resetDialogGuardsForTests,
  resolveRsDialogCssWidth,
  resolveRsDialogWidthPx,
} from '../src/dialog-utils'

describe('resolveRsDialogWidthPx', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('font-size')
    resetDialogGuardsForTests()
    document.body.style.overflow = ''
    document.body.style.paddingInlineEnd = ''
  })

  it('returns undefined for presets', () => {
    expect(resolveRsDialogWidthPx('sm')).toBeUndefined()
    expect(resolveRsDialogWidthPx('md')).toBeUndefined()
    expect(resolveRsDialogWidthPx('lg')).toBeUndefined()
  })

  it('keeps numeric and px widths', () => {
    expect(resolveRsDialogWidthPx(1200)).toBe(1200)
    expect(resolveRsDialogWidthPx('960px')).toBe(960)
  })

  it('converts rem using root font size', () => {
    document.documentElement.style.fontSize = '16px'
    expect(resolveRsDialogWidthPx('40rem')).toBe(640)
  })

  it('converts percent against the given viewport width', () => {
    expect(resolveRsDialogWidthPx('90%', 1000)).toBe(900)
    expect(resolveRsDialogWidthPx('80%', 800)).toBe(640)
  })

  it('returns undefined for empty or unknown units', () => {
    expect(resolveRsDialogWidthPx('')).toBeUndefined()
    expect(resolveRsDialogWidthPx('min(90vw, 1200px)')).toBeUndefined()
    expect(resolveRsDialogWidthPx(0)).toBeUndefined()
  })
})

describe('resolveRsDialogCssWidth', () => {
  it('maps number to px and keeps custom CSS strings', () => {
    expect(resolveRsDialogCssWidth('md')).toBeUndefined()
    expect(resolveRsDialogCssWidth(520)).toBe('520px')
    expect(resolveRsDialogCssWidth('90%')).toBe('90%')
  })
})

describe('dialog guards', () => {
  afterEach(() => {
    resetDialogGuardsForTests()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingInlineEnd = ''
  })

  it('restores body overflow once when the last lock releases', () => {
    document.body.style.overflow = 'auto'
    const first = acquireDialogScrollLock()
    const second = acquireDialogScrollLock()
    expect(document.body.style.overflow).toBe('hidden')
    first()
    expect(document.body.style.overflow).toBe('hidden')
    second()
    expect(document.body.style.overflow).toBe('auto')
    second()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('inerts siblings and restores them without touching the layer', () => {
    const parent = document.createElement('div')
    const other = document.createElement('button')
    const layer = document.createElement('div')
    parent.append(other, layer)
    document.body.append(parent)
    const release = inertDialogSiblings(layer)
    expect(other.hasAttribute('inert') || other.inert).toBe(true)
    expect(layer.hasAttribute('inert') || layer.inert).toBeFalsy()
    release()
    expect(other.hasAttribute('inert') || other.inert).toBeFalsy()
    release()
    expect(other.hasAttribute('inert') || other.inert).toBeFalsy()
  })

  it('lists tabbables and leaves editor Tab alone', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<button type="button">A</button><button type="button" disabled>B</button><textarea></textarea><div class="monaco-editor"><textarea class="inputarea"></textarea></div>'
    document.body.append(root)
    const items = listDialogTabbables(root)
    expect(items.map((el) => el.tagName)).toEqual(['BUTTON', 'TEXTAREA', 'TEXTAREA'])
    const editor = root.querySelector('.inputarea')
    expect(dialogTargetOwnsTab(editor)).toBe(true)
    expect(dialogTargetOwnsTab(root.querySelector('button'))).toBe(false)
  })
})
