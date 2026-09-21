import type { Terminal } from '@xterm/xterm'

export type RsTerminalWheelScrollModifier = 'none' | 'shift'

/** 视口是否已滚入 scrollback（非底部跟随） */
export function isTerminalViewportScrolledUp(terminal: Terminal): boolean {
  const buffer = terminal.buffer.active
  return buffer.viewportY < buffer.baseY
}

export function isAlternateTerminalBuffer(terminal: Terminal | null | undefined): boolean {
  return terminal?.buffer.active.type === 'alternate'
}

/**
 * shift：仅全屏 TUI（备用屏，vim/top/less）把滚轮转成方向键；
 * 普通 shell 必须滚 scrollback，否则 bash/zsh 会当成历史命令。
 */
export function shouldConvertWheelToArrowKeys(options: {
  modifier: RsTerminalWheelScrollModifier
  shiftKey: boolean
  alternateBuffer: boolean
}): boolean {
  if (options.shiftKey || options.modifier === 'none') {
    return false
  }
  return options.alternateBuffer
}

/**
 * 滚轮策略：shell 里滚历史缓冲；仅备用屏才把滚轮发给 PTY。
 * 按住 Shift 时始终原生滚动。
 */
export function attachWheelScrollGuard(
  hostEl: HTMLElement,
  options: {
    modifier: () => RsTerminalWheelScrollModifier
    inputEnabled: () => boolean
    onArrowKeys: (data: string) => void
    isAlternateBuffer?: () => boolean
  },
): () => void {
  const viewport =
    hostEl.querySelector<HTMLElement>('.xterm-scrollable-element') ??
    hostEl.querySelector<HTMLElement>('.xterm-viewport')
  if (!viewport) {
    return () => undefined
  }

  const handler = (ev: WheelEvent): void => {
    if (
      !shouldConvertWheelToArrowKeys({
        modifier: options.modifier(),
        shiftKey: ev.shiftKey,
        alternateBuffer: options.isAlternateBuffer?.() ?? false,
      })
    ) {
      return
    }
    ev.preventDefault()
    ev.stopImmediatePropagation()
    if (!options.inputEnabled() || ev.deltaY === 0) {
      return
    }
    const steps = Math.min(5, Math.max(1, Math.round(Math.abs(ev.deltaY) / 40)))
    const seq = ev.deltaY > 0 ? '\x1b[B' : '\x1b[A'
    options.onArrowKeys(seq.repeat(steps))
  }

  viewport.addEventListener('wheel', handler, { capture: true, passive: false })
  return () => {
    viewport.removeEventListener('wheel', handler, { capture: true })
  }
}
