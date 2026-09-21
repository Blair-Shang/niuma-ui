export type DocGroup = 'guide' | 'basic' | 'form' | 'nav' | 'feedback' | 'data' | 'editor'

export type ComponentGroup = Exclude<DocGroup, 'guide'>

export interface ApiRow {
  name: string
  type: string
  default?: string
  defaultEn?: string
  description: string
  descriptionEn?: string
}

export interface TokenRow {
  name: string
  default: string
  description: string
  descriptionEn?: string
}

export interface FaqItem {
  q: string
  a: string
  qEn?: string
  aEn?: string
}

export interface DemoTocItem {
  id: string
  title: string
  titleEn: string
}

export interface GuideDoc {
  slug: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  sections: GuideSection[]
}

export interface GuideSection {
  id: string
  title: string
  titleEn: string
  body?: string
  bodyEn?: string
  bullets?: string[]
  bulletsEn?: string[]
  code?: { lang: string; content: string }
}

export interface ComponentDoc {
  slug: string
  name: string
  title: string
  titleZh: string
  group: ComponentGroup
  /** 一句话定位，用于侧栏与卡片 */
  summary: string
  /** 组件介绍（企业文档首段） */
  description: string
  descriptionEn?: string
  whenToUse: string[]
  whenToUseEn?: string[]
  demos?: DemoTocItem[]
  props: ApiRow[]
  events?: ApiRow[]
  slots?: ApiRow[]
  methods?: ApiRow[]
  tokens?: TokenRow[]
  faq?: FaqItem[]
  related?: string[]
}

export interface NavItem {
  path: string
  title: string
  titleEn: string
  group: DocGroup
  summary?: string
}
