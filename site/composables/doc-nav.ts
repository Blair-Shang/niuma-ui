import { componentDocs } from '../catalog/components'
import { guideDocs } from '../catalog/guides'
import type { ComponentGroup } from '../catalog/types'
import { pickSitePair } from '../i18n'

export const componentGroupOrder: ComponentGroup[] = [
  'basic',
  'form',
  'nav',
  'feedback',
  'data',
  'editor',
]

export interface DocNavItem {
  to: string
  title: string
  titleEn: string
  kind: 'guide' | 'component'
}

export const docNavItems: DocNavItem[] = [
  ...guideDocs.map((guide) => ({
    to: `/guide/${guide.slug}`,
    title: guide.title,
    titleEn: guide.titleEn,
    kind: 'guide' as const,
  })),
  ...componentGroupOrder.flatMap((group) =>
    componentDocs
      .filter((item) => item.group === group)
      .map((item) => ({
        to: `/components/${item.slug}`,
        title: `${item.title} ${item.titleZh}`,
        titleEn: item.title,
        kind: 'component' as const,
      })),
  ),
]

export function getDocNeighbors(path: string) {
  const index = docNavItems.findIndex((item) => item.to === path)
  return {
    prev: index > 0 ? docNavItems[index - 1] : undefined,
    next: index >= 0 && index < docNavItems.length - 1 ? docNavItems[index + 1] : undefined,
  }
}

export function relatedComponentLabel(slug: string, locale: string) {
  const item = componentDocs.find((doc) => doc.slug === slug)
  if (!item) return slug
  return pickSitePair(locale, `${item.title} ${item.titleZh}`, item.title)
}
