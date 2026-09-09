<script setup lang="ts">
import { ChevronUp } from '@lucide/vue'
import type { SelectScrollUpButtonProps } from 'reka-ui'
import { SelectScrollUpButton, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectScrollUpButton
    data-slot="select-scroll-up-button"
    v-bind="{ ...$attrs, ...forwarded }"
    :class="cn('flex items-center justify-center py-1 hover:cursor-pointer', props.class)"
  >
    <ChevronUp aria-hidden="true" />
  </SelectScrollUpButton>
</template>
