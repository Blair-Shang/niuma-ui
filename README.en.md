# niuma-ui

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-yellow.svg)](https://pnpm.io/)

English | [简体中文](./README.md)

Vue 3 design system and component library. Ships consistent `Rs*` components, `--rs-*` design tokens, and optional desktop-tooling editors / terminal wrappers.

Use it for ops consoles, database workbenches, internal admin UIs, and product sites that need one visual and interaction language.

**Status:** open source from **v1.0.0** under [Apache License 2.0](./LICENSE).

## Features

- **Design tokens** — light / dark via `data-rs-theme` and CSS variables; hosts can override a brand layer
- **Rs\* components** — Button, Form, Dialog, Table, Tree, Tabs, and more
- **Tooling-oriented** — Monaco, CodeMirror, xterm wrappers (import carefully in light apps)
- **Accessible primitives** — built on [Reka UI](https://reka-ui.com/); apps only consume `niuma-ui`
- **Vite-friendly** — source-linked HMR; optional host Vite plugins

## Requirements

| Item | Version |
|------|---------|
| Node.js | ≥ 20 |
| Package manager | pnpm ≥ 9 (recommended) |
| Vue | ^3.5 (`peerDependency`) |
| Bundler | Vite 5+ / 8 (recommended) |

## Install

```bash
pnpm add niuma-ui
```

Until published to npm, install from a GitHub tag:

```bash
pnpm add git+https://github.com/Blair-Shang/niuma-ui.git#v1.0.0
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
4. Light apps should avoid pulling Monaco / Terminal / heavy table editors via the main barrel.

Component catalog: **[docs/components.md](./docs/components.md)**.

## Live demos

- **Component site**: [https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/) (GitHub Pages, deploys from `main`)
- Local: `pnpm dev` → http://localhost:5180

## Local development

```bash
pnpm install
pnpm dev
pnpm build:playground
pnpm test
```

## Versioning

Semantic Versioning. Stable publishes set the npm dist-tag **`latest`** (prereleases use `next`). There is no GitHub tag named `latest`. Pin a SemVer tag for reproducible releases. See [CHANGELOG.md](./CHANGELOG.md).

## License

[Apache License 2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution.
