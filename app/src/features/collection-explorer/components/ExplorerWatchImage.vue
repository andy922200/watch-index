<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'

/**
 * 卡片圖片需要的顯示資料，由呼叫端先組好已格式化的字串與連結，
 * 這支元件只負責「何時開始載入圖片」與「載入前後怎麼呈現」。
 */
export interface ExplorerWatchImageView {
  imageUrl: string
  alt: string
  brandName: string
  reference: string
  href: string
  compareLabel: string
}

interface Props {
  view: ExplorerWatchImageView
  /**
   * 頁面是否正在捲動中。圖片「第一次」載入完成時若正好在捲動中，先不淡入顯示，
   * 等捲動停止再一次揭露，避免圖片依各自完成時間分散彈出造成的閃爍感。
   * 只影響尚未揭露過的圖片──已經揭露過的圖片不會因為之後又開始捲動而被重新遮罩，
   * 否則使用者隨手一滑，連早就載入完成、已顯示在畫面上的圖片也會瞬間消失又出現。
   */
  isScrolling: boolean
}

const props = defineProps<Props>()

/**
 * 原生 `loading="lazy"` 的觸發距離由瀏覽器決定、無法調整；
 * 改用 IntersectionObserver 搭配較大的 rootMargin，讓圖片在捲動到視窗前就提早開始下載，
 * 避免快速拖曳捲軸時圖片來不及載入、造成佔位背景與圖片交替出現的閃爍感。
 */
const LOAD_AHEAD_MARGIN = '600px 0px'

const containerRef = useTemplateRef<HTMLElement>('container')
const shouldLoad = ref(false)
const isLoaded = ref(false)
const hasFailed = ref(false)
const isRevealed = ref(false)

const { stop } = useIntersectionObserver(
  containerRef,
  ([entry]) => {
    if (!entry?.isIntersecting) return
    shouldLoad.value = true
    stop()
  },
  { rootMargin: LOAD_AHEAD_MARGIN },
)

watch(
  [isLoaded, () => props.isScrolling],
  ([loaded, scrolling]) => {
    if (loaded && !scrolling) isRevealed.value = true
  },
  { immediate: true },
)

const markLoaded = (): void => {
  isLoaded.value = true
}
const markFailed = (): void => {
  hasFailed.value = true
}
</script>

<template>
  <div
    ref="container"
    class="bg-muted/40 relative grid aspect-square place-items-center overflow-hidden"
  >
    <div v-if="!isLoaded" data-image-fallback class="text-muted-foreground px-4 text-center">
      <p class="font-mono text-[11px] tracking-[0.22em] uppercase">{{ view.brandName }}</p>
      <p class="mt-3 font-mono text-xs">{{ view.reference }}</p>
    </div>
    <a :href="view.href" :aria-label="view.compareLabel" class="absolute inset-0 cursor-pointer">
      <img
        v-if="shouldLoad && !hasFailed"
        :src="view.imageUrl"
        :alt="view.alt"
        decoding="async"
        class="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-300"
        :class="{ 'opacity-100': isRevealed }"
        @load="markLoaded"
        @error="markFailed"
      />
    </a>
  </div>
</template>
