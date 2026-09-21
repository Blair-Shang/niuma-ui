<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useId, watch } from 'vue'
import type { RsComponentSize } from '../../../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../../../theme/types'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext, useRsFormField } from '../../form/src/form-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  collectDroppedFiles,
  createUploadObjectUrl,
  downloadUploadFile,
  droppedDataHasDirectory,
  formatFileSize,
  mergeUploadFiles,
  nextUploadPreviewUrls,
  pruneBrokenUploadPreview,
  removeUploadFileAt,
  resolveUploadCapture,
  resolveUploadFileIcon,
  revokeUploadObjectUrl,
  skipDuplicateUploadFiles,
  validateUploadFiles,
  type RsUploadBeforeRemove,
  type RsUploadBeforeSelect,
  type RsUploadCapture,
  type RsUploadListType,
  type RsUploadVariant,
} from './upload-utils'

/**
 * 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsUpload>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsUploadExpose {
  open: () => void
  focus: () => void
  blur: () => void
  clear: () => void
}

export type RsUploadInstance = RsUploadExpose & { $el: HTMLElement }

export type {
  RsUploadBeforeRemove,
  RsUploadBeforeSelect,
  RsUploadCapture,
  RsUploadListType,
  RsUploadVariant,
}

defineOptions({ name: 'RsUpload' })

const model = defineModel<File[]>({ default: () => [] })

const props = withDefaults(
  defineProps<{
    accept?: string
    multiple?: boolean
    maxSize?: number
    maxCount?: number
    disabled?: boolean
    label?: string
    hint?: string
    /** 是否展示已选文件列表 */
    showFileList?: boolean
    /** 文件行是否显示下载按钮 */
    showDownload?: boolean
    /** 达到 maxCount 后隐藏拖拽区（仅保留列表） */
    hideDropzoneWhenFull?: boolean
    size?: RsComponentSize
    id?: string
    /** 向 Form 注册字段。不写到原生 file input（选完会清空，不能靠它提交）。 */
    name?: string
    ariaLabel?: string
    listType?: RsUploadListType
    variant?: RsUploadVariant
    directory?: boolean
    capture?: RsUploadCapture
    /** 新文件覆盖已有列表，而不是追加 */
    replace?: boolean
    /** 焦点在控件上时允许从剪贴板粘贴文件 */
    paste?: boolean
    skipDuplicate?: boolean
    showPreview?: boolean
    beforeSelect?: RsUploadBeforeSelect
    beforeRemove?: RsUploadBeforeRemove
  }>(),
  {
    multiple: false,
    disabled: false,
    showFileList: true,
    showDownload: false,
    hideDropzoneWhenFull: false,
    listType: 'text',
    variant: 'dropzone',
    directory: false,
    replace: false,
    paste: true,
    skipDuplicate: false,
    showPreview: false,
  },
)

const emit = defineEmits<{
  reject: [errors: ReturnType<typeof validateUploadFiles>['rejected']]
  download: [file: File, index: number]
  remove: [file: File, index: number]
  change: [files: File[]]
  preview: [file: File, index: number]
}>()

const { t, locale } = useRsI18n()
const formContext = useRsFormContext()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const autoId = useId()
const listLabelId = useId()
const inputRef = shallowRef<HTMLInputElement | null>(null)
const triggerRef = shallowRef<HTMLButtonElement | null>(null)
const dragging = shallowRef(false)
const dragDepth = shallowRef(0)
const previewUrls = shallowRef(new Map<File, string>())
const brokenPreview = shallowRef(new Set<File>())
let applySeq = 0
let removeSeq = 0
let dragResetBound = false

const inputId = computed(() => props.id || autoId)
const resolvedDisabled = computed(() => props.disabled || Boolean(formContext?.disabled.value))
const allowMultiple = computed(() => props.multiple || props.directory)
const canAdd = computed(() => !props.maxCount || model.value.length < props.maxCount)
const isDropzoneDisabled = computed(() => resolvedDisabled.value || !canAdd.value)
const showDropzone = computed(
  () => !(props.hideDropzoneWhenFull && props.maxCount != null && model.value.length >= props.maxCount),
)
const isPictureCard = computed(() => props.listType === 'picture-card')
const showPicturePreview = computed(() => props.showPreview || props.listType !== 'text')
const showBlockDropzone = computed(
  () => showDropzone.value && props.variant === 'dropzone' && !isPictureCard.value,
)
const showAddTile = computed(
  () => showDropzone.value && props.variant === 'dropzone' && isPictureCard.value,
)
const showButton = computed(() => props.variant === 'button')
const resolvedHint = computed(() => {
  if (dragging.value && !isDropzoneDisabled.value) return t('upload.dropActive')
  return props.hint ?? t('upload.browse')
})
const resolvedCapture = computed(() => resolveUploadCapture(props.capture))
const inputExtraAttrs = computed(() => {
  const attrs: Record<string, string> = {}
  if (props.directory) {
    attrs.webkitdirectory = ''
    attrs.directory = ''
  }
  if (resolvedCapture.value) attrs.capture = resolvedCapture.value
  return attrs
})
const dropIconPx = computed(() => {
  const map: Record<RsComponentSize, number> = { ssm: 16, sm: 18, md: 22, lg: 26 }
  return map[resolvedSize.value]
})
const fileIconPx = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const fileViews = computed(() =>
  model.value.map((file, index) => {
    const icon = resolveUploadFileIcon(file)
    const previewUrl = previewUrls.value.get(file)
    const broken = brokenPreview.value.has(file)
    return {
      file,
      index,
      key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      icon,
      image: Boolean(previewUrl) && !broken,
      previewUrl,
      sizeText: formatFileSize(file.size, locale.value),
    }
  }),
)
const rootClass = computed(() => [
  'rs-upload',
  `rs-upload--${resolvedSize.value}`,
  `rs-upload--${props.variant}`,
  `rs-upload--${props.listType}`,
  {
    'rs-upload--disabled': resolvedDisabled.value,
    'rs-upload--full': !canAdd.value,
  },
])

function setFieldValue(value: unknown): void {
  model.value = Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : []
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue: setFieldValue,
}))

function commit(next: File[]): void {
  model.value = next
  emit('change', next)
}

function applyFiles(files: File[]): void {
  if (!files.length || isDropzoneDisabled.value) return
  let incoming = props.skipDuplicate ? skipDuplicateUploadFiles(model.value, files) : [...files]
  if (!incoming.length) return
  const hook = props.beforeSelect
  if (!hook) {
    commitIncoming(incoming)
    return
  }
  const seq = (applySeq += 1)
  Promise.resolve(hook(incoming)).then((next) => {
    if (seq !== applySeq) return
    if (next === false) return
    commitIncoming(Array.isArray(next) ? next : incoming)
  })
}

function commitIncoming(incoming: File[]): void {
  if (!incoming.length || isDropzoneDisabled.value) return
  const current = props.replace ? [] : model.value
  const result = validateUploadFiles(incoming, {
    accept: props.accept,
    maxSize: props.maxSize,
    maxCount: props.maxCount ? props.maxCount - current.length : undefined,
  })
  const next = mergeUploadFiles(current, result.accepted, props.maxCount)
  commit(next)
  if (result.rejected.length) emit('reject', result.rejected)
}

function onFilesChange(event: Event): void {
  const input = event.target as HTMLInputElement
  applyFiles(Array.from(input.files ?? []))
  input.value = ''
}

function resetDrag(): void {
  dragDepth.value = 0
  dragging.value = false
  unbindDragReset()
}

function bindDragReset(): void {
  if (typeof window === 'undefined' || dragResetBound) return
  window.addEventListener('dragend', resetDrag)
  window.addEventListener('blur', resetDrag)
  dragResetBound = true
}

function unbindDragReset(): void {
  if (typeof window === 'undefined' || !dragResetBound) return
  window.removeEventListener('dragend', resetDrag)
  window.removeEventListener('blur', resetDrag)
  dragResetBound = false
}

function onDragEnter(event: DragEvent): void {
  event.preventDefault()
  if (isDropzoneDisabled.value) return
  dragDepth.value += 1
  dragging.value = true
  bindDragReset()
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = isDropzoneDisabled.value ? 'none' : 'copy'
}

function onDragLeave(event: DragEvent): void {
  event.preventDefault()
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) resetDrag()
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  resetDrag()
  if (isDropzoneDisabled.value) return
  const data = event.dataTransfer
  if (droppedDataHasDirectory(data)) {
    void collectDroppedFiles(data).then(applyFiles)
    return
  }
  applyFiles(Array.from(data?.files ?? []))
}

function onPaste(event: ClipboardEvent): void {
  if (!props.paste || isDropzoneDisabled.value) return
  const files = Array.from(event.clipboardData?.files ?? [])
  if (!files.length) return
  event.preventDefault()
  applyFiles(files)
}

function commitRemove(file: File, index: number): void {
  commit(removeUploadFileAt(model.value, index))
  emit('remove', file, index)
}

function removeFile(index: number): void {
  const file = model.value[index]
  if (!file || resolvedDisabled.value) return
  const hook = props.beforeRemove
  if (!hook) {
    commitRemove(file, index)
    return
  }
  const seq = (removeSeq += 1)
  Promise.resolve(hook(file, index)).then((ok) => {
    if (seq !== removeSeq) return
    if (ok === false) return
    const nextIndex = model.value.indexOf(file)
    if (nextIndex < 0) return
    commitRemove(file, nextIndex)
  })
}

function onDownload(file: File, index: number): void {
  emit('download', file, index)
  downloadUploadFile(file)
}

function onPreview(file: File, index: number): void {
  emit('preview', file, index)
}

function markBroken(file: File): void {
  if (brokenPreview.value.has(file)) return
  const next = new Set(brokenPreview.value)
  next.add(file)
  brokenPreview.value = next
}

function open(): void {
  if (isDropzoneDisabled.value) return
  inputRef.value?.click()
}

function focus(): void {
  if (props.variant === 'button') {
    triggerRef.value?.focus()
    return
  }
  inputRef.value?.focus()
}

function blur(): void {
  triggerRef.value?.blur()
  inputRef.value?.blur()
}

function clear(): void {
  if (!model.value.length) return
  commit([])
}

function syncPreviewUrls(files: readonly File[]): void {
  const { next, revoked } = nextUploadPreviewUrls(
    previewUrls.value,
    files,
    showPicturePreview.value,
    createUploadObjectUrl,
  )
  for (const url of revoked) revokeUploadObjectUrl(url)
  previewUrls.value = next
  brokenPreview.value = pruneBrokenUploadPreview(brokenPreview.value, files)
}

watch(
  [model, showPicturePreview],
  () => {
    syncPreviewUrls(model.value)
  },
  { immediate: true },
)

onUnmounted(() => {
  applySeq += 1
  removeSeq += 1
  unbindDragReset()
  for (const url of previewUrls.value.values()) revokeUploadObjectUrl(url)
  previewUrls.value = new Map()
  brokenPreview.value = new Set()
})

defineExpose<RsUploadExpose>({
  open,
  focus,
  blur,
  clear,
})
</script>

<template>
  <div
    :class="rootClass"
    :aria-disabled="resolvedDisabled ? 'true' : undefined"
    @paste="onPaste"
  >
    <input
      :id="inputId"
      ref="inputRef"
      class="rs-upload__input"
      type="file"
      :accept="accept"
      :multiple="allowMultiple"
      :disabled="isDropzoneDisabled"
      :aria-label="ariaLabel || label || t('upload.label')"
      v-bind="inputExtraAttrs"
      @change="onFilesChange"
    >

    <label
      v-if="showBlockDropzone"
      class="rs-upload__dropzone"
      :class="{
        'rs-upload__dropzone--disabled': isDropzoneDisabled,
        'rs-upload__dropzone--dragging': dragging && !isDropzoneDisabled,
      }"
      :for="inputId"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <slot>
        <span class="rs-upload__icon" aria-hidden="true">
          <slot name="icon">
            <RsIcon name="cloud-upload" :size="dropIconPx" />
          </slot>
        </span>
        <span class="rs-upload__text">
          <span class="rs-upload__label">{{ label ?? t('upload.label') }}</span>
          <span class="rs-upload__hint">
            <slot name="hint">{{ resolvedHint }}</slot>
          </span>
        </span>
        <slot name="extra" />
      </slot>
    </label>

    <button
      v-if="showButton"
      ref="triggerRef"
      type="button"
      class="rs-upload__trigger"
      :disabled="isDropzoneDisabled"
      :aria-label="ariaLabel || label || t('upload.button')"
      @click="open"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <slot>
        <RsIcon name="upload" :size="fileIconPx" />
        <span>{{ label ?? t('upload.button') }}</span>
      </slot>
    </button>

    <ul
      v-if="showFileList && (fileViews.length || showAddTile)"
      :id="listLabelId"
      class="rs-upload__list"
      :aria-label="t('upload.fileList')"
    >
      <li
        v-for="view in fileViews"
        :key="view.key"
        class="rs-upload__file"
        :class="{ 'rs-upload__file--card': isPictureCard }"
      >
        <slot name="file" :file="view.file" :index="view.index">
          <button
            v-if="showPicturePreview && view.image"
            type="button"
            class="rs-upload__thumb"
            :aria-label="t('upload.preview')"
            :title="t('upload.preview')"
            @click.stop="onPreview(view.file, view.index)"
          >
            <img
              class="rs-upload__thumb-img"
              :src="view.previewUrl"
              :alt="view.file.name"
              @error="markBroken(view.file)"
            >
          </button>
          <span
            v-else
            class="rs-upload__file-icon"
            :class="`rs-upload__file-icon--${view.icon}`"
            aria-hidden="true"
          >
            <slot name="file-icon" :file="view.file" :index="view.index">
              <RsIcon :name="view.icon" :size="fileIconPx" />
            </slot>
          </span>
          <span v-if="!isPictureCard" class="rs-upload__file-meta">
            <span class="rs-upload__file-name">{{ view.file.name }}</span>
            <span class="rs-upload__file-size">{{ view.sizeText }}</span>
          </span>
          <span v-else class="rs-upload__file-name rs-upload__file-name--card">{{ view.file.name }}</span>
          <span class="rs-upload__file-actions">
            <button
              v-if="showDownload"
              type="button"
              class="rs-upload__file-action"
              :aria-label="t('upload.download')"
              :title="t('upload.download')"
              @click.stop="onDownload(view.file, view.index)"
            >
              <RsIcon name="download" :size="fileIconPx" />
            </button>
            <button
              v-if="!resolvedDisabled"
              type="button"
              class="rs-upload__file-remove"
              :aria-label="t('common.remove')"
              @click.stop="removeFile(view.index)"
            >
              <RsIcon name="x" :size="fileIconPx" />
            </button>
          </span>
        </slot>
      </li>
      <li v-if="showAddTile" class="rs-upload__file rs-upload__file--card rs-upload__file--add">
        <label
          class="rs-upload__dropzone rs-upload__dropzone--tile"
          :class="{
            'rs-upload__dropzone--disabled': isDropzoneDisabled,
            'rs-upload__dropzone--dragging': dragging && !isDropzoneDisabled,
          }"
          :for="inputId"
          @dragenter="onDragEnter"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <slot>
            <span class="rs-upload__icon" aria-hidden="true">
              <slot name="icon">
                <RsIcon name="plus" :size="dropIconPx" />
              </slot>
            </span>
            <span class="rs-upload__label">{{ label ?? t('upload.add') }}</span>
          </slot>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rs-upload {
  position: relative;
  display: grid;
  gap: var(--rs-upload-gap);
}

.rs-upload--ssm {
  --rs-upload-dropzone-min-height: 5.5rem;
  --rs-upload-icon-box: 2.25rem;
  --rs-upload-card-size: 5rem;
}

.rs-upload--sm {
  --rs-upload-dropzone-min-height: 7rem;
  --rs-upload-icon-box: 2.5rem;
  --rs-upload-card-size: 5.75rem;
}

.rs-upload--md {
  --rs-upload-dropzone-min-height: var(--rs-upload-dropzone-min-height-md);
  --rs-upload-icon-box: var(--rs-upload-icon-box-md);
  --rs-upload-card-size: var(--rs-upload-card-size-md);
}

.rs-upload--lg {
  --rs-upload-dropzone-min-height: 10rem;
  --rs-upload-icon-box: 3.5rem;
  --rs-upload-card-size: 7.5rem;
}

.rs-upload__dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--rs-space-md);
  min-height: var(--rs-upload-dropzone-min-height);
  padding-block: var(--rs-space-xl);
  padding-inline: var(--rs-space-lg);
  border: 1px dashed var(--rs-upload-border);
  border-radius: var(--rs-upload-radius);
  background: var(--rs-upload-bg);
  cursor: pointer;
  text-align: center;
  transition:
    border-color var(--rs-transition-fast),
    background var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-upload__dropzone:hover:not(.rs-upload__dropzone--disabled),
.rs-upload__dropzone--dragging:not(.rs-upload__dropzone--disabled) {
  border-color: var(--rs-upload-border-active);
  background: var(--rs-upload-bg-active);
}

.rs-upload__dropzone:focus-within:not(.rs-upload__dropzone--disabled) {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-upload__dropzone--disabled {
  opacity: var(--rs-upload-disabled-opacity);
  cursor: not-allowed;
}

.rs-upload__dropzone--tile {
  min-height: var(--rs-upload-card-size);
  inline-size: var(--rs-upload-card-size);
  padding-block: var(--rs-space-sm);
  padding-inline: var(--rs-space-sm);
}

.rs-upload__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-upload__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--rs-upload-icon-box);
  height: var(--rs-upload-icon-box);
  border-radius: var(--rs-radius-full);
  border: 1px solid color-mix(in srgb, var(--rs-primary) 24%, var(--rs-border));
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
  box-shadow: var(--rs-shadow-sm);
  transition:
    transform var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-upload__dropzone:hover:not(.rs-upload__dropzone--disabled) .rs-upload__icon,
.rs-upload__dropzone--dragging:not(.rs-upload__dropzone--disabled) .rs-upload__icon {
  transform: translateY(-1px);
  box-shadow: var(--rs-shadow);
}

.rs-upload__text {
  display: grid;
  gap: var(--rs-space-xs);
  max-inline-size: 20rem;
}

.rs-upload__label {
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-upload__hint {
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.rs-upload__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--rs-space-sm);
  min-height: var(--rs-control-height-md);
  padding-inline: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-sm);
  cursor: pointer;
  transition:
    border-color var(--rs-transition-fast),
    background var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-upload--ssm .rs-upload__trigger {
  min-height: var(--rs-control-height-ssm);
}

.rs-upload--sm .rs-upload__trigger {
  min-height: var(--rs-control-height-sm);
}

.rs-upload--lg .rs-upload__trigger {
  min-height: var(--rs-control-height-lg);
}

.rs-upload__trigger:hover:not(:disabled) {
  border-color: var(--rs-upload-border-active);
  background: var(--rs-upload-bg-active);
}

.rs-upload__trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-upload__trigger:disabled {
  opacity: var(--rs-upload-disabled-opacity);
  cursor: not-allowed;
}

.rs-upload__list {
  display: grid;
  gap: var(--rs-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-upload--picture-card .rs-upload__list {
  grid-template-columns: repeat(auto-fill, minmax(var(--rs-upload-card-size), 1fr));
  gap: var(--rs-space-sm);
}

.rs-upload__file {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  padding-block: var(--rs-space-sm);
  padding-inline: var(--rs-space-md);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  transition:
    border-color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-upload__file:hover {
  border-color: var(--rs-border);
  background: color-mix(in srgb, var(--rs-surface-hover) 35%, var(--rs-surface));
}

.rs-upload__file--card {
  position: relative;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-end;
  min-block-size: var(--rs-upload-card-size);
  padding: 0;
  overflow: hidden;
}

.rs-upload__file--add {
  border-style: dashed;
  background: transparent;
}

.rs-upload__file--add:hover {
  background: transparent;
}

.rs-upload__file-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--rs-upload-file-icon-size);
  height: var(--rs-upload-file-icon-size);
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border-subtle);
  background: color-mix(in srgb, var(--rs-bg) 55%, var(--rs-surface));
  color: var(--rs-text-secondary);
}

.rs-upload__file-icon--file-image,
.rs-upload__file-icon--file-music,
.rs-upload__file-icon--file-video-camera {
  color: var(--rs-info);
}

.rs-upload__file-icon--file-code,
.rs-upload__file-icon--file-braces,
.rs-upload__file-icon--file-terminal {
  color: var(--rs-primary);
}

.rs-upload__file-icon--file-key,
.rs-upload__file-icon--key-round,
.rs-upload__file-icon--file-lock {
  color: var(--rs-warning);
}

.rs-upload__file-icon--file-archive {
  color: var(--rs-primary);
}

.rs-upload__file-icon--file-spreadsheet {
  color: var(--rs-success);
}

.rs-upload__file-icon--file-type,
.rs-upload__file-icon--file-text {
  color: var(--rs-danger);
}

.rs-upload__thumb {
  display: block;
  flex-shrink: 0;
  width: var(--rs-upload-file-icon-size);
  height: var(--rs-upload-file-icon-size);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-bg);
  cursor: pointer;
}

.rs-upload__file--card .rs-upload__thumb,
.rs-upload__file--card .rs-upload__file-icon {
  width: 100%;
  height: var(--rs-upload-card-size);
  border: 0;
  border-radius: 0;
}

.rs-upload__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rs-upload__file-meta {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.rs-upload__file-name {
  overflow: hidden;
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-upload__file-name--card {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  background: color-mix(in srgb, var(--rs-bg) 72%, transparent);
  font-size: var(--rs-font-size-xs);
}

.rs-upload__file-size {
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.rs-upload__file-actions {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--rs-space-xs);
}

.rs-upload__file--card .rs-upload__file-actions {
  position: absolute;
  inset-block-start: var(--rs-space-xs);
  inset-inline-end: var(--rs-space-xs);
}

.rs-upload__file-action,
.rs-upload__file-remove {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--rs-upload-action-size);
  height: var(--rs-upload-action-size);
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-text-secondary);
  cursor: pointer;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-upload__file-action:hover,
.rs-upload__file-remove:hover {
  background: var(--rs-item-hover);
  color: var(--rs-text-primary);
}

.rs-upload__file-action:focus-visible,
.rs-upload__file-remove:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .rs-upload__dropzone,
  .rs-upload__icon,
  .rs-upload__trigger,
  .rs-upload__file,
  .rs-upload__file-action,
  .rs-upload__file-remove {
    transition: none;
  }

  .rs-upload__dropzone:hover:not(.rs-upload__dropzone--disabled) .rs-upload__icon,
  .rs-upload__dropzone--dragging:not(.rs-upload__dropzone--disabled) .rs-upload__icon {
    transform: none;
  }
}
</style>
