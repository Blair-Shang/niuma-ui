<script setup lang="ts">
import { ref } from 'vue'
import { RsAnchor, type RsAnchorItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const items: RsAnchorItem[] = [
  { href: '#anchor-demo-basic', title: '基本用法' },
  {
    href: '#anchor-demo-nested',
    title: '嵌套',
    children: [{ href: '#anchor-demo-child', title: '子标题' }],
  },
]

const linelessItems: RsAnchorItem[] = [
  { href: '#anchor-line-basic', title: '无轨道' },
  {
    href: '#anchor-line-nested',
    title: '嵌套',
    children: [{ href: '#anchor-line-child', title: '子标题' }],
  },
]

const basicCode = `<RsAnchor
  :items="items"
  :change-hash="false"
  :get-container="() => scroller"
/>`

const linelessCode = `<RsAnchor :items="items" lineless :change-hash="false" />`

const container = ref<HTMLElement | null>(null)
const linelessBox = ref<HTMLElement | null>(null)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="传入章节 items。Hash 路由必须关闭 change-hash，否则会覆盖当前路由。"
    :code="basicCode"
  >
    <div class="demo">
      <RsAnchor :items="items" :change-hash="false" :get-container="() => container" />
      <div ref="container" class="demo__scroller">
        <section id="anchor-demo-basic">
          <h3>基本用法</h3>
          <p>滚动或点击目录，墨点会跟到当前标题。</p>
        </section>
        <section id="anchor-demo-nested">
          <h3>嵌套</h3>
          <p>children 会缩进一级，适合 API / Token 等子节。</p>
        </section>
        <section id="anchor-demo-child">
          <h3>子标题</h3>
          <p>工作台主栏不是 window 时，把滚动容器交给 getContainer。</p>
        </section>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-lineless"
    title="无轨道"
    description="lineless 只高亮文字，适合空间更紧的侧栏。"
    :code="linelessCode"
  >
    <div class="demo">
      <RsAnchor
        :items="linelessItems"
        lineless
        :change-hash="false"
        :get-container="() => linelessBox"
      />
      <div ref="linelessBox" class="demo__scroller">
        <section id="anchor-line-basic">
          <h3>无轨道</h3>
          <p>同一套 items，关闭墨点轨道。</p>
        </section>
        <section id="anchor-line-nested">
          <h3>嵌套</h3>
          <p>激活项用浅底而不是轨道墨点。</p>
        </section>
        <section id="anchor-line-child">
          <h3>子标题</h3>
          <p>点击仍会平滑滚到对应章节。</p>
        </section>
      </div>
    </div>
  </DocDemo>
</template>

<style scoped>
.demo {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  gap: 1.25rem;
}
.demo__scroller {
  max-height: 16rem;
  overflow: auto;
  padding: 0 0.75rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
}
.demo__scroller section {
  min-height: 8.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--rs-border-subtle);
}
.demo__scroller h3 {
  margin: 0 0 0.5rem;
  font-size: var(--rs-font-size-sm);
}
.demo__scroller p {
  margin: 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.6;
}
</style>
