<script setup lang="ts">
import { ArrowUp } from '@lucide/vue'
import { useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'

/** 捲動超過這個像素高度後才顯示按鈕，避免一開啟頁面就出現。 */
const VISIBILITY_THRESHOLD_PX = 400

const { t } = useI18n()
const { y } = useWindowScroll()
const isVisible = computed(() => y.value > VISIBILITY_THRESHOLD_PX)

const scrollToTop = (): void => {
  window.scrollTo({ behavior: 'smooth', top: 0 })
}
</script>

<template>
  <Button
    v-if="isVisible"
    class="fixed right-4 bottom-4 z-50 rounded-full shadow-lg lg:hidden"
    size="icon"
    :aria-label="t('site.scrollToTop')"
    @click="scrollToTop"
  >
    <ArrowUp class="size-5" />
  </Button>
</template>
