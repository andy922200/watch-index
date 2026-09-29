<script setup lang="ts">
import { ExternalLink, X } from '@lucide/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import type { MarketCode } from '@/lib/markets'
import type { PageLanguageCode } from '@/lib/pageRoutes'
import { getPriceCompareUrl } from '@/lib/pageUrls'

import { markImageFailed, markImageLoaded } from '../utils/watchCompareActions'
import type { CompareColumnDisplay } from '../utils/watchCompareDisplay'

interface Props {
  column: CompareColumnDisplay
  index: number
  selectedMarket: MarketCode | null
  pageLanguage: PageLanguageCode
}

defineProps<Props>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { t } = useI18n()
const failedImages = ref<ReadonlySet<string>>(new Set())
const loadedImages = ref<ReadonlySet<string>>(new Set())

/* 工具函式包裝 Start */
const markLoaded = (id: string): void => markImageLoaded(id, loadedImages)
const markFailed = (id: string): void => markImageFailed(id, failedImages)
/* 工具函式包裝 End */
</script>

<template>
  <div class="flex items-start justify-between gap-2">
    <span class="text-muted-foreground font-mono text-xs">
      {{ t('site.explorer.watchColumn', { number: index + 1 }) }}
    </span>
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('site.explorer.removeWatch', { reference: column.referenceLabel })"
      @click="emit('remove', column.id)"
    >
      <X aria-hidden="true" />
    </Button>
  </div>
  <div
    v-if="column.watch"
    class="bg-muted/40 relative mt-3 grid aspect-square max-h-48 place-items-center overflow-hidden"
  >
    <div
      v-if="!loadedImages.has(column.id)"
      data-image-fallback
      class="text-muted-foreground p-3 text-center font-mono text-xs"
    >
      {{ column.brandLabel }}
      <br />
      {{ column.referenceLabel }}
    </div>
    <img
      v-if="!failedImages.has(column.id)"
      :src="column.watch.imageUrl"
      :alt="`${column.brandLabel} ${column.referenceLabel}`"
      class="bg-muted/40 absolute inset-0 h-full w-full object-contain p-3 transition-opacity duration-300"
      :class="loadedImages.has(column.id) ? 'opacity-100' : 'opacity-0'"
      @load="markLoaded(column.id)"
      @error="markFailed(column.id)"
    />
  </div>
  <p class="mt-3 text-sm font-medium">{{ column.brandLabel }}</p>
  <p class="text-muted-foreground mt-1 font-mono text-xs break-all">
    {{ column.referenceLabel }}
  </p>
  <p v-if="!column.watch" class="text-destructive mt-2 text-xs">
    {{ t('site.explorer.missingLocal') }}
  </p>
  <Button
    v-if="column.watch && column.brandId && selectedMarket"
    as-child
    variant="link"
    class="mt-3 h-auto p-0 text-xs"
  >
    <a
      :href="
        getPriceCompareUrl({
          brandId: column.brandId,
          watchId: column.id,
          market: selectedMarket,
          language: pageLanguage,
        })
      "
    >
      {{ t('site.explorer.singleCompare') }}
      <ExternalLink aria-hidden="true" />
    </a>
  </Button>
</template>
