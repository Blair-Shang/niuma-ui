import { afterEach, describe, expect, it } from 'vitest'
import { applyLocale } from '../apply'
import {
  inferRsLocaleDir,
  isRsLocaleRegistered,
  listRsLocales,
  registerRsLocale,
  resolveRsLocaleDir,
  resolveRsMessage,
} from '../registry'
import { dirAttribute, localeAttribute } from '../types'

describe('locale registry', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(localeAttribute)
    document.documentElement.removeAttribute(dirAttribute)
    document.documentElement.removeAttribute('dir')
    document.documentElement.removeAttribute('lang')
  })

  it('ships zh-CN and en-US', () => {
    expect(isRsLocaleRegistered('zh-CN')).toBe(true)
    expect(isRsLocaleRegistered('en-US')).toBe(true)
    expect(listRsLocales()).toEqual(expect.arrayContaining(['zh-CN', 'en-US']))
    expect(resolveRsMessage('zh-CN', 'select.placeholder')).toBe('请选择')
    expect(resolveRsMessage('en-US', 'select.placeholder')).toBe('Select')
  })

  it('registerRsLocale adds a third language and falls back missing keys', () => {
    registerRsLocale('ja-JP', { 'select.placeholder': '選択してください' }, { dir: 'ltr' })
    expect(isRsLocaleRegistered('ja-JP')).toBe(true)
    expect(resolveRsMessage('ja-JP', 'select.placeholder')).toBe('選択してください')
    expect(resolveRsMessage('ja-JP', 'common.cancel')).toBe('Cancel')
    expect(resolveRsLocaleDir('ja-JP')).toBe('ltr')
  })

  it('infers rtl for Arabic and applyLocale writes dir', () => {
    expect(inferRsLocaleDir('ar-SA')).toBe('rtl')
    registerRsLocale('ar', { 'select.placeholder': 'اختر' })
    applyLocale('ar', 'auto')
    expect(document.documentElement.getAttribute(localeAttribute)).toBe('ar')
    expect(document.documentElement.getAttribute('lang')).toBe('ar')
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')
    expect(document.documentElement.getAttribute(dirAttribute)).toBe('rtl')
  })

  it('dir=ltr overrides locale inference', () => {
    applyLocale('ar', 'ltr')
    expect(document.documentElement.getAttribute('dir')).toBe('ltr')
  })
})
