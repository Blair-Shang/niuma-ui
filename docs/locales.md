# 社区语言包

本包只维护 **zh-CN** 与 **en-US**。其它语言由宿主或社区登记。不要向 `src/locale/messages.ts` 提官方 ja / ar / ko 表。

## 登记

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

然后：

```vue
<RsConfigProvider locale="ja-JP" dir="auto">
  <App />
</RsConfigProvider>
```

未设 `locale` 时按本机语言选择（`zh*` → `zh-CN`，`en*` → `en-US`），认不出回退 `zh-CN`。缺 key 回退：当前语言 → `en-US` → `zh-CN`。`dir="auto"` 跟 locale（`ar` / `he` / `fa` / `ur` 为 rtl）。

## 必填 key

用 `rsLocaleMessageKeys` 当清单。可以只覆盖部分 key（其余走回退）。完整产品语言请补齐全部 key。

## 复数

`t()` 支持 ICU 子集：

```text
{count, plural, one {# file} other {# files}}
```

可用 `=0`。类别由 `Intl.PluralRules(locale)` 决定，`#` 换成数字。

```ts
t('pagination.summary', { total: 8 })
```

不要在组件里拼 `"n " + t('items')`。

## 合入规则

- **新 key**（组件用到）：同一 PR 补 zh-CN 与 en-US。
- **新语言**：单独发包装或 gist，调用 `registerRsLocale`。若希望别人发现，开 Issue 附链接。
- 不要扩大 `RsLocale` 联合类型。

详见 [components.md §11](./components.md)、[consumers.md](./consumers.md)。
