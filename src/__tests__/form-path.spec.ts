import { describe, expect, it } from 'vitest'
import {
  concatNamePath,
  getByNamePath,
  hasByNamePath,
  namePathKey,
  normalizeNamePath,
  setByNamePath,
} from '../components/form-path'

describe('form-path', () => {
  it('normalizes string and array name paths', () => {
    expect(normalizeNamePath('user.email')).toEqual(['user', 'email'])
    expect(normalizeNamePath(['user', 'email'])).toEqual(['user', 'email'])
    expect(namePathKey(['a', 0, 'b'])).toBe('a.0.b')
  })

  it('gets and sets nested values', () => {
    const model: Record<string, unknown> = {}
    setByNamePath(model, 'user.email', 'a@b.com')
    expect(model).toEqual({ user: { email: 'a@b.com' } })
    expect(getByNamePath(model, ['user', 'email'])).toBe('a@b.com')
    expect(hasByNamePath(model, 'user.email')).toBe(true)
  })

  it('walks multi-level JSON paths', () => {
    const model: Record<string, unknown> = {}
    setByNamePath(model, 'config.headerConfig.isRequestHeader', true)
    expect(model).toEqual({
      config: { headerConfig: { isRequestHeader: true } },
    })
    expect(getByNamePath(model, 'config.headerConfig.isRequestHeader')).toBe(true)
    expect(hasByNamePath(model, 'config.headerConfig.headerName')).toBe(false)
  })

  it('preserves arrays when setting nested list fields', () => {
    const model: Record<string, unknown> = { users: [{ name: 'A' }] }
    setByNamePath(model, ['users', 0, 'name'], 'B')
    expect(model.users).toEqual([{ name: 'B' }])
    expect(Array.isArray(model.users)).toBe(true)
  })

  it('concatenates list prefix and item name', () => {
    expect(concatNamePath('users', [0, 'name'])).toEqual(['users', 0, 'name'])
  })
})
