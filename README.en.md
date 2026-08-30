# niuma-ui

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-yellow.svg)](https://pnpm.io/)

English | [简体中文](./README.md)

Vue 3 **workbench** design system: `Rs*` components, `--rs-*` tokens, and optional editor / terminal wrappers.

Built for ops consoles, database workbenches, and internal admin UIs. Marketing sites can use named imports, but this is not a lightweight Ant Design-style kit — `npm install` pulls Monaco, CodeMirror, and xterm.

**Status:** open source from **v1.0.0** under [Apache License 2.0](./LICENSE). From **v1.2.0** the npm package is compiled ESM (`install` then import by package name).

## Features

- **Design tokens** — light / dark via `data-rs-theme` and CSS variables; hosts can override a brand layer
- **Rs\* components** — Button, Form, Dialog, Table, Tree, Tabs, and more
- **Tooling-oriented** — Monaco, CodeMirror, xterm wrappers (import carefully in light apps)
- **Accessible primitives** — built on [Reka UI](https://reka-ui.com/); apps only consume `niuma-ui`
- **Vite-friendly** — `import { RsButton } from 'niuma-ui'` is the public API; `niumaUiHost` is serve-only HMR

## Requirements

| Item | Version |
|------|---------|
| Node.js | ≥ 20 |
| Package manager | npm / pnpm / yarn (this repo develops with pnpm) |
| Vue | ^3.5 (`peerDependency`) |
| Bundler | Vite 5+ recommended; `RsMonacoEditor` needs Vite `?worker` |
| Styles | `import 'niuma-ui/styles.css'` passes through `@import 'tailwindcss'`; Vite hosts need `@tailwindcss/vite` |

## Install

```bash
pnpm add niuma-ui
# or: npm install niuma-ui / yarn add niuma-ui
```

Pin a version:

```bash
pnpm add niuma-ui@1.2.0
```

Local link and Vite details: **[Consumer guide](./docs/consumers.md)** (Chinese).

## Quick start

```ts
import { createApp } from 'vue'
import { RsConfigProvider, RsButton } from 'niuma-ui'
import 'niuma-ui/styles.css'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { RsConfigProvider, RsButton } from 'niuma-ui'
</script>

<template>
  <RsConfigProvider theme="light" locale="zh-CN">
    <RsButton variant="primary">Hello</RsButton>
  </RsConfigProvider>
</template>
```

## Usage conventions

1. Apps import only from `niuma-ui` — **do not** depend on `reka-ui` directly.
2. Styles: `import 'niuma-ui/styles.css'`.
3. Wrap the app with `RsConfigProvider`.
4. Light apps should named-import and wrap what they need — do not `import *`. Install still includes editor dependencies; tree-shaking only affects the bundle.

Component catalog: **[docs/components.md](./docs/components.md)**.

## Live demos

- **Component site**: [https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/) (GitHub Pages, deploys from `main`)
- Local: `pnpm dev` → http://localhost:5180

## Local development

```bash
pnpm install
pnpm dev
pnpm build               # library → dist/ (npm publish)
pnpm build:playground
pnpm test
```

## Versioning

Semantic Versioning. Stable publishes set the npm dist-tag **`latest`** (prereleases use `next`). There is no GitHub tag named `latest`. Pin a SemVer tag for reproducible releases. See [CHANGELOG.md](./CHANGELOG.md).

## License

[Apache License 2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution.
