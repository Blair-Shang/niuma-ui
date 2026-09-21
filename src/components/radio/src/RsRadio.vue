<script setup lang="ts">
import { computed, provide, useId } from 'vue'
import type { RsComponentSize } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext } from '../../form/src/form-utils'
import {
  isRsRadioValueEqual,
  resolveRsRadioOrientation,
  RS_RADIO_GROUP_KEY,
  type RsRadioOrientation,
  type RsRadioValue,
} from './radio-utils'

defineOptions({ name: 'RsRadio' })

export type { RsRadioOrientation, RsRadioValue }

const model = defineModel<RsRadioValue | undefined>({ default: undefined })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    size?: RsComponentSize
    name?: string
    orientation?: RsRadioOrientation
    /** 无障碍组名。选项文案不够说明整组时再传。 */
    ariaLabel?: string
  }>(),
  {
    disabled: false,
    orientation: 'horizontal',
  },
)

const emit = defineEmits<{
  change: [value: RsRadioValue]
}>()

const formContext = useRsFormContext()
const groupId = useId()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const resolvedOrientation = computed(() => resolveRsRadioOrientation(props.orientation))
const resolvedName = computed(() => props.name || groupId)

const rootClass = computed(() => [
  'rs-radio-group',
  `rs-radio-group--${resolvedOrientation.value}`,
  `rs-radio-group--${resolvedSize.value}`,
  { 'rs-radio-group--disabled': resolvedDisabled.value },
])

function select(value: RsRadioValue): void {
  if (resolvedDisabled.value) return
  if (isRsRadioValueEqual(model.value, value)) return
  model.value = value
  emit('change', value)
}

provide(RS_RADIO_GROUP_KEY, {
  size: resolvedSize,
  disabled: resolvedDisabled,
  name: resolvedName,
  isChecked: (value) => isRsRadioValueEqual(model.value, value),
  select,
})
</script>

<template>
  <div
    role="radiogroup"
    :class="rootClass"
    :aria-orientation="resolvedOrientation"
    :aria-disabled="resolvedDisabled || undefined"
    :aria-label="ariaLabel"
  >
    <slot />
  </div>
</template>

<style scoped>
.rs-radio-group {
  display: flex;
  width: max-content;
  max-width: 100%;
  gap: var(--rs-space-md);
  color: var(--rs-text);
}

.rs-radio-group--vertical {
  flex-direction: column;
  align-items: flex-start;
}

.rs-radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.rs-radio-group--disabled {
  cursor: not-allowed;
}
</style>
