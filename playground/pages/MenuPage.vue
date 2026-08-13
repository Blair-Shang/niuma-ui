<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsMenu, type RsMenuItem, type RsMenuItemGroup } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const flatActive = ref('dashboard')
const flatItems: RsMenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
  { key: 'chat', label: '对话', icon: 'message-square' },
  { key: 'settings', label: '设置', icon: 'settings' },
  { key: 'disabled', label: '不可用', icon: 'ban', disabled: true },
]

const active = ref('projects')
const openKeys = ref<string[]>([])
const lastSelect = ref('projects')
const highlightParent = ref(false)

const menuItems: RsMenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      { key: 'projects', label: '项目' },
      { key: 'docs', label: '文档' },
      { key: 'archive', label: '归档', disabled: true },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]

const deepActive = ref('alpha-permissions')
const deepOpenKeys = ref<string[]>([])

const deepNestedItems: RsMenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      {
        key: 'team-alpha',
        label: 'Alpha 团队',
        icon: 'users',
        children: [
          { key: 'alpha-projects', label: '项目列表' },
          { key: 'alpha-members', label: '成员管理' },
          {
            key: 'alpha-settings',
            label: '团队设置',
            children: [
              { key: 'alpha-general', label: '常规' },
              { key: 'alpha-permissions', label: '权限' },
              { key: 'alpha-audit', label: '审计日志', disabled: true },
            ],
          },
        ],
      },
      {
        key: 'team-beta',
        label: 'Beta 团队',
        children: [
          { key: 'beta-projects', label: '项目列表' },
          { key: 'beta-members', label: '成员管理' },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: '资源中心',
    icon: 'layers',
    children: [
      {
        key: 'templates',
        label: '模板库',
        children: [
          { key: 'tpl-design', label: '设计模板' },
          { key: 'tpl-dev', label: '开发模板' },
        ],
      },
      { key: 'marketplace', label: '应用市场' },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]

const groupedDeepActive = ref('saas-billing')
const groupedDeepOpenKeys = ref<string[]>([])

const groupedDeepItems: RsMenuItemGroup[] = [
  {
    label: '产品',
    children: [
      {
        key: 'product-line',
        label: '产品线',
        icon: 'box',
        children: [
          {
            key: 'saas',
            label: 'SaaS',
            children: [
              { key: 'saas-dashboard', label: '控制台' },
              { key: 'saas-billing', label: '计费' },
            ],
          },
          { key: 'enterprise', label: '企业版' },
        ],
      },
    ],
  },
  {
    label: '运营',
    children: [
      {
        key: 'analytics',
        label: '数据分析',
        icon: 'bar-chart-3',
        children: [
          { key: 'analytics-overview', label: '概览' },
          { key: 'analytics-funnel', label: '漏斗' },
        ],
      },
      { key: 'campaigns', label: '营销活动', icon: 'megaphone' },
    ],
  },
]

const collapsed = ref(true)
const collapsedActive = ref('settings')
const collapsedOpenKeys = ref<string[]>(['workspace'])
const collapsedLastSelect = ref('settings')

/** 折叠态专用：父级与子级均带图标，便于验证仅图标栏与 flyout 内图标 */
const collapsedIconItems: RsMenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      { key: 'projects', label: '项目', icon: 'box' },
      { key: 'docs', label: '文档', icon: 'file-text' },
      {
        key: 'share',
        label: '分享',
        icon: 'share-2',
        children: [
          { key: 'share-slack', label: 'Slack', icon: 'message-square' },
          { key: 'share-email', label: '邮件', icon: 'mail' },
        ],
      },
      { key: 'archive', label: '归档', icon: 'archive', disabled: true },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]

const groupedActive = ref('billing')
const groupedItems: RsMenuItemGroup[] = [
  {
    label: '工作区',
    children: [
      { key: 'apps', label: '应用', icon: 'layout-dashboard' },
      { key: 'chat', label: '对话', icon: 'message-square' },
    ],
  },
  {
    label: '账户',
    children: [
      { key: 'billing', label: '账单', icon: 'credit-card' },
      { key: 'security', label: '安全', icon: 'shield-check' },
    ],
  },
]

const horizontalNestedActive = ref('share-email')
const horizontalNestedOpenKeys = ref<string[]>([])

const horizontalNestedItems: RsMenuItem[] = [
  { key: 'home', label: '首页', icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      { key: 'projects', label: '项目' },
      {
        key: 'share',
        label: '分享',
        icon: 'share-2',
        children: [
          { key: 'share-slack', label: 'Slack' },
          { key: 'share-email', label: '邮件' },
          { key: 'share-link', label: '复制链接' },
        ],
      },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]

const horizontalCollapsedActive = ref('home')
const horizontalCollapsedOpenKeys = ref<string[]>([])
</script>

<template>
  <DemoPage title="RsMenu" test-file="RsMenu.spec.ts">
    <DemoBlock title="扁平菜单">
      <p class="menu-hint">无分组、无嵌套；点击叶子项更新选中态。禁用项不可选。</p>
      <p class="menu-hint">
        选中项：<code>{{ flatActive }}</code>
      </p>
      <div class="menu-frame">
        <RsMenu v-model="flatActive" :items="flatItems" />
      </div>
    </DemoBlock>

    <DemoBlock title="单层嵌套">
      <p class="menu-hint">
        点击父级展开/收起子菜单；选中深层叶子时会自动把祖先写入
        <code>openKeys</code>。默认只高亮叶子；开启
        <code>highlightParent</code>
        后祖先父级仅字体高亮（无背景）。
      </p>
      <div class="menu-toolbar">
        <RsButton size="sm" variant="secondary" @click="highlightParent = !highlightParent">
          {{ highlightParent ? '关闭父级高亮' : '开启父级高亮' }}
        </RsButton>
        <span class="menu-hint menu-hint--inline">
          选中项：<code>{{ active }}</code>
          · 展开：<code>{{ openKeys.join(', ') || '—' }}</code>
          · select：<code>{{ lastSelect }}</code>
          · highlightParent：<code>{{ highlightParent }}</code>
        </span>
      </div>
      <div class="menu-frame">
        <RsMenu
          v-model="active"
          v-model:open-keys="openKeys"
          :items="menuItems"
          :highlight-parent="highlightParent"
          @select="lastSelect = $event"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="多层嵌套（4 级）">
      <p class="menu-hint">
        选中深层项会自动展开全部祖先。选中项：
        <code>{{ deepActive }}</code>
        · 展开：
        <code>{{ deepOpenKeys.join(', ') || '—' }}</code>
      </p>
      <div class="menu-frame menu-frame--tall">
        <RsMenu
          v-model="deepActive"
          v-model:open-keys="deepOpenKeys"
          :items="deepNestedItems"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="分组菜单（垂直）">
      <p class="menu-hint">分组标题仅展示，不参与选中；分组内可继续嵌套。</p>
      <div class="menu-frame menu-frame--tall">
        <RsMenu
          v-model="groupedDeepActive"
          v-model:open-keys="groupedDeepOpenKeys"
          :items="groupedDeepItems"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="收起态（仅图标）">
      <p class="menu-hint">
        垂直折叠后只显示图标。叶子项悬停显示原生
        <code>title</code>
        ；有子菜单的项悬停会在右侧弹出浮层子菜单（子项也可带图标），选中后浮层关闭。
      </p>
      <div class="menu-toolbar">
        <RsButton size="sm" variant="secondary" @click="collapsed = !collapsed">
          {{ collapsed ? '展开菜单' : '收起菜单' }}
        </RsButton>
        <span class="menu-hint menu-hint--inline">
          选中：<code>{{ collapsedActive }}</code>
          · openKeys：<code>{{ collapsedOpenKeys.join(', ') || '—' }}</code>
          · select：<code>{{ collapsedLastSelect }}</code>
        </span>
      </div>
      <div class="menu-compare">
        <div
          class="menu-frame"
          :class="{ 'menu-frame--collapsed': collapsed }"
        >
          <p class="menu-caption">可切换 · 父子均带图标</p>
          <RsMenu
            v-model="collapsedActive"
            v-model:open-keys="collapsedOpenKeys"
            :items="collapsedIconItems"
            :collapsed="collapsed"
            @select="collapsedLastSelect = $event"
          />
        </div>
        <div class="menu-frame menu-frame--collapsed">
          <p class="menu-caption">固定收起 · 悬停看 flyout 图标</p>
          <RsMenu
            v-model="collapsedActive"
            v-model:open-keys="collapsedOpenKeys"
            :items="collapsedIconItems"
            collapsed
            @select="collapsedLastSelect = $event"
          />
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="分组菜单（水平）">
      <p class="menu-hint">水平模式下分组标题隐藏，子项横向排列。</p>
      <div class="menu-frame menu-frame--wide">
        <RsMenu v-model="groupedActive" :items="groupedItems" mode="horizontal" />
      </div>
    </DemoBlock>

    <DemoBlock title="水平 + 嵌套子菜单">
      <p class="menu-hint">
        水平模式下子菜单以悬浮面板展开。选中：
        <code>{{ horizontalNestedActive }}</code>
        · 展开：
        <code>{{ horizontalNestedOpenKeys.join(', ') || '—' }}</code>
      </p>
      <div class="menu-frame menu-frame--wide">
        <RsMenu
          v-model="horizontalNestedActive"
          v-model:open-keys="horizontalNestedOpenKeys"
          :items="horizontalNestedItems"
          mode="horizontal"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="水平 + collapsed 属性">
      <p class="menu-hint">
        <code>collapsed</code>
        仅约束垂直模式；水平模式下该属性被忽略（不隐藏文案、不折叠子菜单），行为与普通水平菜单一致。
      </p>
      <div class="menu-frame menu-frame--wide">
        <RsMenu
          v-model="horizontalCollapsedActive"
          v-model:open-keys="horizontalCollapsedOpenKeys"
          :items="horizontalNestedItems"
          mode="horizontal"
          collapsed
        />
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.menu-frame {
  width: 14rem;
  padding: 0.5rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
}
.menu-frame--wide {
  width: 100%;
}
.menu-frame--tall {
  width: 16rem;
}
.menu-frame--collapsed {
  width: 3rem;
  padding: 0.5rem 0.25rem;
}
.menu-hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: 1.5;
}
.menu-hint--inline {
  margin: 0;
}
.menu-hint code {
  padding: 0.125rem 0.375rem;
  border-radius: var(--rs-radius-xs);
  background: var(--rs-surface-hover);
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  color: var(--rs-text);
}
.menu-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.menu-compare {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
}
.menu-caption {
  margin: 0 0 0.375rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
</style>
