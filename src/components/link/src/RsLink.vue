<script setup lang="ts">
import { computed } from 'vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import { mergeRsLinkRel, resolveRsLinkTone, type RsLinkTone, type RsLinkUnderline } from './link-utils'

defineOptions({ name: 'RsLink' })

export type { RsLinkTone, RsLinkUnderline }

const props = withDefaults(
  defineProps<{
    href: string
    target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
    rel?: string
    disabled?: boolean
    underline?: RsLinkUnderline
    /** 语义色。默认 primary。不要用业务 CSS 改颜色。 */
    tone?: RsLinkTone
    /** 前缀图标，Lucide kebab-case。装饰性，名称走默认插槽。 */
    icon?: string
  }>(),
  {
    target: '_self',
    rel: undefined,
    disabled: false,
    underline: 'hover',
    tone: undefined,
    icon: undefined,
  },
)

const resolvedTone = computed(() => resolveRsLinkTone(props.tone))
const mergedRel = computed(() => mergeRsLinkRel(props.rel, props.target))

function onClick(event: MouseEvent) {
  if (!props.disabled) return
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <a
    :href="disabled ? undefined : href"
    :target="disabled ? undefined : target"
    :rel="disabled ? undefined : mergedRel"
    class="rs-link"
    :class="{
      'rs-link--disabled': disabled,
      'rs-link--has-icon': Boolean(icon),
      [`rs-link--underline-${underline}`]: true,
      [`rs-link--tone-${resolvedTone}`]: true,
    }"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled ? -1 : undefined"
    @click="onClick"
  >
    <RsIcon v-if="icon" class="rs-link__icon" :name="icon" size="1em" />
    <slot />
  </a>
</template>

<style scoped>
.rs-link {
  display: inline;
  color: var(--rs-link-tone, var(--rs-primary));
  font-size: inherit;
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-tight);
  text-underline-offset: 0.18em;
  text-decoration-thickness: 1px;
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    text-decoration-color var(--rs-transition-fast);
}
.rs-link--has-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
}
.rs-link:visited {
  color: var(--rs-link-tone, var(--rs-primary));
}
.rs-link:hover,
.rs-link:active {
  color: var(--rs-link-tone-hover, var(--rs-primary-hover));
}
.rs-link:focus-visible {
  outline: none;
  border-radius: var(--rs-radius-xs);
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-link--underline-always {
  text-decoration: underline;
}
.rs-link--underline-hover {
  text-decoration: none;
}
.rs-link--underline-hover:hover,
.rs-link--underline-hover:focus-visible {
  text-decoration: underline;
}
.rs-link--underline-none,
.rs-link--underline-none:hover,
.rs-link--underline-none:focus-visible {
  text-decoration: none;
}
.rs-link--tone-primary {
  --rs-link-tone: var(--rs-primary);
  --rs-link-tone-hover: var(--rs-primary-hover);
}
.rs-link--tone-neutral {
  --rs-link-tone: var(--rs-text);
  --rs-link-tone-hover: var(--rs-primary);
}
.rs-link--tone-success {
  --rs-link-tone: var(--rs-success, #18a058);
  --rs-link-tone-hover: var(--rs-success, #18a058);
}
.rs-link--tone-warning {
  --rs-link-tone: var(--rs-warning, #f0a020);
  --rs-link-tone-hover: var(--rs-warning, #f0a020);
}
.rs-link--tone-danger {
  --rs-link-tone: var(--rs-danger);
  --rs-link-tone-hover: var(--rs-danger);
}
.rs-link--tone-info {
  --rs-link-tone: var(--rs-info, #2080f0);
  --rs-link-tone-hover: var(--rs-info, #2080f0);
}
.rs-link__icon {
  color: inherit;
}
.rs-link--disabled,
.rs-link--disabled:visited,
.rs-link--disabled:hover,
.rs-link--disabled:active {
  color: var(--rs-muted);
  cursor: not-allowed;
  text-decoration: none;
}
@media (prefers-reduced-motion: reduce) {
  .rs-link {
    transition: none;
  }
}
</style>
