import type { Component } from 'vue'
import { isRsBrandIconName } from './brand'

/**
 * 业务登记的图标。本文件不引入 Lucide。
 * `import { registerRsIcon } from '@niuma/ui'` 只应落到这里。
 */
const hostIcons = new Map<string, Component>()

/** kebab-case，与 Lucide / 品牌 mark 同一套名字。 */
const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isVueComponent(value: unknown): value is Component {
  return typeof value === 'function' || (typeof value === 'object' && value !== null)
}

/**
 * 登记业务自己的图标，供 `RsIcon` 以及页签 / 菜单 / 树 / 右键的 `icon` 字符串使用。
 * 同名再次调用会换成新组件。内置品牌 mark 不能覆盖。
 * Lucide 已有的名字仍渲染内置图形，开发环境会警告一次。
 * 组件会收到 `size`、`strokeWidth`、`color`（默认 `currentColor`）。
 */
export function registerRsIcon(name: string, component: Component): void {
  const id = name.trim()
  if (!ICON_NAME.test(id)) {
    throw new Error(`registerRsIcon: "${name}" must be kebab-case (for example "my-product")`)
  }
  if (isRsBrandIconName(id)) {
    throw new Error(`registerRsIcon: "${id}" is a built-in brand mark and cannot be replaced`)
  }
  if (!isVueComponent(component)) {
    throw new Error('registerRsIcon: component must be a Vue component')
  }
  hostIcons.set(id, component)
}

export function resolveHostIcon(name: string): Component | undefined {
  return hostIcons.get(name)
}

/** 测试里撤掉登记，避免盖住后续用例。不从包入口导出。 */
export function unregisterRsIcon(name: string): void {
  hostIcons.delete(name.trim())
}
