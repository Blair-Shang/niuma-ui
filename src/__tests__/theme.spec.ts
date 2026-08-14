import { describe, expect, it } from 'vitest'
import { createRsConfigState } from '../composables/useRsConfig'
import { applyTheme } from '../theme/apply'
import { themePresets } from '../theme/presets'
import {
  RS_FONT_SIZES,
  RS_FONT_SIZE_CSS,
  RS_FONT_WEIGHTS,
  RS_FONT_WEIGHT_CSS,
} from '../theme/types'

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
  })

  it('applyTheme sets data-rs-theme on element', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.rsTheme).toBe('light')
    applyTheme('dark')
    expect(document.documentElement.dataset.rsTheme).toBe('dark')
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
