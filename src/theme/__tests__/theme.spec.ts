import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRsConfigState } from '../../composables/useRsConfig'
import { applyTheme, readResolvedTheme, resolveThemeMode } from '../apply'
import { themePresets } from '../presets'
import { themePrefAttribute } from '../types'
import {
  RS_FONT_SIZES,
  RS_FONT_SIZE_CSS,
  RS_FONT_WEIGHTS,
  RS_FONT_WEIGHT_CSS,
} from '../types'

describe('useRsConfig / theme', () => {
  it('translates by locale', () => {
    const zh = createRsConfigState('dark', 'zh-CN')
    const en = createRsConfigState('dark', 'en-US')
    expect(zh.t('select.placeholder')).toBe('请选择')
    expect(en.t('select.placeholder')).toBe('Select')
    expect(zh.t('input.required')).toBe('此项为必填')
    expect(en.t('input.required')).toBe('This field is required')
    expect(zh.t('form.validate.required', { label: '邮箱' })).toBe('请填写邮箱')
    expect(en.t('form.validate.required', { label: 'Email' })).toBe('Please enter Email')
    expect(en.t('breadcrumb.label')).toBe('Breadcrumb')
    expect(en.t('pagination.summary', { total: 1 })).toBe('1 item')
    expect(en.t('pagination.summary', { total: 8 })).toBe('8 items')
    expect(zh.t('pagination.summary', { total: 1 })).toBe('共 1 条')
    expect(en.t('log.newLines', { count: 1 })).toBe('1 new line')
    expect(en.t('log.newLines', { count: 3 })).toBe('3 new lines')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-rs-theme')
    document.documentElement.removeAttribute(themePrefAttribute)
    vi.unstubAllGlobals()
  })

  it('applyTheme sets data-rs-theme on element', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.rsTheme).toBe('light')
    expect(document.documentElement.getAttribute(themePrefAttribute)).toBeNull()
    applyTheme('dark')
    expect(document.documentElement.dataset.rsTheme).toBe('dark')
  })

  it('applyTheme system writes resolved light/dark and pref', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-color-scheme: dark'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    applyTheme('system')
    expect(document.documentElement.dataset.rsTheme).toBe('dark')
    expect(document.documentElement.getAttribute(themePrefAttribute)).toBe('system')
    expect(resolveThemeMode('system')).toBe('dark')
  })

  it('readResolvedTheme defaults to light when attribute is missing', () => {
    expect(readResolvedTheme()).toBe('light')
    document.documentElement.setAttribute('data-rs-theme', 'dark')
    expect(readResolvedTheme()).toBe('dark')
  })

  it('createRsConfigState resolves system preference', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const cfg = createRsConfigState('system', 'en-US')
    expect(cfg.theme.value).toBe('system')
    expect(cfg.resolvedTheme.value).toBe('light')
  })

  it('exposes typography token ladders', () => {
    expect(RS_FONT_SIZES).toEqual(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'])
    expect(RS_FONT_SIZE_CSS['3xl']).toBe('var(--rs-font-size-3xl)')
    expect(RS_FONT_WEIGHTS).toEqual(['regular', 'medium', 'semibold', 'bold'])
    expect(RS_FONT_WEIGHT_CSS.semibold).toBe('var(--rs-font-weight-semibold)')
  })

  it('theme presets include text semantic fields', () => {
    for (const mode of ['light', 'dark'] as const) {
      const p = themePresets[mode]
      expect(p.text).toBeTruthy()
      expect(p.muted).toBeTruthy()
      expect(p.placeholder).toBeTruthy()
      expect(p.textDisabled).toBeTruthy()
      expect(p.textInverse).toBe('#ffffff')
    }
  })
})
