/** 内置品牌 mark（工作台数据源）。Lucide 线标不在此列。 */
export const rsBrandIconNames = [
  'ftp',
  'redis',
  'mongodb',
  'vastbase',
  'mysql',
  'sqlite',
  'dameng',
  'oracle',
  'clickhouse',
  'kingbase',
  'sqlserver',
  'postgres',
] as const

export type RsBrandIconName = (typeof rsBrandIconNames)[number]

const brandIconNameSet = new Set<string>(rsBrandIconNames)

export function isRsBrandIconName(name: string): name is RsBrandIconName {
  return brandIconNameSet.has(name)
}

/** 品牌 mark 填充色变量，如 `--rs-icon-mysql-accent`。 */
export function rsBrandIconAccentVar(name: RsBrandIconName): `--rs-icon-${RsBrandIconName}-accent` {
  return `--rs-icon-${name}-accent`
}
