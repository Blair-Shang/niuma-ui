/**
 * 将 Vue emit 适配为 useRsTableEditActions 所需的 edit emit 袋。
 */

import type { EmitFn } from 'vue'
import type { RsTableEmits } from '../components/table/rs-table-props'
import type { RsTableRowData } from '../components/table-utils'
import type { UseRsTableEditActionsOptions } from './useRsTableEditActions'

type EditEmitBag<T extends RsTableRowData> = UseRsTableEditActionsOptions<T>['emit']

/**
 * 创建编辑 emit 桥（避免 RsTable 内联一长串箭头函数）。
 *
 * 入参用 Vue `EmitFn<RsTableEmits>`，与 `defineEmits` 产物对齐；
 * 勿用手写 overload 接口承接（交叉重载在参数位逆变，会报 cellView ̸∈ update:columnOrder）。
 */
export function createRsTableEditEmitBridge<T extends RsTableRowData>(
  emit: EmitFn<RsTableEmits<T>>,
): EditEmitBag<T> {
  return {
    cellView: (row, column, index) => emit('cellView', row, column, index),
    cellEditStart: (row, column, index) => emit('cellEditStart', row, column, index),
    cellEditDialog: (row, column, index, draft) =>
      emit('cellEditDialog', row, column, index, draft),
    cellEditCommit: (row, column, index, value, previous) =>
      emit('cellEditCommit', row, column, index, value, previous),
    cellEditCancel: (row, column, index) => emit('cellEditCancel', row, column, index),
    cellEditInvalid: (row, column, index, message, value) =>
      emit('cellEditInvalid', row, column, index, message, value),
    cellEditBatchCommit: (column, changes) => emit('cellEditBatchCommit', column, changes),
    cellEditUndo: (entry) => emit('cellEditUndo', entry),
    cellEditRedo: (entry) => emit('cellEditRedo', entry),
    cellEditReject: (row, index, reason) => emit('cellEditReject', row, index, reason),
    rowEditCommit: (row, index, changes) => emit('rowEditCommit', row, index, changes),
    rowEditRollback: (row, index) => emit('rowEditRollback', row, index),
  }
}
