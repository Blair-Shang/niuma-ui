<script setup lang="ts">
import { computed, ref } from 'vue'
import RsIcon from './RsIcon.vue'
import {
  downloadUploadFile,
  formatFileSize,
  mergeUploadFiles,
  removeUploadFileAt,
  resolveUploadFileIcon,
  validateUploadFiles,
} from './upload-utils'
import { useRsI18n } from '../composables/useRsI18n'

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
  }>(),
  {
    multiple: false,
    disabled: false,
    showFileList: true,
    showDownload: false,
    hideDropzoneWhenFull: false,
  },
)

const emit = defineEmits<{
  reject: [errors: ReturnType<typeof validateUploadFiles>['rejected']]
  download: [file: File, index: number]
  remove: [file: File, index: number]
}>()

const { t } = useRsI18n()
const dragging = ref(false)
const dragDepth = ref(0)

const canAdd = computed(() => !props.maxCount || model.value.length < props.maxCount)
const isDropzoneDisabled = computed(() => props.disabled || !canAdd.value)
const showDropzone = computed(
  () => !(props.hideDropzoneWhenFull && props.maxCount != null && model.value.length >= props.maxCount),
)
const resolvedHint = computed(() => {
  if (dragging.value && !isDropzoneDisabled.value) return t('upload.dropActive')
  return props.hint ?? t('upload.browse')
})

function applyFiles(files: File[]): void {
  if (!files.length || isDropzoneDisabled.value) return
  const result = validateUploadFiles(files, {
    accept: props.accept,
    maxSize: props.maxSize,
    maxCount: props.maxCount ? props.maxCount - model.value.length : undefined,
  })
  model.value = mergeUploadFiles(model.value, result.accepted, props.maxCount)
  if (result.rejected.length) emit('reject', result.rejected)
}

function onFilesChange(event: Event): void {
  const input = event.target as HTMLInputElement
  applyFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDragEnter(event: DragEvent): void {
  event.preventDefault()
  if (isDropzoneDisabled.value) return
  dragDepth.value += 1
  dragging.value = true
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = isDropzoneDisabled.value ? 'none' : 'copy'
}

function onDragLeave(event: DragEvent): void {
  event.preventDefault()
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) dragging.value = false
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  dragDepth.value = 0
  dragging.value = false
  if (isDropzoneDisabled.value) return
  applyFiles(Array.from(event.dataTransfer?.files ?? []))
}

function removeFile(index: number): void {
  const file = model.value[index]
  if (!file) return
  model.value = removeUploadFileAt(model.value, index)
  emit('remove', file, index)
}

function onDownload(file: File, index: number): void {
  emit('download', file, index)
  // 无外部监听时仍提供默认下载；有监听时由业务决定是否自行处理
  downloadUploadFile(file)
}

function fileIcon(file: File): string {
  return resolveUploadFileIcon(file)
}
</script>

<template>
  <div class="rs-upload">
    <label
      v-if="showDropzone"
      class="rs-upload__dropzone"
      :class="{
        'rs-upload__dropzone--disabled': isDropzoneDisabled,
        'rs-upload__dropzone--dragging': dragging && !isDropzoneDisabled,
      }"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        class="rs-upload__input"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="isDropzoneDisabled"
        @change="onFilesChange"
      >
      <span class="rs-upload__icon" aria-hidden="true">
        <RsIcon name="cloud-upload" :size="22" />
      </span>
      <span class="rs-upload__text">
        <span class="rs-upload__label">{{ label ?? t('upload.label') }}</span>
        <span class="rs-upload__hint">{{ resolvedHint }}</span>
      </span>
    </label>

    <ul v-if="showFileList && model.length" class="rs-upload__list">
      <li
        v-for="(file, index) in model"
        :key="`${file.name}-${file.size}-${index}`"
        class="rs-upload__file"
      >
        <span
          class="rs-upload__file-icon"
          :class="`rs-upload__file-icon--${fileIcon(file)}`"
          aria-hidden="true"
        >
          <RsIcon :name="fileIcon(file)" :size="16" />
        </span>
        <span class="rs-upload__file-meta">
          <span class="rs-upload__file-name">{{ file.name }}</span>
          <span class="rs-upload__file-size">{{ formatFileSize(file.size) }}</span>
        </span>
        <button
          v-if="showDownload"
          type="button"
          class="rs-upload__file-action"
          :aria-label="t('upload.download')"
          :title="t('upload.download')"
          @click.stop="onDownload(file, index)"
        >
          <RsIcon name="download" :size="14" />
        </button>
        <button
          v-if="!disabled"
          type="button"
          class="rs-upload__file-remove"
          :aria-label="t('common.remove')"
          @click.stop="removeFile(index)"
        >
          <RsIcon name="x" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rs-upload {
  display: grid;
  gap: var(--rs-space-md);
}

.rs-upload__dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--rs-space-md);
  min-height: 8.5rem;
  padding: var(--rs-space-xl) var(--rs-space-lg);
  border: 1px dashed var(--rs-border);
  border-radius: var(--rs-radius);
  background: color-mix(in srgb, var(--rs-surface) 82%, var(--rs-bg));
  cursor: pointer;
  text-align: center;
  transition:
    border-color var(--rs-transition-fast),
    background var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-upload__dropzone:hover:not(.rs-upload__dropzone--disabled),
.rs-upload__dropzone--dragging:not(.rs-upload__dropzone--disabled) {
  border-color: color-mix(in srgb, var(--rs-primary) 55%, var(--rs-border));
  background: color-mix(in srgb, var(--rs-primary) 6%, var(--rs-surface));
}

.rs-upload__dropzone:focus-within:not(.rs-upload__dropzone--disabled) {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-upload__dropzone--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.rs-upload__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: inherit;
}

.rs-upload__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
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
  gap: 0.25rem;
  max-width: 20rem;
}

.rs-upload__label {
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-upload__hint {
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.rs-upload__list {
  display: grid;
  gap: var(--rs-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-upload__file {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  padding: var(--rs-space-sm) var(--rs-space-md);
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

.rs-upload__file-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border-subtle);
  background: color-mix(in srgb, var(--rs-bg) 55%, var(--rs-surface));
  color: var(--rs-muted);
}

.rs-upload__file-icon--file-image {
  color: var(--rs-info, #2563eb);
}

.rs-upload__file-icon--file-code,
.rs-upload__file-icon--file-braces,
.rs-upload__file-icon--file-terminal {
  color: var(--rs-primary);
}

.rs-upload__file-icon--file-key,
.rs-upload__file-icon--key-round,
.rs-upload__file-icon--file-lock {
  color: var(--rs-warning, #d97706);
}

.rs-upload__file-icon--file-archive {
  color: var(--rs-secondary, #7c3aed);
}

.rs-upload__file-icon--file-spreadsheet {
  color: var(--rs-success, #16a34a);
}

.rs-upload__file-icon--file-type,
.rs-upload__file-icon--file-text {
  color: var(--rs-danger, #dc2626);
}

.rs-upload__file-icon--file-music,
.rs-upload__file-icon--file-video-camera {
  color: var(--rs-info, #2563eb);
}

.rs-upload__file-meta {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.rs-upload__file-name {
  overflow: hidden;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-upload__file-size {
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.rs-upload__file-action,
.rs-upload__file-remove {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-upload__file-action:hover,
.rs-upload__file-remove:hover {
  background: var(--rs-item-hover);
  color: var(--rs-text);
}

.rs-upload__file-action:focus-visible,
.rs-upload__file-remove:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
</style>
