import { Comment, Fragment, Text, cloneVNode, isVNode, type VNode, type VNodeArrayChildren } from 'vue'

function flattenVNodes(nodes: VNodeArrayChildren, out: VNode[] = []): VNode[] {
  for (const node of nodes) {
    if (node == null || typeof node === 'boolean') continue
    if (Array.isArray(node)) {
      flattenVNodes(node, out)
      continue
    }
    if (!isVNode(node)) continue
    if (node.type === Fragment && Array.isArray(node.children)) {
      flattenVNodes(node.children as VNodeArrayChildren, out)
      continue
    }
    out.push(node)
  }
  return out
}

function isControlVNode(node: VNode): boolean {
  if (node.type === Comment || node.type === Text) return false
  return true
}

/**
 * 把 Form.Item 的 id / aria / invalid / v-model 注入到默认插槽的第一个控件（对齐 Ant cloneElement）。
 * 只有这个直接子节点跟 Item 的 error；子孙里的搜索框不吃 invalid。
 * 子节点已绑定 v-model 时不覆盖（switch Y/N、select 类型映射等）。
 */
export function bindFormItemControl(
  children: VNode[] | undefined,
  extra: Record<string, unknown>,
): VNode[] | undefined {
  if (!children?.length) return children
  const flat = flattenVNodes(children)
  const index = flat.findIndex(isControlVNode)
  if (index < 0) return children
  const target = flat[index]
  if (!target) return children
  const next = flat.slice()
  next[index] = cloneVNode(target, pickControlInject(target, extra), true)
  return next
}

function pickControlInject(
  node: VNode,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const props = node.props
  if (!props || !('modelValue' in props || 'onUpdate:modelValue' in props)) {
    return extra
  }
  const { modelValue: _model, 'onUpdate:modelValue': _update, ...rest } = extra
  return rest
}
