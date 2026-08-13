/**
 * RsButton 外观变体
 * - primary / default / ghost / danger：常规控件按钮
 * - link：行内链接态（可带下划线）
 * - text：工具栏/表格操作等 quaternary 文字按钮（无底无边，靠 tone 着色）
 */
export type RsButtonVariant =
  | 'primary'
  | 'default'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'link'
  | 'text'

/**
 * RsButton 语义色调
 * 主要用于 text / ghost / link：只改文字与图标色，不改变填充形态。
 * 对 primary / default / danger 等填充变体将被忽略。
 */
export type RsButtonTone =
  | 'neutral'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'

/** 填充类变体：已自带语义色，不再叠加 tone */
export function isRsButtonFilledVariant(variant: RsButtonVariant): boolean {
  const resolved = variant === 'secondary' ? 'default' : variant
  return resolved === 'primary' || resolved === 'default' || resolved === 'danger'
}

/** text / ghost / link 可叠加 tone */
export function supportsRsButtonTone(variant: RsButtonVariant): boolean {
  const resolved = variant === 'secondary' ? 'default' : variant
  return resolved === 'text' || resolved === 'ghost' || resolved === 'link'
}
