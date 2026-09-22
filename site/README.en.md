# Docs site (public usage)

[中文](./README.md)

`site/` is the **only public usage guide** for niuma-ui. International readers should see when to use a component, how to write it, and where events land. Write decisions. Do not copy another product’s pages.

| Entry | URL |
|-------|-----|
| Local | `pnpm dev:site` → http://127.0.0.1:5181 |
| Production | https://blair-shang.github.io/niuma-ui/ |
| Routes | Hash: `#/components/{slug}`, `#/guide/{slug}` |

`playground/` is internal smoke and visual regression (`:5180`). It is not usage documentation. The architecture contract stays in [docs/components.en.md](../docs/components.en.md).

## Files

| Path | Write only |
|------|------------|
| `catalog/components/{group}.ts` | Intro, when-to-use, demo TOC, **props / events / slots / methods**, tokens, FAQ |
| `demos/{slug}.vue` | `DocDemo`: preview + copyable source |
| `src/components/{slug}` | Implementation. The catalog must match the source. Do not invent props. |

`slug` = folder name = route. Groups exist only in the catalog: `basic` / `form` / `nav` / `feedback` / `data` / `editor`.

Demos and docs must **not** `import … from 'reka-ui'`. Import from `niuma-ui` only.

## Catalog (complete the API)

Every `ComponentDoc` lists `defineProps` / `defineEmits` / `defineModel` / `<slot>` / `defineExpose` from `RsXxx.vue`. Missing a row means the page is unfinished.

| Field | Rule |
|-------|------|
| `description` + `descriptionEn` | First paragraph: shape and boundaries, not a slogan |
| `whenToUse` + `whenToUseEn` | Decisions: when to use this, when to use another component |
| `demos` | `{ id, title, titleEn }` — `id` matches `DocDemo` |
| `props` | `name` / `type` / `default` / `description` / **`descriptionEn`**. Add `defaultEn` when the default is prose |
| `events` | Component `emit` and `update:*` (including `v-model`). If there are **no** component events, say so (Icon: `none`; native listeners fall through to the svg) |
| `slots` | `default` and every named slot |
| `methods` | **Every** key on `defineExpose`: functions and exposed instances / refs. If there is no `defineExpose`, write `none` |
| `tokens` | `--rs-*` this component writes or depends on |
| `faq` | Choice questions, ghost APIs, why a click does nothing |

Do not:

- List fields the source does not have (Divider `label`, Scrollbar `direction`)
- Ship Chinese-only one-line descriptions
- Type a real union as generic `string`
- Omit `update:*` for a `v-model`
- Drop any key from `defineExpose` (including validate / open helpers used only by a parent)

## Methods (`defineExpose`)

`catalog.methods` and `defineExpose({ ... })` must have the **same key set**. Missing, extra, or renamed keys means the page is unfinished.

Document more than “imperative APIs for a host `ref`”:

| Caller | Still list it |
|--------|----------------|
| Host: `formRef.value.validate()`, `dialogRef.value.close()` | Yes |
| Parent in this library: Form calling FormItem `validate` / `setValue` | Yes |
| Exposed instance: `view`, or the DOM from `getViewport()` | Yes |

Each row: `name`, full type (args + return), `description` + `descriptionEn`. Say who calls it, what it does, and what it returns on failure.

Components with no `defineExpose` (Button, Icon) set methods to `none`. Do not leave the table absent so it looks forgotten.

A child control (`RsFormItem`, `RsConfirmDialog`, a column picker) that has its own `defineExpose` must list those keys on its doc page. Do not only document the parent.

Do not:

- Publish two “important” methods and hide the rest as internal
- List file-private functions that are not on `defineExpose`
- Ship Chinese-only method copy

## Demos (`demos/{slug}.vue`)

Full examples: `demos/button.vue` / `icon.vue` / `link.vue`.

1. **Locale** — Site chrome uses **vue-i18n** (`site/locales/{locale}/` split into nav / home / doc, `t('doc.showCode')` / `chrome`). The locale stays in sync with `RsConfigProvider` via `setSiteLocale` and is stored in `localStorage`. Catalog paired fields still use `pickSitePair` (non-Chinese falls back to English). Preview labels use `useSiteDemo({ 'zh-CN', 'en-US', … })`. Do **not** write `isEn`. To add a language: copy a locale folder + `SITE_LOCALES` + a demo table block; missing demo packs fall back to `en-US`. vue-i18n is docs-site only — it is not part of the niuma-ui package.
1b. **Theme** — color uses `--rs-*`. Dark islands use `data-rs-theme`. Read the current light/dark with `useSiteI18n().resolvedTheme` (same path as the header `setTheme`). Do not hard-code hex.
2. **Copyable code** — `code` is an English snippet that matches the preview. Do not ship Chinese-only examples.
3. **Usage, not a prop gallery** — one decision per block (shape, disabled, composition). Color uses tokens. Dark surfaces use `data-rs-theme`. Do not hard-code hex.
4. **Events must be visible** — bind `click` / `change` / `close` and show a result in the preview (`click → Save`). Show that `loading` blocks extra clicks. If there is no component event, contrast “icon does nothing / button logs a click”.
5. **Actions on controls** — bind interaction to `RsButton` or a native control. Do not put `@click` on a decorative `RsIcon` (no focus ring).
6. **Slots in the preview** — if `#header` / `#trigger` / `#fallback` exist, use them in a demo. Do not leave them on the API table only.
7. **Methods in the preview** — host-facing expose (`validate`, `close`, `scrollTop`, `focus`) needs a template `ref` and a button that shows the result. Parent-only methods may skip the button; they still belong on the methods table.

## When the API changes

1. Change `src/components/{slug}` and tests first.
2. Sync `catalog/components/{group}.ts` (bilingual props / events / slots / methods).
3. Sync `demos/{slug}.vue` (add `DocDemo` blocks; events and host-facing expose must produce a visible result).
4. Update the inventory in [docs/components.en.md](../docs/components.en.md) and `CHANGELOG.md` `[Unreleased]`.

Complete pages: `#/components/button`, `#/components/icon`, `#/components/link`, `#/components/badge`, `#/components/tag`, `#/components/divider`, `#/components/avatar`, `#/components/card`, `#/components/stat-card`, `#/components/container`, `#/components/scrollbar`, `#/components/form`, `#/components/input`, `#/components/textarea`, `#/components/input-number`, `#/components/checkbox`, `#/components/radio`, `#/components/switch`, `#/components/select`, `#/components/auto-complete`, `#/components/cascader`, `#/components/tree-select`, `#/components/mentions`, `#/components/label`, `#/components/fieldset`, `#/components/dynamic-tags`, `#/components/upload`, `#/components/date-picker`, `#/components/datetime-picker`, `#/components/time-picker`, `#/components/calendar-grid`, `#/components/anchor`, `#/components/breadcrumb`, `#/components/menu`, `#/components/sidebar`, `#/components/tabs`, `#/components/steps`, `#/components/dropdown`, `#/components/toolbar`, `#/components/split-pane`, `#/components/pagination`, `#/components/alert`, `#/components/empty`, `#/components/loading`, `#/components/loading-bar`, `#/components/tooltip`, `#/components/popover`, `#/components/dialog`, `#/components/confirm-dialog`, `#/components/drawer`, `#/components/toaster`, `#/components/descriptions`, `#/components/virtual-list`.
