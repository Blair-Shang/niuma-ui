# niuma-ui

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/niuma-ui.svg)](https://www.npmjs.com/package/niuma-ui)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

English | [简体中文](./README.md)

Vue 3 **workbench** design system: consistent `Rs*` components, `--rs-*` tokens, and optional editor / terminal wrappers.

Built for ops consoles, database workbenches, and internal admin UIs. Marketing sites can use named imports. `npm install` pulls Monaco, CodeMirror, and xterm; named imports control the bundle.

**Status:** [Apache License 2.0](./LICENSE) since v1.0.0. Compiled ESM on npm since v1.2.0. Current line is **2.0.0**. The `1.x` branch keeps the 1.3 line.

## Features

- **Design tokens** — light / dark / system via `data-rs-theme` and CSS variables; hosts override a brand layer
- **Rs\* components** — Button, Form, Dialog, Table, Tree, Tabs, Anchor, and more
- **Tooling** — Monaco, CodeMirror, xterm (import only on routes that need them)
- **Accessibility** — [Reka UI](https://reka-ui.com/) underneath; apps depend only on `niuma-ui`
- **Vite** — `import { RsButton } from 'niuma-ui'` is enough to bundle; `niumaUiHost` is local `pnpm dev` HMR only

## Requirements

| Item | Version |
|------|---------|
| Node.js | ≥ 20 |
| Package manager | npm / pnpm / yarn (this repo develops with pnpm ≥ 9) |
| Vue | ^3.5 (`peerDependency`) |
| Bundler | Vite 5+ recommended; `RsMonacoEditor` needs Vite `?worker` |
| Styles | `import 'niuma-ui/styles.css'` (standalone CSS, no Tailwind) |

## Install

```bash
pnpm add niuma-ui
# or: npm install niuma-ui / yarn add niuma-ui
```

Prefer a range such as `^2.0.0`. Pin **2.0.0** for a bit-for-bit install. Use `niuma-ui@1` for the 1.x line.

Local `link`, Vite plugins, and bundle size: **[Consumer guide](./docs/consumers.en.md)** ([中文](./docs/consumers.md)).

## Quick start

```ts
// main.ts
import { createApp } from 'vue'
import 'niuma-ui/styles.css'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { RsConfigProvider, RsButton } from 'niuma-ui'
</script>

<template>
  <RsConfigProvider theme="light" locale="en-US">
    <RsButton variant="primary">Hello</RsButton>
  </RsConfigProvider>
</template>
```

Shipped locales: `zh-CN` | `en-US`.

## Usage

1. Named-import from the package root only. **Do not** depend on `reka-ui`. Do not `import *`.
2. Import `niuma-ui/styles.css` once, then your brand CSS.
3. Wrap the app with `RsConfigProvider` (theme, locale, default control size).
4. Light sites re-export used symbols from their own `ui.ts`. Do not alias the package to this repo’s `src/index.ts`.

Component APIs live on the docs site. The architecture contract is for maintainers: [components.en.md](./docs/components.en.md) ([中文](./docs/components.md)).

## Docs

- **Component site:** [https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/) (source: `site/`)
- Local docs: `pnpm dev:site` → http://127.0.0.1:5181
- `playground/` is internal smoke / visual regression only (`pnpm dev` → :5180). It is not usage documentation.

| Doc | Audience |
|-----|----------|
| [docs/consumers.en.md](./docs/consumers.en.md) | People installing the library ([中文](./docs/consumers.md)) |
| [docs/components.en.md](./docs/components.en.md) | People changing this repository ([中文](./docs/components.md)) |
| [CONTRIBUTING.en.md](./CONTRIBUTING.en.md) | PRs, tests, releases ([中文](./CONTRIBUTING.md)) |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes |
| [SECURITY.md](./SECURITY.md) | Private vulnerability reports |

## Local development

```bash
pnpm install
pnpm dev:site     # docs site
pnpm test
pnpm build        # library → dist/
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor flow.

## Versioning

[Semantic Versioning](https://semver.org/): compatible fixes are PATCH, compatible features MINOR, breaking API or token renames MAJOR.

Stable publishes set npm dist-tag **`latest`**; prereleases use **`next`**. There is no Git tag named `latest`. Release steps live only in [CONTRIBUTING.md](./CONTRIBUTING.md).

## License and credits

[Apache License 2.0](./LICENSE). Attribution: [NOTICE](./NOTICE).

Primitives: [Reka UI](https://reka-ui.com/). Icons: [Lucide](https://lucide.dev/). Editors: [Monaco](https://microsoft.github.io/monaco-editor/), [CodeMirror](https://codemirror.net/). Terminal: [xterm.js](https://xtermjs.org/).

- Docs: https://blair-shang.github.io/niuma-ui/
- npm: https://www.npmjs.com/package/niuma-ui
- Source: https://github.com/Blair-Shang/niuma-ui
- Issues: https://github.com/Blair-Shang/niuma-ui/issues
