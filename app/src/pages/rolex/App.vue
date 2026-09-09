<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { formatNumber } from 'parse-localized-number'
import { computed, ref, watch as watchSelectedMarket } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import WatchCollectionCombobox, {
  type WatchCollectionOption,
} from '@/components/watch-collection/WatchCollectionCombobox.vue'
import { useWatchCatalog } from '@/composables/useWatchCatalog'
import {
  DEFAULT_MARKET,
  getMarketFromQuery,
  isMarketCode,
  MARKET_STORAGE_KEY,
  type MarketCode,
} from '@/lib/markets'
import { Locale } from '@/plugins/i18n'
import type { Watch } from '@/types/watch-data'

import WatchDetailsDialog from './components/WatchDetailsDialog.vue'

const PAGE_SIZE = 12

const { locale, t } = useI18n()

const selectedCollectionId = ref<string | null>(null)
const selectedWatch = ref<Watch | null>(null)
const isWatchDetailsOpen = ref(false)
const visibleWatchCount = ref(PAGE_SIZE)
const selectedMarket = useStorage<MarketCode>(MARKET_STORAGE_KEY, DEFAULT_MARKET, undefined, {
  serializer: {
    read: (value: string): MarketCode => (isMarketCode(value) ? value : DEFAULT_MARKET),
    write: (market: MarketCode): string => market,
  },
})
const marketFromQuery = getMarketFromQuery(window.location.search)

if (marketFromQuery !== null) {
  selectedMarket.value = marketFromQuery
}
const { catalog, error, isLoading, loadCatalog } = useWatchCatalog()

const collectionOptions = computed<WatchCollectionOption[]>(() =>
  (catalog.value?.collections ?? []).map((collection) => ({
    id: collection.id,
    label: t(`site.watchCollection.${collection.id}`),
    watchCount: collection.watchCount,
  })),
)

const filteredWatches = computed<Watch[]>(() => {
  const watches = Object.values(catalog.value?.watchesByReference ?? {})

  return watches
    .filter(
      (watch) =>
        selectedCollectionId.value === null || watch.collectionId === selectedCollectionId.value,
    )
    .sort((left, right) => left.modelReference.localeCompare(right.modelReference))
})

const visibleWatches = computed<Watch[]>(() =>
  filteredWatches.value.slice(0, visibleWatchCount.value),
)

const hasMoreWatches = computed(() => visibleWatchCount.value < filteredWatches.value.length)

const selectCollection = (collectionId: string | null): void => {
  selectedCollectionId.value = collectionId
  visibleWatchCount.value = PAGE_SIZE
}

const loadMoreWatches = (): void => {
  visibleWatchCount.value += PAGE_SIZE
}

const openWatchDetails = (watch: Watch): void => {
  selectedWatch.value = watch
  isWatchDetailsOpen.value = true
}

const getWatchImageAlt = (watch: Watch): string =>
  t('site.watchList.imageAlt', { modelName: watch.modelName })

const formatPrice = (watch: Watch): string => {
  if (watch.priceStatus !== 'listed' || watch.price === null || !catalog.value) {
    return t('site.watchList.priceUnavailable')
  }

  return t('site.watchList.priceValue', {
    currency: catalog.value.priceMarket.currencyCode,
    price: formatNumber(watch.price),
  })
}

const getPriceLabel = (): string => {
  const priceType = catalog.value?.priceMarket.priceType

  if (priceType === 'tax-exclude') {
    return t('site.watchList.priceLabelExcludingTax')
  }

  if (priceType === 'no-tax') {
    return t('site.watchList.priceLabelNoTax')
  }

  return t('site.watchList.priceLabelIncludingTax')
}

const getDateLocale = (): string => (locale.value === Locale.zhTw ? 'zh-TW' : 'en-US')

const formatPriceUpdatedAt = (): string => {
  if (!catalog.value) {
    return ''
  }

  return new Intl.DateTimeFormat(getDateLocale(), { dateStyle: 'medium' }).format(
    new Date(catalog.value.priceUpdatedAt),
  )
}

watchSelectedMarket(
  selectedMarket,
  (market) => {
    void loadCatalog(market)
  },
  { immediate: true },
)
</script>

<template>
  <AppLayout :lang="locale">
    <AppNav v-model:market="selectedMarket" />
    <section class="w-full max-w-4xl text-center" aria-labelledby="page-title">
      <h1
        id="page-title"
        class="hero-title my-6 w-full text-4xl font-semibold tracking-tight sm:mt-8 sm:mb-12 sm:text-6xl"
      >
        {{ t('site.title') }}
      </h1>
      <p v-if="catalog" class="text-muted-foreground -mt-2 text-sm sm:-mt-8">
        {{ t('site.priceUpdatedAt', { date: formatPriceUpdatedAt() }) }}
      </p>
      <div class="mt-10 flex justify-center">
        <WatchCollectionCombobox
          v-if="!isLoading && !error"
          :all-option-label="t('site.watchCollection.all')"
          :empty-message="t('site.watchCollection.empty')"
          :label="t('site.watchCollection.label')"
          :options="collectionOptions"
          :placeholder="t('site.watchCollection.placeholder')"
          :selected-collection-id="selectedCollectionId"
          @select="selectCollection"
        />
        <p v-else-if="isLoading" role="status">{{ t('site.watchList.loading') }}</p>
        <p v-else role="alert">{{ t('site.watchList.error') }}</p>
      </div>
    </section>
    <section v-if="!isLoading && !error" class="mt-12 w-full" aria-labelledby="watch-list-heading">
      <h2 id="watch-list-heading" class="sr-only">{{ t('site.watchList.heading') }}</h2>
      <p
        v-if="filteredWatches.length === 0"
        class="text-muted-foreground text-center"
        role="status"
      >
        {{ t('site.watchList.empty') }}
      </p>
      <div
        v-else
        data-testid="watch-grid"
        class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6"
      >
        <Card
          v-for="watch in visibleWatches"
          :key="watch.modelReference"
          class="h-full gap-0 overflow-hidden py-0"
        >
          <CardContent class="p-0">
            <img
              class="aspect-square w-full object-contain"
              :src="watch.imageUrl"
              :alt="getWatchImageAlt(watch)"
              loading="lazy"
            />
          </CardContent>
          <CardHeader class="flex-1 px-4 py-4">
            <CardTitle class="line-clamp-2 h-11 text-base leading-snug">{{
              watch.modelName
            }}</CardTitle>
            <CardDescription class="h-4 truncate font-mono text-xs">
              {{ watch.modelReference }}
            </CardDescription>
            <div class="mt-2 min-h-14">
              <p class="text-muted-foreground text-xs">{{ getPriceLabel() }}</p>
              <p class="font-medium tabular-nums">{{ formatPrice(watch) }}</p>
            </div>
            <CardDescription v-if="watch.localNicknames.length > 0" class="line-clamp-2 h-10">
              {{ watch.localNicknames.join('、') }}
            </CardDescription>
            <CardDescription v-else aria-hidden="true" class="invisible h-10" />
          </CardHeader>
          <CardFooter class="px-4 pt-0 pb-4">
            <Button class="w-full" variant="outline" @click="openWatchDetails(watch)">
              {{ t('site.watchList.viewDetails') }}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div v-if="hasMoreWatches" class="mt-8 flex justify-center">
        <Button variant="outline" @click="loadMoreWatches">
          {{ t('site.watchList.loadMore') }}
        </Button>
      </div>
    </section>
    <WatchDetailsDialog v-model:open="isWatchDetailsOpen" :watch="selectedWatch" />
  </AppLayout>
</template>

<style lang="scss" scoped>
.hero-title {
  &::after {
    content: '';
    display: block;
    width: 3.5rem;
    height: 2px;
    margin: 0.75rem auto 0;
    background: currentColor;
    opacity: 0.4;
  }
}
</style>
