/** 解析写入原生 label[for] 的控件 id。htmlFor / forId / for 是别名。 */
export function resolveRsLabelFor(
  htmlFor?: string,
  forId?: string,
  nativeFor?: string,
): string | undefined {
  const value = htmlFor || forId || nativeFor
  return value || undefined
}

/** 有 hint 时才给说明分配 id，供控件 aria-describedby。 */
export function resolveRsLabelHintId(
  hintId: string | undefined,
  autoId: string,
  hasHint: boolean,
): string | undefined {
  if (!hasHint) return undefined
  return hintId || autoId
}

/** 必填优先；optional 只在非必填时展示。 */
export function showRsLabelOptional(required: boolean, optional: boolean): boolean {
  return optional && !required
}
