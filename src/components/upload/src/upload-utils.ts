export interface RsUploadValidationRules {
  accept?: string
  maxSize?: number
  maxCount?: number
}

export interface RsUploadValidationError {
  file: File
  reason: 'accept' | 'maxSize' | 'maxCount'
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
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

/** 触发浏览器下载指定 File / Blob */
export function downloadUploadFile(file: File | Blob, filename?: string): void {
  const name = filename || (file instanceof File ? file.name : 'download')
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
