<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import {
  RsButton,
  RsConfirmDialog,
  RsIcon,
  rsConfirm,
  type RsDialogWidth,
  type RsFeedbackTone,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 演示 icon prop：传入组件而非默认 "!" */
const WarningIcon = defineComponent({
  name: 'PgConfirmWarningIcon',
  setup() {
    return () => h(RsIcon, { name: 'shield-check', size: 20 })
  },
})

const TrashIcon = defineComponent({
  name: 'PgConfirmTrashIcon',
  setup() {
    return () => h(RsIcon, { name: 'trash-2', size: 20 })
  },
})

const defaultOpen = ref(false)
const deleteOpen = ref(false)
const subtitleOpen = ref(false)
const widthOpen = ref(false)
const widthPreset = ref<RsDialogWidth>('md')
const iconPropOpen = ref(false)
const iconSlotOpen = ref(false)
const loadingOpen = ref(false)
const loading = ref(false)
const asyncOpen = ref(false)
const asyncLoading = ref(false)
const overlayOpen = ref(false)
const customButtonsOpen = ref(false)
const primaryConfirmOpen = ref(false)
const eventOpen = ref(false)
const scopedConfirmOpen = ref(false)
const scopedConfirmMount = 'pg-confirm-dialog-mount'

const alertOnlyOpen = ref(false)
const extraOpen = ref(false)
const beforeCloseOpen = ref(false)
const beforeCloseBlocked = ref(true)

const toneOpen = ref(false)
const toneConfig = ref<{
  tone: RsFeedbackTone
  title: string
  description: string
  confirmVariant: 'primary' | 'danger'
}>({
  tone: 'danger',
  title: '',
  description: '',
  confirmVariant: 'danger',
})

const lastEvent = ref('（尚未操作）')
const imperativeResult = ref('（尚未调用）')

function openTone(
  tone: RsFeedbackTone,
  title: string,
  description: string,
  confirmVariant: 'primary' | 'danger' = tone === 'danger' ? 'danger' : 'primary',
): void {
  toneConfig.value = { tone, title, description, confirmVariant }
  toneOpen.value = true
}

function logEvent(name: string): void {
  lastEvent.value = `${name} · ${new Date().toLocaleTimeString()}`
}

function openWidth(preset: RsDialogWidth): void {
  widthPreset.value = preset
  widthOpen.value = true
}

async function onLoadingConfirm(): Promise<void> {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1200))
  loading.value = false
  loadingOpen.value = false
  logEvent('confirmLoading 完成')
}

async function onAsyncConfirm(): Promise<void> {
  asyncLoading.value = true
  await new Promise((r) => setTimeout(r, 1200))
  asyncLoading.value = false
  asyncOpen.value = false
  logEvent('autoCloseOnConfirm=false 完成')
}

async function runRsConfirmBasic(): Promise<void> {
  const ok = await rsConfirm({
    title: '确认删除该成员？',
    subtitle: '此操作不可恢复，请谨慎操作',
    description: '删除后相关权限与历史记录将一并清理。',
    icon: TrashIcon,
    width: 500,
    confirmText: '确定删除',
    showOverlay: true,
  })
  imperativeResult.value = ok ? 'rsConfirm：已确认' : 'rsConfirm：已取消'
}

async function runRsConfirmAsync(): Promise<void> {
  imperativeResult.value = 'rsConfirm：提交中…'
  try {
    const ok = await rsConfirm({
      title: '提交变更？',
      subtitle: '将写入远程配置',
      description: '确认后模拟 1.2s 异步请求；失败可保持打开（本例成功）。',
      tone: 'info',
      confirmVariant: 'primary',
      width: 'md',
      showOverlay: true,
      onConfirm: async () => {
        await new Promise((r) => setTimeout(r, 1200))
      },
    })
    imperativeResult.value = ok ? 'rsConfirm 异步：已确认' : 'rsConfirm 异步：已取消'
  } catch {
    imperativeResult.value = 'rsConfirm 异步：异常'
  }
}

async function runRsConfirmReject(): Promise<void> {
  imperativeResult.value = 'rsConfirm：将演示失败保持打开…'
  const ok = await rsConfirm({
    title: '保存配置？',
    description: '点击确认后会模拟失败，对话框应保持打开并可重试。',
    tone: 'warning',
    confirmVariant: 'primary',
    showOverlay: true,
    onConfirm: async () => {
      await new Promise((r) => setTimeout(r, 800))
      throw new Error('模拟保存失败')
    },
  })
  imperativeResult.value = ok ? '不应到达' : 'rsConfirm 失败态：已取消或关闭'
}

async function runShortcut(kind: 'warning' | 'danger' | 'info' | 'success' | 'error' | 'confirm'): Promise<void> {
  const ok = await rsConfirm[kind]({
    title:
      kind === 'info' || kind === 'success' || kind === 'error'
        ? `rsConfirm.${kind}（单按钮）`
        : `rsConfirm.${kind}`,
    description: `快捷 API：tone / confirmVariant / showCancel 已按 ${kind} 预设。`,
    width: 480,
  })
  imperativeResult.value = `rsConfirm.${kind} → ${ok ? '确认' : '取消/关闭'}`
}
</script>

<template>
  <DemoPage title="RsConfirmDialog" test-file="RsConfirmDialog.spec.ts">
    <DemoBlock title="默认 i18n 文案">
      <p class="hint">
        不传 <code>title</code> / <code>description</code> 时使用
        <code>t('confirm.*')</code>，随 Playground 语言切换。
      </p>
      <RsButton @click="defaultOpen = true">打开确认框</RsButton>
      <RsConfirmDialog v-model:open="defaultOpen" />
    </DemoBlock>

    <DemoBlock title="subtitle 分层文案">
      <p class="hint">
        <code>subtitle</code> 在标题与正文之间；<code>description</code> 为主要说明，支持换行
       （<code>white-space: pre-wrap</code>）。
      </p>
      <RsButton variant="default" @click="subtitleOpen = true">带副标题确认</RsButton>
      <RsConfirmDialog
        v-model:open="subtitleOpen"
        title="确认删除"
        subtitle="此操作不可恢复，请谨慎操作"
        description="确定要删除选中的 3 个资源吗？&#10;&#10;删除后无法从回收站恢复。"
        confirm-text="确定删除"
        :width="500"
      />
    </DemoBlock>

    <DemoBlock title="width 预设 / 自定义">
      <p class="hint">
        不传保持历史默认 <code>28rem</code>；预设 <code>sm/md/lg</code>；数字按 px；也可传 CSS
        长度。
      </p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="openWidth('sm')">sm</RsButton>
        <RsButton size="sm" variant="default" @click="openWidth('md')">md</RsButton>
        <RsButton size="sm" variant="default" @click="openWidth('lg')">lg</RsButton>
        <RsButton size="sm" variant="default" @click="openWidth(500)">500px</RsButton>
        <RsButton size="sm" variant="default" @click="openWidth('40rem')">40rem</RsButton>
      </div>
      <RsConfirmDialog
        v-model:open="widthOpen"
        title="宽度演示"
        :subtitle="`当前 width = ${String(widthPreset)}`"
        description="对比不同宽度下标题与正文的换行表现。"
        :width="widthPreset"
        confirm-variant="primary"
        tone="info"
      />
    </DemoBlock>

    <DemoBlock title="自定义 icon（prop）">
      <p class="hint">
        传入 <code>icon</code> 组件替换默认 <code>!</code>；背景色仍由 <code>tone</code> 控制。
      </p>
      <RsButton variant="default" @click="iconPropOpen = true">icon prop</RsButton>
      <RsConfirmDialog
        v-model:open="iconPropOpen"
        title="删除工作区？"
        subtitle="所有成员将失去访问权限"
        description="此操作不可撤销。"
        :icon="WarningIcon"
        tone="danger"
        confirm-text="删除"
      />
    </DemoBlock>

    <DemoBlock title="自定义 icon（#icon 插槽）">
      <p class="hint">需要额外样式或组合图标时用插槽覆盖。</p>
      <RsButton variant="default" @click="iconSlotOpen = true">#icon slot</RsButton>
      <RsConfirmDialog
        v-model:open="iconSlotOpen"
        title="归档项目？"
        description="归档后可在「已归档」列表中找回。"
        tone="warning"
        confirm-variant="primary"
        confirm-text="归档"
      >
        <template #icon>
          <RsIcon name="archive" :size="20" />
        </template>
      </RsConfirmDialog>
    </DemoBlock>

    <DemoBlock title="confirmLoading 受控加载">
      <p class="hint">
        需配合 <code>:auto-close-on-confirm="false"</code>，否则一点确认就会关掉，看不到
        loading；确认中禁用按钮并阻止 Esc。
      </p>
      <div class="row">
        <RsButton variant="default" @click="loadingOpen = true">打开并模拟提交</RsButton>
        <span class="event-log">最近：<code>{{ lastEvent }}</code></span>
      </div>
      <RsConfirmDialog
        v-model:open="loadingOpen"
        title="保存更改？"
        description="确认后模拟 1.2s 请求，期间按钮 loading。"
        confirm-variant="primary"
        tone="info"
        :auto-close-on-confirm="false"
        :confirm-loading="loading"
        @confirm="onLoadingConfirm"
      />
    </DemoBlock>

    <DemoBlock title="autoCloseOnConfirm=false">
      <p class="hint">
        点击确认不自动关闭，由业务在异步结束后再把 <code>open</code> 设为
        <code>false</code>。
      </p>
      <RsButton variant="default" @click="asyncOpen = true">手动关闭流程</RsButton>
      <RsConfirmDialog
        v-model:open="asyncOpen"
        title="发布版本？"
        description="确认后保持打开，待请求完成再关闭。"
        tone="warning"
        confirm-variant="primary"
        :auto-close-on-confirm="false"
        :confirm-loading="asyncLoading"
        @confirm="onAsyncConfirm"
      />
    </DemoBlock>

    <DemoBlock title="showOverlay 遮罩">
      <p class="hint">默认无遮罩；命令式 <code>rsConfirm</code> 默认开启遮罩。</p>
      <RsButton variant="default" @click="overlayOpen = true">带遮罩确认</RsButton>
      <RsConfirmDialog
        v-model:open="overlayOpen"
        title="离开当前页？"
        description="未保存的内容将丢失。"
        tone="warning"
        show-overlay
      />
    </DemoBlock>

    <DemoBlock title="命令式 rsConfirm（增强选项）">
      <p class="hint">
        覆盖 <code>subtitle</code> / <code>width</code> / <code>icon</code> / 异步
        <code>onConfirm</code>（成功关闭；reject 保持打开）。详见
        <code>createRsDialog.spec.ts</code>。
      </p>
      <div class="row">
        <RsButton size="sm" @click="runRsConfirmBasic">subtitle + icon + width</RsButton>
        <RsButton size="sm" variant="default" @click="runRsConfirmAsync">异步 onConfirm</RsButton>
        <RsButton size="sm" variant="danger" @click="runRsConfirmReject">onConfirm reject</RsButton>
        <span class="event-log">结果：<code>{{ imperativeResult }}</code></span>
      </div>
    </DemoBlock>

    <DemoBlock title="tone 快捷 API（rsConfirm.*）">
      <p class="hint">
        <code>warning</code> / <code>danger</code> / <code>confirm</code> 为双按钮确认；
        <code>info</code> / <code>success</code> / <code>error</code> 默认
        <code>showCancel: false</code> 单按钮提示。业务侧请直接用这些 API，不要再走
        Dialog layout=confirm。
      </p>
      <div class="row">
        <RsButton size="sm" variant="danger" @click="runShortcut('warning')">warning</RsButton>
        <RsButton size="sm" variant="danger" @click="runShortcut('danger')">danger</RsButton>
        <RsButton size="sm" @click="runShortcut('confirm')">confirm</RsButton>
        <RsButton size="sm" variant="default" @click="runShortcut('info')">info</RsButton>
        <RsButton size="sm" variant="default" @click="runShortcut('success')">success</RsButton>
        <RsButton size="sm" variant="default" @click="runShortcut('error')">error</RsButton>
        <span class="event-log">结果：<code>{{ imperativeResult }}</code></span>
      </div>
    </DemoBlock>

    <DemoBlock title="showCancel=false（单按钮提示）">
      <p class="hint">声明式单按钮；与 <code>rsConfirm.info</code> 同构。</p>
      <RsButton variant="default" @click="alertOnlyOpen = true">打开提示</RsButton>
      <RsConfirmDialog
        v-model:open="alertOnlyOpen"
        title="操作完成"
        description="配置已保存，无需取消按钮。"
        tone="success"
        confirm-variant="primary"
        confirm-text="知道了"
        :show-cancel="false"
        show-overlay
      />
    </DemoBlock>

    <DemoBlock title="#extra 插槽">
      <p class="hint">正文与底部按钮之间插入自定义内容；命令式对应 <code>extra</code> 渲染函数。</p>
      <RsButton variant="default" @click="extraOpen = true">带额外内容</RsButton>
      <RsConfirmDialog
        v-model:open="extraOpen"
        title="删除选中项？"
        subtitle="将同时清理关联缓存"
        description="请核对即将删除的资源。"
        confirm-text="删除"
        show-overlay
      >
        <template #extra>
          <ul class="extra-list">
            <li>route-assert-01</li>
            <li>route-assert-02</li>
            <li>route-assert-03</li>
          </ul>
        </template>
      </RsConfirmDialog>
    </DemoBlock>

    <DemoBlock title="beforeClose 拦截">
      <p class="hint">返回 <code>false</code> 可阻止关闭（含取消 / Esc / 确认自动关闭）。</p>
      <div class="row">
        <RsButton variant="default" @click="beforeCloseOpen = true">打开</RsButton>
        <label class="row">
          <input v-model="beforeCloseBlocked" type="checkbox" />
          阻止关闭
        </label>
      </div>
      <RsConfirmDialog
        v-model:open="beforeCloseOpen"
        title="关闭拦截演示"
        description="勾选「阻止关闭」时，任何关闭路径都应失败。"
        tone="warning"
        confirm-variant="primary"
        show-overlay
        :before-close="() => !beforeCloseBlocked"
      />
    </DemoBlock>

    <DemoBlock title="危险删除（默认 tone）">
      <p class="hint">
        默认 <code>tone="danger"</code>、<code>confirmVariant="danger"</code>，适合不可逆操作。
      </p>
      <RsButton variant="default" @click="deleteOpen = true">删除任务</RsButton>
      <RsConfirmDialog
        v-model:open="deleteOpen"
        title="删除任务？"
        description="删除后数据无法恢复，相关流程将立即停止。"
        confirm-text="删除"
        cancel-text="保留"
      />
    </DemoBlock>

    <DemoBlock title="tone 语义色">
      <p class="hint">图标背景使用 container 语义色，避免大面积高饱和功能色。</p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="openTone('danger', '删除工作区？', '所有成员将失去访问权限。')">
          danger
        </RsButton>
        <RsButton size="sm" variant="default" @click="openTone('warning', '发布到生产？', '当前版本尚未通过全部检查。')">
          warning
        </RsButton>
        <RsButton size="sm" variant="default" @click="openTone('success', '标记为已完成？', '任务将移入归档列表。')">
          success
        </RsButton>
        <RsButton size="sm" variant="default" @click="openTone('info', '切换计费方案？', '变更将在下个账单周期生效。')">
          info
        </RsButton>
        <RsButton size="sm" variant="default" @click="openTone('default', '重置筛选条件？', '将恢复为默认视图。')">
          default
        </RsButton>
      </div>
      <RsConfirmDialog
        v-model:open="toneOpen"
        :tone="toneConfig.tone"
        :title="toneConfig.title"
        :description="toneConfig.description"
        :confirm-variant="toneConfig.confirmVariant"
      />
    </DemoBlock>

    <DemoBlock title="非破坏性确认（confirmVariant=primary）">
      <p class="hint">非删除类操作可将确认按钮改为品牌主色，降低误触恐慌感。</p>
      <RsButton @click="primaryConfirmOpen = true">提交审核</RsButton>
      <RsConfirmDialog
        v-model:open="primaryConfirmOpen"
        tone="info"
        confirm-variant="primary"
        title="提交审核？"
        description="提交后进入审核队列，审核期间不可编辑。"
        confirm-text="提交"
      />
    </DemoBlock>

    <DemoBlock title="自定义按钮文案">
      <RsButton variant="default" @click="customButtonsOpen = true">退出协作</RsButton>
      <RsConfirmDialog
        v-model:open="customButtonsOpen"
        tone="warning"
        title="退出当前协作？"
        description="未保存的批注将丢失。"
        confirm-text="退出"
        cancel-text="继续编辑"
        confirm-variant="danger"
      />
    </DemoBlock>

    <DemoBlock title="confirm / cancel 事件">
      <p class="hint">
        点击确认触发 <code>confirm</code> 并关闭；取消触发 <code>cancel</code>。
      </p>
      <div class="row">
        <RsButton @click="eventOpen = true">触发事件</RsButton>
        <span class="event-log">最近操作：<code>{{ lastEvent }}</code></span>
      </div>
      <RsConfirmDialog
        v-model:open="eventOpen"
        title="保存更改？"
        description="离开页面前是否保存当前编辑内容。"
        confirm-text="保存"
        cancel-text="不保存"
        confirm-variant="primary"
        @confirm="logEvent('confirm')"
        @cancel="logEvent('cancel')"
      />
    </DemoBlock>

    <DemoBlock title="teleportTo 挂载点（页签隔离）">
      <p class="hint">
        ConfirmDialog 同样支持 <code>teleport-to</code>，可挂载到当前页签容器，避免跨页签覆盖。
      </p>
      <RsButton variant="default" @click="scopedConfirmOpen = true">打开挂载点确认框</RsButton>
      <div :id="scopedConfirmMount" class="scoped-mount" />
      <RsConfirmDialog
        v-model:open="scopedConfirmOpen"
        title="挂载点确认"
        description="此确认框挂载到本页指定 id。"
        :teleport-to="`#${scopedConfirmMount}`"
      />
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
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.event-log {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.event-log code {
  font-size: inherit;
  color: var(--rs-text);
}
.scoped-mount {
  position: relative;
}
.extra-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-dialog-description-fg);
  line-height: var(--rs-line-height-normal);
}
</style>
