# Community locales

This package ships **zh-CN** and **en-US** only. Other languages are registered by hosts or community packs. Do not send PRs that add official ja / ar / ko tables to `src/locale/messages.ts`.

## Register

```ts
import { registerRsLocale } from 'niuma-ui'
import { rsLocaleMessageKeys } from 'niuma-ui'

registerRsLocale(
  'ja-JP',
  {
    'select.placeholder': '選択してください',
    'pagination.summary': '{total, plural, other {# 件}}',
  },
  { dir: 'ltr' },
)
```

Then wrap the app:

```vue
<RsConfigProvider locale="ja-JP" dir="auto">
  <App />
</RsConfigProvider>
```

Omitted `locale` follows the host language (`zh*` → `zh-CN`, `en*` → `en-US`) and falls back to `zh-CN`. Missing keys fall back `current → en-US → zh-CN`. `dir="auto"` follows the locale (`ar` / `he` / `fa` / `ur` → rtl).

## Required keys

Use `rsLocaleMessageKeys` as the checklist. A pack may omit keys (fallback covers them). For a complete product language, fill every key.

## Plurals

`t()` accepts an ICU subset:

```text
{count, plural, one {# file} other {# files}}
```

Exact match `=0` is allowed. Categories come from `Intl.PluralRules(locale)`. `#` becomes the number.

```ts
t('pagination.summary', { total: 8 })
```

Do not concatenate `"n " + t('items')` in components.

## Pull requests

- New **keys** (used by a component): add zh-CN and en-US in the same PR.
- New **languages**: publish a separate package or gist and call `registerRsLocale`. Link it from an Issue if you want it listed for others.
- Do not grow the `RsLocale` union type.

See also [components.en.md §11](./components.en.md) and [consumers.en.md](./consumers.en.md).
