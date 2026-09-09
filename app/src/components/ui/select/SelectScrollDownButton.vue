<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { SelectScrollDownButtonProps } from 'reka-ui'
import { SelectScrollDownButton, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<SelectScrollDownButtonProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectScrollDownButton
    data-slot="select-scroll-down-button"
    v-bind="{ ...$attrs, ...forwarded }"
    :class="cn('flex items-center justify-center py-1 hover:cursor-pointer', props.class)"
  >
    <ChevronDown aria-hidden="true" />
  </SelectScrollDownButton>
</template>
