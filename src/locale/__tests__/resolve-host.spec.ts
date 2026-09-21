import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerRsLocale } from '../registry'
import { resolveHostLocale } from '../resolve-host'
import { defaultLocale } from '../types'

describe('resolveHostLocale', () => {
  const languageDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'language')
  const languagesDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'languages')

  afterEach(() => {
    if (languageDesc) Object.defineProperty(navigator, 'language', languageDesc)
    if (languagesDesc) Object.defineProperty(navigator, 'languages', languagesDesc)
    vi.unstubAllGlobals()
  })

  function stubHostLanguages(tags: string[]) {
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      get: () => tags,
    })
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      get: () => tags[0] ?? '',
    })
  }

  it('falls back to zh-CN when the host language is unknown', () => {
    expect(defaultLocale).toBe('zh-CN')
    stubHostLanguages(['fr-FR'])
    expect(resolveHostLocale()).toBe('zh-CN')
  })

  it('maps Chinese tags to zh-CN', () => {
    stubHostLanguages(['zh-Hans-CN', 'zh'])
    expect(resolveHostLocale()).toBe('zh-CN')
  })

  it('maps English tags to en-US', () => {
    stubHostLanguages(['en-GB'])
    expect(resolveHostLocale()).toBe('en-US')
  })

  it('matches a registered community locale by language prefix', () => {
    registerRsLocale('ja-JP', { 'select.placeholder': '選択してください' })
    stubHostLanguages(['ja'])
    expect(resolveHostLocale()).toBe('ja-JP')
  })
})
