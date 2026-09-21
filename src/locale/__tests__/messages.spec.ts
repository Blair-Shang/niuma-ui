import { describe, expect, it } from 'vitest'
import { enUS, rsLocaleMessageKeys, zhCN } from '../messages'
import { defaultLocale } from '../types'

describe('locale messages', () => {
  it('falls back to zh-CN when the host language cannot be resolved', () => {
    expect(defaultLocale).toBe('zh-CN')
  })

  it('keeps zh-CN and en-US keys in lockstep', () => {
    const zhKeys = Object.keys(zhCN).sort()
    const enKeys = Object.keys(enUS).sort()
    expect(zhKeys).toEqual(enKeys)
    expect(rsLocaleMessageKeys).toEqual(Object.keys(enUS))
  })
})
