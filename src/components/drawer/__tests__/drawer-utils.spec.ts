import { afterEach, describe, expect, it } from 'vitest'
import {
  acquireRsDrawerScrollLock,
  clampRsDrawerSize,
  isRsDrawerDismissExempt,
  isTopRsDrawer,
  pushRsDrawerLayer,
  resetRsDrawerRuntime,
  resolveRsDrawerDimensionCss,
  resolveRsDrawerSizePx,
} from '../src/drawer-utils'

describe('drawer-utils', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    resetRsDrawerRuntime()
  })

  it('clamps a dragged size inside min and max', () => {
    expect(clampRsDrawerSize(10, 256, 800)).toBe(256)
    expect(clampRsDrawerSize(900, 256, 800)).toBe(800)
    expect(clampRsDrawerSize(400.4, 256, 800)).toBe(400)
  })

  it('resolves dimensions and ignores empty values', () => {
    expect(resolveRsDrawerDimensionCss(420)).toBe('420px')
    expect(resolveRsDrawerDimensionCss('24rem')).toBe('24rem')
    expect(resolveRsDrawerDimensionCss('  ')).toBeUndefined()
    expect(resolveRsDrawerDimensionCss(0)).toBeUndefined()
    expect(resolveRsDrawerSizePx('2rem', 100, 16, 1000)).toBe(32)
    expect(resolveRsDrawerSizePx('50%', 100, 16, 1000)).toBe(500)
    expect(resolveRsDrawerSizePx('nope', 100, 16, 1000)).toBe(100)
  })

  it('treats only the last opened drawer as the top layer', () => {
    const releaseA = pushRsDrawerLayer('a')
    const releaseB = pushRsDrawerLayer('b')
    expect(isTopRsDrawer('b')).toBe(true)
    expect(isTopRsDrawer('a')).toBe(false)
    releaseB()
    expect(isTopRsDrawer('a')).toBe(true)
    releaseA()
    expect(isTopRsDrawer('a')).toBe(false)
  })

  it('restores body overflow only after the last scroll lock is released', () => {
    document.body.style.overflow = 'auto'
    const releaseA = acquireRsDrawerScrollLock()
    const releaseB = acquireRsDrawerScrollLock()
    expect(document.body.style.overflow).toBe('hidden')
    releaseA()
    expect(document.body.style.overflow).toBe('hidden')
    releaseB()
    expect(document.body.style.overflow).toBe('auto')
    releaseB()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('ignores pointer targets inside the panel or an owned popup', () => {
    const content = document.createElement('div')
    content.className = 'rs-drawer__content'
    const inner = document.createElement('button')
    content.appendChild(inner)
    const menu = document.createElement('div')
    menu.setAttribute('role', 'menu')
    const item = document.createElement('button')
    menu.appendChild(item)
    const other = document.createElement('div')
    other.className = 'rs-drawer__content'
    document.body.append(content, menu, other)

    expect(isRsDrawerDismissExempt(inner, content)).toBe(true)
    expect(isRsDrawerDismissExempt(item, content)).toBe(true)
    expect(isRsDrawerDismissExempt(other, content)).toBe(false)
    expect(isRsDrawerDismissExempt(document.body, content)).toBe(false)

    content.remove()
    menu.remove()
    other.remove()
  })
})
