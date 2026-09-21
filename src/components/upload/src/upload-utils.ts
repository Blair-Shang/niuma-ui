export interface RsUploadValidationRules {
  accept?: string
  maxSize?: number
  maxCount?: number
}

export interface RsUploadValidationError {
  file: File
  reason: 'accept' | 'maxSize' | 'maxCount'
}

export type RsUploadListType = 'text' | 'picture' | 'picture-card'

export type RsUploadVariant = 'dropzone' | 'button'

export type RsUploadCapture = boolean | 'user' | 'environment'

export type RsUploadBeforeSelect = (
  files: File[],
) => boolean | File[] | Promise<boolean | File[]>

export type RsUploadBeforeRemove = (
  file: File,
  index: number,
) => boolean | Promise<boolean>

export function formatFileSize(size: number, locale?: string): string {
  const abs = Number.isFinite(size) ? Math.max(0, size) : 0
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = abs
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  if (unit === 0) return `${Math.round(value)} B`
  const formatted = locale
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
    : value.toFixed(1)
  return `${formatted} ${units[unit]}`
}

export function isFileAccepted(file: File, accept?: string): boolean {
  if (!accept) return true
  const rules = accept.split(',').map((item) => item.trim()).filter(Boolean)
  return rules.some((rule) => {
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule.toLowerCase())
    if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

export function validateUploadFiles(
  files: readonly File[],
  rules: RsUploadValidationRules = {},
): { accepted: File[]; rejected: RsUploadValidationError[] } {
  const accepted: File[] = []
  const rejected: RsUploadValidationError[] = []
  for (const file of files) {
    if (rules.maxCount && accepted.length >= rules.maxCount) {
      rejected.push({ file, reason: 'maxCount' })
    } else if (!isFileAccepted(file, rules.accept)) {
      rejected.push({ file, reason: 'accept' })
    } else if (rules.maxSize && file.size > rules.maxSize) {
      rejected.push({ file, reason: 'maxSize' })
    } else {
      accepted.push(file)
    }
  }
  return { accepted, rejected }
}

export function mergeUploadFiles(current: readonly File[], next: readonly File[], maxCount?: number): File[] {
  const merged = [...current, ...next]
  return maxCount ? merged.slice(0, maxCount) : merged
}

export function removeUploadFileAt(files: readonly File[], index: number): File[] {
  return files.filter((_, currentIndex) => currentIndex !== index)
}

export function isSameUploadFile(left: Pick<File, 'name' | 'size' | 'lastModified' | 'type'>, right: Pick<File, 'name' | 'size' | 'lastModified' | 'type'>): boolean {
  return (
    left.name === right.name
    && left.size === right.size
    && left.lastModified === right.lastModified
    && left.type === right.type
  )
}

export function skipDuplicateUploadFiles(current: readonly File[], incoming: readonly File[]): File[] {
  return incoming.filter((file) => !current.some((item) => isSameUploadFile(item, file)))
}

export function resolveUploadCapture(capture?: RsUploadCapture): 'user' | 'environment' | undefined {
  if (capture === true) return 'environment'
  if (capture === 'user' || capture === 'environment') return capture
  return undefined
}

export function isImageUploadFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (file.type.startsWith('image/')) return true
  return resolveUploadFileIcon(file) === 'file-image'
}

type FileSystemEntryLike = {
  isFile: boolean
  isDirectory: boolean
  file?: (success: (file: File) => void, error?: (err: DOMException) => void) => void
  createReader?: () => {
    readEntries: (
      success: (entries: FileSystemEntryLike[]) => void,
      error?: (err: DOMException) => void,
    ) => void
  }
}

function asFileSystemEntry(item: DataTransferItem): FileSystemEntryLike | null {
  const getter = (item as DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntryLike | null
  }).webkitGetAsEntry
  if (typeof getter !== 'function') return null
  return getter.call(item)
}

export function droppedDataHasDirectory(data: DataTransfer | null | undefined): boolean {
  const items = data?.items
  if (!items?.length) return false
  return Array.from(items).some((item) => asFileSystemEntry(item)?.isDirectory)
}

function readFileEntry(entry: FileSystemEntryLike): Promise<File | null> {
  return new Promise((resolve) => {
    if (!entry.file) {
      resolve(null)
      return
    }
    entry.file((file) => resolve(file), () => resolve(null))
  })
}

function readDirectoryEntries(entry: FileSystemEntryLike): Promise<FileSystemEntryLike[]> {
  const reader = entry.createReader?.()
  if (!reader) return Promise.resolve([])
  const collected: FileSystemEntryLike[] = []
  return new Promise((resolve) => {
    const pump = (): void => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(collected)
          return
        }
        collected.push(...batch)
        pump()
      }, () => resolve(collected))
    }
    pump()
  })
}

async function collectEntryFiles(entry: FileSystemEntryLike, output: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await readFileEntry(entry)
    if (file) output.push(file)
    return
  }
  if (!entry.isDirectory) return
  const children = await readDirectoryEntries(entry)
  for (const child of children) {
    await collectEntryFiles(child, output)
  }
}

/** 读取拖入的 File。文件夹走 webkitGetAsEntry；否则回退 dataTransfer.files。 */
export async function collectDroppedFiles(data: DataTransfer | null | undefined): Promise<File[]> {
  if (!data) return []
  const fromList = Array.from(data.files ?? [])
  const items = data.items
  if (!items?.length) return fromList
  const entries = Array.from(items)
    .map((item) => asFileSystemEntry(item))
    .filter((entry): entry is FileSystemEntryLike => Boolean(entry))
  if (!entries.length) return fromList
  const files: File[] = []
  for (const entry of entries) {
    await collectEntryFiles(entry, files)
  }
  return files.length ? files : fromList
}

export function nextUploadPreviewUrls(
  current: ReadonlyMap<File, string>,
  files: readonly File[],
  enabled: boolean,
  createUrl: (file: Blob) => string,
): { next: Map<File, string>; revoked: string[] } {
  const live = new Set(files)
  const next = new Map<File, string>()
  const revoked: string[] = []
  if (!enabled) {
    revoked.push(...current.values())
    return { next, revoked }
  }
  for (const [file, url] of current) {
    if (live.has(file)) next.set(file, url)
    else revoked.push(url)
  }
  for (const file of files) {
    if (!isImageUploadFile(file) || next.has(file)) continue
    const url = createUrl(file)
    if (url) next.set(file, url)
  }
  return { next, revoked }
}

export function pruneBrokenUploadPreview(broken: ReadonlySet<File>, files: readonly File[]): Set<File> {
  const live = new Set(files)
  return new Set([...broken].filter((file) => live.has(file)))
}

export function createUploadObjectUrl(file: Blob): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return ''
  return URL.createObjectURL(file)
}

export function revokeUploadObjectUrl(url: string | undefined | null): void {
  if (!url || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return
  URL.revokeObjectURL(url)
}

/** 触发浏览器下载指定 File / Blob。无 document 时空操作。延迟 revoke，避免下载被中断。 */
export function downloadUploadFile(file: File | Blob, filename?: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  const name = filename || (file instanceof File ? file.name : 'download')
  const url = createUploadObjectUrl(file)
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  if (typeof window === 'undefined') {
    revokeUploadObjectUrl(url)
    return
  }
  window.setTimeout(() => revokeUploadObjectUrl(url), 1500)
}

/** 将文本等内容还原为可回显的 File（编辑态回填） */
export function createUploadFileFromContent(
  name: string,
  content: BlobPart,
  type = 'application/octet-stream',
): File {
  return new File([content], name, { type })
}

/** 扩展名 → Lucide 图标名（kebab-case） */
const UPLOAD_EXT_ICON: Record<string, string> = {
  // 证书 / 密钥
  pem: 'file-key',
  crt: 'file-key',
  cer: 'file-key',
  key: 'key-round',
  p12: 'file-lock',
  pfx: 'file-lock',
  // 文本 / 文档
  txt: 'file-text',
  md: 'file-text',
  markdown: 'file-text',
  log: 'file-text',
  pdf: 'file-type',
  doc: 'file-text',
  docx: 'file-text',
  rtf: 'file-text',
  // 表格
  csv: 'file-spreadsheet',
  xls: 'file-spreadsheet',
  xlsx: 'file-spreadsheet',
  // 代码 / 配置
  json: 'file-braces',
  yaml: 'file-code',
  yml: 'file-code',
  xml: 'file-code',
  html: 'file-code',
  htm: 'file-code',
  css: 'file-code',
  scss: 'file-code',
  js: 'file-code',
  mjs: 'file-code',
  cjs: 'file-code',
  ts: 'file-code',
  tsx: 'file-code',
  jsx: 'file-code',
  vue: 'file-code',
  go: 'file-code',
  py: 'file-code',
  java: 'file-code',
  rs: 'file-code',
  sql: 'file-terminal',
  sh: 'file-terminal',
  bat: 'file-terminal',
  ps1: 'file-terminal',
  // 图片
  png: 'file-image',
  jpg: 'file-image',
  jpeg: 'file-image',
  gif: 'file-image',
  webp: 'file-image',
  svg: 'file-image',
  bmp: 'file-image',
  ico: 'file-image',
  // 音视频
  mp3: 'file-music',
  wav: 'file-music',
  flac: 'file-music',
  aac: 'file-music',
  mp4: 'file-video-camera',
  webm: 'file-video-camera',
  mov: 'file-video-camera',
  avi: 'file-video-camera',
  // 压缩包
  zip: 'file-archive',
  rar: 'file-archive',
  '7z': 'file-archive',
  tar: 'file-archive',
  gz: 'file-archive',
  tgz: 'file-archive',
}

/** MIME 前缀 → Lucide 图标名（扩展名未知时回退） */
const UPLOAD_MIME_ICON: Array<{ prefix: string; icon: string }> = [
  { prefix: 'image/', icon: 'file-image' },
  { prefix: 'audio/', icon: 'file-music' },
  { prefix: 'video/', icon: 'file-video-camera' },
  { prefix: 'text/', icon: 'file-text' },
  { prefix: 'application/pdf', icon: 'file-type' },
  { prefix: 'application/json', icon: 'file-braces' },
  { prefix: 'application/zip', icon: 'file-archive' },
  { prefix: 'application/x-tar', icon: 'file-archive' },
  { prefix: 'application/gzip', icon: 'file-archive' },
]

/**
 * 按文件名扩展名 / MIME 解析列表图标（Lucide kebab-case）。
 * 未匹配时返回 `file`。
 */
export function resolveUploadFileIcon(file: Pick<File, 'name' | 'type'> | string): string {
  const name = typeof file === 'string' ? file : file.name
  const mime = typeof file === 'string' ? '' : file.type || ''
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  if (ext && UPLOAD_EXT_ICON[ext]) return UPLOAD_EXT_ICON[ext]
  const byMime = UPLOAD_MIME_ICON.find((item) => mime.startsWith(item.prefix))
  if (byMime) return byMime.icon
  return 'file'
}
