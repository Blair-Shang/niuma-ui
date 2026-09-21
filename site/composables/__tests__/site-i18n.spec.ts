import { describe, expect, it } from 'vitest'
import {
  i18n,
  nextSiteLocale,
  pickSitePair,
  pickSiteRecord,
  resolveSiteLocale,
  siteText,
} from '../../i18n'

describe('site i18n', () => {
  it('resolves registered locales and prefixes', () => {
    expect(resolveSiteLocale('zh-CN')).toBe('zh-CN')
    expect(resolveSiteLocale('en-US')).toBe('en-US')
    expect(resolveSiteLocale('zh-TW')).toBe('zh-CN')
    expect(resolveSiteLocale('en')).toBe('en-US')
  })

  it('falls back to en-US when the site has no pack', () => {
    expect(resolveSiteLocale('ja-JP')).toBe('en-US')
    expect(resolveSiteLocale('ar')).toBe('en-US')
    expect(siteText('ja-JP').nav.guide).toBe(siteText('en-US').nav.guide)
  })

  it('picks demo tables by locale then prefix then en-US', () => {
    const table = {
      'zh-CN': { inbox: '收件箱' },
      'en-US': { inbox: 'Inbox' },
      'ja-JP': { inbox: '受信箱' },
    }
    expect(pickSiteRecord(table, 'zh-CN').inbox).toBe('收件箱')
    expect(pickSiteRecord(table, 'en-US').inbox).toBe('Inbox')
    expect(pickSiteRecord(table, 'ja-JP').inbox).toBe('受信箱')
    expect(pickSiteRecord({ 'zh-CN': table['zh-CN'], 'en-US': table['en-US'] }, 'ja-JP').inbox).toBe(
      'Inbox',
    )
    expect(pickSiteRecord(table, 'zh-TW').inbox).toBe('收件箱')
  })

  it('uses English catalog copy for non-Chinese locales', () => {
    expect(pickSitePair('zh-CN', '进行中', 'In progress')).toBe('进行中')
    expect(pickSitePair('en-US', '进行中', 'In progress')).toBe('In progress')
    expect(pickSitePair('ja-JP', '进行中', 'In progress')).toBe('In progress')
    expect(pickSitePair('de-DE', '进行中')).toBe('进行中')
  })

  it('cycles registered site locales', () => {
    expect(nextSiteLocale('zh-CN')).toBe('en-US')
    expect(nextSiteLocale('en-US')).toBe('zh-CN')
    expect(nextSiteLocale('ja-JP')).toBe('zh-CN')
  })

  it('resolves chrome copy through vue-i18n', () => {
    const previous = i18n.global.locale.value
    i18n.global.locale.value = 'en-US'
    expect(i18n.global.t('nav.guide')).toBe('Guide')
    expect(i18n.global.t('doc.showCode')).toBe('Show code')
    i18n.global.locale.value = 'zh-CN'
    expect(i18n.global.t('nav.guide')).toBe('指南')
    i18n.global.locale.value = previous
  })
})
