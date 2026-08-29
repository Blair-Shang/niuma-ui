import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import RsTree from '../components/RsTree.vue'
import {
  collectHalfCheckedKeys,
  flattenTreeNodeIds,
  getTreeChildren,
  getTreeKey,
  getTreeLabel,
  resolveTreeFieldNames,
  resolveTreeFocusKey,
  splitTreeLabelHighlight,
} from '../components/tree-utils'

const nodes = [
  { key: 'root', label: '根节点', children: [{ key: 'child', label: '子节点' }] },
  { id: 'alt', title: '备用字段' },
]

/**
 * jsdom 不做布局，直接给 scrollTop 赋值会被钳成 0，无法模拟滚动。
 * 覆盖成可写的自有属性后再派发 scroll，组件才能读到真实偏移。
 */
async function scrollViewportTo(element: Element, top: number): Promise<void> {
  Object.defineProperty(element, 'scrollTop', { configurable: true, writable: true, value: top })
  element.dispatchEvent(new Event('scroll'))
  await nextTick()
}

const checkNodes = [
  {
    key: 'parent',
    label: '父节点',
    children: [
      { key: 'child-a', label: '子 A' },
      { key: 'child-b', label: '子 B' },
    ],
  },
]

describe('RsTree', () => {
  it('renders nodes when defaultExpandAll is true', () => {
    const wrapper = mount(RsTree, {
      props: { nodes, defaultExpandAll: true },
    })
    expect(wrapper.text()).toContain('根节点')
    expect(wrapper.text()).toContain('子节点')
    expect(wrapper.text()).toContain('备用字段')
  })

  it('hides children until expanded', async () => {
    const wrapper = mount(RsTree, {
      props: { nodes: [nodes[0]] },
    })
    expect(wrapper.text()).not.toContain('子节点')
    await wrapper.find('.rs-tree__toggle').trigger('click')
    expect(wrapper.text()).toContain('子节点')
  })

  it('selects a single node via v-model', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
        modelValue: '',
        'onUpdate:modelValue': (value: string | string[]) => wrapper.setProps({ modelValue: value }),
      },
    })
    await wrapper.findAll('.rs-tree__label')[1].trigger('click')
    expect(wrapper.props('modelValue')).toBe('b')
    const selected = wrapper.find('.rs-tree__row--selected')
    expect(selected.exists()).toBe(true)
    expect(selected.text()).toContain('B')
  })

  it('highlights multiple selected rows in multiple mode', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }],
        multiple: true,
        modelValue: ['a', 'c'],
      },
    })
    expect(wrapper.findAll('.rs-tree__row--selected')).toHaveLength(2)
  })

  it('supports fieldNames mapping', () => {
    const apiNodes = [
      {
        id: '1',
        name: '部门',
        subList: [{ id: '1-1', name: '研发' }],
      },
    ]
    const wrapper = mount(RsTree, {
      props: {
        nodes: apiNodes,
        fieldNames: { key: 'id', label: 'name', children: 'subList' },
        defaultExpandAll: true,
      },
    })
    expect(wrapper.text()).toContain('部门')
    expect(wrapper.text()).toContain('研发')
  })

  it('syncs halfCheckedKeys when partially checked', async () => {
    const updates: string[][] = []
    mount(RsTree, {
      props: {
        nodes: checkNodes,
        checkable: true,
        defaultExpandAll: true,
        checkedKeys: ['child-a'],
        halfCheckedKeys: [],
        'onUpdate:halfCheckedKeys': (value: string[] | undefined) => {
          if (value !== undefined) updates.push(value)
        },
      },
    })
    await flushPromises()
    expect(updates.at(-1)).toEqual(expect.arrayContaining(['parent']))
  })

  it('checks on node click when checkOnClickNode is true', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }],
        checkable: true,
        checkOnClickNode: true,
        selectable: false,
        checkedKeys: [] as string[],
        'onUpdate:checkedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ checkedKeys: value })
        },
      },
    })
    await wrapper.find('.rs-tree__label').trigger('click')
    expect(wrapper.props('checkedKeys')).toEqual(['a'])
  })

  it('filters nodes with filter prop and highlights matches', () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes,
        filter: '子节点',
        autoExpandParent: true,
      },
    })
    expect(wrapper.find('.rs-tree__highlight').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('备用字段')
  })

  it('does not render keyword highlight when highlight is false', () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes,
        filter: '子节点',
        highlight: false,
        autoExpandParent: true,
      },
    })
    expect(wrapper.find('.rs-tree__highlight').exists()).toBe(false)
    expect(wrapper.text()).toContain('子节点')
  })

  it('shows empty state when filter has no matches', () => {
    const wrapper = mount(RsTree, {
      props: { nodes, filter: '不存在的内容' },
    })
    expect(wrapper.find('.rs-tree__empty').exists()).toBe(true)
  })

  it('restores expanded keys after clearing a filter with no matches', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [nodes[0]],
        autoExpandParent: true,
        expandedKeys: ['root'] as string[],
        'onUpdate:expandedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ expandedKeys: value })
        },
      },
    })
    expect(wrapper.props('expandedKeys')).toEqual(['root'])
    await wrapper.setProps({ filter: '不存在的内容' })
    expect(wrapper.find('.rs-tree__empty').exists()).toBe(true)
    expect(wrapper.props('expandedKeys')).toEqual(['root'])
    await wrapper.setProps({ filter: '' })
    expect(wrapper.props('expandedKeys')).toEqual(['root'])
  })

  it('restores pre-filter expanded keys after clearing a matching filter', async () => {
    const treeNodes = [
      {
        key: 'root',
        label: '根',
        children: [
          { key: 'keep', label: '保留', children: [{ key: 'keep-1', label: '保留子' }] },
          { key: 'hide', label: '隐藏', children: [{ key: 'hide-1', label: '隐藏子' }] },
        ],
      },
    ]
    const wrapper = mount(RsTree, {
      props: {
        nodes: treeNodes,
        autoExpandParent: true,
        expandedKeys: ['root', 'hide'] as string[],
        'onUpdate:expandedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ expandedKeys: value })
        },
      },
    })
    await wrapper.setProps({ filter: '保留' })
    expect(wrapper.props('expandedKeys')).toEqual(expect.arrayContaining(['root', 'keep']))
    await wrapper.setProps({ filter: '' })
    expect(wrapper.props('expandedKeys')).toEqual(['root', 'hide'])
  })

  it('loads children lazily on expand', async () => {
    const loadData = vi.fn(async (node: { key?: string }) => {
      if (node.key === 'lazy-root') {
        ;(node as { children?: unknown[] }).children = [{ key: 'lazy-child', label: '异步子节点' }]
      }
    })
    const lazyNodes = [{ key: 'lazy-root', label: '异步根', isLeaf: false }]
    const wrapper = mount(RsTree, {
      props: {
        nodes: lazyNodes,
        lazy: true,
        loadData,
      },
    })
    await wrapper.find('.rs-tree__toggle').trigger('click')
    await vi.waitFor(() => expect(loadData).toHaveBeenCalled())
    await wrapper.setProps({ nodes: [{ key: 'lazy-root', label: '异步根', children: [{ key: 'lazy-child', label: '异步子节点' }] }] })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('异步子节点')
  })

  it('supports keyboard navigation', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
      },
      attachTo: document.body,
    })
    await flushPromises()
    const treeEl = wrapper.get('.rs-tree').element as HTMLElement
    treeEl.focus()
    treeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.rs-tree__row--focused').text()).toContain('B')
    wrapper.unmount()
  })

  it('exposes focusNode', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
      },
    })
    const vm = wrapper.vm as { focusNode: (key: string) => void }
    vm.focusNode('b')
    await flushPromises()
    expect(wrapper.find('.rs-tree__row--focused').text()).toContain('B')
  })

  it('collapses siblings in accordion mode', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [
          {
            key: 'root',
            label: '根',
            children: [
              { key: 'a', label: 'A', children: [{ key: 'a-1', label: 'A1' }] },
              { key: 'b', label: 'B', children: [{ key: 'b-1', label: 'B1' }] },
            ],
          },
        ],
        accordion: true,
        expandedKeys: ['root', 'a'],
        'onUpdate:expandedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ expandedKeys: value })
        },
      },
    })
    const toggles = wrapper.findAll('.rs-tree__toggle')
    await toggles[2].trigger('click')
    expect(wrapper.props('expandedKeys')).toEqual(expect.arrayContaining(['root', 'b']))
    expect(wrapper.props('expandedKeys')).not.toContain('a')
  })

  it('emits node-drop when draggable', async () => {
    const onDrop = vi.fn()
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
        draggable: true,
        onNodeDrop: onDrop,
      },
      attachTo: document.body,
    })
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    const items = wrapper.findAll('.rs-tree__row')
    await items[0].trigger('dragstart', { dataTransfer })
    await items[1].trigger('drop', { dataTransfer, clientY: 20 })
    expect(onDrop).toHaveBeenCalledWith('a', 'b', expect.any(String))
    wrapper.unmount()
  })

  it('blocks dropping a node into its own descendant but allows dropping onto an ancestor', async () => {
    const onDrop = vi.fn()
    const allowDrop = vi.fn(() => true)
    const treeNodes = [
      {
        key: 'parent',
        label: '父',
        children: [{ key: 'child', label: '子' }],
      },
    ]
    const wrapper = mount(RsTree, {
      props: {
        nodes: treeNodes,
        draggable: true,
        defaultExpandAll: true,
        allowDrop,
        onNodeDrop: onDrop,
      },
      attachTo: document.body,
    })
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    const rows = wrapper.findAll('.rs-tree__row')

    // 父 → 子：会成环，组件内直接否决，allowDrop 都不该被问到
    await rows[0].trigger('dragstart', { dataTransfer })
    await rows[1].trigger('drop', { dataTransfer, clientY: 20 })
    expect(onDrop).not.toHaveBeenCalled()
    expect(allowDrop).not.toHaveBeenCalled()

    // 子 → 父：合法（如拖出所在文件夹），交由 allowDrop 裁决
    await rows[1].trigger('dragstart', { dataTransfer })
    await rows[0].trigger('drop', { dataTransfer, clientY: 20 })
    expect(allowDrop).toHaveBeenCalled()
    expect(onDrop).toHaveBeenCalledWith('child', 'parent', expect.any(String))
    wrapper.unmount()
  })

  it('hides drag handle when dragTrigger is row', () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }],
        draggable: true,
        dragTrigger: 'row',
      },
    })
    expect(wrapper.find('.rs-tree__drag-handle').exists()).toBe(false)
    expect(wrapper.classes()).toContain('rs-tree--drag-row')
  })

  it('auto virtualizes large flat trees', () => {
    const largeNodes = Array.from({ length: 150 }, (_, index) => ({
      key: String(index),
      label: `Node ${index}`,
    }))
    const wrapper = mount(RsTree, {
      props: { nodes: largeNodes, height: 200 },
    })
    expect(wrapper.classes()).toContain('rs-tree--virtual')
    expect(wrapper.find('.rs-tree__viewport').classes()).toContain('rs-native-scrollbar')
    expect(wrapper.findAll('.rs-tree__item').length).toBeLessThan(largeNodes.length)
  })

  it('reports aria-posinset from the slice offset while scrolled', async () => {
    const largeNodes = Array.from({ length: 600 }, (_, index) => ({
      key: `n-${index}`,
      label: `Node ${index}`,
    }))
    const wrapper = mount(RsTree, {
      props: { nodes: largeNodes, virtual: true, height: 320, itemHeight: 32, overscan: 2 },
    })
    const viewport = wrapper.find('.rs-tree__viewport')
    await scrollViewportTo(viewport.element, 3200)
    const firstRow = wrapper.find('.rs-tree__row')
    // scrollTop 3200 / 32 = 第 100 行，减 overscan 2 → 首个渲染行是第 99 项（posinset 从 1 起算）
    expect(firstRow.attributes('aria-posinset')).toBe('99')
    expect(firstRow.attributes('aria-setsize')).toBe('600')
    expect(firstRow.text()).toContain('Node 98')
  })

  it('keeps virtual rows visible after filtering a scrolled large tree', async () => {
    const largeNodes = Array.from({ length: 1200 }, (_, index) => ({
      key: `t-${index}`,
      label: index === 50 ? 'bas_sku_match' : `TABLE_${index}`,
    }))
    const wrapper = mount(RsTree, {
      props: { nodes: largeNodes, virtual: true, height: 240, itemHeight: 28 },
    })
    const viewport = wrapper.find('.rs-tree__viewport')
    expect(viewport.exists()).toBe(true)
    // 已滚到列表中部：过滤后内容骤短，若不归零/钳位，切片 start 会越界并渲染出空白
    await scrollViewportTo(viewport.element, 8000)
    expect(wrapper.findAll('.rs-tree__item').length).toBeGreaterThan(0)
    await wrapper.setProps({ filter: 'bas_sku' })
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('.rs-tree__item').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('bas_sku_match')
    expect(viewport.element.scrollTop).toBe(0)
  })

  it('expands node on label click when expandOnClickNode is true', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [nodes[0]],
        expandOnClickNode: true,
        selectable: false,
        expandedKeys: [] as string[],
        'onUpdate:expandedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ expandedKeys: value })
        },
      },
    })
    await wrapper.find('.rs-tree__label').trigger('click')
    expect(wrapper.props('expandedKeys')).toEqual(['root'])
  })

  it('renders showLine and blockNode classes', () => {
    const wrapper = mount(RsTree, {
      props: { nodes, showLine: true, blockNode: true, defaultExpandAll: true },
    })
    expect(wrapper.classes()).toContain('rs-tree--line')
    expect(wrapper.classes()).toContain('rs-tree--block')
    expect(wrapper.find('.rs-tree__lines').exists()).toBe(true)
    expect(wrapper.find('.rs-tree__line-vert').exists()).toBe(true)
    expect(wrapper.find('.rs-tree__line-horz').exists()).toBe(true)
  })

  it('applies focused row class to the focused node', async () => {
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
      },
    })
    const vm = wrapper.vm as { focusNode: (key: string) => void }
    vm.focusNode('b')
    await flushPromises()
    expect(wrapper.find('.rs-tree__row--focused').text()).toContain('B')
  })

  it('emits node-dblclick on a row that was not focused before the gesture', async () => {
    const onNodeDblclick = vi.fn()
    const wrapper = mount(RsTree, {
      props: {
        nodes: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
        blockNode: true,
        selectable: false,
        onNodeDblclick,
      },
    })
    const rows = wrapper.findAll('.rs-tree__row')
    await rows[0].trigger('click')
    await rows[1].trigger('dblclick')
    expect(onNodeDblclick).toHaveBeenCalledTimes(1)
    expect(onNodeDblclick).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'b', label: 'B' }),
      'b',
    )
  })
})

describe('tree-utils basics', () => {
  it('getTreeKey prefers key then id then label', () => {
    expect(getTreeKey({ key: 'a' })).toBe('a')
    expect(getTreeKey({ id: 'b' })).toBe('b')
    expect(getTreeKey({ label: 'c' })).toBe('c')
  })

  it('supports custom fieldNames', () => {
    const fields = resolveTreeFieldNames({ key: 'id', label: 'name', children: 'subList' })
    expect(getTreeKey({ id: 'x' }, fields)).toBe('x')
    expect(getTreeLabel({ name: '标题' }, fields)).toBe('标题')
    expect(getTreeChildren({ subList: [{ id: '1' }] }, fields)).toHaveLength(1)
  })

  it('splitTreeLabelHighlight marks matched segment', () => {
    const parts = splitTreeLabelHighlight('Hello World', 'wor')
    expect(parts.some((part) => part.highlight && part.text === 'Wor')).toBe(true)
  })

  it('collectHalfCheckedKeys returns parent for partial selection', () => {
    const index = new Map([
      ['parent', { node: {}, parentKey: null, childrenKeys: ['child-a', 'child-b'] }],
      ['child-a', { node: {}, parentKey: 'parent', childrenKeys: [] }],
      ['child-b', { node: {}, parentKey: 'parent', childrenKeys: [] }],
    ])
    expect(collectHalfCheckedKeys(index, new Set(['child-a']), false)).toEqual(['parent'])
  })

  it('resolveTreeFocusKey moves across flat nodes', () => {
    const flat = [
      { key: 'a', node: {}, depth: 0, hasChildren: false, isLast: false, parentKey: null, levelLines: [] },
      { key: 'b', node: {}, depth: 0, hasChildren: false, isLast: true, parentKey: null, levelLines: [] },
    ]
    const index = new Map([
      ['a', { node: {}, parentKey: null, childrenKeys: [] }],
      ['b', { node: {}, parentKey: null, childrenKeys: [] }],
    ])
    expect(resolveTreeFocusKey(flat, 'a', 'next', index)).toBe('b')
  })

  it('flattenTreeNodeIds walks the full tree', () => {
    expect(flattenTreeNodeIds(nodes)).toEqual(['root', 'child', 'alt'])
  })

  it('onlyCheckLeaf hides parent checkbox and checks leaves only', async () => {
    const halfUpdates: string[][] = []
    const wrapper = mount(RsTree, {
      props: {
        nodes: checkNodes,
        checkable: true,
        onlyCheckLeaf: true,
        defaultExpandAll: true,
        checkedKeys: [] as string[],
        'onUpdate:checkedKeys': (value: string[] | undefined) => {
          if (value !== undefined) void wrapper.setProps({ checkedKeys: value })
        },
        'onUpdate:halfCheckedKeys': (value: string[] | undefined) => {
          if (value !== undefined) halfUpdates.push(value)
        },
      },
    })
    expect(wrapper.findAll('.rs-tree__checkbox')).toHaveLength(2)
    expect(wrapper.find('.rs-tree__checkbox-spacer').exists()).toBe(true)
    await wrapper.findAll('.rs-tree__checkbox-input')[0].trigger('change')
    expect(wrapper.props('checkedKeys')).toEqual(['child-a'])
    await flushPromises()
    expect(halfUpdates.at(-1)).toEqual(['parent'])
  })

  it('enables fill-capture layer when height or virtual is set', () => {
    const withHeight = mount(RsTree, {
      props: { nodes, height: 200 },
    })
    expect(withHeight.classes()).toContain('rs-tree--fill-capture')

    const withVirtual = mount(RsTree, {
      props: { nodes, virtual: true },
    })
    expect(withVirtual.classes()).toContain('rs-tree--fill-capture')

    const plain = mount(RsTree, {
      props: { nodes },
    })
    expect(plain.classes()).not.toContain('rs-tree--fill-capture')
  })

  it('does not stop contextmenu propagation for parent handlers', async () => {
    const onContextmenu = vi.fn()
    const wrapper = mount({
      components: { RsTree },
      template: '<div class="host" @contextmenu="onContextmenu"><RsTree :nodes="nodes" :height="200" /></div>',
      setup() {
        return {
          nodes: [{ key: 'only', label: '唯一节点' }],
          onContextmenu,
        }
      },
    })
    await wrapper.find('.rs-tree').trigger('contextmenu')
    expect(onContextmenu).toHaveBeenCalledTimes(1)
  })
})
