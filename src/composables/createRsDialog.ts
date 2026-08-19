import { createApp, h, ref, type App } from 'vue'
import RsConfigProvider from '../components/RsConfigProvider.vue'
import RsConfirmDialog from '../components/RsConfirmDialog.vue'
import RsDialog from '../components/RsDialog.vue'
import type { RsConfirmOptions } from '../components/dialog-utils'
import type { RsDialogBeforeClose, RsDialogCloseReason, RsDialogWidth } from '../components/dialog-utils'
import type { RsFeedbackTone } from '../components/overlay-utils'
import { defaultLocale, type RsLocale } from '../locale/types'
import type { RsThemeMode } from '../theme/types'

export type RsConfirmResult = boolean

export type RsConfirmInput = RsConfirmOptions | string

export interface RsDialogOpenOptions {
  title?: string
  subtitle?: string
  description?: string
  width?: RsDialogWidth
  tone?: RsFeedbackTone
  /**
   * 布局。默认 window（工作窗）。
   * form：居中轻量表单/说明；confirm 仅作历史兼容（等同 form）。
   * 确认/提示请用 rsConfirm / RsConfirmDialog。
   */
  layout?: 'window' | 'form' | 'confirm'
  showOverlay?: boolean
  /** 遮罩不透明度 0–1 */
  overlayOpacity?: number
  /** 遮罩模糊；number 为 px */
  overlayBlur?: number | string
  showClose?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
  autoCloseOnConfirm?: boolean
  beforeClose?: RsDialogBeforeClose
  teleportTo?: string | HTMLElement
  /** 默认插槽对应 #body 的渲染函数 */
  body?: () => unknown
  footer?: () => unknown
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  onAfterClose?: (reason: RsDialogCloseReason) => void
  /** 命令式挂载时覆盖主题；默认读 document data-rs-theme */
  theme?: RsThemeMode
  /** 命令式挂载时覆盖语言；默认读 document data-rs-locale */
  locale?: RsLocale
}

export interface RsDialogHandle {
  close: (reason?: RsDialogCloseReason) => Promise<boolean>
  destroy: () => void
}

/** tone 快捷方法：可传完整选项或纯文案（作为 description） */
export interface RsConfirmApi {
  (options?: RsConfirmOptions): Promise<RsConfirmResult>
  warning: (options?: RsConfirmInput) => Promise<RsConfirmResult>
  danger: (options?: RsConfirmInput) => Promise<RsConfirmResult>
  info: (options?: RsConfirmInput) => Promise<RsConfirmResult>
  success: (options?: RsConfirmInput) => Promise<RsConfirmResult>
  error: (options?: RsConfirmInput) => Promise<RsConfirmResult>
  confirm: (options?: RsConfirmInput) => Promise<RsConfirmResult>
}

function readDomTheme(): RsThemeMode {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-rs-theme') === 'dark' ? 'dark' : 'light'
}

function readDomLocale(): RsLocale {
  if (typeof document === 'undefined') return defaultLocale
  const value = document.documentElement.getAttribute('data-rs-locale')
  return value === 'en-US' || value === 'zh-CN' ? value : defaultLocale
}

/** 命令式实例的销毁函数；测试收尾用 destroyAllRsDialogHosts 走正规 unmount。 */
const liveHosts = new Set<() => void>()

function mountHost(
  render: () => unknown,
  config?: { theme?: RsThemeMode; locale?: RsLocale },
): { app: App; container: HTMLDivElement; destroy: () => void } {
  const container = document.createElement('div')
  document.body.appendChild(container)

  // themeScope=local：不覆盖主应用的 document 主题；Portal 仍靠页面已有 data-rs-theme。
  // ConfigProvider 负责 provide locale，使命令式实例的 i18n 默认文案正确。
  const theme = config?.theme ?? readDomTheme()
  const locale = config?.locale ?? readDomLocale()

  const app = createApp({
    setup() {
      return () =>
        h(
          RsConfigProvider,
          { theme, locale, themeScope: 'local' },
          { default: () => render() },
        )
    },
  })
  app.mount(container)
  let destroyed = false
  const destroy = () => {
    if (destroyed) return
    destroyed = true
    liveHosts.delete(destroy)
    try {
      app.unmount()
    } catch {
      // Teleport 节点可能已被外部从 DOM 摘掉（测试误删 portal、宿主提前清理）
    }
    container.remove()
  }
  liveHosts.add(destroy)
  return { app, container, destroy }
}

const pendingDestroyTimers = new Set<number>()

function scheduleHostDestroy(destroy: () => void): number {
  const timer = window.setTimeout(() => {
    pendingDestroyTimers.delete(timer)
    destroy()
  }, 200)
  pendingDestroyTimers.add(timer)
  return timer
}

function clearHostDestroyTimer(timer: number | undefined): void {
  if (timer == null) return
  clearTimeout(timer)
  pendingDestroyTimers.delete(timer)
}

/** 立即销毁所有命令式对话框宿主。测试 afterEach 使用，避免拆 DOM 后再延迟 unmount。 */
export function destroyAllRsDialogHosts(): void {
  for (const timer of [...pendingDestroyTimers]) {
    clearTimeout(timer)
    pendingDestroyTimers.delete(timer)
  }
  for (const destroy of [...liveHosts]) destroy()
}

function normalizeConfirmInput(
  options: RsConfirmInput | undefined,
  defaults: Partial<RsConfirmOptions>,
): RsConfirmOptions {
  if (typeof options === 'string') {
    return { ...defaults, description: options }
  }
  return { ...defaults, ...(options ?? {}) }
}

/**
 * 命令式确认框（基于 RsConfirmDialog）。
 * resolve(true) 为确认，resolve(false) 为取消/关闭。
 * 若传入 onConfirm 且返回 Promise，确认期间自动 loading，成功后关闭。
 */
function rsConfirmCore(options: RsConfirmOptions = {}): Promise<RsConfirmResult> {
  return new Promise((resolve) => {
    const open = ref(true)
    const loading = ref(options.confirmLoading ?? false)
    let settled = false
    let confirmed = false
    let closeTimer: number | undefined
    const hasAsyncConfirm = typeof options.onConfirm === 'function'
    let unmountHost = () => {}

    const destroy = () => {
      clearHostDestroyTimer(closeTimer)
      closeTimer = undefined
      unmountHost()
    }

    const settle = (value: boolean) => {
      if (settled) return
      settled = true
      open.value = false
      if (!value) options.onCancel?.()
      // 等关闭帧后再销毁，避免动画被硬切
      closeTimer = scheduleHostDestroy(destroy)
      resolve(value)
    }

    unmountHost = mountHost(
      () =>
        h(
          RsConfirmDialog,
          {
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value
              if (!value) {
                // 等同 tick 内的 confirm/cancel 事件先落定，避免 Action 关闭抢先 resolve(false)
                queueMicrotask(() => settle(confirmed))
              }
            },
            title: options.title,
            subtitle: options.subtitle,
            description: options.description,
            tone: options.tone,
            icon: options.icon,
            width: options.width,
            confirmText: options.confirmText,
            cancelText: options.cancelText,
            confirmVariant: options.confirmVariant,
            showCancel: options.showCancel,
            confirmLoading: loading.value,
            beforeClose: options.beforeClose,
            // 有异步 onConfirm 时由我们在结束后关闭，避免提前关掉
            autoCloseOnConfirm: !hasAsyncConfirm,
            showOverlay: options.showOverlay ?? true,
            overlayOpacity: options.overlayOpacity,
            overlayBlur: options.overlayBlur,
            teleportTo: options.teleportTo === false ? false : options.teleportTo,
            onConfirm: () => {
              if (!hasAsyncConfirm) {
                confirmed = true
                return
              }
              loading.value = true
              void Promise.resolve()
                .then(() => options.onConfirm?.())
                .then(() => {
                  confirmed = true
                  settle(true)
                })
                .catch(() => {
                  loading.value = false
                })
            },
            onCancel: () => {
              confirmed = false
            },
          },
          options.extra
            ? {
                extra: () => options.extra?.(),
              }
            : undefined,
        ),
      { theme: options.theme, locale: options.locale },
    ).destroy
  })
}

/**
 * 命令式确认 / 提示 API。
 * - rsConfirm(options) 基础调用
 * - rsConfirm.warning / .danger / .confirm 双按钮确认
 * - rsConfirm.info / .success / .error 默认单按钮提示（showCancel: false）
 */
export const rsConfirm: RsConfirmApi = Object.assign(rsConfirmCore, {
  warning: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'danger',
        confirmVariant: 'danger',
        showOverlay: true,
      }),
    ),
  danger: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'danger',
        confirmVariant: 'danger',
        showOverlay: true,
      }),
    ),
  info: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'info',
        confirmVariant: 'primary',
        showCancel: false,
        showOverlay: true,
      }),
    ),
  success: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'success',
        confirmVariant: 'primary',
        showCancel: false,
        showOverlay: true,
      }),
    ),
  error: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'danger',
        confirmVariant: 'danger',
        showCancel: false,
        showOverlay: true,
      }),
    ),
  confirm: (options?: RsConfirmInput) =>
    rsConfirmCore(
      normalizeConfirmInput(options, {
        tone: 'warning',
        confirmVariant: 'primary',
        showOverlay: true,
      }),
    ),
})

/**
 * 命令式打开 RsDialog；适合临时表单/说明层。
 * 确认/危险提示请用 rsConfirm，不要传 layout: 'confirm'。
 * 轻量表单/说明请用 layout: 'form'。
 * 复杂长期状态仍建议声明式使用组件。
 */
export function openRsDialog(options: RsDialogOpenOptions = {}): RsDialogHandle {
  const open = ref(true)
  let destroyed = false
  let closeTimer: number | undefined
  let dialogExpose: { close?: (reason?: RsDialogCloseReason) => Promise<boolean> } | null = null
  const layout = options.layout ?? 'window'

  if (import.meta.env.DEV && layout === 'confirm') {
    console.warn(
      '[openRsDialog] layout:"confirm" 已弃用。确认/提示请使用 rsConfirm / RsConfirmDialog；本 API 仅用于工作窗/表单。',
    )
  }

  const { destroy: unmount } = mountHost(
    () =>
      h(
        RsDialog,
        {
          ref: (instance: unknown) => {
            dialogExpose = instance as typeof dialogExpose
          },
          open: open.value,
          'onUpdate:open': (value: boolean) => {
            open.value = value
            if (!value && !destroyed) {
              closeTimer = scheduleHostDestroy(destroy)
            }
          },
          title: options.title,
          description:
            [options.subtitle, options.description].filter(Boolean).join('\n\n') ||
            options.description,
          width: options.width ?? 'md',
          tone: options.tone,
          layout,
          resizable: layout === 'window',
          fullscreenable: layout === 'window',
          showOverlay: options.showOverlay ?? true,
          overlayOpacity: options.overlayOpacity,
          overlayBlur: options.overlayBlur,
          showClose: options.showClose,
          closeOnOverlayClick: options.closeOnOverlayClick,
          closeOnEsc: options.closeOnEsc,
          showFooter: options.showFooter ?? true,
          showCancel: options.showCancel,
          showConfirm: options.showConfirm,
          cancelText: options.cancelText,
          confirmText: options.confirmText,
          confirmVariant: options.confirmVariant,
          autoCloseOnConfirm: options.autoCloseOnConfirm ?? true,
          beforeClose: options.beforeClose,
          teleportTo: options.teleportTo,
          deferBodyMount: false,
          onConfirm: () => {
            void options.onConfirm?.()
          },
          onCancel: () => {
            options.onCancel?.()
          },
          onAfterClose: (reason: RsDialogCloseReason) => {
            options.onAfterClose?.(reason)
          },
        },
        {
          body: options.body,
          footer: options.footer,
        },
      ),
    { theme: options.theme, locale: options.locale },
  )

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    clearHostDestroyTimer(closeTimer)
    closeTimer = undefined
    unmount()
  }

  return {
    async close(reason: RsDialogCloseReason = 'programmatic') {
      if (destroyed) return false
      if (dialogExpose?.close) return dialogExpose.close(reason)
      open.value = false
      return true
    },
    destroy,
  }
}
