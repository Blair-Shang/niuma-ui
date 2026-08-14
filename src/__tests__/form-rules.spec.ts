import { describe, expect, it } from 'vitest'
import {
  buildLocalInputRules,
  matchFormRuleTrigger,
  normalizeFormRules,
  runFormFieldRules,
} from '../components/form-rules'

describe('form-rules', () => {
  it('normalizes single rule and arrays', () => {
    expect(normalizeFormRules({ required: true })).toHaveLength(1)
    expect(normalizeFormRules([{ required: true }, { min: 2 }])).toHaveLength(2)
    expect(normalizeFormRules()).toEqual([])
  })

  it('matches trigger filters', () => {
    expect(matchFormRuleTrigger({ required: true }, 'blur')).toBe(true)
    expect(matchFormRuleTrigger({ required: true, trigger: 'blur' }, 'change')).toBe(false)
    expect(matchFormRuleTrigger({ required: true, trigger: ['blur', 'change'] }, 'change')).toBe(
      true,
    )
  })

  it('validates required / min / pattern / email type', async () => {
    const required = await runFormFieldRules('', [{ required: true, message: '必填' }])
    expect(required).toEqual({ valid: false, message: '必填' })

    const min = await runFormFieldRules('ab', [{ min: 3, message: '短' }])
    expect(min.valid).toBe(false)

    const email = await runFormFieldRules('bad', [{ type: 'email', message: '邮箱错' }])
    expect(email.message).toBe('邮箱错')

    const ok = await runFormFieldRules('a@b.com', [{ type: 'email' }])
    expect(ok.valid).toBe(true)

    const pattern = await runFormFieldRules('x', [
      { pattern: /^\d+$/, message: '数字' },
    ])
    expect(pattern.message).toBe('数字')
  })

  it('supports async validator', async () => {
    const result = await runFormFieldRules('admin', [
      {
        async validator(value) {
          if (String(value) === 'admin') return '占用'
          return true
        },
      },
    ])
    expect(result).toEqual({ valid: false, message: '占用' })
  })

  it('builds local input rules', () => {
    const rules = buildLocalInputRules({
      required: true,
      rule: 'email',
      validator: () => true,
    })
    expect(rules).toHaveLength(3)
    expect(rules[0]?.required).toBe(true)
    expect(rules[1]?.type).toBe('email')
  })

  it('interpolates required message with label', async () => {
    const labeled = await runFormFieldRules('', [{ required: true }], { label: '邮箱' })
    expect(labeled.message).toBe('请填写邮箱')
  })

  it('supports message as function', async () => {
    const result = await runFormFieldRules('x', [
      {
        min: 3,
        message: ({ value }) => `当前「${String(value)}」太短`,
      },
    ])
    expect(result.valid).toBe(false)
    expect(result.message).toBe('当前「x」太短')
  })

  it('validator can read other fields via context', async () => {
    const result = await runFormFieldRules('two', [
      {
        validator(value, ctx) {
          if (String(value) !== String(ctx.getFieldValue('a'))) return '不一致'
          return true
        },
      },
    ], {
      getFieldValue: (name) => (String(name) === 'a' ? 'one' : undefined),
    })
    expect(result).toEqual({ valid: false, message: '不一致' })

    const ok = await runFormFieldRules('one', [
      {
        validator(value, ctx) {
          if (String(value) !== String(ctx.getFieldValue('a'))) return '不一致'
          return true
        },
      },
    ], {
      getFieldValue: (name) => (String(name) === 'a' ? 'one' : undefined),
    })
    expect(ok.valid).toBe(true)
  })

  it('runs custom validator on empty value for cross-field required', async () => {
    const result = await runFormFieldRules(
      '',
      [
        {
          validator(_value, ctx) {
            if (ctx.getFieldValue('kind') === 'email') return '邮箱必填'
            return true
          },
        },
      ],
      { getFieldValue: (name) => (String(name) === 'kind' ? 'email' : undefined) },
    )
    expect(result).toEqual({ valid: false, message: '邮箱必填' })
  })

  it('treats Error return and thrown errors as failure', async () => {
    const returned = await runFormFieldRules('x', [
      { validator: () => new Error('返回错误') as unknown as string },
    ])
    expect(returned).toEqual({ valid: false, message: '返回错误' })

    const thrown = await runFormFieldRules('x', [
      {
        validator() {
          throw new Error('抛出错误')
        },
      },
    ])
    expect(thrown).toEqual({ valid: false, message: '抛出错误' })
  })
})
