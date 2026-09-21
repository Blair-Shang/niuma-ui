import type { SiteMessages } from '../zh-CN'

export const home: SiteMessages['home'] = {
  kicker: 'Vue 3 · Apache 2.0',
  title: 'Niuma UI',
  slogan: 'An enterprise component library for consoles and desktop workbenches',
  intro:
    'Consistent Rs* components and design tokens — forms, tables, trees, dialogs, plus Monaco and terminal surfaces for professional tools.',
  ctaStart: 'Get started',
  ctaComponents: 'Components',
  ctaGithub: 'GitHub',
  install: 'Install',
  previewTitle: 'Live preview',
  previewHint: 'The same tokens. Switch light and dark instantly.',
  features: 'Capabilities',
  featured: 'Components',
  featuredHint: 'Start with high-traffic controls, or browse by category.',
  stack: 'Stack',
  oss: 'Open source',
  ossBody: 'Apache License 2.0. Issues and pull requests are welcome.',
  groupHint: {
    basic: 'Button, Tag, Card',
    form: 'Form, Select, Date',
    nav: 'Anchor, Menu, Split',
    feedback: 'Dialog, Drawer, Toast',
    data: 'Table, Tree, Descriptions',
    editor: 'Editor, Log, Terminal',
  },
}

export const features: SiteMessages['features'] = [
  { title: 'Design tokens', body: 'Light/dark and brand color live on --rs-* variables. Override, don’t fork.' },
  { title: 'Variant × tone', body: 'Shape and semantic color are orthogonal and can be combined independently.' },
  { title: 'Accessible', body: 'Built on Reka UI with shared focus, keyboard, and overlay contracts.' },
  { title: 'Workbench density', body: 'Table, tree, split pane, log, and editors for ops consoles and desktop tools.' },
  { title: 'Tree-shakable', body: 'Named imports. Load Monaco and the terminal per route, not in the first paint.' },
  { title: 'Ready to ship', body: 'Vue 3.5, TypeScript, and RsConfigProvider for theme and locale.' },
]
