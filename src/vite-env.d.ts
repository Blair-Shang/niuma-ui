/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'dayjs/esm/plugin/customParseFormat' {
  import type { PluginFunc } from 'dayjs'
  const plugin: PluginFunc
  export default plugin
}
