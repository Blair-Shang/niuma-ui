<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsEmpty, RsIcon } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const emptyRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    title: 'No projects yet',
    desc: 'Create the first project to start collaborating.',
    create: 'New project',
    inbox: 'Inbox is empty. New mail will show up here.',
    searchTitle: 'No results for “design system”',
    searchDesc: 'Check the spelling, or browse all documents.',
    membersTitle: 'No teammates yet',
    membersDesc: 'Invite people to edit and review together.',
    learn: 'Learn about roles',
    invite: 'Invite',
    fillHint: 'The pane is empty. Run a query to fill it.',
    square: 'Square frame and badge.',
    smallRadius: 'sm radius on the frame and badge.',
    fillSquare: 'fill plus a square badge inside a pane.',
    slotTitle: 'Custom heading',
    slotDesc: 'Description slot can hold a link.',
    docs: 'Browse docs',
    listTitle: 'No tasks in this list',
    listAction: 'New task',
    failTitle: 'Could not load',
    failDesc: 'The network is unstable. Try again in a moment.',
    back: 'Back',
    retry: 'Retry',
    darkSurface: 'Dark surface — empty tokens follow data-rs-theme, do not hard-code color',
    idle: 'RsEmpty emits nothing. Bind create / retry on RsButton.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no reset() on the empty ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    title: '还没有项目',
    desc: '创建第一个项目，开始协作与发布。',
    create: '新建项目',
    inbox: '收件箱是空的，新消息会出现在这里。',
    searchTitle: '没有匹配「design system」的内容',
    searchDesc: '检查拼写，或浏览全部文档。',
    membersTitle: '暂无团队成员',
    membersDesc: '邀请同事加入工作区，一起编辑与评审。',
    learn: '了解权限',
    invite: '邀请成员',
    fillHint: '结果区暂无数据，执行查询后显示在这里。',
    square: '外层与图标均为直角。',
    smallRadius: '外层与图标均为 sm。',
    fillSquare: 'fill + 直角图标（面板内嵌）。',
    slotTitle: '自定义标题',
    slotDesc: '描述插槽里可以放链接。',
    docs: '浏览文档',
    listTitle: '当前分类下没有任务。',
    listAction: '新建任务',
    failTitle: '加载失败',
    failDesc: '网络不稳定，请稍后重试。',
    back: '返回',
    retry: '重试',
    darkSurface: '深色表面 — 空态 token 跟 data-rs-theme，不要写死颜色',
    idle: 'RsEmpty 不发事件。新建 / 重试绑在 RsButton 上。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。空态 ref 上没有 reset()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsEmpty>
  <RsButton variant="primary" size="sm">New project</RsButton>
</RsEmpty>`

const copyCode = `<RsEmpty
  title="No projects yet"
  description="Create the first project to start collaborating."
/>`

const presetCode = `<RsEmpty />
<RsEmpty preset="simple" />
<RsEmpty preset="search" />`

const sizeCode = `<RsEmpty size="sm" />
<RsEmpty size="md" />
<RsEmpty size="lg" />`

const iconCode = `<RsEmpty description="Inbox is empty. New mail will show up here.">
  <template #icon>
    <RsIcon name="inbox" :size="22" />
  </template>
</RsEmpty>`

const imageCode = `<RsEmpty image="/empty.svg" image-size="72" />
<RsEmpty>
  <template #image>
    <RsIcon name="folder-open" :size="36" />
  </template>
</RsEmpty>`

const fillCode = `<div class="host">
  <RsEmpty fill description="The pane is empty." />
</div>`

const radiusCode = `<RsEmpty radius="none" icon-radius="none">
  <template #icon>
    <RsIcon name="inbox" :size="22" />
  </template>
</RsEmpty>`

const slotsCode = `<RsEmpty>
  <template #title>Custom heading</template>
  <template #description>Description slot can hold a link.</template>
  <RsButton size="sm">Browse docs</RsButton>
</RsEmpty>`

const sceneCode = `<RsEmpty title="Could not load" description="The network is unstable.">
  <template #icon>
    <RsIcon name="cloud-off" :size="22" />
  </template>
  <RsButton size="sm" variant="default">Back</RsButton>
  <RsButton size="sm">Retry</RsButton>
</RsEmpty>`

const eventsCode = `<RsEmpty>
  <RsButton size="sm">New project</RsButton>
</RsEmpty>`

const methodsCode = `const empty = ref()
// RsEmpty has no defineExpose — empty.value.reset is undefined
<RsEmpty ref="empty" />`

function inspectEmptyRef() {
  const inst = emptyRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="未传 description 走 locale。默认插槽放下一步操作。颜色跟 token，不要写死 hex。"
    description-en="Omit description to use locale. Put the next step in the default slot. Colors follow tokens — do not hard-code hex."
    :code="basicCode"
  >
    <RsEmpty>
      <RsButton variant="primary" size="sm">{{ copy.create }}</RsButton>
    </RsEmpty>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsEmpty>
          <RsButton variant="primary" size="sm">{{ copy.create }}</RsButton>
        </RsEmpty>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-copy"
    title="标题与描述"
    title-en="Title and description"
    description="title 是可选主文案。description 由业务传入；显式空字符串会隐藏说明。"
    description-en="title is optional. Pass description from the product. An empty string hides the supporting copy."
    :code="copyCode"
  >
    <RsEmpty :title="copy.title" :description="copy.desc" />
  </DocDemo>

  <DocDemo
    id="demo-preset"
    title="内置插图"
    title-en="Presets"
    description="default 是空卡片线稿，simple 更轻，search 会换 empty.search 文案。自定义图请用 #image / #icon。"
    description-en="default is an empty-card sketch, simple is lighter, and search switches to empty.search. Use #image or #icon for custom art."
    :code="presetCode"
  >
    <div class="stack">
      <RsEmpty />
      <RsEmpty preset="simple" />
      <RsEmpty preset="search" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="三档密度：sm 表格内、md 默认、lg 整页。没有 ssm，也不跟 Form。"
    description-en="Three densities: sm in a table, md by default, lg on a page. There is no ssm, and it does not follow Form."
    :code="sizeCode"
  >
    <div class="stack">
      <RsEmpty size="sm" />
      <RsEmpty size="md" />
      <RsEmpty size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-icon"
    title="自定义图标"
    title-en="Custom icon"
    description="#icon 画在圆形徽章里，常用 RsIcon。不要给装饰图标绑 click。"
    description-en="#icon sits in the circular badge. RsIcon is typical. Do not bind click on a decorative icon."
    :code="iconCode"
  >
    <div class="stack">
      <RsEmpty :description="copy.inbox">
        <template #icon>
          <RsIcon name="inbox" :size="22" />
        </template>
      </RsEmpty>
      <RsEmpty :title="copy.searchTitle" :description="copy.searchDesc">
        <template #icon>
          <RsIcon name="search-x" :size="22" />
        </template>
      </RsEmpty>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-image"
    title="自定义插图"
    title-en="Custom image"
    description="image 是 URL，失败回退 preset。#image 整块替换、不带徽章底。演示用图标代替远程图，避免外链。"
    description-en="image is a URL and falls back to the preset on error. #image replaces the whole figure without the badge. This demo uses an icon instead of a remote file."
    :code="imageCode"
  >
    <RsEmpty image-size="72">
      <template #image>
        <RsIcon name="folder-open" :size="36" />
      </template>
    </RsEmpty>
  </DocDemo>

  <DocDemo
    id="demo-fill"
    title="占满父级"
    title-en="Fill"
    description="fill 占满父级并去掉虚线框。父级需要有高度。图标圆角仍由 iconRadius 控制。"
    description-en="fill stretches into the parent and drops the dashed frame. The parent needs a height. Badge radius still follows iconRadius."
    :code="fillCode"
  >
    <div class="fill-host">
      <RsEmpty fill :description="copy.fillHint">
        <template #icon>
          <RsIcon name="play-circle" :size="22" />
        </template>
      </RsEmpty>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radius"
    title="圆角"
    title-en="Radius"
    description="radius 控制外框，iconRadius 控制徽章。档位 none | xs | sm | md | lg | full。不要 :deep 改圆角。"
    description-en="radius is the frame; iconRadius is the badge. Steps: none | xs | sm | md | lg | full. Do not :deep the radius."
    :code="radiusCode"
  >
    <div class="stack">
      <RsEmpty radius="none" icon-radius="none" :description="copy.square">
        <template #icon>
          <RsIcon name="inbox" :size="22" />
        </template>
      </RsEmpty>
      <RsEmpty radius="sm" icon-radius="sm" :description="copy.smallRadius">
        <template #icon>
          <RsIcon name="folder-open" :size="22" />
        </template>
      </RsEmpty>
      <RsEmpty fill icon-radius="none" :description="copy.fillSquare">
        <template #icon>
          <RsIcon name="play-circle" :size="22" />
        </template>
      </RsEmpty>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#title / #description 可包链接。默认插槽是操作，没有 #extra。"
    description-en="#title and #description can hold a link. The default slot is actions — there is no #extra."
    :code="slotsCode"
  >
    <RsEmpty>
      <template #icon>
        <RsIcon name="users" :size="22" />
      </template>
      <template #title>{{ copy.slotTitle }}</template>
      <template #description>{{ copy.slotDesc }}</template>
      <RsButton size="sm">{{ copy.docs }}</RsButton>
    </RsEmpty>
  </DocDemo>

  <DocDemo
    id="demo-scene"
    title="业务场景"
    title-en="Scenes"
    description="列表空态、搜索无结果、加载失败用同一组件，只换文案、图标和按钮。失败不是 Dialog。"
    description-en="List-empty, search-empty, and load-failed share this component — only copy, icon, and buttons change. Failure is not a Dialog."
    :code="sceneCode"
  >
    <div class="stack">
      <div class="panel">
        <RsEmpty :description="copy.listTitle">
          <template #icon>
            <RsIcon name="list-todo" :size="22" />
          </template>
          <RsButton size="sm">{{ copy.listAction }}</RsButton>
        </RsEmpty>
      </div>
      <div class="panel">
        <RsEmpty preset="search" :title="copy.searchTitle" :description="copy.searchDesc" />
      </div>
      <div class="panel">
        <RsEmpty :title="copy.failTitle" :description="copy.failDesc">
          <template #icon>
            <RsIcon name="cloud-off" :size="22" />
          </template>
          <RsButton size="sm" variant="default">{{ copy.back }}</RsButton>
          <RsButton size="sm">{{ copy.retry }}</RsButton>
        </RsEmpty>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。点空态本身不会发 click / change。可感知的操作请绑 RsButton。"
    description-en="No component events. A click on the empty state does not emit click or change. Bind actions on RsButton."
    :code="eventsCode"
  >
    <RsEmpty :title="copy.membersTitle" :description="copy.membersDesc">
      <template #icon>
        <RsIcon name="users" :size="22" />
      </template>
      <RsButton variant="default">{{ copy.learn }}</RsButton>
      <RsButton>{{ copy.invite }}</RsButton>
    </RsEmpty>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改文案走 props。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change copy with props. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsEmpty ref="emptyRef" size="sm" />
      <RsButton variant="default" @click="inspectEmptyRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: 0.75rem;
  background: var(--rs-surface);
  color: var(--rs-text);
}

.panel {
  padding: 0.75rem;
  border-radius: var(--rs-radius);
  border: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
}

.fill-host {
  display: flex;
  flex-direction: column;
  height: 12rem;
  border: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
  overflow: hidden;
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text);
}
</style>
