import { inject, type InjectionKey, type ShallowRef } from 'vue'
import type { RsLoadingBarApi } from '../components/loading-bar/src/loading-bar-utils'

export type { RsLoadingBarApi } from '../components/loading-bar/src/loading-bar-utils'

export const RS_LOADING_BAR_KEY: InjectionKey<ShallowRef<RsLoadingBarApi | null>> =
  Symbol('rs-loading-bar')

const noop: RsLoadingBarApi = {
  start() {},
  finish() {},
  error() {},
  set() {},
  inc() {},
  getProgress: () => 0,
  isStarted: () => false,
}

/**
 * useRsLoadingBar 读取最近的 RsLoadingBar 实例 API。
 * 调用方须位于 RsLoadingBar 默认插槽的后代树中；
 * 未挂载或未包裹时返回空操作实现，避免调用方崩溃。
 */
export function useRsLoadingBar(): RsLoadingBarApi {
  const injected = inject(RS_LOADING_BAR_KEY, null)
  if (!injected) return noop
  return {
    start() {
      injected.value?.start()
    },
    finish() {
      injected.value?.finish()
    },
    error() {
      injected.value?.error()
    },
    set(progress: number) {
      injected.value?.set(progress)
    },
    inc(amount?: number) {
      injected.value?.inc(amount)
    },
    getProgress() {
      return injected.value?.getProgress() ?? 0
    },
    isStarted() {
      return injected.value?.isStarted() ?? false
    },
  }
}
