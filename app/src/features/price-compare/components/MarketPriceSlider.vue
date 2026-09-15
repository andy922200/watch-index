<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  differencePercent: number | null
  slider: {
    startPercent: number
    widthPercent: number
  } | null
  title: string
}

const props = defineProps<Props>()

const isLowerPrice = computed(() => props.differencePercent !== null && props.differencePercent < 0)
const fillStyle = computed(() => {
  if (!props.slider) {
    return undefined
  }

  return {
    left: `${props.slider.startPercent}%`,
    width: `${props.slider.widthPercent}%`,
  }
})
</script>

<template>
  <div
    class="bg-muted relative h-3 overflow-hidden rounded-full"
    :title="props.title"
    aria-hidden="true"
  >
    <div class="bg-border absolute top-0 bottom-0 left-1/2 z-10 w-0.5 -translate-x-1/2" />
    <div
      v-if="fillStyle"
      class="absolute top-0 bottom-0 rounded-full"
      :class="isLowerPrice ? 'bg-primary' : 'bg-pink-600 dark:bg-rose-600'"
      :style="fillStyle"
    />
  </div>
</template>
