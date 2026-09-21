import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsForm from '../../form/src/RsForm.vue'
import RsUpload from '../src/RsUpload.vue'
import {
  formatFileSize,
  isFileAccepted,
  isSameUploadFile,
  mergeUploadFiles,
  removeUploadFileAt,
  resolveUploadCapture,
  resolveUploadFileIcon,
  nextUploadPreviewUrls,
  skipDuplicateUploadFiles,
  validateUploadFiles,
} from '../src/upload-utils'

function createFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type })
}

async function selectFiles(wrapper: ReturnType<typeof mount>, files: File[]): Promise<void> {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: files,
    configurable: true,
  })
  await input.trigger('change')
}

describe('upload-utils', () => {
  it('formats file sizes', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('formats file sizes with a locale', () => {
    expect(formatFileSize(1536, 'en-US')).toBe('1.5 KB')
  })

  it('matches accept rules by extension, mime type, and wildcard', () => {
    const txt = createFile('a.txt', 'x')
    const png = createFile('b.png', 'x', 'image/png')
    expect(isFileAccepted(txt, '.txt')).toBe(true)
    expect(isFileAccepted(txt, 'image/*')).toBe(false)
    expect(isFileAccepted(png, 'image/*')).toBe(true)
    expect(isFileAccepted(png, 'text/plain')).toBe(false)
  })

  it('validates accept, maxSize, and maxCount', () => {
    const small = createFile('small.txt', 'hi')
    const large = createFile('large.txt', 'x'.repeat(200))
    const invalidType = createFile('bad.pdf', 'x', 'application/pdf')

    expect(validateUploadFiles([invalidType], { accept: '.txt' }).rejected[0]?.reason).toBe('accept')
    expect(validateUploadFiles([large], { maxSize: 100 }).rejected[0]?.reason).toBe('maxSize')
    expect(
      validateUploadFiles([small, createFile('extra.txt', 'y')], { maxCount: 1 }).rejected[0]?.reason,
    ).toBe('maxCount')
  })

  it('merges and trims files by maxCount', () => {
    const first = createFile('a.txt', 'a')
    const second = createFile('b.txt', 'b')
    expect(mergeUploadFiles([first], [second], 1)).toHaveLength(1)
    expect(mergeUploadFiles([first], [second])).toHaveLength(2)
  })

  it('removes file at index', () => {
    const files = [createFile('a.txt', 'a'), createFile('b.txt', 'b')]
    expect(removeUploadFileAt(files, 0).map((file) => file.name)).toEqual(['b.txt'])
  })

  it('skips duplicate files and resolves capture', () => {
    const first = createFile('a.txt', 'a')
    const copy = new File(['a'], 'a.txt', { type: 'text/plain', lastModified: first.lastModified })
    const extra = createFile('b.txt', 'b')
    expect(isSameUploadFile(first, copy)).toBe(true)
    expect(skipDuplicateUploadFiles([first], [copy, extra])).toEqual([extra])
    expect(resolveUploadCapture(true)).toBe('environment')
    expect(resolveUploadCapture('user')).toBe('user')
    expect(resolveUploadCapture(false)).toBeUndefined()
  })

  it('syncs preview urls and revokes leftovers', () => {
    const image = createFile('a.png', 'x', 'image/png')
    const text = createFile('a.txt', 'x')
    const first = nextUploadPreviewUrls(new Map(), [image, text], true, () => 'blob:a')
    expect(first.next.get(image)).toBe('blob:a')
    expect(first.next.has(text)).toBe(false)
    const second = nextUploadPreviewUrls(first.next, [], true, () => 'blob:b')
    expect(second.revoked).toEqual(['blob:a'])
    expect(second.next.size).toBe(0)
  })

  it('resolves list icons by extension and mime', () => {
    expect(resolveUploadFileIcon('localhost.pem')).toBe('file-key')
    expect(resolveUploadFileIcon('localhost.key')).toBe('key-round')
    expect(resolveUploadFileIcon('photo.png')).toBe('file-image')
    expect(resolveUploadFileIcon('app.ts')).toBe('file-code')
    expect(resolveUploadFileIcon('data.xlsx')).toBe('file-spreadsheet')
    expect(resolveUploadFileIcon('pack.zip')).toBe('file-archive')
    expect(resolveUploadFileIcon(createFile('blob.bin', 'x', 'image/png'))).toBe('file-image')
    expect(resolveUploadFileIcon('unknown.xyz')).toBe('file')
  })
})

describe('RsUpload', () => {
  it('registers the public component name', () => {
    const wrapper = mount(RsUpload)
    expect(wrapper.vm.$options.name).toBe('RsUpload')
  })

  it('renders default en-US label', () => {
    const wrapper = mount(RsUpload)
    expect(wrapper.find('.rs-upload__label').text()).toBe('Click or drag files here to upload')
  })

  it('renders custom label and hint', () => {
    const wrapper = mount(RsUpload, {
      props: { label: '上传附件', hint: '仅 PDF' },
    })
    expect(wrapper.find('.rs-upload__label').text()).toBe('上传附件')
    expect(wrapper.find('.rs-upload__hint').text()).toBe('仅 PDF')
  })

  it('renders default browse hint when hint is omitted', () => {
    const wrapper = mount(RsUpload)
    expect(wrapper.find('.rs-upload__hint').text()).toBe('or click to browse files')
  })

  it('uses en-US label inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsUpload),
      },
    })
    expect(wrapper.find('.rs-upload__label').text()).toBe('Click or drag files here to upload')
  })

  it('accepts files and updates model', async () => {
    const wrapper = mount(RsUpload, {
      props: { modelValue: [] },
    })
    const file = createFile('demo.txt', 'hello')
    await selectFiles(wrapper, [file])
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([file])
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([file])
  })

  it('shows file list with formatted size', async () => {
    const file = createFile('demo.txt', 'hello')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [file] },
    })
    expect(wrapper.find('.rs-upload__file-name').text()).toBe('demo.txt')
    expect(wrapper.find('.rs-upload__file-size').text()).toBe(formatFileSize(file.size))
  })

  it('removes file from list', async () => {
    const first = createFile('a.txt', 'a')
    const second = createFile('b.txt', 'b')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [first, second] },
    })
    await wrapper.find('.rs-upload__file-remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([second])
    expect(wrapper.emitted('remove')?.[0]?.[0]).toBe(first)
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([second])
  })

  it('emits reject for invalid files', async () => {
    const wrapper = mount(RsUpload, {
      props: { modelValue: [], accept: '.txt' },
    })
    const invalid = createFile('image.png', 'x', 'image/png')
    await selectFiles(wrapper, [invalid])
    const reject = wrapper.emitted('reject')?.[0]?.[0] as Array<{ reason: string }>
    expect(reject?.[0]?.reason).toBe('accept')
  })

  it('disables input when disabled', () => {
    const wrapper = mount(RsUpload, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.rs-upload__dropzone').classes()).toContain('rs-upload__dropzone--disabled')
  })

  it('inherits Form.disabled', () => {
    const wrapper = mount(RsForm, {
      props: { disabled: true },
      slots: {
        default: () => h(RsUpload),
      },
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.rs-upload').classes()).toContain('rs-upload--disabled')
  })

  it('disables input when maxCount is reached', () => {
    const wrapper = mount(RsUpload, {
      props: {
        modelValue: [createFile('a.txt', 'a'), createFile('b.txt', 'b')],
        maxCount: 2,
      },
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.rs-upload__dropzone').classes()).toContain('rs-upload__dropzone--disabled')
  })

  it('hides file list when showFileList is false', () => {
    const wrapper = mount(RsUpload, {
      props: {
        modelValue: [createFile('a.txt', 'a')],
        showFileList: false,
      },
    })
    expect(wrapper.find('.rs-upload__list').exists()).toBe(false)
  })

  it('shows download action and emits download', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const file = createFile('a.txt', 'hello')
    const wrapper = mount(RsUpload, {
      props: {
        modelValue: [file],
        showDownload: true,
      },
    })
    expect(wrapper.find('.rs-upload__file-action').exists()).toBe(true)
    await wrapper.find('.rs-upload__file-action').trigger('click')
    expect(wrapper.emitted('download')?.[0]?.[0]).toBe(file)
    expect(createObjectURL).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('accepts dropped files', async () => {
    const wrapper = mount(RsUpload, {
      props: { modelValue: [] },
    })
    const file = createFile('drop.txt', 'x')
    await wrapper.find('.rs-upload__dropzone').trigger('drop', {
      dataTransfer: { files: [file] },
    })
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([file])
  })

  it('hides dropzone when full and hideDropzoneWhenFull', () => {
    const wrapper = mount(RsUpload, {
      props: {
        modelValue: [createFile('a.txt', 'a')],
        maxCount: 1,
        hideDropzoneWhenFull: true,
      },
    })
    expect(wrapper.find('.rs-upload__dropzone').exists()).toBe(false)
    expect(wrapper.find('.rs-upload__file-name').text()).toBe('a.txt')
  })

  it('replaces the list when replace is set', async () => {
    const first = createFile('old.txt', 'old')
    const next = createFile('new.txt', 'new')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [first], replace: true },
    })
    await selectFiles(wrapper, [next])
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([next])
  })

  it('skips duplicate files when skipDuplicate is set', async () => {
    const first = createFile('a.txt', 'a')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [first], skipDuplicate: true },
    })
    const copy = new File(['a'], 'a.txt', { type: 'text/plain', lastModified: first.lastModified })
    await selectFiles(wrapper, [copy])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders a button trigger', () => {
    const wrapper = mount(RsUpload, {
      props: { variant: 'button' },
    })
    expect(wrapper.find('.rs-upload__trigger').exists()).toBe(true)
    expect(wrapper.find('.rs-upload__dropzone').exists()).toBe(false)
  })

  it('renders picture-card add tile', () => {
    const wrapper = mount(RsUpload, {
      props: { listType: 'picture-card' },
    })
    expect(wrapper.find('.rs-upload__file--add').exists()).toBe(true)
    expect(wrapper.find('.rs-upload__dropzone--tile').exists()).toBe(true)
  })

  it('applies size class and directory attributes', () => {
    const wrapper = mount(RsUpload, {
      props: { size: 'sm', directory: true, capture: true },
    })
    expect(wrapper.find('.rs-upload').classes()).toContain('rs-upload--sm')
    expect(wrapper.find('input').attributes('multiple')).toBeDefined()
    expect(wrapper.find('input').attributes('webkitdirectory')).toBeDefined()
    expect(wrapper.find('input').attributes('capture')).toBe('environment')
  })

  it('exposes open, focus, blur, and clear', async () => {
    const file = createFile('a.txt', 'a')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [file] },
    })
    const exposed = wrapper.vm as unknown as {
      open: () => void
      focus: () => void
      blur: () => void
      clear: () => void
    }
    const input = wrapper.find('input').element as HTMLInputElement
    const click = vi.spyOn(input, 'click')
    exposed.open()
    expect(click).toHaveBeenCalled()
    exposed.clear()
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([])
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([])
    exposed.focus()
    exposed.blur()
  })

  it('emits preview from a picture thumb', async () => {
    const createObjectURL = vi.fn(() => 'blob:preview')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const file = createFile('photo.png', 'x', 'image/png')
    const wrapper = mount(RsUpload, {
      props: { modelValue: [file], listType: 'picture' },
    })
    await wrapper.find('.rs-upload__thumb').trigger('click')
    expect(wrapper.emitted('preview')?.[0]?.[0]).toBe(file)
    expect(createObjectURL).toHaveBeenCalled()

    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('revokes preview urls on unmount', () => {
    const createObjectURL = vi.fn(() => 'blob:preview')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const wrapper = mount(RsUpload, {
      props: {
        modelValue: [createFile('photo.png', 'x', 'image/png')],
        listType: 'picture-card',
      },
    })
    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('applies files from paste when focused', async () => {
    const wrapper = mount(RsUpload, {
      props: { modelValue: [], paste: true },
    })
    const file = createFile('paste.txt', 'x')
    await wrapper.find('.rs-upload').trigger('paste', {
      clipboardData: { files: [file] },
    })
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([file])
  })
})
