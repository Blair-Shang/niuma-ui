import type { ComponentDoc } from '../types'

export const editorComponents: ComponentDoc[] = [
  {
    slug: 'code-block',
    name: 'RsCodeBlock',
    title: 'CodeBlock',
    titleZh: '代码块',
    group: 'editor',
    summary: '只读代码展示，可复制；也可改为可编辑。',
    description: '文档与日志中的代码片段。默认只读，带复制。需要轻量编辑用 CodeEditor，IDE 级用 Monaco。',
    whenToUse: ['文档示例、响应 JSON、短脚本展示。'],
    props: [
      { name: 'code', type: 'string', description: '源码。' },
      { name: 'lang', type: 'string', description: '语言。' },
      { name: 'editable', type: 'boolean', default: 'false', description: '允许改正文。' },
      { name: 'showBar', type: 'boolean', description: '是否显示工具条。' },
    ],
    related: ['code-editor', 'markdown'],
  },
  {
    slug: 'code-editor',
    name: 'RsCodeEditor',
    title: 'CodeEditor',
    titleZh: '代码编辑器',
    group: 'editor',
    summary: '基于 CodeMirror 的轻量编辑器。',
    description: '配置、SQL 片段、脚本的轻量编辑。体积小于 Monaco。需要语言服务与多文件时用 Monaco。',
    whenToUse: ['设置页里的 JSON / YAML、短 SQL。'],
    props: [
      { name: 'v-model', type: 'string', description: '文本。' },
      { name: 'language', type: 'string', description: '语法。' },
      { name: 'readonly', type: 'boolean', description: '只读。' },
    ],
    related: ['monaco-editor', 'code-block'],
  },
  {
    slug: 'monaco-editor',
    name: 'RsMonacoEditor',
    title: 'MonacoEditor',
    titleZh: 'Monaco 编辑器',
    group: 'editor',
    summary: '基于 Monaco 的重型编辑器。',
    description: 'IDE 级编辑：语言服务、多光标、差异。宿主需 Vite 处理 worker，并调用 setupMonacoWorkers()。官网轻量页不要首屏引入。',
    whenToUse: ['SQL 工作台、规则编辑、需要补全与诊断。'],
    props: [
      { name: 'v-model', type: 'string', description: '文本。' },
      { name: 'language', type: 'string', description: '语言。' },
      { name: 'theme', type: 'string', description: 'Monaco 主题。' },
    ],
    faq: [
      {
        q: '为什么包体积很大？',
        a: 'Monaco 与语言 worker 本身重。请按路由懒加载，并在轻量后台用 CodeEditor 替代。',
      },
    ],
    related: ['code-editor', 'terminal'],
  },
  {
    slug: 'markdown',
    name: 'RsMarkdown',
    title: 'Markdown',
    titleZh: 'Markdown',
    group: 'editor',
    summary: 'Markdown 渲染与编辑预览。',
    description: '说明文档、变更记录、知识片段。渲染走消毒，编辑预览用于内部文档。',
    whenToUse: ['只读文档或简单双栏预览。富文本表面见 ProseEditor。'],
    props: [
      { name: 'source', type: 'string', description: 'Markdown 文本。' },
      { name: 'editable', type: 'boolean', description: '编辑模式。' },
    ],
    related: ['code-block'],
  },
  {
    slug: 'log',
    name: 'RsLog',
    title: 'Log',
    titleZh: '日志',
    group: 'editor',
    summary: '作业 / 发版日志，不是终端。',
    description:
      '只读日志视图：虚拟滚动、折行撑满、级别（含 syslog / OTel）、搜索过滤、键盘漫游与 WCAG 色条。内置扫描 [ERROR] / 行首级别。产品成功失败标识用 inferMarkers 或写入 level。不要拿它当 PTY。',
    whenToUse: [
      'CI、发版、作业输出的只读流。',
      '需要交互式 shell 时用 Terminal。',
    ],
    props: [
      { name: 'lines', type: 'LogLine[] | string[]', description: '日志行。' },
      { name: 'inferMarkers', type: 'options', description: '业务成功 / 失败标识。' },
    ],
    related: ['terminal', 'virtual-list'],
  },
  {
    slug: 'terminal',
    name: 'RsTerminal',
    title: 'Terminal',
    titleZh: '终端',
    group: 'editor',
    summary: '基于 xterm 的 PTY 面板。',
    description: '交互式终端。需要宿主提供数据通道（websocket / node-pty）。只读日志用 RsLog。',
    whenToUse: ['SSH、本地 shell、容器 exec。'],
    props: [
      { name: 'onData', type: '(data: string) => void', description: '用户输入。' },
      { name: 'readonly', type: 'boolean', description: '只读。' },
    ],
    faq: [
      {
        q: '能直接当日志看吗？',
        a: '不建议。日志没有 PTY 语义，搜索、级别色条与虚拟行高应用 RsLog。',
      },
    ],
    related: ['log', 'monaco-editor'],
  },
]
