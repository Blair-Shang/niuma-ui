<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsTooltip, RsTooltipProvider } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const aligns = ['start', 'center', 'end'] as const
const align = ref<(typeof aligns)[number]>('center')
const disabled = ref(false)
const delay = ref(400)
const open = ref(false)
const eventLog = ref('')
const methodLog = ref('')
const tipRef = ref<{ open: () => void; close: () => void } | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    copy: 'Copy connection string',
    copyName: 'Copy',
    database: 'Database',
    help: 'Letters, digits, underscore, or hyphen.',
    nowrap: 'orders_2026_archive',
    richTitle: 'Build 2.4.0',
    richBody: 'Select this id and paste it into the release notes.',
    idle: 'Hover the button. openChange shows up here.',
    opened: 'openChange → open',
    closed: 'openChange → closed',
    methodIdle: 'open() and close() skip the hover delay.',
    methodOpen: 'open() → open',
    methodClose: 'close() → closed',
    dark: 'Dark island — the bubble copies data-rs-theme',
  },
  'zh-CN': {
    copy: '复制连接字符串',
    copyName: '复制',
    database: '数据库',
    help: '只能含字母、数字、下划线或连字符。',
    nowrap: 'orders_2026_archive',
    richTitle: '构建 2.4.0',
    richBody: '可以选中这段编号，贴到发布说明里。',
    idle: '悬停按钮。openChange 会写在这里。',
    opened: 'openChange → 打开',
    closed: 'openChange → 关闭',
    methodIdle: 'open() / close() 不等悬停延迟。',
    methodOpen: 'open() → 打开',
    methodClose: 'close() → 关闭',
    dark: '深色岛 — 气泡会抄走 data-rs-theme',
  },
})

function onOpenChange(next: boolean) {
  eventLog.value = next ? copy.value.opened : copy.value.closed
}

function showOpen() {
  tipRef.value?.open()
  methodLog.value = copy.value.methodOpen
}

function showClose() {
  tipRef.value?.close()
  methodLog.value = copy.value.methodClose
}

const basicCode = `<RsTooltip content="Copy connection string">
  <RsButton icon="copy" icon-only aria-label="Copy" variant="ghost" />
</RsTooltip>`

const placementCode = `<RsTooltip side="left" align="center" :delay-duration="0" content="left">
  <RsButton size="sm">left</RsButton>
</RsTooltip>`

const helpCode = `<RsTooltip icon content="Letters, digits, underscore, or hyphen.">
  Database
</RsTooltip>`

const contentCode = `<RsTooltip nowrap content="orders_2026_archive">
  <RsButton variant="ghost">Identifier</RsButton>
</RsTooltip>

<RsTooltip>
  <RsButton variant="ghost">Build</RsButton>
  <template #content>
    <strong>Build 2.4.0</strong>
    <div>Select this id and paste it into the release notes.</div>
  </template>
</RsTooltip>`

const stateCode = `<RsTooltip :disabled="disabled" content="This tip stays closed">
  <RsButton>Hover</RsButton>
</RsTooltip>

<RsTooltipProvider :delay-duration="400" :skip-delay-duration="300">
  <RsTooltip content="First">
    <RsButton>First</RsButton>
  </RsTooltip>
  <RsTooltip content="Second">
    <RsButton>Second</RsButton>
  </RsTooltip>
</RsTooltipProvider>`

const controlCode = `<RsTooltip v-model:open="open" content="Controlled" @open-change="onOpenChange">
  <RsButton>Hover</RsButton>
</RsTooltip>`

const methodsCode = `const tip = ref<{ open: () => void; close: () => void } | null>(null)

<RsTooltip ref="tip" content="Opened from open()">
  <RsButton>Target</RsButton>
</RsTooltip>
<RsButton @click="tip?.open()">open()</RsButton>
<RsButton @click="tip?.close()">close()</RsButton>`

const themeCode = `<RsTooltip arrow content="Points at the trigger">
  <RsButton>Arrow</RsButton>
</RsTooltip>

<div data-rs-theme="dark">
  <RsTooltip content="Follows the island theme">
    <RsButton>Dark</RsButton>
  </RsTooltip>
</div>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="图标按钮已经有 aria-label 时，用一句提示补充，不要把长说明写进按钮。"
    description-en="When the icon button already has an aria-label, add one sentence. Do not put the long text on the button."
    :code="basicCode"
  >
    <RsTooltip :content="copy.copy">
      <RsButton icon="copy" icon-only :aria-label="copy.copyName" variant="ghost" />
    </RsTooltip>
  </DocDemo>

  <DocDemo
    id="demo-placement"
    title="方向与对齐"
    title-en="Placement"
    description="悬停对应方向的按钮，气泡开在那一侧。贴边放不下才翻到对侧。align 管交叉轴；上下方向在 RTL 里 start 和 end 对调。"
    description-en="Hover a side button and the tip opens there. It flips only when that side does not fit. align is the cross axis. On top and bottom, start and end swap in RTL."
    :code="placementCode"
  >
    <div class="compass">
      <RsTooltip side="top" align="center" :delay-duration="0" content="top">
        <RsButton size="sm">top</RsButton>
      </RsTooltip>
      <div class="compass__mid">
        <RsTooltip side="left" align="center" :delay-duration="0" content="left">
          <RsButton size="sm">left</RsButton>
        </RsTooltip>
        <RsTooltip side="right" align="center" :delay-duration="0" content="right">
          <RsButton size="sm">right</RsButton>
        </RsTooltip>
      </div>
      <RsTooltip side="bottom" align="center" :delay-duration="0" content="bottom">
        <RsButton size="sm">bottom</RsButton>
      </RsTooltip>
    </div>
    <div class="tip-row">
      <RsButton
        v-for="item in aligns"
        :key="item"
        size="sm"
        :variant="align === item ? 'primary' : 'default'"
        @click="align = item"
      >
        {{ item }}
      </RsButton>
    </div>
    <RsTooltip side="bottom" :align="align" :content="`align: ${align}`">
      <RsButton>{{ align }}</RsButton>
    </RsTooltip>
  </DocDemo>

  <DocDemo
    id="demo-help"
    title="帮助图标"
    title-en="Help icon"
    description="表单标签后的问号只在图标上打开。图标名称默认就是正文；需要短名称时再传 aria-label。"
    description-en="The question mark after a label opens only from the icon. Its accessible name defaults to the tip text. Pass aria-label for a shorter name."
    :code="helpCode"
  >
    <RsTooltip icon :content="copy.help">
      {{ copy.database }}
    </RsTooltip>
  </DocDemo>

  <DocDemo
    id="demo-content"
    title="内容与单行"
    title-en="Content"
    description="标识符用 nowrap。#content 可以放多行；指针可以移进去选中文字。不要在里面放按钮。"
    description-en="Use nowrap for an identifier. #content can be more than one line, and the pointer can move in to select text. Do not put buttons inside."
    :code="contentCode"
  >
    <div class="tip-row">
      <RsTooltip nowrap :content="copy.nowrap">
        <RsButton variant="ghost" size="sm">{{ copy.nowrap }}</RsButton>
      </RsTooltip>
      <RsTooltip>
        <RsButton variant="ghost" size="sm">{{ copy.richTitle }}</RsButton>
        <template #content>
          <strong>{{ copy.richTitle }}</strong>
          <div>{{ copy.richBody }}</div>
        </template>
      </RsTooltip>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-state"
    title="禁用与延迟"
    title-en="Disabled and delay"
    description="disabled 时不打开。Provider 的 delay-duration 是第一次等待；skip-delay-duration 让你从一条滑到下一条时不再等。"
    description-en="disabled keeps the tip closed. delay-duration is the first wait. skip-delay-duration drops that wait when you move from one tip to the next."
    :code="stateCode"
  >
    <div class="tip-row">
      <RsButton size="sm" :variant="disabled ? 'primary' : 'default'" @click="disabled = !disabled">
        disabled {{ disabled }}
      </RsButton>
      <RsTooltip :disabled="disabled" content="This tip stays closed while disabled is true">
        <RsButton size="sm">Hover</RsButton>
      </RsTooltip>
    </div>
    <label class="tip-delay">
      delay {{ delay }}ms
      <input v-model.number="delay" type="range" min="0" max="800" step="100" />
    </label>
    <RsTooltipProvider :delay-duration="delay" :skip-delay-duration="300">
      <div class="tip-row">
        <RsTooltip content="First tip. Move sideways.">
          <RsButton size="sm">First</RsButton>
        </RsTooltip>
        <RsTooltip content="Second tip opens without the full delay.">
          <RsButton size="sm">Second</RsButton>
        </RsTooltip>
      </div>
    </RsTooltipProvider>
  </DocDemo>

  <DocDemo
    id="demo-control"
    title="受控与事件"
    title-en="Controlled"
    description="v-model:open 由父级决定显隐。openChange 与 update:open 一起发，这里把结果显示出来。"
    description-en="v-model:open lets the parent own visibility. openChange fires with update:open. The line below is that result."
    :code="controlCode"
  >
    <div class="tip-row">
      <RsTooltip v-model:open="open" content="Controlled" @open-change="onOpenChange">
        <RsButton>Hover</RsButton>
      </RsTooltip>
      <RsButton size="sm" variant="ghost" @click="open = !open">v-model {{ open }}</RsButton>
    </div>
    <p class="tip-log">{{ eventLog || copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="open() / close() 给宿主立刻开关，不等悬停延迟。RsTooltipProvider 没有 defineExpose。"
    description-en="open() / close() toggle immediately and skip the hover delay. RsTooltipProvider has no defineExpose."
    :code="methodsCode"
  >
    <div class="tip-row">
      <RsTooltip ref="tipRef" content="Opened from open()">
        <RsButton variant="ghost">Target</RsButton>
      </RsTooltip>
      <RsButton size="sm" @click="showOpen">open()</RsButton>
      <RsButton size="sm" variant="ghost" @click="showClose">close()</RsButton>
    </div>
    <p class="tip-log">{{ methodLog || copy.methodIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="箭头与主题"
    title-en="Arrow and theme"
    description="arrow 默认关，避免改变原有外观。气泡挂到 body 后仍抄触发器上的 data-rs-theme，深色岛里不会变回浅色。"
    description-en="arrow defaults off so the old look stays. After mounting on body, the bubble copies data-rs-theme from the trigger, so a dark island does not fall back to light."
    :code="themeCode"
  >
    <div class="tip-row">
      <RsTooltip arrow content="Points at the trigger">
        <RsButton>Arrow</RsButton>
      </RsTooltip>
      <div class="tip-island" data-rs-theme="dark">
        <RsTooltip :content="copy.dark">
          <RsButton>{{ copy.dark }}</RsButton>
        </RsTooltip>
      </div>
    </div>
  </DocDemo>
</template>

<style scoped>
.tip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
}

.compass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-block-end: var(--rs-space-md);
  padding-block: 3rem;
  padding-inline: 6rem;
}

.compass__mid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
}

.tip-delay {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-block: var(--rs-space-sm);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.tip-log {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.tip-island {
  padding-block: var(--rs-space-md);
  padding-inline: var(--rs-space-lg);
  border-radius: var(--rs-radius-md);
  background: var(--rs-bg);
}
</style>
