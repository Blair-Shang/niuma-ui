import { brand, subtitle } from './common'
import { doc } from './doc'
import { features, home } from './home'
import { footer } from './footer'
import { groups } from './groups'
import { nav } from './nav'

export const zhCN = {
  brand,
  subtitle,
  nav,
  groups,
  home,
  features,
  footer,
  doc,
}

export type SiteMessages = typeof zhCN
