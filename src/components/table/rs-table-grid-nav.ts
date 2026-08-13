/**
 * ARIA Grid 单元格导航（矩形行列模型，不限于可编辑格）。
 * 对标 Excel / AG Grid 漫游：箭头、Home/End、Ctrl+Home/End、PageUp/PageDown。
 */

export type RsTableGridNavDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'home'
  | 'end'
  | 'first'
  | 'last'
  | 'pageUp'
  | 'pageDown'

export interface RsTableGridCellRef {
  rowKey: string
  colKey: string
  rowIndex: number
}

/**
 * 在「行列表 × 列 key」矩形上移动焦点。
 * rows 按视觉顺序；colKeys 为可见数据列顺序。
 */
export function navigateGridCell(
  rows: Array<{ rowKey: string; rowIndex: number }>,
  colKeys: string[],
  current: RsTableGridCellRef | null,
  direction: RsTableGridNavDirection,
  pageSize = 10,
): RsTableGridCellRef | null {
  if (!rows.length || !colKeys.length) return null

  const seed = current ?? {
    rowKey: rows[0]!.rowKey,
    colKey: colKeys[0]!,
    rowIndex: rows[0]!.rowIndex,
  }

  let rowPos = rows.findIndex((r) => r.rowKey === seed.rowKey)
  if (rowPos < 0) rowPos = 0
  let colPos = colKeys.indexOf(seed.colKey)
  if (colPos < 0) colPos = 0

  const lastRow = rows.length - 1
  const lastCol = colKeys.length - 1
  const step = Math.max(1, pageSize)

  switch (direction) {
    case 'left':
      colPos = Math.max(0, colPos - 1)
      break
    case 'right':
      colPos = Math.min(lastCol, colPos + 1)
      break
    case 'up':
      rowPos = Math.max(0, rowPos - 1)
      break
    case 'down':
      rowPos = Math.min(lastRow, rowPos + 1)
      break
    case 'home':
      colPos = 0
      break
    case 'end':
      colPos = lastCol
      break
    case 'first':
      rowPos = 0
      colPos = 0
      break
    case 'last':
      rowPos = lastRow
      colPos = lastCol
      break
    case 'pageUp':
      rowPos = Math.max(0, rowPos - step)
      break
    case 'pageDown':
      rowPos = Math.min(lastRow, rowPos + step)
      break
    default:
      break
  }

  const row = rows[rowPos]!
  return {
    rowKey: row.rowKey,
    colKey: colKeys[colPos]!,
    rowIndex: row.rowIndex,
  }
}

/**
 * 将 KeyboardEvent 映射为网格导航方向；无法识别则返回 null。
 */
export function resolveGridNavDirection(event: KeyboardEvent): RsTableGridNavDirection | null {
  const mod = event.ctrlKey || event.metaKey
  switch (event.key) {
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'Home':
      return mod ? 'first' : 'home'
    case 'End':
      return mod ? 'last' : 'end'
    case 'PageUp':
      return 'pageUp'
    case 'PageDown':
      return 'pageDown'
    default:
      return null
  }
}
