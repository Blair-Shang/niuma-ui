import { ref } from 'vue'
import {
  RS_TOAST_DEFAULT_POSITION,
  type RsToastPosition,
} from '../../_shared/src/overlay-utils'
import {
  RS_TOAST_DEFAULT_DURATION,
  RS_TOAST_MAX,
  resolveRsToastDuration,
  shouldArmToastTimer,
  toastLeaveDelay,
  trimToastList,
  type RsToastAction,
  type RsToastKind,
} from './toast-utils'

export interface RsToastRecord {
  id: string
  toasterId: string
  type: RsToastKind
  title: string
  description?: string
  position?: RsToastPosition
  duration: number
  dismissible: boolean
  closeButton: boolean
  richColors: boolean
  action?: RsToastAction
  cancel?: RsToastAction
  onDismiss?: (id: string) => void
  onAutoClose?: (id: string) => void
  leaving: boolean
}

export interface RsToasterHostOptions {
  position: RsToastPosition
  duration: number
  closeButton: boolean
  richColors: boolean
}

export interface RsToastCreate {
  type: RsToastKind
  title: string
  description?: string
  position?: RsToastPosition
  duration?: number
  id?: string
  toasterId?: string
  dismissible?: boolean
  closeButton?: boolean
  richColors?: boolean
  action?: RsToastAction
  cancel?: RsToastAction
  onDismiss?: (id: string) => void
  onAutoClose?: (id: string) => void
}

interface TimerState {
  timeout: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
  reasons: Set<string>
}

const DEFAULT_HOST: RsToasterHostOptions = {
  position: RS_TOAST_DEFAULT_POSITION,
  duration: RS_TOAST_DEFAULT_DURATION,
  closeButton: true,
  richColors: false,
}

export const rsToasts = ref<RsToastRecord[]>([])

const hosts = new Map<string, { token: symbol; options: RsToasterHostOptions }>()
const timers = new Map<string, TimerState>()
const leaveTimers = new Map<string, ReturnType<typeof setTimeout>>()
let seq = 0
let visibilityBound = false

export function syncRsToasterHost(id: string, token: symbol, options: RsToasterHostOptions): void {
  hosts.set(id, { token, options })
}

export function releaseRsToasterHost(id: string, token: symbol): void {
  const current = hosts.get(id)
  if (current?.token === token) hosts.delete(id)
}

export function readRsToasterHost(id: string): RsToasterHostOptions {
  return hosts.get(id)?.options ?? DEFAULT_HOST
}

function nextId(): string {
  seq += 1
  return `rs-toast-${seq}`
}

function callListener(fn: ((id: string) => void) | undefined, id: string): void {
  if (!fn) return
  try {
    fn(id)
  } catch {
    // 监听抛错不能把条留在队列里。
  }
}

function clearTimer(id: string): void {
  const state = timers.get(id)
  if (state?.timeout) clearTimeout(state.timeout)
  timers.delete(id)
}

function clearLeave(id: string): void {
  const timeout = leaveTimers.get(id)
  if (timeout) clearTimeout(timeout)
  leaveTimers.delete(id)
}

function syncVisibility(): void {
  if (typeof document === 'undefined') return
  if (rsToasts.value.length > 0 && !visibilityBound) {
    document.addEventListener('visibilitychange', onVisibility)
    visibilityBound = true
    return
  }
  if (rsToasts.value.length === 0 && visibilityBound) {
    document.removeEventListener('visibilitychange', onVisibility)
    visibilityBound = false
  }
}

function onVisibility(): void {
  if (typeof document === 'undefined') return
  if (document.hidden) {
    for (const item of rsToasts.value) pauseRsToast(item.id, 'hidden')
    return
  }
  for (const item of rsToasts.value) resumeRsToast(item.id, 'hidden')
}

function arm(id: string, duration: number): void {
  clearTimer(id)
  if (!shouldArmToastTimer(duration, typeof window !== 'undefined')) return
  const state: TimerState = {
    timeout: null,
    remaining: duration,
    startedAt: 0,
    reasons: new Set<string>(),
  }
  timers.set(id, state)
  if (typeof document !== 'undefined' && document.hidden) {
    state.reasons.add('hidden')
    return
  }
  state.startedAt = Date.now()
  state.timeout = setTimeout(() => finish(id, 'auto'), duration)
}

export function pauseRsToast(id: string, reason: string): void {
  const state = timers.get(id)
  if (!state || state.reasons.has(reason)) return
  const wasRunning = state.reasons.size === 0 && state.timeout != null
  state.reasons.add(reason)
  if (!wasRunning || !state.timeout) return
  clearTimeout(state.timeout)
  state.timeout = null
  state.remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt))
}

export function resumeRsToast(id: string, reason: string): void {
  const state = timers.get(id)
  if (!state || !state.reasons.delete(reason) || state.reasons.size > 0) return
  if (state.remaining <= 0) {
    finish(id, 'auto')
    return
  }
  state.startedAt = Date.now()
  state.timeout = setTimeout(() => finish(id, 'auto'), state.remaining)
}

function finish(id: string, reason: 'auto' | 'dismiss'): void {
  const record = rsToasts.value.find((item) => item.id === id)
  if (!record || record.leaving) {
    clearTimer(id)
    return
  }
  clearTimer(id)
  record.leaving = true
  if (reason === 'auto') callListener(record.onAutoClose, id)
  else callListener(record.onDismiss, id)
  const delay = toastLeaveDelay()
  const remove = () => {
    leaveTimers.delete(id)
    rsToasts.value = rsToasts.value.filter((item) => item.id !== id)
    syncVisibility()
  }
  if (delay <= 0 || typeof window === 'undefined') {
    remove()
    return
  }
  leaveTimers.set(id, setTimeout(remove, delay))
}

function dropOverflow(toasterId: string): void {
  const owned = rsToasts.value.filter((item) => item.toasterId === toasterId)
  const kept = new Set(trimToastList(owned, RS_TOAST_MAX))
  if (kept.size === owned.length) return
  for (const item of owned) {
    if (kept.has(item)) continue
    clearTimer(item.id)
    clearLeave(item.id)
    callListener(item.onDismiss, item.id)
  }
  rsToasts.value = rsToasts.value.filter((item) => item.toasterId !== toasterId || kept.has(item))
}

export function pushRsToast(input: RsToastCreate): string {
  const toasterId = input.toasterId || 'default'
  const host = readRsToasterHost(toasterId)
  const id = input.id || nextId()
  const duration = resolveRsToastDuration(input.duration, host.duration)
  const next: RsToastRecord = {
    id,
    toasterId,
    type: input.type,
    title: input.title,
    description: input.description,
    position: input.position,
    duration,
    dismissible: input.dismissible !== false,
    closeButton: input.closeButton ?? host.closeButton,
    richColors: input.richColors ?? host.richColors,
    action: input.action,
    cancel: input.cancel,
    onDismiss: input.onDismiss,
    onAutoClose: input.onAutoClose,
    leaving: false,
  }
  clearLeave(id)
  rsToasts.value = [next, ...rsToasts.value.filter((item) => item.id !== id)]
  dropOverflow(toasterId)
  if (rsToasts.value.some((item) => item.id === id)) arm(id, duration)
  syncVisibility()
  return id
}

export function dismissRsToast(id?: string): void {
  if (id == null || id === '') {
    for (const item of [...rsToasts.value]) finish(item.id, 'dismiss')
    return
  }
  finish(id, 'dismiss')
}

/** 测试收尾：清定时器、摘 visibility、清空队列。不拆已挂载宿主的配置。 */
export function resetRsToastStore(): void {
  for (const id of timers.keys()) clearTimer(id)
  for (const id of leaveTimers.keys()) clearLeave(id)
  rsToasts.value = []
  seq = 0
  if (visibilityBound && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibility)
    visibilityBound = false
  }
}
