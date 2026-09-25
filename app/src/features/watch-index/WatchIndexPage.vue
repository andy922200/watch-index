<script setup lang="ts" generic="TWatch extends BaseWatch">
import { useStorage } from '@vueuse/core'
import { computed, ref, watch as watchSource } from 'vue'
import { useI18n } from 'vue-i18n'

import AppBreadcrumb from '@/components/layout/AppBreadcrumb.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import SearchCombobox from '@/components/search-combobox/SearchCombobox.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useWatchCatalog } from '@/composables/useWatchCatalog'
import { getBrandDisplayCurrencyStorageKey, isCurrencyCode } from '@/lib/displayCurrencies'
import { formatCurrency, formatMediumDate, getIntlLocale } from '@/lib/formatters'
import {
  getBrandMarketStorageKey,
  getMarketFromQuery,
  isMarketInOptions,
  type MarketCode,
} from '@/lib/markets'
import { getBrandPageLanguagePaths, getPriceCompareUrl } from '@/lib/pageUrls'
import { Locale } from '@/plugins/i18n'
import type { BaseWatch } from '@/types/watch-data'

import WatchDetailsDialog from './components/WatchDetailsDialog.vue'
import { useWatchSearch } from './composables/useWatchSearch'
import type { WatchBrandConfig } from './types'

interface Props {
  config: WatchBrandConfig<TWatch>
}

type PriceSort = 'default' | 'price-ascending' | 'price-descending'

const PAGE_SIZE = 12
const DEFAULT_PRICE_SORT: PriceSort = 'default'

const props = defineProps<Props>()
const { locale, t } = useI18n()
const languagePaths = getBrandPageLanguagePaths({ brandId: props.config.brandId, page: 'index' })
const selectedWatch = ref<TWatch | null>(null)
const isWatchDetailsOpen = ref(false)
const visibleWatchCount = ref(PAGE_SIZE)
const selectedPriceSort = ref<PriceSort>(DEFAULT_PRICE_SORT)
const selectedMarket = useStorage<MarketCode>(
  getBrandMarketStorageKey(props.config.brandId),
  props.config.defaultMarket,
  undefined,
  {
    serializer: {
      read: (value: string) =>
        isMarketInOptions(value, props.config.marketOptions) ? value : props.config.defaultMarket,
      write: (market): string => market,
    },
  },
)
const selectedDisplayCurrency = useStorage(
  getBrandDisplayCurrencyStorageKey(props.config.brandId),
  'TWD',
  undefined,
  {
    serializer: {
      read: (value: string): string => (isCurrencyCode(value) ? value : 'TWD'),
      write: (currency: string): string => currency,
    },
  },
)
const marketFromQuery = getMarketFromQuery(
  window.location.search,
  props.config.marketOptions,
  props.config.defaultMarket,
)

if (marketFromQuery !== null) {
  selectedMarket.value = marketFromQuery
}

const { catalog, displayCurrencies, error, isLoading, loadCatalog } = useWatchCatalog<TWatch>({
  brandId: props.config.brandId,
  isCatalog: props.config.isCatalog,
})
const {
  convert,
  error: exchangeRateError,
  getExchangeRateDate,
  loadExchangeRates,
} = useExchangeRates()
const {
  debouncedSearchQuery,
  filteredWatches,
  isSearchPending,
  searchComboboxGroups,
  searchQuery,
  selectSearchSuggestion,
} = useWatchSearch<TWatch>({
  catalog,
  getCollectionLabel: (collectionId) => t(`site.watchCollection.${collectionId}`),
  getSearchGroupLabel: (groupId) => t(`site.watchSearch.${groupId}Heading`),
})

const sortedWatches = computed<TWatch[]>(() => {
  if (selectedPriceSort.value === DEFAULT_PRICE_SORT) {
    return filteredWatches.value
  }

  const priceDirection = selectedPriceSort.value === 'price-ascending' ? 1 : -1
  return [...filteredWatches.value].sort((left, right) => {
    const leftPrice = left.priceStatus === 'listed' ? left.price : null
    const rightPrice = right.priceStatus === 'listed' ? right.price : null

    if (leftPrice === null || rightPrice === null) {
      if (leftPrice === rightPrice) return left.reference.localeCompare(right.reference)
      return leftPrice === null ? 1 : -1
    }

    return (
      (leftPrice - rightPrice) * priceDirection || left.reference.localeCompare(right.reference)
    )
  })
})
const visibleWatches = computed<TWatch[]>(() =>
  sortedWatches.value.slice(0, visibleWatchCount.value),
)
const hasMoreWatches = computed(() => visibleWatchCount.value < sortedWatches.value.length)
const intlLocale = computed(() => getIntlLocale(locale.value))
const displayCurrencyRateDate = computed(() => getExchangeRateDate(selectedDisplayCurrency.value))

interface WatchCardView {
  convertedPrice: string | null
  imageAlt: string
  price: string
  priceLabel: string
  watch: TWatch
}

const priceLabel = computed(() => {
  const priceType = catalog.value?.priceMarket.priceType
  if (priceType === 'tax-exclude') return t('site.watchList.priceLabelExcludingTax')
  if (priceType === 'no-tax') return t('site.watchList.priceLabelNoTax')
  return t('site.watchList.priceLabelIncludingTax')
})
const watchCards = computed<WatchCardView[]>(() =>
  visibleWatches.value.map((watch) => {
    const listedPrice = watch.priceStatus === 'listed' ? watch.price : null
    const priceMarket = catalog.value?.priceMarket
    const convertedAmount =
      listedPrice !== null &&
      priceMarket &&
      priceMarket.currencyCode !== selectedDisplayCurrency.value
        ? convert(listedPrice, selectedDisplayCurrency.value)
        : null

    return {
      convertedPrice:
        convertedAmount === null
          ? null
          : t('site.watchList.convertedPriceValue', {
              price: formatCurrency({
                amount: convertedAmount,
                currency: selectedDisplayCurrency.value,
                locale: intlLocale.value,
              }),
            }),
      imageAlt: t('site.watchList.imageAlt', { modelName: watch.modelName }),
      price:
        listedPrice !== null && priceMarket
          ? formatCurrency({
              amount: listedPrice,
              currency: priceMarket.currencyCode,
              locale: intlLocale.value,
              minimumFractionDigits: 0,
            })
          : t('site.watchList.priceUnavailable'),
      priceLabel: priceLabel.value,
      watch,
    }
  }),
)

const formatPriceUpdatedAt = (): string =>
  catalog.value ? formatMediumDate(catalog.value.priceUpdatedAt, intlLocale.value) : ''
const formatExchangeRateUpdatedAt = (): string =>
  displayCurrencyRateDate.value
    ? formatMediumDate(displayCurrencyRateDate.value, intlLocale.value)
    : ''
const getWatchPriceCompareUrl = (watch: TWatch): string =>
  getPriceCompareUrl({
    brandId: props.config.brandId,
    language: locale.value === Locale.enUs ? Locale.enUs : Locale.zhTw,
    market: selectedMarket.value,
    watchId: watch.watchId,
  })
const openWatchDetails = (watch: TWatch): void => {
  selectedWatch.value = watch
  isWatchDetailsOpen.value = true
}
const loadMoreWatches = (): void => {
  visibleWatchCount.value += PAGE_SIZE
}

watchSource(selectedMarket, (market) => void loadCatalog(market), { immediate: true })
watchSource(displayCurrencies, (currencies) => {
  if (currencies.length > 0 && !currencies.includes(selectedDisplayCurrency.value)) {
    selectedDisplayCurrency.value = currencies.includes('TWD') ? 'TWD' : currencies[0]
  }
})
watchSource(
  [() => catalog.value?.priceMarket.currencyCode, displayCurrencies],
  ([currency, currencies]) => {
    if (currency && currencies.length > 0) {
      void loadExchangeRates({ baseCurrency: currency, targetCurrencies: currencies })
    }
  },
)
watchSource([debouncedSearchQuery, selectedPriceSort], () => {
  visibleWatchCount.value = PAGE_SIZE
})
</script>

<template>
  <AppLayout :brand="props.config.brandId" :lang="locale">
    <AppNav
      v-model:display-currency="selectedDisplayCurrency"
      v-model:market="selectedMarket"
      :display-currencies="displayCurrencies"
      :language-paths="languagePaths"
      :market-options="props.config.marketOptions"
    />
    <AppBreadcrumb :current="t(props.config.titleKey)" class="my-2 self-start" />
    <section class="w-full max-w-4xl text-center" aria-labelledby="page-title">
      <h1
        id="page-title"
        class="hero-title my-6 w-full text-4xl font-semibold tracking-tight sm:mt-8 sm:mb-12 sm:text-6xl"
      >
        {{ t(props.config.titleKey) }}
      </h1>
      <p v-if="catalog" class="text-muted-foreground -mt-2 text-sm sm:-mt-8">
        {{ t('site.priceUpdatedAt', { date: formatPriceUpdatedAt() }) }}
      </p>
      <p v-if="displayCurrencyRateDate" class="text-muted-foreground mt-1 text-sm">
        {{ t('site.exchangeRateUpdatedAt', { date: formatExchangeRateUpdatedAt() }) }}
      </p>
      <p v-else-if="exchangeRateError" class="text-muted-foreground mt-1 text-sm" role="status">
        {{ t('site.exchangeRateUnavailable') }}
      </p>
      <div class="mt-10 flex justify-center">
        <SearchCombobox
          v-if="!isLoading && !error"
          v-model:query="searchQuery"
          :empty-message="t('site.watchSearch.empty')"
          :groups="searchComboboxGroups"
          :is-pending="isSearchPending"
          :label="t('site.watchSearch.label')"
          :placeholder="t('site.watchSearch.placeholder')"
          @select="selectSearchSuggestion"
        />
        <p v-else-if="isLoading" role="status">{{ t('site.watchList.loading') }}</p>
        <p v-else role="alert">{{ t('site.watchList.error') }}</p>
      </div>
    </section>
    <section v-if="!isLoading && !error" class="mt-12 w-full" aria-labelledby="watch-list-heading">
      <h2 id="watch-list-heading" class="sr-only">{{ t('site.watchList.heading') }}</h2>
      <div class="mb-6 flex justify-end">
        <Select v-model="selectedPriceSort">
          <SelectTrigger class="w-52 cursor-pointer" :aria-label="t('site.watchList.sortLabel')"
            ><SelectValue :placeholder="t('site.watchList.sortDefault')"
          /></SelectTrigger>
          <SelectContent class="w-(--reka-select-trigger-width)" :side-offset="4"
            ><SelectGroup>
              <SelectItem class="cursor-pointer" :value="DEFAULT_PRICE_SORT">{{
                t('site.watchList.sortDefault')
              }}</SelectItem>
              <SelectItem class="cursor-pointer" value="price-ascending">{{
                t('site.watchList.sortPriceLowToHigh')
              }}</SelectItem>
              <SelectItem class="cursor-pointer" value="price-descending">{{
                t('site.watchList.sortPriceHighToLow')
              }}</SelectItem>
            </SelectGroup></SelectContent
          >
        </Select>
      </div>
      <p
        v-if="filteredWatches.length === 0"
        class="text-muted-foreground text-center"
        role="status"
      >
        {{ t('site.watchSearch.empty') }}
      </p>
      <div
        v-else
        data-testid="watch-grid"
        class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6"
      >
        <Card
          v-for="card in watchCards"
          :key="card.watch.watchId"
          class="h-full gap-0 overflow-hidden py-0"
        >
          <CardContent class="p-0"
            ><button
              type="button"
              class="block aspect-square w-full cursor-pointer p-4"
              :aria-label="t('site.watchList.viewDetails')"
              @click="openWatchDetails(card.watch)"
            >
              <img
                class="size-full object-contain"
                :src="card.watch.imageUrl"
                :alt="card.imageAlt"
                loading="lazy"
              /></button
          ></CardContent>
          <CardHeader class="flex-1 px-4 py-4"
            ><CardTitle class="min-h-11 text-base leading-snug">{{
              card.watch.modelName
            }}</CardTitle
            ><CardDescription class="h-4 truncate font-mono text-xs">{{
              card.watch.reference
            }}</CardDescription>
            <div class="mt-2 min-h-14">
              <p class="text-muted-foreground text-xs">{{ card.priceLabel }}</p>
              <p class="font-medium tabular-nums">{{ card.price }}</p>
              <p v-if="card.convertedPrice" class="text-muted-foreground tabular-nums">
                {{ card.convertedPrice }}
              </p>
            </div>
            <CardDescription
              v-if="card.watch.localNicknames.length > 0"
              class="line-clamp-2 h-10"
              >{{ card.watch.localNicknames.join('、') }}</CardDescription
            ><CardDescription v-else aria-hidden="true" class="invisible h-10"
          /></CardHeader>
          <CardFooter class="flex-col gap-2 px-4 pt-0 pb-4"
            ><Button class="w-full" variant="outline" @click="openWatchDetails(card.watch)">{{
              t('site.watchList.viewDetails')
            }}</Button
            ><Button as-child class="w-full" variant="outline"
              ><a :href="getWatchPriceCompareUrl(card.watch)">{{
                t('site.watchList.compareMarkets')
              }}</a></Button
            ></CardFooter
          >
        </Card>
      </div>
      <div v-if="hasMoreWatches" class="mt-8 flex justify-center">
        <Button variant="outline" @click="loadMoreWatches">{{
          t('site.watchList.loadMore')
        }}</Button>
      </div>
    </section>
    <WatchDetailsDialog v-model:open="isWatchDetailsOpen" :watch="selectedWatch" />
  </AppLayout>
</template>

<style lang="scss" scoped>
.hero-title::after {
  content: '';
  display: block;
  width: 3.5rem;
  height: 2px;
  margin: 0.75rem auto 0;
  background: currentColor;
  opacity: 0.4;
}
</style>
