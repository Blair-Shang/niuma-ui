<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsForm,
  RsUpload,
  createUploadFileFromContent,
  type RsUploadExpose,
  type RsUploadValidationError,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const files = ref<File[]>([])
const ruleFiles = ref<File[]>([])
const pictureFiles = ref<File[]>([
  createUploadFileFromContent('cover.png', 'PNG', 'image/png'),
])
const cardFiles = ref<File[]>([])
const buttonFiles = ref<File[]>([])
const sizeFiles = ref<File[]>([])
const slotFiles = ref<File[]>([])
const eventFiles = ref<File[]>([])
const methodFiles = ref<File[]>([
  createUploadFileFromContent('readme.txt', 'hello\n', 'text/plain'),
])
const lastAction = ref('')
const methodLog = ref('')
const fieldRef = ref<RsUploadExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    dropLabel: 'Upload attachment',
    dropHint: 'Drag here, or click to browse',
    imageLabel: 'Images',
    imageHint: 'PNG / JPG · max 3 · 2 MB each',
    replaceHint: 'replace + max-count=1. The next pick overwrites.',
    darkSurface: 'Dark surface — upload tokens follow data-rs-theme, do not hard-code color',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    disabledHint: 'Pick and remove are off. Download still works.',
    extraCount: (n: number) => `${n} selected`,
    slotHint: 'Custom hint slot. Keep the native file input.',
    idle: 'No event yet. change / reject / download / remove / preview log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOpen: 'open()',
    toClear: 'clear()',
    methodIdle: 'Call open() or clear(). There is no upload() or setValue() on the ref.',
    methodOpen: 'open()',
    methodClear: 'clear()',
    previewName: (name: string) => `preview ${name}`,
  },
  'zh-CN': {
    dropLabel: '上传附件',
    dropHint: '拖到这里，或点击选择',
    imageLabel: '图片',
    imageHint: 'PNG / JPG · 最多 3 张 · 每张 2 MB',
    replaceHint: 'replace + max-count=1。下一次选择会覆盖。',
    darkSurface: '深色表面 — upload token 跟 data-rs-theme，不要写死颜色',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    disabledHint: '不能选择或移除。下载仍可用。',
    extraCount: (n: number) => `已选 ${n}`,
    slotHint: '自定义 hint 插槽。不要丢掉原生 file input。',
    idle: '还没有事件。change / reject / download / remove / preview 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOpen: 'open()',
    toClear: 'clear()',
    methodIdle: '调用 open() 或 clear()。ref 上没有 upload() / setValue()。',
    methodOpen: 'open()',
    methodClear: 'clear()',
    previewName: (name: string) => `预览 ${name}`,
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsUpload
  v-model="files"
  label="Upload attachment"
  hint="Drag here, or click to browse"
/>`

const rulesCode = `<RsUpload
  v-model="files"
  multiple
  accept="image/*"
  :max-count="3"
  :max-size="2 * 1024 * 1024"
  replace
  skip-duplicate
  @reject="onReject"
/>`

const listCode = `<RsUpload v-model="files" list-type="text" />
<RsUpload v-model="files" list-type="picture" />
<RsUpload v-model="files" list-type="picture-card" :max-count="4" />`

const buttonCode = `<RsUpload
  v-model="files"
  variant="button"
  multiple
  directory
/>`

const sizeCode = `<RsUpload size="ssm" />
<RsUpload size="sm" />
<RsUpload size="md" />
<RsUpload size="lg" />`

const disabledCode = `<RsUpload disabled show-download :model-value="files" />

<RsForm disabled>
  <RsUpload />
</RsForm>`

const slotsCode = `<RsUpload v-model="files">
  <template #hint>Custom hint slot.</template>
  <template #extra>{{ files.length }} selected</template>
</RsUpload>`

const eventsCode = `<RsUpload
  v-model="files"
  show-download
  list-type="picture"
  @change="onChange"
  @reject="onReject"
  @download="onDownload"
  @remove="onRemove"
  @preview="onPreview"
/>`

const methodsCode = `const field = ref<RsUploadExpose>()
field.value?.open()
field.value?.clear()
// field.value?.upload is undefined

<RsUpload ref="field" v-model="files" />`

function log(name: string, detail: string) {
  lastAction.value = copy.value.changeHit(name, detail)
}

function reasonText(reason: RsUploadValidationError['reason']): string {
  return reason
}

function onReject(errors: RsUploadValidationError[]) {
  log('reject', errors.map((item) => `${item.file.name}:${reasonText(item.reason)}`).join(', '))
}

function onChange(next: File[]) {
  log('change', String(next.length))
}

function onDownload(file: File, index: number) {
  log('download', `${index} ${file.name}`)
}

function onRemove(file: File, index: number) {
  log('remove', `${index} ${file.name}`)
}

function onPreview(file: File, index: number) {
  log('preview', `${index} ${file.name}`)
}

function callOpen() {
  fieldRef.value?.open()
  methodLog.value = copy.value.methodOpen
}

function callClear() {
  fieldRef.value?.clear()
  methodLog.value = copy.value.methodClear
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="点击或拖拽"
    title-en="Click or drag"
    description="默认单文件追加。点击虚线区或拖入。v-model 是 File[]。不包 Reka。"
    description-en="Default is single-pick append. Click the dashed area or drop files. v-model is File[]. No Reka."
    :code="basicCode"
  >
    <RsUpload v-model="files" :label="copy.dropLabel" :hint="copy.dropHint" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsUpload :label="copy.dropLabel" :hint="copy.dropHint" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-rules"
    title="类型与数量"
    title-en="Type and limits"
    description="accept / max-count / max-size 在选择时校验，违规发 reject。replace 覆盖列表；skip-duplicate 跳过同名同大小。"
    description-en="accept / max-count / max-size run on pick; failures emit reject. replace overwrites the list; skip-duplicate skips the same name and size."
    :code="rulesCode"
  >
    <RsUpload
      v-model="ruleFiles"
      multiple
      accept="image/*"
      :max-count="3"
      :max-size="2 * 1024 * 1024"
      skip-duplicate
      :label="copy.imageLabel"
      :hint="copy.imageHint"
      @reject="onReject"
    />
    <p class="note">{{ copy.replaceHint }}</p>
    <RsUpload
      :max-count="1"
      replace
      hide-dropzone-when-full
      accept=".crt,.pem,.cer"
      :label="copy.dropLabel"
    />
  </DocDemo>

  <DocDemo
    id="demo-list"
    title="列表形态"
    title-en="List type"
    description="text 行列表。picture 行内缩略图。picture-card 卡片墙，添加格在末尾。点缩略图发 preview，不内置灯箱。"
    description-en="text is a row list. picture adds a thumb. picture-card is a card wall with an add tile. A thumb click emits preview — no lightbox."
    :code="listCode"
  >
    <div class="stack">
      <RsUpload v-model="pictureFiles" list-type="picture" show-download />
      <RsUpload v-model="cardFiles" list-type="picture-card" multiple :max-count="4" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-button"
    title="按钮触发"
    title-en="Button trigger"
    description="variant=button 是形态，不是颜色。directory 选文件夹。仍可把文件拖到按钮上。"
    description-en="variant=button is a shape, not a color. directory picks a folder. You can still drop files on the button."
    :code="buttonCode"
  >
    <RsUpload
      v-model="buttonFiles"
      variant="button"
      multiple
      directory
      :label="copy.dropLabel"
    />
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="ssm / sm / md / lg。未传跟随 Form / ConfigProvider.control-size。不要 :deep 改高度。"
    description-en="ssm / sm / md / lg. Omit to follow Form / ConfigProvider.control-size. Do not :deep the height."
    :code="sizeCode"
  >
    <div class="stack">
      <RsUpload v-model="sizeFiles" size="ssm" />
      <RsUpload size="sm" />
      <RsUpload size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 不能选择或移除。Form.disabled 同样生效。showDownload 时只读文件仍可下载。"
    description-en="disabled blocks pick and remove. Form.disabled does the same. Download still works when showDownload is on."
    :code="disabledCode"
  >
    <div class="stack">
      <RsUpload
        disabled
        show-download
        :model-value="methodFiles"
        :label="copy.dropLabel"
        :hint="copy.disabledHint"
      />
      <RsForm disabled>
        <p class="note">{{ copy.formDisabled }}</p>
        <RsUpload :label="copy.dropLabel" />
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#icon / #hint / #extra 改拖拽区。#file 改一行。默认插槽替换整个触发内容。"
    description-en="#icon / #hint / #extra change the dropzone. #file changes a row. The default slot replaces the whole trigger."
    :code="slotsCode"
  >
    <RsUpload v-model="slotFiles" multiple>
      <template #hint>{{ copy.slotHint }}</template>
      <template #extra>
        <span class="extra">{{ copy.extraCount(slotFiles.length) }}</span>
      </template>
    </RsUpload>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="change 与 v-model 一起发。reject 是校验失败。preview 只通知宿主，不打开灯箱。"
    description-en="change is emitted with v-model. reject is a validation miss. preview only notifies the host — no lightbox."
    :code="eventsCode"
  >
    <RsUpload
      v-model="eventFiles"
      multiple
      :max-count="5"
      show-download
      list-type="picture"
      accept="image/*,.txt,.md,.pem"
      :label="copy.dropLabel"
      @change="onChange"
      @reject="onReject"
      @download="onDownload"
      @remove="onRemove"
      @preview="onPreview"
    />
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="open() 打开系统选择。clear() 清空。没有 upload() / setValue() / validate()。"
    description-en="open() opens the system picker. clear() empties the list. There is no upload(), setValue(), or validate()."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton variant="default" @click="callOpen">{{ copy.toOpen }}</RsButton>
      <RsButton variant="ghost" @click="callClear">{{ copy.toClear }}</RsButton>
    </div>
    <RsUpload ref="fieldRef" v-model="methodFiles" show-download :label="copy.dropLabel" />
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-lg);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-md);
  margin-block-end: var(--rs-space-md);
}

.note,
.extra {
  margin-block: var(--rs-space-sm) 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.canvas {
  margin-block-start: 0.9rem;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}

.event-log {
  margin-block-start: 0.75rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}
</style>
