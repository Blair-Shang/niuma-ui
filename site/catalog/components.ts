import type { ComponentDoc } from './types'
import { basicComponents } from './components/basic'
import { formComponents } from './components/form'
import { navComponents } from './components/nav'
import { feedbackComponents } from './components/feedback'
import { dataComponents } from './components/data'
import { editorComponents } from './components/editor'

export const componentDocs: ComponentDoc[] = [
  ...basicComponents,
  ...formComponents,
  ...navComponents,
  ...feedbackComponents,
  ...dataComponents,
  ...editorComponents,
]

const featuredSlugs = ['button', 'form', 'input', 'select', 'table', 'tree', 'dialog']

export const featuredComponents = componentDocs.filter((item) => featuredSlugs.includes(item.slug))

export function getComponent(slug: string): ComponentDoc | undefined {
  return componentDocs.find((item) => item.slug === slug)
}
