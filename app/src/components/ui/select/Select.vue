<script setup lang="ts">
import { reactiveOmit, useEventListener } from '@vueuse/core'
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
import { SelectRoot, useForwardPropsEmits } from 'reka-ui'
import { ref, watch, watchEffect } from 'vue'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'open'), emits)

const isOpen = ref(props.open ?? props.defaultOpen ?? false)
watchEffect(() => {
  if (props.open !== undefined) isOpen.value = props.open
})
watch(isOpen, (value) => emits('update:open', value))

useEventListener(window, 'resize', () => {
  isOpen.value = false
})
</script>

<template>
  <SelectRoot v-slot="slotProps" v-bind="forwarded" v-model:open="isOpen" data-slot="select">
    <slot v-bind="slotProps" />
  </SelectRoot>
</template>
