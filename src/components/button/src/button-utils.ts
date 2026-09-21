/**
 * RsButton 外观变体（形态，与 tone 正交）
 * - primary：实心
 * - default / secondary：轮廓 + 浅底（secondary 等价 default）
 * - ghost：透明底 + 描边
 * - text：无底无边
 * - link：行内链接
 * - danger：兼容别名，等价 primary + tone="danger" 的历史实心底（保留独立样式）
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
 * RsButton 语义色（色相，与 variant 正交）
 * 对齐 Ant Design color / Element Plus type / Naive UI type：
 * `variant="default" tone="warning"` → 描边 + 浅底 + 警告色。
 */
export type RsButtonTone =
  | 'neutral'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'

/** 规范化变体：未传为 primary；secondary 视为 default。 */
export function resolveRsButtonVariant(variant?: RsButtonVariant): Exclude<RsButtonVariant, 'secondary'> {
  if (variant === 'secondary') return 'default'
  if (!variant) return 'primary'
  return variant
}

/**
 * 解析语义色。未传 tone 时：primary/link 用 primary，danger 变体用 danger，其余 neutral。
 */
export function resolveRsButtonTone(variant?: RsButtonVariant, tone?: RsButtonTone): RsButtonTone {
  if (tone) return tone
  const resolved = resolveRsButtonVariant(variant)
  if (resolved === 'danger') return 'danger'
  if (resolved === 'primary' || resolved === 'link') return 'primary'
  return 'neutral'
}

/** 实心/轮廓填充类变体（相对 text / ghost / link）。 */
export function isRsButtonFilledVariant(variant: RsButtonVariant): boolean {
  const resolved = resolveRsButtonVariant(variant)
  return resolved === 'primary' || resolved === 'default' || resolved === 'danger'
}

/** 所有变体都可叠加 tone（形态 × 色相）。 */
export function supportsRsButtonTone(_variant?: RsButtonVariant): boolean {
  return true
}
