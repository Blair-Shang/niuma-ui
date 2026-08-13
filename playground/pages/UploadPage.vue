<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsUpload,
  createUploadFileFromContent,
  formatFileSize,
  type RsUploadValidationError,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basicFiles = ref<File[]>([])
const multipleFiles = ref<File[]>([])
const customLabelFiles = ref<File[]>([])
const imageFiles = ref<File[]>([])
const limitedSizeFiles = ref<File[]>([])
const limitedCountFiles = ref<File[]>([])
const disabledFiles = ref<File[]>([new File(['demo'], 'readonly.txt', { type: 'text/plain' })])
const downloadFiles = ref<File[]>([
  createUploadFileFromContent('sample-cert.pem', '-----BEGIN CERTIFICATE-----\nDEMO\n-----END CERTIFICATE-----\n', 'application/x-pem-file'),
])
/** 预置多种后缀，用于目测列表图标 */
const iconDemoFiles = ref<File[]>([
  createUploadFileFromContent('localhost.pem', '-----BEGIN CERTIFICATE-----\nDEMO\n-----END CERTIFICATE-----\n'),
  createUploadFileFromContent('localhost.key', '-----BEGIN PRIVATE KEY-----\nDEMO\n-----END PRIVATE KEY-----\n'),
  createUploadFileFromContent('readme.md', '# demo\n'),
  createUploadFileFromContent('config.json', '{"ok":true}\n'),
  createUploadFileFromContent('photo.png', 'PNG', 'image/png'),
  createUploadFileFromContent('report.xlsx', 'XLSX'),
  createUploadFileFromContent('bundle.zip', 'ZIP'),
  createUploadFileFromContent('main.ts', 'export {}\n'),
])
const hideListFiles = ref<File[]>([])
const hideDropzoneFiles = ref<File[]>([])
const echoFiles = ref<File[]>([
  createUploadFileFromContent('gateway.crt', '-----BEGIN CERTIFICATE-----\necho-demo\n-----END CERTIFICATE-----\n', 'application/x-pem-file'),
])
const certFiles = ref<File[]>([])
const eventFiles = ref<File[]>([])
const i18nFiles = ref<File[]>([])

const rejectLog = ref<RsUploadValidationError[]>([])
const eventLog = ref<string[]>([])

const rejectSummary = computed(() => {
  if (!rejectLog.value.length) return ''
  return rejectLog.value
    .map(({ file, reason }) => `${file.name}（${reasonLabel(reason)}）`)
    .join('、')
})

function reasonLabel(reason: RsUploadValidationError['reason']): string {
  if (reason === 'accept') return '类型不符'
  if (reason === 'maxSize') return '超出大小'
  return '超出数量'
}

function onReject(errors: RsUploadValidationError[]): void {
  rejectLog.value = errors
}

function pushEvent(line: string): void {
  eventLog.value = [line, ...eventLog.value].slice(0, 8)
}

function onDownload(file: File, index: number): void {
  pushEvent(`download · #${index} · ${file.name} · ${formatFileSize(file.size)}`)
}

function onRemove(file: File, index: number): void {
  pushEvent(`remove · #${index} · ${file.name}`)
}

function resetEcho(): void {
  echoFiles.value = [
    createUploadFileFromContent(
      'gateway.crt',
      '-----BEGIN CERTIFICATE-----\necho-demo\n-----END CERTIFICATE-----\n',
      'application/x-pem-file',
    ),
  ]
}

function clearEcho(): void {
  echoFiles.value = []
}

/** 示例源码放在 script 中，避免模板里嵌套模板字符串被 Vue 解析器拆坏 */
const basicCode = '<RsUpload v-model="files" />'

const acceptCode = `<RsUpload
  v-model="files"
  accept="image/*"
  multiple
  @reject="onReject"
/>`

const downloadCode = `<RsUpload
  v-model="files"
  show-download
  @download="onDownload"
/>`

const hideDropzoneCode = `<RsUpload
  v-model="files"
  :max-count="1"
  hide-dropzone-when-full
/>`

const certCode = `<RsUpload
  v-model="certFiles"
  accept=".crt,.pem,.cer"
  :max-count="1"
  :max-size="10 * 1024 * 1024"
  hide-dropzone-when-full
  show-download
  label="上传证书"
  hint="支持 .crt, .pem, .cer"
  @reject="onReject"
/>`
</script>

<template>
  <DemoPage title="RsUpload" test-file="RsUpload.spec.ts">
    <DemoBlock title="基础上传" :code="basicCode">
      <p class="hint">
        单文件模式（默认 <code>multiple=false</code>）。支持点击选择，也可把文件拖入虚线区域。
      </p>
      <RsUpload v-model="basicFiles" />
      <p v-if="basicFiles.length" class="state">
        已选 {{ basicFiles.length }} 个：{{ basicFiles.map((f) => f.name).join('、') }}
      </p>
    </DemoBlock>

    <DemoBlock title="多文件">
      <p class="hint"><code>multiple</code> 开启后可一次选择多个文件，列表逐条展示。</p>
      <RsUpload v-model="multipleFiles" multiple />
    </DemoBlock>

    <DemoBlock title="自定义文案">
      <p class="hint">
        <code>label</code> / <code>hint</code> 由业务传入；未传 <code>label</code> 时走 i18n
        <code>upload.label</code>。
      </p>
      <RsUpload
        v-model="customLabelFiles"
        label="上传附件"
        hint="支持 PDF、Word，单个文件不超过 10 MB"
        accept=".pdf,.doc,.docx,application/pdf"
      />
    </DemoBlock>

    <DemoBlock title="类型限制（accept）" :code="acceptCode">
      <p class="hint">
        仅允许图片（<code>accept="image/*"</code>）。选择其他类型会触发 <code>reject</code>。
      </p>
      <RsUpload
        v-model="imageFiles"
        multiple
        accept="image/*"
        label="上传图片"
        hint="PNG / JPG / WebP 等图片格式"
        @reject="onReject"
      />
    </DemoBlock>

    <DemoBlock title="大小限制（maxSize）">
      <p class="hint">
        <code>maxSize</code> 单位为字节，此处限制 100 KB。超大文件会被拒绝并触发
        <code>reject</code>。
      </p>
      <RsUpload
        v-model="limitedSizeFiles"
        :max-size="100 * 1024"
        label="小文件上传"
        hint="单个文件 ≤ 100 KB"
        @reject="onReject"
      />
    </DemoBlock>

    <DemoBlock title="数量限制（maxCount）">
      <p class="hint">
        最多 3 个文件；达到上限后上传区进入禁用态，继续选择会触发 <code>reject</code>。
      </p>
      <RsUpload
        v-model="limitedCountFiles"
        multiple
        :max-count="3"
        label="最多 3 个文件"
        @reject="onReject"
      />
      <p class="state">当前 {{ limitedCountFiles.length }} / 3</p>
    </DemoBlock>

    <DemoBlock title="下载（showDownload）" :code="downloadCode">
      <p class="hint">
        开启 <code>showDownload</code> 后文件行出现下载按钮；默认通过
        <code>createObjectURL</code> 触发浏览器下载，并同步发出 <code>download</code> 事件。
      </p>
      <RsUpload
        v-model="downloadFiles"
        show-download
        label="可下载附件"
        hint="点击列表中的下载图标"
        @download="onDownload"
      />
    </DemoBlock>

    <DemoBlock title="后缀图标">
      <p class="hint">
        列表图标按扩展名 / MIME 映射（如 <code>.pem</code>→钥匙、<code>.png</code>→图片、
        <code>.ts</code>→代码）。未识别后缀回退通用文件图标。
      </p>
      <RsUpload
        v-model="iconDemoFiles"
        multiple
        :max-count="20"
        :show-file-list="true"
        label="多种文件类型"
        hint="也可继续追加本地文件观察图标"
      />
    </DemoBlock>

    <DemoBlock title="隐藏文件列表（showFileList=false）">
      <p class="hint">
        仅保留拖拽区，由业务自行渲染已选文件（下方用简易状态行模拟）。
      </p>
      <RsUpload
        v-model="hideListFiles"
        multiple
        :show-file-list="false"
        label="选择文件"
        hint="列表由业务自定义展示"
      />
      <ul v-if="hideListFiles.length" class="custom-list">
        <li v-for="(file, index) in hideListFiles" :key="`${file.name}-${index}`">
          {{ file.name }}
          <span class="muted">{{ formatFileSize(file.size) }}</span>
        </li>
      </ul>
      <p v-else class="state">尚未选择文件</p>
    </DemoBlock>

    <DemoBlock title="满员隐藏拖拽区（hideDropzoneWhenFull）" :code="hideDropzoneCode">
      <p class="hint">
        适合证书/密钥等「只能有一个」的场景：选中后只保留列表，移除后拖拽区重新出现。
      </p>
      <RsUpload
        v-model="hideDropzoneFiles"
        :max-count="1"
        hide-dropzone-when-full
        label="上传单个文件"
        hint="选中后拖拽区隐藏"
      />
      <p class="state">{{ hideDropzoneFiles.length ? '已满员 · 拖拽区已隐藏' : '可继续选择' }}</p>
    </DemoBlock>

    <DemoBlock title="编辑回填（createUploadFileFromContent）">
      <p class="hint">
        用工具函数把已有文本内容还原为 <code>File</code>，模拟编辑态证书/配置回显。
      </p>
      <div class="actions">
        <RsButton size="sm" variant="secondary" @click="resetEcho">重新回填</RsButton>
        <RsButton size="sm" variant="ghost" @click="clearEcho">清空</RsButton>
      </div>
      <RsUpload
        v-model="echoFiles"
        :max-count="1"
        hide-dropzone-when-full
        show-download
        accept=".crt,.pem,.cer"
        label="证书文件"
        hint="支持 .crt / .pem / .cer"
      />
    </DemoBlock>

    <DemoBlock title="综合场景 · TLS 证书" :code="certCode">
      <p class="hint">
        对齐网关实例表单：扩展名限制、单文件、满员藏拖拽区、可下载、大小上限 10 MB。
      </p>
      <RsUpload
        v-model="certFiles"
        accept=".crt,.pem,.cer"
        :max-count="1"
        :max-size="10 * 1024 * 1024"
        hide-dropzone-when-full
        show-download
        label="上传证书"
        hint="支持 .crt, .pem, .cer · ≤ 10 MB"
        @reject="onReject"
        @download="onDownload"
        @remove="onRemove"
      />
    </DemoBlock>

    <DemoBlock title="事件：download / remove">
      <p class="hint">
        在「下载」或「TLS 证书」场景中操作，观察事件日志（最近 8 条）。
      </p>
      <RsUpload
        v-model="eventFiles"
        multiple
        :max-count="5"
        show-download
        label="触发事件用"
        @download="onDownload"
        @remove="onRemove"
        @reject="onReject"
      />
      <div class="event-panel" :class="{ 'event-panel--empty': !eventLog.length }">
        <p v-for="(line, index) in eventLog" :key="`${line}-${index}`" class="event-line">
          {{ line }}
        </p>
        <p v-if="!eventLog.length" class="event-placeholder">暂无事件</p>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用态">
      <p class="hint">
        <code>disabled</code> 时不可选择 / 移除；列表仍可展示。开启
        <code>showDownload</code> 时仍允许下载只读文件。
      </p>
      <RsUpload v-model="disabledFiles" disabled show-download label="上传已关闭" />
    </DemoBlock>

    <DemoBlock title="校验拒绝反馈">
      <p class="hint">
        在「类型 / 大小 / 数量 / TLS」场景中尝试违规文件，下方汇总最近一次
        <code>reject</code> 载荷。
      </p>
      <div class="reject-panel" :class="{ 'reject-panel--empty': !rejectLog.length }">
        <p v-if="rejectLog.length" class="reject-text">{{ rejectSummary }}</p>
        <p v-else class="reject-placeholder">暂无拒绝记录，请尝试上传不符合规则的文件。</p>
      </div>
    </DemoBlock>

    <DemoBlock title="i18n 默认文案">
      <p class="hint">
        未设置 <code>label</code> 时使用 <code>upload.label</code> /
        <code>upload.browse</code> / <code>upload.dropActive</code>。切换 Playground 右上角语言可目测
        zh-CN / en-US。
      </p>
      <RsUpload v-model="i18nFiles" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: var(--rs-line-height-normal);
}

.hint code {
  font-size: 0.85em;
  color: var(--rs-text);
}

.state {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-sm);
}

.custom-list {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
}

.custom-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text);
}

.muted {
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}

.event-panel,
.reject-panel {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--rs-radius);
  border: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
  display: grid;
  gap: 0.35rem;
}

.reject-panel {
  border-color: var(--rs-danger);
  background: var(--rs-danger-container);
}

.reject-panel--empty,
.event-panel--empty {
  border-color: var(--rs-border-subtle);
  background: var(--rs-surface);
}

.event-line,
.reject-text {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  font-family: var(--rs-font-mono, ui-monospace, monospace);
}

.reject-text {
  color: var(--rs-on-danger-container);
  font-family: inherit;
}

.event-placeholder,
.reject-placeholder {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
}
</style>
