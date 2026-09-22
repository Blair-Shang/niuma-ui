import { afterEach, describe, expect, it } from 'vitest'
import {
  applyColorTheme,
  clearColorTheme,
  colorThemeAttribute,
  isSafeColorThemeValue,
} from '../color-theme'

const ink = {
  id: 'example.ink',
  label: 'Ink',
  uiTheme: 'dark' as const,
  colors: {
    primary: '#8c2f39',
    surface: '#1c1412',
    text: '#f3e6d8',
  },
}

describe('applyColorTheme', () => {
  afterEach(() => {
    clearColorTheme()
  })

  it('writes allowlisted tokens and marks the theme id', () => {
    expect(applyColorTheme(ink)).toBe(true)
    const root = document.documentElement
    expect(root.getAttribute(colorThemeAttribute)).toBe('example.ink')
    expect(root.style.getPropertyValue('--rs-primary')).toBe('#8c2f39')
    expect(root.style.getPropertyValue('--rs-surface')).toBe('#1c1412')
    expect(root.style.getPropertyValue('--rs-text-primary')).toBe('#f3e6d8')
  })

  it('drops tokens the next theme does not set', () => {
    applyColorTheme(ink)
    applyColorTheme({
      id: 'example.paper',
      label: 'Paper',
      uiTheme: 'light',
      colors: { primary: '#1d4e89' },
    })
    const root = document.documentElement
    expect(root.getAttribute(colorThemeAttribute)).toBe('example.paper')
    expect(root.style.getPropertyValue('--rs-primary')).toBe('#1d4e89')
    expect(root.style.getPropertyValue('--rs-surface')).toBe('')
    expect(root.style.getPropertyValue('--rs-text-primary')).toBe('')
  })

  it('ignores unknown keys and unsafe values', () => {
    const theme = {
      ...ink,
      colors: {
        primary: 'red; background: url(https://evil.test)',
        surface: '#111111',
        notAToken: '#ffffff',
      },
    }
    expect(applyColorTheme(theme as never)).toBe(true)
    const root = document.documentElement
    expect(root.style.getPropertyValue('--rs-primary')).toBe('')
    expect(root.style.getPropertyValue('--rs-surface')).toBe('#111111')
    expect(root.style.getPropertyValue('--notAToken')).toBe('')
  })

  it('rejects an id that is not a theme name', () => {
    expect(applyColorTheme({ ...ink, id: '../ink' })).toBe(false)
    expect(document.documentElement.hasAttribute(colorThemeAttribute)).toBe(false)
  })

  it('clearColorTheme restores the stylesheet', () => {
    applyColorTheme(ink)
    clearColorTheme()
    const root = document.documentElement
    expect(root.hasAttribute(colorThemeAttribute)).toBe(false)
    expect(root.style.getPropertyValue('--rs-primary')).toBe('')
  })

  it('rejects values that can escape a custom property', () => {
    expect(isSafeColorThemeValue('#8c2f39')).toBe(true)
    expect(isSafeColorThemeValue('color-mix(in srgb, #8c2f39 20%, transparent)')).toBe(true)
    expect(isSafeColorThemeValue('var(--rs-primary)')).toBe(true)
    expect(isSafeColorThemeValue('red; } body { background: url(https://evil.test)')).toBe(false)
  })
})
