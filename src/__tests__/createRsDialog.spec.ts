import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import {
  destroyAllRsDialogHosts,
  openRsDialog,
  rsConfirm,
} from '../composables/createRsDialog'

describe('createRsDialog', () => {
  afterEach(() => {
    destroyAllRsDialogHosts()
  })

  it('rsConfirm resolves true when confirm clicked', async () => {
    const promise = rsConfirm({
      title: '删除？',
      description: '不可撤销',
      showOverlay: false,
    })
    await flushPromises()
    const confirmBtn = Array.from(document.body.querySelectorAll('.rs-confirm-dialog__footer button')).at(
      -1,
    ) as HTMLButtonElement
    expect(confirmBtn).toBeTruthy()
    confirmBtn.click()
    await flushPromises()
    await expect(promise).resolves.toBe(true)
  })

  it('rsConfirm resolves false when cancel clicked', async () => {
    const promise = rsConfirm({
      title: '取消测试',
      showOverlay: false,
    })
    await flushPromises()
    const cancelBtn = document.body.querySelector(
      '.rs-confirm-dialog__footer button',
    ) as HTMLButtonElement
    cancelBtn.click()
    await flushPromises()
    await expect(promise).resolves.toBe(false)
  })

  it('rsConfirm passes subtitle and width', async () => {
    const promise = rsConfirm({
      title: '删除？',
      subtitle: '不可恢复',
      description: '确定删除吗？',
      width: 500,
      showOverlay: false,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content') as HTMLElement
    expect(content?.textContent).toContain('不可恢复')
    expect(content?.textContent).toContain('确定删除吗？')
    expect(content.style.maxWidth).toBe('500px')
    const cancelBtn = document.body.querySelector(
      '.rs-confirm-dialog__footer button',
    ) as HTMLButtonElement
    cancelBtn.click()
    await flushPromises()
    await expect(promise).resolves.toBe(false)
  })

  it('rsConfirm waits for async onConfirm before resolving', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const promise = rsConfirm({
      title: '异步',
      showOverlay: false,
      onConfirm: () => gate,
    })
    await flushPromises()
    const confirmBtn = Array.from(document.body.querySelectorAll('.rs-confirm-dialog__footer button')).at(
      -1,
    ) as HTMLButtonElement
    confirmBtn.click()
    await flushPromises()
    expect(confirmBtn.getAttribute('disabled')).not.toBeNull()
    release()
    await flushPromises()
    await expect(promise).resolves.toBe(true)
  })

  it('destroy does not throw after portal node was removed', async () => {
    const handle = openRsDialog({
      title: '残留',
      showOverlay: false,
      body: () => 'portal',
    })
    await flushPromises()
    document.body.querySelector('.rs-dialog__content')?.closest('body > div')?.remove()
    expect(() => handle.destroy()).not.toThrow()
  })

  it('openRsDialog mounts builtin footer and can destroy', async () => {
    const handle = openRsDialog({
      title: '命令式',
      showOverlay: false,
      body: () => '临时内容',
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.textContent).toContain('命令式')
    expect(content?.classList.contains('rs-dialog__content--window')).toBe(true)
    expect(document.body.querySelector('.rs-dialog__footer')).not.toBeNull()
    handle.destroy()
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).toBeNull()
  })

  it('rsConfirm.info uses single confirm button', async () => {
    const promise = rsConfirm.info({
      title: '提示',
      description: '仅确认',
      showOverlay: false,
    })
    await flushPromises()
    const buttons = document.body.querySelectorAll('.rs-confirm-dialog__footer button')
    expect(buttons).toHaveLength(1)
    ;(buttons[0] as HTMLButtonElement).click()
    await flushPromises()
    await expect(promise).resolves.toBe(true)
  })

  it('rsConfirm.warning accepts string shorthand', async () => {
    const promise = rsConfirm.warning('确定删除吗？')
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.textContent).toContain('确定删除吗？')
    const cancelBtn = document.body.querySelector(
      '.rs-confirm-dialog__footer button',
    ) as HTMLButtonElement
    cancelBtn.click()
    await flushPromises()
    await expect(promise).resolves.toBe(false)
  })

  it('rsConfirm supports extra render content', async () => {
    const promise = rsConfirm({
      title: '带额外',
      description: '正文',
      showOverlay: false,
      extra: () => h('div', { class: 'extra-probe' }, 'list-item'),
    })
    await flushPromises()
    expect(document.body.querySelector('.extra-probe')?.textContent).toContain('list-item')
    const cancelBtn = document.body.querySelector(
      '.rs-confirm-dialog__footer button',
    ) as HTMLButtonElement
    cancelBtn.click()
    await flushPromises()
    await expect(promise).resolves.toBe(false)
  })
})
