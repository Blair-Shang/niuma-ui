<script setup lang="ts">
import { computed } from 'vue'
import {
  resolveRsContainerStyle,
  type RsContainerGap,
  type RsContainerMaxWidth,
  type RsContainerMaybeResponsive,
  type RsContainerPadding,
} from './container-utils'

defineOptions({ name: 'RsContainer' })

export type {
  RsContainerBreakpoint,
  RsContainerGap,
  RsContainerMaxWidth,
  RsContainerMaybeResponsive,
  RsContainerPadding,
  RsContainerResponsive,
} from './container-utils'

const props = withDefaults(
  defineProps<{
    /** 最大内容宽度；`fluid` 为 true 时忽略。 */
    maxWidth?: RsContainerMaybeResponsive<RsContainerMaxWidth>
    /** 水平内边距。 */
    padding?: RsContainerMaybeResponsive<RsContainerPadding>
    /** 是否在父级内水平居中。 */
    centered?: boolean
    /** 占满父级宽度，忽略 `maxWidth`。 */
    fluid?: boolean
    /** 根元素标签名。 */
    tag?: string
    /** 启用栅格布局；未传 `columns` 时默认为 12 栅格。 */
    grid?: boolean
    /** 栅格列数，支持响应式。 */
    columns?: RsContainerMaybeResponsive<number>
    /** 栅格间距，支持响应式。 */
    gap?: RsContainerMaybeResponsive<RsContainerGap>
  }>(),
  {
    maxWidth: 'lg',
    padding: 'md',
    centered: true,
    fluid: false,
    tag: 'div',
    grid: false,
    columns: 12,
    gap: 'md',
  },
)

const rootClass = computed(() => [
  'rs-container',
  { 'rs-container--centered': props.centered, 'rs-container--grid': props.grid },
])

const rootStyle = computed(() =>
  resolveRsContainerStyle({
    maxWidth: props.maxWidth,
    padding: props.padding,
    fluid: props.fluid,
    grid: props.grid,
    columns: props.columns,
    gap: props.gap,
  }),
)
</script>

<template>
  <component :is="tag" :class="rootClass" :style="rootStyle">
    <slot />
  </component>
</template>

<style scoped>
.rs-container {
  width: 100%;
  box-sizing: border-box;
  max-width: var(--rs-container-max-current, var(--rs-container-max-lg));
  padding-inline: var(--rs-container-padding-current, var(--rs-space-md));
}

.rs-container--centered {
  margin-inline: auto;
}

.rs-container--grid {
  display: grid;
  grid-template-columns: repeat(var(--rs-container-columns-current, 12), minmax(0, 1fr));
  gap: var(--rs-container-gap-current, var(--rs-space-md));
}

@media (width >= 40rem) {
  .rs-container {
    max-width: var(--rs-container-max-sm, var(--rs-container-max-current, var(--rs-container-max-lg)));
    padding-inline: var(--rs-container-padding-sm, var(--rs-container-padding-current, var(--rs-space-md)));
  }

  .rs-container--grid {
    grid-template-columns: repeat(
      var(--rs-container-columns-sm, var(--rs-container-columns-current, 12)),
      minmax(0, 1fr)
    );
    gap: var(--rs-container-gap-sm, var(--rs-container-gap-current, var(--rs-space-md)));
  }
}

@media (width >= 48rem) {
  .rs-container {
    max-width: var(--rs-container-max-md, var(--rs-container-max-sm, var(--rs-container-max-current)));
    padding-inline: var(
      --rs-container-padding-md,
      var(--rs-container-padding-sm, var(--rs-container-padding-current))
    );
  }

  .rs-container--grid {
    grid-template-columns: repeat(
      var(--rs-container-columns-md, var(--rs-container-columns-sm, var(--rs-container-columns-current, 12))),
      minmax(0, 1fr)
    );
    gap: var(--rs-container-gap-md, var(--rs-container-gap-sm, var(--rs-container-gap-current)));
  }
}

@media (width >= 64rem) {
  .rs-container {
    max-width: var(
      --rs-container-max-lg,
      var(--rs-container-max-md, var(--rs-container-max-sm, var(--rs-container-max-current)))
    );
    padding-inline: var(
      --rs-container-padding-lg,
      var(--rs-container-padding-md, var(--rs-container-padding-sm, var(--rs-container-padding-current)))
    );
  }

  .rs-container--grid {
    grid-template-columns: repeat(
      var(
        --rs-container-columns-lg,
        var(--rs-container-columns-md, var(--rs-container-columns-sm, var(--rs-container-columns-current, 12)))
      ),
      minmax(0, 1fr)
    );
    gap: var(--rs-container-gap-lg, var(--rs-container-gap-md, var(--rs-container-gap-sm, var(--rs-container-gap-current))));
  }
}

@media (width >= 80rem) {
  .rs-container {
    max-width: var(
      --rs-container-max-xl,
      var(--rs-container-max-lg, var(--rs-container-max-md, var(--rs-container-max-sm, var(--rs-container-max-current))))
    );
    padding-inline: var(
      --rs-container-padding-xl,
      var(--rs-container-padding-lg, var(--rs-container-padding-md, var(--rs-container-padding-sm, var(--rs-container-padding-current))))
    );
  }

  .rs-container--grid {
    grid-template-columns: repeat(
      var(
        --rs-container-columns-xl,
        var(
          --rs-container-columns-lg,
          var(--rs-container-columns-md, var(--rs-container-columns-sm, var(--rs-container-columns-current, 12)))
        )
      ),
      minmax(0, 1fr)
    );
    gap: var(
      --rs-container-gap-xl,
      var(--rs-container-gap-lg, var(--rs-container-gap-md, var(--rs-container-gap-sm, var(--rs-container-gap-current))))
    );
  }
}
</style>
