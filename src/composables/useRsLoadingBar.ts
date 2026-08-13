import { inject, type InjectionKey, type ShallowRef } from 'vue'

export type RsLoadingBarApi = {
  start: () => void
  finish: () => void
  error: () => void
}

export const RS_LOADING_BAR_KEY: InjectionKey<ShallowRef<RsLoadingBarApi | null>> =
  Symbol('rs-loading-bar')

/**
 * useRsLoadingBar 读取最近的 RsLoadingBar 实例 API。
 * 调用方须位于 RsLoadingBar 默认插槽的后代树中；
 * 未挂载或未包裹时返回空操作实现，避免调用方崩溃。
 */
export function useRsLoadingBar(): RsLoadingBarApi {
  const injected = inject(RS_LOADING_BAR_KEY, null)
  const noop: RsLoadingBarApi = {
    start() {},
    finish() {},
    error() {},
  }
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
  }
}
