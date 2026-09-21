# Consumer guide

How to integrate `niuma-ui` into a host app (desktop shell, admin console, or marketing site). Read the root [README.md](../README.md) first. Architecture and catalog: [components.en.md](./components.en.md). Chinese: [consumers.md](./consumers.md).

Usage, when-to-use, and API live only on the docs site: [https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/) (source `site/`, local `pnpm dev:site`). `playground/` is the maintainer test bench. It does not document public usage.

**Positioning:** a workbench design system, not a lightweight general-purpose kit. Since **1.2.0** the npm package is compiled ESM. Install pulls Monaco / CodeMirror / xterm; bundle size depends on **named imports** and the entry rules below. Current release is **2.0.0**. The `1.x` branch keeps the 1.3 line.

**Contract:** the public API is named imports from the package root. `vite build` / CI resolve that entry and do not depend on rewrite plugins. `niumaUiHost` is **serve-only** (`pnpm dev`). Do not alias the package to `src/index.ts`.

1. `styles.css` is standalone (tokens + reset + components) and **does not** include Tailwind. Hosts `import 'niuma-ui/styles.css'`. Add `import 'niuma-ui/brand-icons.css'` for data-source mark colors. If the app uses utility classes, import Tailwind in the host CSS.
2. Enable `niumaUiHost()` (`niuma-ui/vite-plugins/niuma-ui-host`):
   - `pnpm dev` + `link:`: named imports rewrite to `src/**/*.vue`, `styles.css` points at source, components HMR.
   - `vite build` / CI: no rewrite; resolve real re-exports from `dist/index.js`.
3. **Do not** alias the package to `src/index.ts`. Evaluating the whole barrel pulls unused component CSS and breaks tree-shaking.
4. Always named-import from the root. Light hosts re-export used symbols from their own `src/ui.ts` (product-level thinning, not a bundler bypass). No `import *`.
5. Subpaths (`vite-plugins/*`, `styles.css`, `vite-prebundle/*`) are for tooling, not everyday component imports.

## 1. How to depend

The npm name is **`niuma-ui`**. Stable publishes update dist-tag **`latest`**. Prereleases use **`next`**. There is no GitHub tag named `latest`.

| Case | Recommended | Notes |
|------|-------------|--------|
| Local HMR against this repo | `"niuma-ui": "link:../niuma-ui"` | Path is relative to the **package.json that declares the dependency** |
| Third-party, want patches | `"niuma-ui": "^2.0.0"` | Compatible 2.x only |
| Must reproduce | `"niuma-ui": "2.0.0"` | Exact version |
| Stay on 1.x | `"niuma-ui": "^1.3.9"` | Tailwind-forwarding contract; see the `1.x` branch |
| Downstream CI that used to clone this repo | `npm:niuma-ui@latest` | Install from the registry; do not checkout this git repo in product CI |

Open-source baseline **1.0.0**, [Apache License 2.0](../LICENSE). The old scoped name `@niuma/ui` is not published — use **`niuma-ui`**.

### 1.1 Local `link` (development)

```text
workspace/
  niuma-ui/          # this repository
  your-app/          # host (use ../../niuma-ui if the app lives in a subfolder)
```

```json
{
  "dependencies": {
    "niuma-ui": "link:../niuma-ui",
    "vue": "^3.5.0"
  }
}
```

```bash
cd ../niuma-ui && pnpm install   # prepare builds dist when missing
cd ../your-app && pnpm install
pnpm dev
```

`exports` only resolve `dist` (same as Vue / Vite). After clone, `pnpm install` in **niuma-ui** runs `prepare` and builds plugins + the barrel. With `link:` + `pnpm dev`, `niumaUiHost` points used components at sibling `src/` for HMR. Production / CI still resolve npm `dist`. Rebuild after changing Vite plugin sources (`pnpm build`).

### 1.2 npm (recommended for everyone else)

```bash
pnpm add niuma-ui          # current latest
pnpm add niuma-ui@2.0.0    # pin
```

Prefer a semver range over `git+https://…#v2.0.0` unless you cannot reach npm. Do not checkout `ref: latest` from GitHub — that tag does not exist.

### 1.3 Downstream CI that still commits `link:` (optional)

If a host still commits `link:` in `package.json`, CI should rewrite it to npm and **must not** clone this git repo:

```bash
pnpm pkg set "dependencies.niuma-ui=npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
pnpm install --no-frozen-lockfile
```

`--frozen-lockfile` fights `latest`. Pin with `NIUMA_UI_VERSION=2.0.0` when you need a known build.

## 2. Minimal integration

1. Install `vue` (peer) and `niuma-ui`.
2. Import styles once at the app entry:

   ```ts
   import 'niuma-ui/styles.css'
   import 'niuma-ui/brand-icons.css' // optional: official data-source mark colors
   ```

   Do not write `@import 'niuma-ui/src/styles.css'`.

3. Wrap the root with `RsConfigProvider`:

   ```vue
   <RsConfigProvider theme="light" locale="en-US" control-size="md">
     <RouterView />
   </RsConfigProvider>
   ```

   Omit `locale` to follow the host language (Chinese systems stay on `zh-CN`). Extra languages: [locales.en.md](./locales.en.md).

4. Import components and composables only from `niuma-ui`. Do not install or import `reka-ui`.

### Theme and brand

- `RsConfigProvider` `theme` is `light` | `dark` | `system`. `system` follows the OS; the DOM still gets `data-rs-theme="light|dark"`.
- No attribute means light. Set `<html data-rs-theme="light">` (or `dark`) for first paint.
- Colors live in CSS only. `themePresets` is a reference and does not restyle the page.
- Override the same `--rs-*` names in host CSS. See [`src/theme/brand.example.css`](../src/theme/brand.example.css).
- Override text with `--rs-text-primary` (do not start new overrides on `--rs-text`).
- Brand mark colors are optional: `import 'niuma-ui/brand-icons.css'`. Without it, marks are monochrome.
- Omitted `locale` follows the host language and falls back to `zh-CN`. Extra languages: [locales.en.md](./locales.en.md) (`registerRsLocale` + `rsLocaleMessageKeys`). `t()` supports `{count, plural, one {#} other {#}}`. RTL: `dir="rtl"` or `{ dir: 'rtl' }` when registering.
- Subsystems: `--rs-table-*`, `--rs-terminal-*`, `--rs-code-*`, `--rs-prose-*`.
- Type scale: `--rs-font-size-*`, `--rs-font-weight-*`, `--rs-font-sans|mono|serif`.
- JS helpers: `RS_FONT_SIZE_CSS`, `RS_FONT_WEIGHT_CSS`, `readCssLengthPx`, `readCodeFontFamily`.

### TypeScript

The npm entry is compiled ESM + `.d.ts` (types point at `.js`, not `.vue`). Host `tsconfig` should use `"moduleResolution": "bundler"` / `node16` / `nodenext`. Do not path-map into this package’s `src/`. `pnpm dev` + `niumaUiHost` already points at source for HMR.

## 3. Vite

### 3.1 Allow the linked package

```ts
import { dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const uiRoot = dirname(require.resolve('niuma-ui/package.json'))

export default defineConfig({
  server: {
    fs: {
      allow: [/* host root */, uiRoot],
    },
  },
})
```

### 3.2 Official plugins

```ts
import { niumaUiHost } from 'niuma-ui/vite-plugins/niuma-ui-host'
import { monacoZhNlsPlugin } from 'niuma-ui/vite-plugins/monaco-zh-nls'
import { silenceAntlrParseConsole } from 'niuma-ui/vite-plugins/silence-antlr-parse-console'

export default defineConfig({
  plugins: [...niumaUiHost()],
})
```

| Plugin | Use |
|--------|-----|
| `niumaUiHost` | Recommended for local `link`. Serve-only HMR and styles alias. Build uses the package entry. |
| `monacoZhNlsPlugin` | Chinese NLS for Monaco context menus (optional) |
| `silenceAntlrParseConsole` | Quiets unfinished SQL-language parse logs (optional) |

Enable the last two only if you use `RsMonacoEditor` / SQL language features.

### 3.3 `optimizeDeps` (heavy editors)

Do not put the whole Monaco bundle in `optimizeDeps.include`. Prefer public prebundle paths for CodeMirror / xterm:

```ts
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default defineConfig({
  optimizeDeps: {
    entries: [
      'index.html',
      require.resolve('niuma-ui/vite-prebundle/codemirror'),
      require.resolve('niuma-ui/vite-prebundle/xterm'),
    ],
  },
})
```

## 4. Bundle size

The root entry aggregates a full workbench surface.

- Always `import { RsButton } from 'niuma-ui'`. Marketing sites re-export used symbols from `src/ui.ts`.
- Do not `import * as UI from 'niuma-ui'`.
- Styles always `niuma-ui/styles.css`.

## 5. RsTable SSR / charts

- SSR: prefer `useRsTableHeadless`; first paint can use a read-only `<RsTable>` (virtual / editable / contextMenu / cellTooltip off). See [rs-table-ssr.md](./rs-table-ssr.md).
- Charts: `createChartSeriesTableFeature` + `mapRsTableSeriesToEChartsOption`; keep echarts in the host. See [rs-table-chart-adapter.md](./rs-table-chart-adapter.md).

## 6. Upgrades

1. Read the target [CHANGELOG](../CHANGELOG.md) / GitHub Release.
2. Bump `package.json` and `pnpm install`. First-party pipelines that track `latest` need `--no-frozen-lockfile` after rewriting the spec.
3. Smoke theme switch, Dialog, Table, and editors if you use them.
4. Before a MAJOR: renamed props, removed tokens, peer Vue version.

## 7. FAQ

**Q: After `link`, `dist/vite-plugins/niuma-ui-host.js` is missing?**  
A: `dist` is not committed. Run `pnpm install` (or `pnpm build`) at the niuma-ui root. Do not point `exports` at source `.ts`.

**Q: `link` resolves the wrong folder?**  
A: The path is relative to the **package.json that declares the dependency**, not the repo root. An app under `web/` usually needs `../../niuma-ui`.

**Q: Do I still need `shamefully-hoist=true`?**  
A: No. The published package is compiled; pnpm isolation can resolve `reka-ui` and friends.

**Q: Dev looks fine, CI looks unstyled?**  
A: Check that you `import 'niuma-ui/styles.css'` and did not alias the root entry to `src/index.ts`. `niumaUiHost` does not run in `vite build`. 2.0 styles do not depend on Tailwind.

**Q: Must I use pnpm / Vite?**  
A: Install with npm, pnpm, or yarn. Ordinary components are not Vite-only. `RsMonacoEditor` and the official `vite-plugins/*` need Vite 5+ (workers / plugin API).

**Q: Can I mix other component libraries?**  
A: Technically yes; visuals and focus layers will clash. New UI should be `Rs*` only; migrate leftovers by surface.

**Q: Vue 2?**  
A: No. Vue 3 only.

**Q: License?**  
A: [Apache License 2.0](../LICENSE). See [NOTICE](../NOTICE). Dependencies keep their own licenses (Reka UI, Lucide, Monaco, CodeMirror, xterm, …).

## 8. Support

- Issues: https://github.com/Blair-Shang/niuma-ui/issues  
- Security: [SECURITY.md](../SECURITY.md)  
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)  

When discussing design or API, include host framework versions, a minimal reproduction, and expected vs actual behavior. Third-party products should pin a minor (`^2.0.0` and up) and record the version in their own docs.
