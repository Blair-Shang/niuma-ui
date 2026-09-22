import { getCurrentInstance, inject } from 'vue'
import { rsToasts, dismissRsToast, pushRsToast } from '../components/toaster/src/toast-store'
import {
  errorToastText,
  normalizePromiseMessage,
  normalizeRsToastInput,
  type RsToastInput,
  type RsToastKind,
  type RsToastOptions,
  type RsToastPromiseMessages,
  type RsToastAction,
} from '../components/toaster/src/toast-utils'
import { readDocumentLocale } from '../locale/apply'
import { resolveRsMessage } from '../locale/registry'
import { rsConfigKey } from './useRsConfig'

export type {
  RsToastAction,
  RsToastInput,
  RsToastKind,
  RsToastOptions,
  RsToastPromiseMessages,
}

function show(type: RsToastKind, input: RsToastInput, duration?: number): string {
  const payload = normalizeRsToastInput(input)
  return pushRsToast({
    ...payload,
    type,
    duration: duration ?? payload.duration,
  })
}

/** 在 setup 里跟 ConfigProvider；在 setup 外跟 document / 本机语言。回调里不再调用 inject。 */
function createToastTranslator(): (key: string) => string {
  const config = getCurrentInstance() ? inject(rsConfigKey, null) : null
  return (key: string) => resolveRsMessage(config?.locale.value ?? readDocumentLocale(), key) ?? key
}

export function useRsToast() {
  const t = createToastTranslator()

  function update(id: string, input: RsToastInput, type?: RsToastKind): void {
    const current = rsToasts.value.find((item) => item.id === id)
    if (!current) return
    const payload = normalizeRsToastInput(input)
    const typeChanged = type != null && type !== current.type
    pushRsToast({
      type: type ?? current.type,
      title: payload.title,
      description: payload.description ?? current.description,
      position: payload.position ?? current.position,
      duration:
        payload.duration ??
        (typeChanged && type !== 'loading' ? undefined : current.duration),
      id,
      toasterId: payload.toasterId ?? current.toasterId,
      dismissible: payload.dismissible ?? current.dismissible,
      closeButton: payload.closeButton ?? current.closeButton,
      richColors: payload.richColors ?? current.richColors,
      action: payload.action ?? current.action,
      cancel: payload.cancel ?? current.cancel,
      onDismiss: payload.onDismiss ?? current.onDismiss,
      onAutoClose: payload.onAutoClose ?? current.onAutoClose,
    })
  }

  function promise<T>(task: Promise<T> | (() => Promise<T>), data: RsToastPromiseMessages<T>): string {
    const loading = normalizeRsToastInput(data.loading)
    const id = pushRsToast({
      ...loading,
      type: 'loading',
      duration: loading.duration ?? Number.POSITIVE_INFINITY,
      id: data.id ?? loading.id,
      toasterId: data.toasterId ?? loading.toasterId,
    })
    const run = typeof task === 'function' ? task() : task
    Promise.resolve(run).then(
      (value) => {
        const next = normalizePromiseMessage(data.success, value) ?? { title: t('toaster.done') }
        update(id, next, 'success')
      },
      (error) => {
        const next = normalizePromiseMessage(data.error, error) ?? {
          title: errorToastText(error) || t('toaster.failed'),
        }
        update(id, next, 'error')
      },
    )
    return id
  }

  return {
    success: (input: RsToastInput) => show('success', input),
    error: (input: RsToastInput) => show('error', input),
    info: (input: RsToastInput) => show('info', input),
    warning: (input: RsToastInput) => show('warning', input),
    message: (input: RsToastInput) => show('default', input),
    loading: (input: RsToastInput) => show('loading', input, normalizeRsToastInput(input).duration ?? Number.POSITIVE_INFINITY),
    promise,
    update,
    dismiss: (id?: string | number) => {
      dismissRsToast(id == null || id === '' ? undefined : String(id))
    },
  }
}
