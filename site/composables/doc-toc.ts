import { inject, provide, type Ref, ref } from 'vue'

export interface DocTocItem {
  id: string
  title: string
  children?: DocTocItem[]
}

const KEY = Symbol('doc-toc')

export function provideDocToc(): Ref<DocTocItem[]> {
  const items = ref<DocTocItem[]>([])
  provide(KEY, items)
  return items
}

export function useDocToc(): Ref<DocTocItem[]> {
  return inject(KEY, ref<DocTocItem[]>([]))
}
