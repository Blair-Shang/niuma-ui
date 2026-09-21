# Component guidelines

This is the **architecture contract** for `niuma-ui`. Read it before changing a component, adding an export, or touching tokens. Breaking the red lines below breaks the architecture: ship a MAJOR or revert.

Chinese: [components.md](./components.md). Keep both inventories in sync. Hosts: [consumers.en.md](./consumers.en.md) / [consumers.md](./consumers.md). Process: [CONTRIBUTING.en.md](../CONTRIBUTING.en.md) / [CONTRIBUTING.md](../CONTRIBUTING.md).

Stable imports come only from the package root:

```ts
import { RsButton, RsConfigProvider } from 'niuma-ui'
```

**Do not** import `reka-ui`. **Do not** use undocumented deep paths (`niuma-ui/src/…`, internal `*-utils` files).

---

## 1. Where each doc lives

| Doc | Write | Do not write |
|-----|--------|----------------|
| **This file** | Red lines, naming, public surface, tokens, Vue/CSS/overlay/form/a11y/i18n/SSR, checklist, catalog | Per-prop API (that is the site) |
| `site/` | Public usage: when to use, demos, API, tokens, FAQ | Internal pixel tests |
| `playground/` | Maintainer smoke / visual regression | Public usage, install guides, full API |
| `src/index.ts` | The only SemVer surface | Casual extra exports |
| `docs/consumers.md` | Host Vite / bundle / CI | Internals |
| `CONTRIBUTING.md` | PR, tests, release | A second copy of these rules |

Component APIs live on the docs site: `#/components/{slug}` (`pnpm dev:site`). The inventory below and `site/catalog/components/` must stay in sync.

---

## 2. Red lines

Do **not** do these without an Issue and a MAJOR (or a revert):

1. Let apps or the docs site import `reka-ui`, Lucide internals, or this package’s `src/` deep paths.
2. Add an `src/index.ts` export without updating this public-surface section and the site.
3. Export DOM implementation details (scroll math, ink, Portal queries) as stable API.
4. Replace `--rs-*` with `:deep`, hardcoded px / hex, or a system font stack.
5. Add a parallel package, a second entry, or a second theme attribute. Theme is `data-rs-theme` + `RsConfigProvider` only.
6. Fork an `Rs*` inside a host app and restyle internals. Change this repository instead.
7. Pull Monaco / xterm / rich table editing onto the default light path, or require `import *` on marketing sites.
8. Treat `playground/` as public usage or the official site. Public copy is `site/` only.
9. Move testable logic from `*-utils.ts` back into templates.
10. Assume `window` / `document` always exist inside utils (SSR and jsdom must degrade).
11. Replace a native HTML element with `div` + `role` / a homemade keyboard when the native semantics exist (WHATWG first; APG’s first rule is the same).
12. Ship a new Dialog, Menu, Combobox, Tabs, Grid, or Tree without APG keyboard, focus, and accessible name.

When unsure: **do not export**. If a host truly needs it, document it here first.

### External specs (scope)

Follow the clauses below that apply to this library. On conflict: WHATWG semantics > APG keyboard/roles > Vue style. Do not treat any spec as fully audited end-to-end.

| Spec | We follow | We do not follow |
|------|-----------|------------------|
| [WHATWG HTML](https://html.spec.whatwg.org/multipage/) | `<button type>`, `fieldset`/`legend`, `<nav>`, `<a href>`, native `disabled` | Treat this library as a full HTML-document style guide. Workbench widgets (virtual table, log) may be ARIA widgets when native HTML is not enough |
| [Vue Style Guide](https://vuejs.org/style-guide/) | **A (essential) always**; **B (strongly recommended) for all new code** — including `defineOptions({ name: 'RsXxx' })` and never `v-if`+`v-for` on the same node | **C**: already chosen — Composition API + `<script setup>` + scoped. **D**: avoid (`$parent`, implicit recursion, undocumented mixed control) |
| [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) | Custom widgets match a pattern: Dialog, Menu, Combobox, Tabs, Grid, Tree, Window Splitter. Names, focus trap, `Esc`, arrow keys come from APG. Decorative nodes `aria-hidden` | Promise a signed-off screen-reader matrix per pattern until that component has keyboard tests or a written list |
| Google HTML/CSS Style Guide | **Not a contract of this library** | Optional end-tag omission fights Vue templates. Classes are BEM `.rs-block__el--mod`, not Google’s short hyphenated list |

Details: §7, §10, §12. Existing debt (some `Rs*` still lack `name`) is fixed in the next PR that touches the file. New components must not ship without it.

---

## 3. Naming and files

| Kind | Rule | Example |
|------|------|---------|
| Public component | `Rs` + PascalCase, `defineOptions({ name: 'RsXxx' })` | `RsAnchor.vue` |
| Public type | `Rs` prefix | `RsAnchorItem`, `RsButtonTone` |
| Internal utils | kebab + `-utils.ts`, **no** `Rs` in the filename | `anchor-utils.ts` |
| CSS block | `.rs-{name}`, `__` element, `--` modifier | `.rs-anchor__link--active` |
| Tokens | `--rs-*`; subsystems `--rs-table-*` / `--rs-terminal-*` / `--rs-log-*` / `--rs-code-*` / `--rs-prose-*` | |
| Site slug | kebab-case = `site/demos/{slug}.vue` | `anchor`, `code-editor` |
| Locale key | `dot.case`, component in lowercase | `anchor.label` |

```text
src/
  components/           # Rs*.vue + *-utils.ts
  components/table/     # table submodule
  composables/          # useRsConfig, useRsI18n, useRsToast
  theme/                # tokens, presets, applyTheme
  locale/               # zh-CN / en-US
  monaco/               # workers — editor path only
  icons/                # registry, not a second icon system
  index.ts              # public surface only
```

New official UI is only `src/components/RsXxx.vue` plus a sibling `*-utils.ts`. Do not add a parallel component package under `src/`.

---

## 4. Public surface and SemVer

Only symbols in `src/index.ts` are covered by SemVer.

| Layer | Export | Example | Change |
|-------|--------|---------|--------|
| **Component** | `Rs*` SFC | `RsAnchor` | Remove / change defaults → MAJOR |
| **Contract types** | Types on public props / items | `RsAnchorItem` | Field change → MAJOR |
| **Host helpers** | No DOM, tested, documented | `hrefToAnchorId`, `resolveRsButtonVariant` | Semantic change → MAJOR |
| **Internal** | Do not export | `scrollContainerTo`, `findLinkByHref` | Free to change |

Before exporting: (1) is the type on a public prop? (2) must hosts call it to integrate? If not, keep it internal. (3) add a test and list it here or on the site.

MAJOR (plus a migration note in CHANGELOG): rename/remove props, events, slots, exports, CSS classes, tokens; change `v-model` type or default semantics; flip defaults such as `changeHash`.

MINOR / PATCH: optional props, new components, fixes that keep old call sites working.

---

## 5. Tokens, size, radius, type

Theme is `RsConfigProvider` + `data-rs-theme="light|dark"`. Brand overlays copy `src/theme/brand.example.css` and load **after** `styles.css`.

Do not hardcode `#6366f1`, `14px`, or `system-ui`. Do not `:deep(.rs-xxx)` height / radius / font-size. Do not invent `--niuma-*` / `--el-*`.

Size (`RsComponentSize`): `ssm` < `sm` < `md` (default) < `lg`, via `--rs-control-height-*`. Resolve **props → `RsForm` → `RsConfigProvider` → `md`** with `useResolvedRsComponentSize`.

Radius (`RsRadius`): `none | xs | sm | md | lg | full` via `useResolvedRsRadius` / `rsRadiusCss`.

Type: only `--rs-font-size-*`, `--rs-font-weight-*`, `--rs-font-sans|mono|serif`. For APIs that want pixels, use `readCssLengthPx` / `readCodeFontFamily`.

z-index: `--rs-z-tooltip` 10, `--rs-z-dropdown` 50, `--rs-z-panel` 80, `--rs-z-modal` 100, `--rs-z-loading-bar` 190, `--rs-z-toast` 200. No magic numbers.

---

## 6. Variant × tone

Shape and hue stay separate. Do not let one prop change both.

- **`variant`**: shape (solid / outline / ghost / text / link). Not “danger”.
- **`tone`**: hue (`neutral` / `primary` / `danger` / `success` / `warning` / `info`).

`variant="default" tone="warning"` is the outline warning. Historical `variant="danger"` is `primary + tone=danger`. New components must keep shape and hue orthogonal.

---

## 7. Vue contract

Follow [Vue Style Guide](https://vuejs.org/style-guide/) A/B. Public components **must** `defineOptions({ name: 'RsXxx' })` (the file name is not a substitute — DevTools, keep-alive, and warning stacks use `name`).

Single values use `defineModel`. Named models: `v-model:visible`. User events: `click` / `change`. Sync: `update:modelValue`. Boolean props default `false`. Function props such as `getContainer` may return null; the component falls back. Slots: `default` plus semantic names (`prefix`, `suffix`, `title`). Disabled is always `disabled`. Control size is always `size: RsComponentSize`. Anything that writes `location.hash` must be switchable (`changeHash`; the hash-router site sets `false`).

Components are UI plus existing tokens and host bridges. No SQL and no copies of product-backend logic.

---

## 8. CSS

Root `.rs-{name}`. State via modifiers, not inline brand colors. Logical properties (`inset-inline-start`, `padding-inline`). `scoped` stays on this block; restyle children with props/tokens. Honor `prefers-reduced-motion: reduce`.

---

## 9. Overlays

Wrap Reka only inside this package; hosts still see `Rs*`. Portals use §5 z-index tokens. Modal: focus trap, Esc, restore focus. Positioning reuses `overlay-utils`. The docs site must not add another headless library.

---

## 10. Forms

`RsFormItem` is the only field registration point. Controls read size from form context. Messages go through `validateMessages` / locale. `RsFieldset` is WHATWG `fieldset`/`legend`, not `RsCard`. `RsFormList` is array fields only.

---

## 11. Internationalization

Public API names (props, events, slots, CSS classes) stay English. User-visible strings must be translatable.

- Runtime copy (`aria-label`, empty states, placeholders, buttons) goes through `useRsI18n()` and `src/locale/messages.ts`.
- **Shipped locales:** `zh-CN` and `en-US` (BCP-47). Default is `zh-CN`. New or changed keys must land in both languages in the same PR.
- **Adding a locale (for example `ja-JP`):**
  1. Extend `RsLocale`.
  2. Clone the full table in `messages.ts`; translate values, never rename keys.
  3. Add the same locale in `site/i18n.ts`.
  4. Tests must cover `t('…')` fallback (missing key → `en-US` or `zh-CN`, never a hardcoded Chinese string).
- Numbers, dates, and plurals: use `Intl.*`. Do not hardcode `YYYY-MM-DD` or “n items” in one language.
- Writing direction: logical CSS (`padding-inline`, `inset-inline-start`). A full RTL theme is not shipped yet. Do not fake `dir="rtl"` with negative margins. When RTL lands, patch logical properties only — do not add a second class set.
- Site marketing copy lives in `site/i18n.ts`, not the component locale table.
- Repository guidelines are maintained in both languages (`docs/*.md` and `docs/*.en.md`). Update both inventories when adding a component.

---

## 12. Accessibility

Follow [APG](https://www.w3.org/WAI/ARIA/apg/) and WCAG 2.2 AA, in this order:

1. **Native first** (WHATWG): prefer `<button>` / `<a href>` / `<input>` / `fieldset` over `div[role=…]`.
2. **ARIA only when native is not enough**: role, state, and keyboard land together. A `role` without a keyboard is a defect.
3. **Name**: icon-only controls need `tooltip` or `aria-label`; navigation is `<nav>` + `aria-label`; current item is `aria-current="page"` or `"location"` (in-page TOC uses `location`).
4. **Focus**: `outline: none` only together with `:focus-visible` + `--rs-focus-ring`. Modal: trap, `Esc`, restore focus on close.
5. **Decoration**: rails, ink, and visual-only icons get `aria-hidden="true"`.
6. **Patterns**: Dialog, Menu / MenuBar, Combobox, Tabs, Grid (`RsTable`), Tree, Window Splitter (`RsSplitPane`). New overlays match APG before paint.

Semantic color contrast must not drop below existing tokens (log stripes and terminal `minimumContrastRatio` are the precedents).

---

## 13. SSR and runtime

Utils must no-op or return safely without `window`. Detect scroll containers by features (`scrollY` / `nodeType`), not `instanceof Window` across iframes. Decode hash ids with `decodeURIComponent` before `getElementById`.

---

## 14. Utils and tests

Keep `*-utils.ts` pure and tested. Vue files bind lifecycle, events, and style.

`src/__tests__/RsXxx.spec.ts` minimum: mount smoke, agreed events, utils edges (empty list, encoding, missing container, defaults). Import-only tests are not enough.

---

## 15. New-component checklist

1. `RsXxx.vue` + `xxx-utils.ts` if needed (UTF-8, no BOM).
2. `defineOptions({ name: 'RsXxx' })`, class `.rs-xxx`.
3. Export from `src/index.ts` per §4.
4. `zh-CN` + `en-US` keys in `src/locale/messages.ts`.
5. `src/__tests__/RsXxx.spec.ts`.
6. Register in `site/catalog/components/{group}.ts` (when-to-use, API, tokens, FAQ).
7. `site/demos/{slug}.vue` with `DocDemo` and copyable source.
8. Update the inventory in **both** this file and [components.md](./components.md); slug matches catalog.
9. `CHANGELOG.md` `[Unreleased]`.
10. Optional `playground/routes.ts` — **does not** replace the site.
11. Dialog / Menu / Combobox / Tabs / Grid / Tree: APG keyboard (Tab / arrows / Esc / Enter) covered by a test or a FAQ note.
12. Do not add a new `role` when a native element already has the semantics.

---

## 16. Heavy modules

`RsMonacoEditor`, `RsTerminal`, `RsCodeEditor`, and rich table editing are large. Light hosts named-import and re-export from a product `ui.ts`. See [consumers.md](./consumers.md).

---

## 17. Inventory

Stable `Rs*` components. Per-prop APIs live on the docs site. Additions must update **both** this file and [components.md](./components.md), plus `site/catalog`.

### General

| Component | Role | Docs |
|-----------|------|------|
| `RsConfigProvider` | Theme, locale, default control size | Guides |
| `RsIcon` | Lucide (and custom) by name | `#/components/icon` |
| `RsContainer` | Responsive width / padding | `#/components/container` |
| `RsScrollbar` | Scroll area | `#/components/scrollbar` |
| `RsLoading` | Loading indicator | `#/components/loading` |
| `RsEmpty` | Empty state | `#/components/empty` |
| `RsLink` | Text link | `#/components/link` |
| `RsBadge` | Status / count | `#/components/badge` |
| `RsTag` / `RsDynamicTags` | Tag / editable tag group | `#/components/tag` |
| `RsAvatar` | Avatar / fallback | `#/components/avatar` |
| `RsLabel` | Form label | `#/components/label` |
| `RsCard` / `RsStatCard` | Content / metric card | `#/components/card` |
| `RsDivider` | Divider | `#/components/divider` |
| `RsAlert` | Inline alert | `#/components/alert` |
| `RsDescriptions` / `RsDescriptionsItem` | Description list | `#/components/descriptions` |
| `RsLoadingBar` | Top progress (`useRsLoadingBar`) | `#/components/loading-bar` |

### Input

| Component | Role | Docs |
|-----------|------|------|
| `RsButton` | `variant` × `tone`, loading, icon-only | `#/components/button` |
| `RsCheckbox` | Checkbox | `#/components/checkbox` |
| `RsSwitch` | `checkedValue` / `uncheckedValue` | `#/components/switch` |
| `RsRadio` / `RsRadioItem` | Radio group | `#/components/radio` |
| `RsInput` | Validation; prefix/suffix; addons | `#/components/input` |
| `RsInputNumber` | Number input | `#/components/input-number` |
| `RsSelect` | Search / create / remote / `maxTagCount` | `#/components/select` |
| `RsAutoComplete` | APG Combobox | `#/components/auto-complete` |
| `RsCascader` | Multi-column cascade | `#/components/cascader` |
| `RsTreeSelect` | Uses `RsTree` | `#/components/tree-select` |
| `RsMentions` | `@` mentions | `#/components/mentions` |
| `RsUpload` | File pick + validation helpers | `#/components/upload` |
| `RsForm` / `RsFormItem` / `RsFormList` | Form / Form.Item / Form.List | `#/components/form` |
| `RsFieldset` | `fieldset`/`legend`, not Card | `#/components/fieldset` |
| `RsDatePicker` / `RsDateTimePicker` / `RsTimePicker` | Date and time | `#/components/date-picker` |
| `RsCalendarGrid` / `RsTimePickerColumns` | Calendar / time-column primitives | `#/components/calendar-grid` |

### Navigation and layout

| Component | Role | Docs |
|-----------|------|------|
| `RsBreadcrumb` | Breadcrumb | `#/components/breadcrumb` |
| `RsAnchor` | In-page TOC; hash routers need `changeHash=false` | `#/components/anchor` |
| `RsToolbar` | Toolbar | `#/components/toolbar` |
| `RsTabs` | Close / rename / overflow | `#/components/tabs` |
| `RsSteps` | Steps | `#/components/steps` |
| `RsMenu` | Menu | `#/components/menu` |
| `RsDropdown` | Command menu | `#/components/dropdown` |
| `RsSidebar` / `RsSidebarGroup` / `RsSidebarItem` | Sidebar | `#/components/sidebar` |
| `RsSplitPane` | Resizable panes | `#/components/split-pane` |
| `RsPagination` | Pagination | `#/components/pagination` |
| `RsVirtualList` | Virtual list | `#/components/virtual-list` |

### Overlay and feedback

| Component | Role | Docs |
|-----------|------|------|
| `RsTooltip` / `RsTooltipProvider` | Tooltip | `#/components/tooltip` |
| `RsPopover` | Popover | `#/components/popover` |
| `RsDialog` / `RsConfirmDialog` | Dialog / confirm | `#/components/dialog` |
| `RsDrawer` | Drawer | `#/components/drawer` |
| `RsContextMenu` | Context menu | `#/components/context-menu` |
| `RsToaster` | Toast host (`useRsToast`) | `#/components/toaster` |

### Data display

| Component | Role | Docs |
|-----------|------|------|
| `RsTable` | Sort, select, virtual, edit. Architecture [rs-table-architecture.md](./rs-table-architecture.md); SSR [rs-table-ssr.md](./rs-table-ssr.md); charts [rs-table-chart-adapter.md](./rs-table-chart-adapter.md); pixels [rs-table-visual.md](./rs-table-visual.md) | `#/components/table` |
| `RsTableCellEditor` | Cell editor | `#/components/table-cell-edit` |
| `RsTableHeader` / `RsTableBody` / `RsTableColGroup` | Table view parts (ViewContext) | With Table |
| `RsTree` | Check, drag, virtual | `#/components/tree` |
| `RsCodeBlock` | Read-only by default; `editable` / `showBar` | `#/components/code-block` |
| `RsMarkdown` | Markdown | `#/components/markdown` |
| `RsProseEditor` | Rich-text surface | Editor family |

### Editors and terminal (heavy)

| Component | Role | Docs |
|-----------|------|------|
| `RsCodeEditor` | CodeMirror | `#/components/code-editor` |
| `RsMonacoEditor` | Monaco | `#/components/monaco-editor` |
| `RsTerminal` | xterm | `#/components/terminal` |
| `RsLog` | Read-only log (not a PTY) | `#/components/log` |

### Registered host helpers (excerpt)

`src/index.ts` is authoritative. These categories may be exported; **DOM implementation functions stay internal** unless listed.

| Category | Examples | Notes |
|----------|----------|--------|
| Button | `resolveRsButtonVariant` / `resolveRsButtonTone` | Shape and hue |
| Anchor | `hrefToAnchorId`, `flattenAnchorItems`, `pickActiveAnchorHref` | Pure helpers; do not export scroll / ink |
| Size / radius | `useResolvedRsComponentSize`, `rsRadiusCss` | |
| Theme | `applyTheme`, `themePresets` | |
| i18n | `useRsI18n`, `createTranslator` | |
| Form / date | `validateDateValue`, … | No DOM |
| Table | `useRsTable*` (see table architecture) | Do not reimplement the engine in a host |

---

## 18. Docs site vs internal test bench

Public usage lives only on `site/`:

1. Register when-to-use, API, tokens, and FAQ in `site/catalog/components/`.
2. Copyable examples go in `site/demos/{slug}.vue` with `DocDemo`.
3. Local `pnpm dev:site` → http://127.0.0.1:5181 ; `pnpm build:site` deploys GitHub Pages (https://blair-shang.github.io/niuma-ui/).

`playground/` is the maintainer test bench. It is **not** a second docs site:

1. `playground/routes.ts` registers test paths only.
2. `DemoPage` / `DemoBlock` for smoke; Playwright for visual regression.
3. `pnpm dev` → http://127.0.0.1:5180.
4. Do not write install tutorials or treat brief tables as the public API.

Host products (including the gateway console) must link the docs site when explaining `Rs*` usage — never playground. If playground copy disagrees with this contract or the site API, the contract and the site win.
