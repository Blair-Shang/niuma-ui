import { componentDocs } from '../catalog/components'
import { guideDocs } from '../catalog/guides'
import { siteText, type SiteLocale } from '../i18n'
import type { ComponentGroup } from '../catalog/types'

export interface SiteSearchHit {
  kind: 'guide' | 'component'
  to: string
  title: string
  hint: string
  group: string
  keywords?: string
}

function haystack(parts: string[]): string {
  return parts.join(' ').toLowerCase()
}

export function searchDocs(query: string, locale: SiteLocale): SiteSearchHit[] {
  const copy = siteText(locale)
  const isEn = locale === 'en-US'
  const q = query.trim().toLowerCase()

  const guides: SiteSearchHit[] = guideDocs.map((item) => ({
    kind: 'guide',
    to: `/guide/${item.slug}`,
    title: isEn ? item.titleEn : item.title,
    hint: isEn ? item.descriptionEn : item.description,
    group: copy.groups.guide,
    keywords: `${item.slug} ${item.title} ${item.titleEn} ${item.description} ${item.descriptionEn}`,
  }))

  const components: SiteSearchHit[] = componentDocs.map((item) => ({
    kind: 'component',
    to: `/components/${item.slug}`,
    title: isEn ? item.title : `${item.title} ${item.titleZh}`,
    hint: item.summary,
    group: copy.groups[item.group as ComponentGroup],
    keywords: `${item.slug} ${item.name} ${item.title} ${item.titleZh}`,
  }))

  const all = [...guides, ...components]
  if (!q) return all.slice(0, 8)

  return all
    .filter((item) => {
      const blob = haystack([item.title, item.hint, item.group, item.to, item.keywords ?? ''])
      return blob.includes(q)
    })
    .slice(0, 16)
}
