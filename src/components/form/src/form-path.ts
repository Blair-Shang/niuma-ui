/** 字段路径：`'user.email'` 或 `['user', 'email']`（对齐 Ant Design NamePath） */
export type RsFormNamePath = string | Array<string | number>

/** 路径段是否为数组下标（Form.List 相对 name 的第一段）。 */
export function isIndexSegment(seg: string | number): boolean {
  if (typeof seg === 'number') return Number.isInteger(seg) && seg >= 0
  return /^\d+$/.test(seg)
}

/**
 * 将 NamePath 规范为路径段。字符串按 `.` 拆分。
 */
export function normalizeNamePath(name?: RsFormNamePath | null): Array<string | number> {
  if (name == null || name === '') return []
  if (Array.isArray(name)) return name.filter((seg) => seg !== '')
  return String(name)
    .split('.')
    .filter((seg) => seg !== '')
}

/**
 * 拼接多段 NamePath（List 前缀 + Item name）。
 */
export function concatNamePath(
  ...parts: Array<RsFormNamePath | undefined | null>
): Array<string | number> {
  return parts.flatMap((part) => normalizeNamePath(part))
}

/**
 * 路径转 rules / DOM 使用的稳定键。
 */
export function namePathKey(name?: RsFormNamePath | null): string {
  return normalizeNamePath(name).map(String).join('.')
}

/**
 * 路径是否已存在于对象树上（含值为 null / undefined 的叶子）。
 */
export function hasByNamePath(source: unknown, name?: RsFormNamePath | null): boolean {
  const keys = normalizeNamePath(name)
  if (!keys.length) return false
  let current: unknown = source
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return false
    if (!Object.prototype.hasOwnProperty.call(current, String(key))) return false
    current = (current as Record<string, unknown>)[String(key)]
  }
  return true
}

/**
 * 按 NamePath 读取对象字段。
 */
export function getByNamePath(source: unknown, name?: RsFormNamePath | null): unknown {
  const keys = normalizeNamePath(name)
  if (!keys.length) return undefined
  let current: unknown = source
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[String(key)]
  }
  return current
}

/**
 * 按 NamePath 写入对象字段。
 * 中间缺失的容器按下一段是否为下标补 `[]` 或 `{}`，已有数组不会被覆盖成对象。
 */
export function setByNamePath(
  target: Record<string, unknown>,
  name: RsFormNamePath,
  value: unknown,
): void {
  const keys = normalizeNamePath(name)
  if (!keys.length) return
  let current: unknown = target
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (current == null || typeof current !== 'object') return
    const obj = current as Record<string, unknown>
    const key = String(keys[i])
    const nextKey = keys[i + 1]
    let next = obj[key]
    if (next == null || typeof next !== 'object') {
      next = isIndexSegment(nextKey!) ? [] : {}
      obj[key] = next
    }
    current = next
  }
  if (current == null || typeof current !== 'object') return
  ;(current as Record<string, unknown>)[String(keys[keys.length - 1])] = value
}
