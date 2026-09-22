import type { Component } from 'vue'
import * as LucideVue from '@lucide/vue'
import { resolveHostIcon } from './host'
import { ApiIcon } from './custom/api'
import { FtpIcon } from './custom/ftp'
import { MongodbIcon } from './custom/mongodb'
import { MysqlIcon } from './custom/mysql'
import { RedisIcon } from './custom/redis'
import { SqliteIcon } from './custom/sqlite'
import { VastbaseIcon } from './custom/vastbase'
import { DamengIcon } from './custom/dameng'
import { OracleIcon } from './custom/oracle'
import { ClickhouseIcon } from './custom/clickhouse'
import { KingbaseIcon } from './custom/kingbase'
import { SqlserverIcon } from './custom/sqlserver'
import { PostgresIcon } from './custom/postgres'

export const LUCIDE_LICENSE = 'ISC'
export const LUCIDE_ATTRIBUTION =
  'Icons by Lucide (https://lucide.dev) — ISC License, free for commercial use'

/** NiuMa 业务扩展图标（kebab-case，与 Lucide 同名查找） */
const customIconMap = new Map<string, Component>([
  ['api', ApiIcon],
  ['ftp', FtpIcon],
  ['mongodb', MongodbIcon],
  ['mysql', MysqlIcon],
  ['redis', RedisIcon],
  ['sqlite', SqliteIcon],
  ['vastbase', VastbaseIcon],
  ['dameng', DamengIcon],
  ['oracle', OracleIcon],
  ['clickhouse', ClickhouseIcon],
  ['kingbase', KingbaseIcon],
  ['sqlserver', SqlserverIcon],
  ['postgres', PostgresIcon],
])

const lucideExports = LucideVue as Record<string, unknown>
const SKIP_LUCIDE_EXPORTS = new Set(['default', 'createLucideIcon'])

function isVueComponent(value: unknown): value is Component {
  return typeof value === 'function' || (typeof value === 'object' && value !== null)
}

/** RsIcon 使用 kebab-case（如 trash-2），@lucide/vue 导出名是 PascalCase（Trash2） */
function kebabToPascal(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function getLucideComponent(name: string): Component | undefined {
  const pascal = kebabToPascal(name)
  if (SKIP_LUCIDE_EXPORTS.has(pascal)) return undefined
  const value = lucideExports[pascal]
  return isVueComponent(value) ? value : undefined
}

/** Lucide 更名兼容：旧 kebab 名 → 当前导出名对应的 kebab */
const iconAliases = new Map<string, string>([
  ['code-2', 'code-xml'],
  ['circle-help', 'circle-question-mark'],
  ['help-circle', 'circle-question-mark'],
])

function resolveIconName(name: string): string {
  return iconAliases.get(name) ?? name
}

const iconCache = new Map<string, Component>()
const shadowedHostNames = new Set<string>()

function hasBuiltinIcon(resolvedName: string): boolean {
  return customIconMap.has(resolvedName) || getLucideComponent(resolvedName) !== undefined
}

/** 内置名优先。业务若登记了同名，开发环境只警告一次，不替换图形。 */
function warnIfHostShadows(requested: string, resolvedName: string): void {
  if (!import.meta.env.DEV) return
  if (!resolveHostIcon(requested) && !resolveHostIcon(resolvedName)) return
  if (shadowedHostNames.has(requested)) return
  shadowedHostNames.add(requested)
  console.warn(`registerRsIcon: "${requested}" is a built-in icon and was not used`)
}

export function isRsIconName(name: string): boolean {
  const resolvedName = resolveIconName(name)
  return (
    hasBuiltinIcon(resolvedName) ||
    resolveHostIcon(name) !== undefined ||
    resolveHostIcon(resolvedName) !== undefined
  )
}

export function resolveLucideIcon(name: string): Component | undefined {
  const resolvedName = resolveIconName(name)
  const cached = iconCache.get(resolvedName)
  if (cached) {
    warnIfHostShadows(name, resolvedName)
    return cached
  }

  const icon = customIconMap.get(resolvedName) ?? getLucideComponent(resolvedName)
  if (icon) {
    iconCache.set(resolvedName, icon)
    warnIfHostShadows(name, resolvedName)
    return icon
  }
  return resolveHostIcon(name) ?? resolveHostIcon(resolvedName)
}

/** 可解析的图标数量（自定义 + Lucide 命名导出） */
export const lucideIconCount =
  customIconMap.size +
  Object.keys(lucideExports).filter(
    (key) => !SKIP_LUCIDE_EXPORTS.has(key) && isVueComponent(lucideExports[key]),
  ).length
