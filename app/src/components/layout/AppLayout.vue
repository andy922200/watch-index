<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import ScrollToTopButton from '@/components/layout/ScrollToTopButton.vue'

interface Props {
  brand: string
  lang: string
}

const props = defineProps<Props>()

onMounted(() => {
  document.documentElement.dataset.brand = props.brand
})

onUnmounted(() => {
  if (document.documentElement.dataset.brand === props.brand) {
    delete document.documentElement.dataset.brand
  }
})
</script>

<template>
  <main class="bg-background text-foreground min-h-dvh p-4" :lang="lang">
    <div class="mx-auto flex w-full max-w-300 flex-col items-center">
      <slot />
    </div>
    <ScrollToTopButton />
  </main>
</template>
