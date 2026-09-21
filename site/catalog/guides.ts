import type { GuideDoc } from './types'

export const guideDocs: GuideDoc[] = [
  {
    slug: 'introduce',
    title: '介绍',
    titleEn: 'Introduction',
    description: 'Niuma UI 是面向运维控制台、数据库工作台与桌面工具的 Vue 3 设计系统。',
    descriptionEn:
      'Niuma UI is a Vue 3 design system for ops consoles, database workbenches, and desktop tools.',
    sections: [
      {
        id: 'overview',
        title: '定位',
        titleEn: 'Positioning',
        body: 'Niuma UI 提供一致的 Rs* 组件与 --rs-* 设计 Token，底层基于 Reka UI。它不是 Ant Design 那种轻量通用库：安装会带上 Monaco、CodeMirror、xterm 等专业工具依赖，适合控制台与桌面工作台。营销站请具名导入，避免把重型编辑器打进首包。',
        bodyEn:
          'Niuma UI ships consistent Rs* components and --rs-* tokens on top of Reka UI. It is not a lightweight Ant Design-style kit: install pulls Monaco, CodeMirror, and xterm. Use named imports on marketing sites so heavy editors stay out of the first bundle.',
      },
      {
        id: 'principles',
        title: '设计原则',
        titleEn: 'Principles',
        bullets: [
          '公开能力只从 niuma-ui 根入口具名导入，禁止直接依赖 reka-ui。',
          '主题与尺寸走 RsConfigProvider + CSS 变量，业务用品牌层覆盖，不 :deep 改内部结构。',
          '形态（variant）与语义色（tone）正交，对齐 Ant Design color / Element Plus type。',
          '重型模块（表格富编辑、Monaco、终端）按需引用，官网与轻量后台应做薄封装。',
          '维护者改组件或加导出前先读 docs/components.md 与 docs/components.en.md（两份清单同步），避免破坏公开面。',
        ],
        bulletsEn: [
          'Named-import public APIs from the niuma-ui root only. Do not depend on reka-ui.',
          'Theme and size go through RsConfigProvider and CSS variables. Hosts override a brand layer; do not :deep internals.',
          'variant is shape, tone is hue — the same split as Ant Design color / Element Plus type.',
          'Load heavy modules (rich table edit, Monaco, terminal) on demand. Thin-wrap them on marketing sites.',
          'Maintainers read docs/components.en.md (and the Chinese twin) before changing exports, so the public surface stays intact.',
        ],
      },
      {
        id: 'audience',
        title: '适用场景',
        titleEn: 'When to use it',
        bullets: [
          '运维监控、作业日志、发布流水线等控制台。',
          '数据库对象树、表数据浏览与单元格编辑。',
          '桌面端设置页、连接管理、文件与终端面板。',
        ],
        bulletsEn: [
          'Ops consoles: monitoring, job logs, release pipelines.',
          'Database object trees, table browsing, and cell editing.',
          'Desktop settings, connection managers, file and terminal panes.',
        ],
      },
    ],
  },
  {
    slug: 'getting-started',
    title: '快速上手',
    titleEn: 'Getting started',
    description: '安装依赖、引入样式，并用 RsConfigProvider 包裹应用。',
    descriptionEn: 'Install the package, import styles, and wrap the app with RsConfigProvider.',
    sections: [
      {
        id: 'install',
        title: '安装',
        titleEn: 'Install',
        body: '要求 Node.js ≥ 20、Vue ^3.5。当前发布版本 2.0.0。建议锁定 ^2.0.0。',
        bodyEn: 'Requires Node.js ≥ 20 and Vue ^3.5. Current release is 2.0.0. Prefer a range such as ^2.0.0.',
        code: {
          lang: 'bash',
          content: 'pnpm add niuma-ui\n# or: npm install niuma-ui / yarn add niuma-ui',
        },
      },
      {
        id: 'entry',
        title: '入口',
        titleEn: 'Entry',
        body: '样式入口必须引入 styles.css。根节点使用 RsConfigProvider 提供主题、语言与默认控件尺寸。',
        bodyEn:
          'Import styles.css once. Wrap the root with RsConfigProvider for theme, locale, and default control size.',
        code: {
          lang: 'ts',
          content: [
            "import { createApp } from 'vue'",
            "import 'niuma-ui/styles.css'",
            "import App from './App.vue'",
            '',
            "createApp(App).mount('#app')",
          ].join('\n'),
        },
      },
      {
        id: 'usage',
        title: '第一个组件',
        titleEn: 'First component',
        code: {
          lang: 'vue',
          content: [
            '<script setup lang="ts">',
            "import { RsConfigProvider, RsButton } from 'niuma-ui'",
            '</script>',
            '',
            '<template>',
            '  <RsConfigProvider theme="light" locale="zh-CN">',
            '    <RsButton variant="primary">Hello</RsButton>',
            '  </RsConfigProvider>',
            '</template>',
          ].join('\n'),
        },
      },
      {
        id: 'rules',
        title: '使用约定',
        titleEn: 'Usage',
        bullets: [
          '业务模块只允许 import { … } from "niuma-ui"。',
          'styles.css 须在业务品牌 CSS 之前或按文档顺序加载。',
          'styles.css 是独立样式，不依赖 Tailwind。',
          '本地联调可启用 niumaUiHost，仅服务 pnpm dev，不进生产构建。',
          '不要直接依赖 reka-ui，不要 import *，不要把包名别名到 src/index.ts。',
        ],
        bulletsEn: [
          'App code may only import { … } from "niuma-ui".',
          'Load styles.css before (or as documented with) your brand CSS.',
          'styles.css is standalone and does not depend on Tailwind.',
          'niumaUiHost is local pnpm dev + link only. Production and CI resolve npm dist.',
          'Do not depend on reka-ui, import *, or alias the package to src/index.ts.',
        ],
      },
    ],
  },
  {
    slug: 'theme',
    title: '主题定制',
    titleEn: 'Theming',
    description: '通过 data-rs-theme 与 --rs-* Token 切换明暗主题，并用品牌层覆盖主色。',
    descriptionEn: 'Switch light and dark with data-rs-theme and --rs-* tokens. Override brand color in a host layer.',
    sections: [
      {
        id: 'provider',
        title: 'ConfigProvider',
        titleEn: 'ConfigProvider',
        body: 'RsConfigProvider 控制 theme（light / dark）、locale、control-size。也可在运行时调用 useRsConfig() 的 setTheme / setLocale。',
        bodyEn:
          'RsConfigProvider sets theme (light / dark), locale, and control-size. At runtime use useRsConfig().setTheme / setLocale.',
        code: {
          lang: 'vue',
          content: '<RsConfigProvider theme="dark" locale="en-US" control-size="md">\n  <App />\n</RsConfigProvider>',
        },
      },
      {
        id: 'token',
        title: '覆盖 Token',
        titleEn: 'Override tokens',
        body: '不要改组件源码。在 html 或业务容器上覆盖 CSS 变量。推荐把品牌层放在独立 brand.css。',
        bodyEn:
          'Do not fork component source. Override CSS variables on html or a host container. Keep brand overrides in a separate brand.css.',
        code: {
          lang: 'css',
          content: [
            'html[data-rs-theme="light"] {',
            '  --rs-primary: #1677ff;',
            '  --rs-primary-hover: #4096ff;',
            '  --rs-primary-container: #e6f4ff;',
            '}',
          ].join('\n'),
        },
      },
      {
        id: 'scope',
        title: '局部换肤',
        titleEn: 'Scoped theming',
        body: 'Token 可挂在任意父级。例如某个工具栏只要更深的描边，只覆盖该容器的 --rs-btn-outline-border。',
        bodyEn:
          'Tokens inherit. To darken one toolbar outline, override --rs-btn-outline-border on that container only.',
      },
    ],
  },
  {
    slug: 'i18n',
    title: '国际化',
    titleEn: 'Internationalization',
    description: '内置 zh-CN / en-US。组件文案走 useRsI18n，可随 RsConfigProvider.locale 切换。',
    descriptionEn:
      'Shipped locales: zh-CN / en-US. Component copy uses useRsI18n and follows RsConfigProvider.locale.',
    sections: [
      {
        id: 'locale',
        title: '切换语言',
        titleEn: 'Switch locale',
        code: {
          lang: 'vue',
          content: '<RsConfigProvider locale="en-US">\n  <RsEmpty />\n</RsConfigProvider>',
        },
      },
      {
        id: 'runtime',
        title: '运行时',
        titleEn: 'Runtime',
        body: 'useRsConfig().setLocale("en-US") 会同步到已挂载的组件。业务自己的文案仍由产品 i18n 管理，不要把业务字符串写进组件 slot 以外的硬编码。',
        bodyEn:
          'useRsConfig().setLocale("en-US") updates mounted components. Host copy stays in the product i18n layer — do not hard-code business strings outside slots.',
      },
    ],
  },
  {
    slug: 'import',
    title: '按需引入',
    titleEn: 'Tree shaking',
    description: '生产构建走包主入口的具名导入。官网与轻量后台应避免把 Monaco / 终端打进首屏。',
    descriptionEn:
      'Production builds tree-shake named imports from the package root. Keep Monaco and the terminal off the first paint.',
    sections: [
      {
        id: 'named',
        title: '具名导入',
        titleEn: 'Named imports',
        body: '打包器按 dist/index.js 的 re-export 摇树。不要 import *，也不要把别名指到源码 src/index.ts。',
        bodyEn:
          'Bundlers tree-shake the re-exports in dist/index.js. Do not import * or alias the package to src/index.ts.',
        code: {
          lang: 'ts',
          content: "import { RsButton, RsDialog } from 'niuma-ui'",
        },
      },
      {
        id: 'heavy',
        title: '重型模块',
        titleEn: 'Heavy modules',
        bullets: [
          'RsMonacoEditor 需要 Vite 处理 ?worker，并调用 setupMonacoWorkers()。',
          'RsTerminal 依赖 xterm，仅在终端面板路由加载。',
          '表格单元格富编辑会引入额外编辑器，只在需要编辑的页面引用。',
        ],
        bulletsEn: [
          'RsMonacoEditor needs Vite ?worker handling and setupMonacoWorkers().',
          'RsTerminal depends on xterm — load it only on the terminal route.',
          'Rich table cell editing pulls extra editors. Import it only on pages that edit.',
        ],
      },
      {
        id: 'host',
        title: '本机联调',
        titleEn: 'Local link',
        body: 'niumaUiHost 只在 pnpm dev + link 时把具名导入改到源码，便于 HMR。vite build / CI 必须解析 npm dist，不要依赖改写插件。',
        bodyEn:
          'niumaUiHost rewrites named imports to source only during pnpm dev + link (HMR). vite build and CI must resolve npm dist and must not depend on that plugin.',
      },
    ],
  },
]

export function getGuide(slug: string): GuideDoc | undefined {
  return guideDocs.find((item) => item.slug === slug)
}
