<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsInput, RsPopover, type RsPopoverExpose, type RsPopoverWidth } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const controlled = ref(false)
const eventLog = ref('')
const note = ref('')
const methodLog = ref('')
const methodRef = ref<RsPopoverExpose | null>(null)
const draft = ref('')
const widths: RsPopoverWidth[] = ['sm', 'md', 'lg', 'auto']

const { copy } = useSiteDemo({
  'en-US': {
    open: 'Open note',
    body: 'The session is saved after connect. Put a short action here, not a confirm.',
    title: 'Filter',
    closeBody: 'Title names the dialog. The close button uses popover.close.',
    hover: 'Hover',
    focus: 'Focus',
    outside: 'Open from outside',
    shut: 'Close from outside',
    idle: 'openChange has not fired.',
    slotIdle: 'Apply has not run.',
    hit: (value: boolean) => `openChange → ${value}`,
    modal: 'Modal',
    modalBody: 'Tab stays in this panel. Page scroll is not locked.',
    apply: 'Apply',
    applied: (value: string) => `apply → ${value || '(empty)'}`,
    namePh: 'Name',
    openM: 'open()',
    closeM: 'close()',
    focusM: 'focus()',
    methodIdle: 'Call open(), close(), or focus().',
    methodHit: (name: string) => `${name} → done`,
    arrow: 'With arrow',
    dark: 'Dark surface — the panel copies data-rs-theme.',
    disabled: 'Disabled',
    disabledHint: 'disabled does not open.',
  },
  'zh-CN': {
    open: '打开说明',
    body: '连接成功后写入会话。这里放短操作，不放确认。',
    title: '筛选',
    closeBody: '标题就是对话框名称。关闭按钮走 popover.close。',
    hover: '悬停',
    focus: '聚焦',
    outside: '外部打开',
    shut: '外部关闭',
    idle: '还没有 openChange。',
    slotIdle: '还没有应用。',
    hit: (value: boolean) => `openChange → ${value}`,
    modal: '模态',
    modalBody: 'Tab 留在这块面板里。页面滚动不锁。',
    apply: '应用',
    applied: (value: string) => `apply → ${value || '（空）'}`,
    namePh: '名称',
    openM: 'open()',
    closeM: 'close()',
    focusM: 'focus()',
    methodIdle: '调用 open()、close() 或 focus()。',
    methodHit: (name: string) => `${name} → done`,
    arrow: '带箭头',
    dark: '深色表面 — 面板抄 data-rs-theme。',
    disabled: '禁用',
    disabledHint: 'disabled 时打不开。',
  },
})

const eventNote = computed(() => eventLog.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onOpenChange(value: boolean) {
  eventLog.value = copy.value.hit(value)
}

function applyDraft(close: () => void) {
  note.value = copy.value.applied(draft.value.trim())
  close()
}

function callOpen() {
  methodRef.value?.open()
  methodLog.value = copy.value.methodHit('open()')
}

function callClose() {
  methodRef.value?.close()
  methodLog.value = copy.value.methodHit('close()')
}

function callFocus() {
  methodRef.value?.focus()
  methodLog.value = copy.value.methodHit('focus()')
}

const basicCode = `<RsPopover>
  <RsButton variant="default">Open note</RsButton>
  <template #content>
    <p>The session is saved after connect.</p>
  </template>
</RsPopover>`

const titleCode = `<RsPopover title="Filter" show-close>
  <RsButton variant="default">Open note</RsButton>
  <template #content>
    <p>Title names the dialog.</p>
  </template>
</RsPopover>`

const placeCode = `<RsPopover side="left" align="center" width="auto">
  <RsButton size="sm">left</RsButton>
  <template #content><p>left</p></template>
</RsPopover>`

const triggerCode = `<RsPopover trigger="hover">
  <RsButton variant="default">Hover</RsButton>
  <template #content><p>Hover card</p></template>
</RsPopover>

<RsPopover trigger="focus">
  <RsButton variant="default">Focus</RsButton>
  <template #content><p>Focus card</p></template>
</RsPopover>`

const controlCode = `<RsPopover v-model:open="open" @open-change="onOpenChange">
  <RsButton variant="default">Open note</RsButton>
  <template #content><p>Controlled</p></template>
</RsPopover>`

const modalCode = `<RsPopover modal>
  <RsButton variant="default">Modal</RsButton>
  <template #content>
    <p>Tab stays in this panel.</p>
  </template>
</RsPopover>`

const slotCode = `<RsPopover>
  <RsButton variant="default">Filter</RsButton>
  <template #title>Filter</template>
  <template #content="{ close }">
    <RsInput v-model="name" />
    <RsButton @click="close()">Apply</RsButton>
  </template>
</RsPopover>`

const methodCode = `<RsPopover ref="popoverRef">
  <RsButton variant="default">Open note</RsButton>
  <template #content><p>Panel</p></template>
</RsPopover>
<RsButton @click="popoverRef?.open()">open()</RsButton>
<RsButton @click="popoverRef?.focus()">focus()</RsButton>`

const themeCode = `<div data-rs-theme="dark">
  <RsPopover arrow>
    <RsButton variant="default">With arrow</RsButton>
    <template #content><p>Theme follows data-rs-theme.</p></template>
  </RsPopover>
</div>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="默认插槽是触发器，#content 是面板。点一下打开，再点、Esc 或外部按下关闭。"
    description-en="The default slot is the trigger. #content is the panel. Click opens it; click again, Escape, or an outside press closes it."
    :code="basicCode"
  >
    <RsPopover>
      <RsButton variant="default">{{ copy.open }}</RsButton>
      <template #content>
        <p class="text">{{ copy.body }}</p>
      </template>
    </RsPopover>
  </DocDemo>

  <DocDemo
    id="demo-title"
    title="标题与关闭"
    title-en="Title and close"
    description="有标题时，标题是对话框的可访问名称。关闭按钮的名称跟语言包。"
    description-en="With a title, that title is the dialog name. The close button follows the locale pack."
    :code="titleCode"
  >
    <RsPopover :title="copy.title" show-close>
      <RsButton variant="default">{{ copy.open }}</RsButton>
      <template #content>
        <p class="text">{{ copy.closeBody }}</p>
      </template>
    </RsPopover>
  </DocDemo>

  <DocDemo
    id="demo-placement"
    title="方向与宽度"
    title-en="Placement and width"
    description="点对应方向的按钮，面板就开在那一侧。贴边放不下才翻到对侧。下面四个按钮各自打开一种宽度。"
    description-en="Each button opens on its own side, and flips only when that side does not fit. The four buttons below each open one width."
    :code="placeCode"
  >
    <div class="compass">
      <RsPopover side="top" align="center" width="auto">
        <RsButton size="sm" variant="default">top</RsButton>
        <template #content>
          <p class="text">top</p>
        </template>
      </RsPopover>
      <div class="compass__mid">
        <RsPopover side="left" align="center" width="auto">
          <RsButton size="sm" variant="default">left</RsButton>
          <template #content>
            <p class="text">left</p>
          </template>
        </RsPopover>
        <RsPopover side="right" align="center" width="auto">
          <RsButton size="sm" variant="default">right</RsButton>
          <template #content>
            <p class="text">right</p>
          </template>
        </RsPopover>
      </div>
      <RsPopover side="bottom" align="center" width="auto">
        <RsButton size="sm" variant="default">bottom</RsButton>
        <template #content>
          <p class="text">bottom</p>
        </template>
      </RsPopover>
    </div>
    <div class="row">
      <RsPopover v-for="item in widths" :key="item" side="bottom" align="center" :width="item">
        <RsButton size="sm" variant="default">{{ item }}</RsButton>
        <template #content>
          <p class="text">{{ item }}</p>
        </template>
      </RsPopover>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-trigger"
    title="悬停与聚焦"
    title-en="Hover and focus"
    description="默认只有 click。hover 和 focus 是另开的方式，不会在鼠标移过时抢走焦点。"
    description-en="The default is click only. hover and focus are opt-in and do not steal focus."
    :code="triggerCode"
  >
    <div class="row">
      <RsPopover trigger="hover">
        <RsButton variant="default">{{ copy.hover }}</RsButton>
        <template #content>
          <p class="text">{{ copy.hover }}</p>
        </template>
      </RsPopover>
      <RsPopover trigger="focus">
        <RsButton variant="default">{{ copy.focus }}</RsButton>
        <template #content>
          <p class="text">{{ copy.focus }}</p>
        </template>
      </RsPopover>
      <RsPopover disabled>
        <RsButton variant="default">{{ copy.disabled }}</RsButton>
        <template #content>
          <p class="text">{{ copy.disabledHint }}</p>
        </template>
      </RsPopover>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-control"
    title="受控与事件"
    title-en="Controlled"
    description="v-model:open 跟外部按钮共用。openChange 在预览里能看见。"
    description-en="v-model:open is shared with the outside buttons. openChange shows up in the preview."
    :code="controlCode"
  >
    <div class="row">
      <RsButton size="sm" @click="controlled = true">{{ copy.outside }}</RsButton>
      <RsButton size="sm" variant="default" @click="controlled = false">{{ copy.shut }}</RsButton>
    </div>
    <RsPopover v-model:open="controlled" @open-change="onOpenChange">
      <RsButton variant="default">{{ copy.open }}</RsButton>
      <template #content>
        <p class="text">{{ eventNote }}</p>
      </template>
    </RsPopover>
    <p class="log">{{ eventNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-modal"
    title="模态"
    title-en="Modal"
    description="Tab 困在面板里。页面滚动不锁，整页打断请用 Dialog。"
    description-en="Tab stays in the panel. Page scroll stays free. A full stop belongs on Dialog."
    :code="modalCode"
  >
    <RsPopover modal :title="copy.modal" show-close>
      <RsButton variant="default">{{ copy.modal }}</RsButton>
      <template #content>
        <p class="text">{{ copy.modalBody }}</p>
        <div class="row">
          <RsButton size="sm" variant="default">A</RsButton>
          <RsButton size="sm">B</RsButton>
        </div>
      </template>
    </RsPopover>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#title 替换标题，#content 收到 close。点应用能看见结果。"
    description-en="#title replaces the title. #content receives close. Apply shows the result."
    :code="slotCode"
  >
    <RsPopover>
      <RsButton variant="default">{{ copy.title }}</RsButton>
      <template #title>{{ copy.title }}</template>
      <template #content="{ close }">
        <div class="form">
          <RsInput v-model="draft" :placeholder="copy.namePh" />
          <RsButton size="sm" @click="applyDraft(close)">{{ copy.apply }}</RsButton>
        </div>
      </template>
    </RsPopover>
    <p class="log">{{ note || copy.slotIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主调用 open()、close()、focus()。toggle() 同样在 ref 上。"
    description-en="The host calls open(), close(), and focus(). toggle() is on the same ref."
    :code="methodCode"
  >
    <div class="row">
      <RsPopover ref="methodRef">
        <RsButton variant="default">{{ copy.open }}</RsButton>
        <template #content>
          <p class="text">{{ methodNote }}</p>
        </template>
      </RsPopover>
      <RsButton size="sm" variant="default" @click="callOpen">{{ copy.openM }}</RsButton>
      <RsButton size="sm" variant="default" @click="callClose">{{ copy.closeM }}</RsButton>
      <RsButton size="sm" variant="default" @click="callFocus">{{ copy.focusM }}</RsButton>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="箭头与主题"
    title-en="Arrow and theme"
    description="箭头默认关闭。深色岛上的面板跟 data-rs-theme，不要写死颜色。"
    description-en="The arrow is off by default. On a dark island the panel follows data-rs-theme. Do not hard-code color."
    :code="themeCode"
  >
    <div class="island" data-rs-theme="dark">
      <RsPopover arrow>
        <RsButton variant="default">{{ copy.arrow }}</RsButton>
        <template #content>
          <p class="text">{{ copy.dark }}</p>
        </template>
      </RsPopover>
    </div>
  </DocDemo>
</template>

<style scoped>
.text {
  margin: 0;
  color: var(--rs-popover-fg, var(--rs-text-primary));
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.row {
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
  padding-block: 4.5rem;
  padding-inline: 12rem;
}

.compass__mid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
}

.form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--rs-space-sm);
}

.log {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.island {
  padding: var(--rs-space-lg);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}
</style>
