<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { computed, ref, watch as watchSource } from 'vue'
import { useI18n } from 'vue-i18n'

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
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useWatchCatalog } from '@/composables/useWatchCatalog'
import {
  DEFAULT_DISPLAY_CURRENCY,
  DISPLAY_CURRENCY_STORAGE_KEY,
  isCurrencyCode,
} from '@/lib/displayCurrencies'
import { formatCurrency, formatMediumDate, getIntlLocale } from '@/lib/formatters'
import {
  DEFAULT_MARKET,
  getMarketFromQuery,
  isMarketCode,
  MARKET_STORAGE_KEY,
  type MarketCode,
} from '@/lib/markets'
import { isRolexWatchCatalog } from '@/lib/validation/rolexWatch'
import { Locale } from '@/plugins/i18n'
import type { RolexWatch } from '@/types/rolex-watch'

import WatchDetailsDialog from './components/WatchDetailsDialog.vue'
import { useWatchSearch } from './composables/useWatchSearch'

const PAGE_SIZE = 12

const { locale, t } = useI18n()

const selectedWatch = ref<RolexWatch | null>(null)
const isWatchDetailsOpen = ref(false)
const visibleWatchCount = ref(PAGE_SIZE)
const selectedMarket = useStorage<MarketCode>(MARKET_STORAGE_KEY, DEFAULT_MARKET, undefined, {
  serializer: {
    read: (value: string): MarketCode => (isMarketCode(value) ? value : DEFAULT_MARKET),
    write: (market: MarketCode): string => market,
  },
})
const selectedDisplayCurrency = useStorage<string>(
  DISPLAY_CURRENCY_STORAGE_KEY,
  DEFAULT_DISPLAY_CURRENCY,
  undefined,
  {
    serializer: {
      read: (value: string): string => (isCurrencyCode(value) ? value : DEFAULT_DISPLAY_CURRENCY),
      write: (currency: string): string => currency,
    },
  },
)
const marketFromQuery = getMarketFromQuery(window.location.search)

if (marketFromQuery !== null) {
  selectedMarket.value = marketFromQuery
}
const { catalog, displayCurrencies, error, isLoading, loadCatalog } = useWatchCatalog({
  isCatalog: isRolexWatchCatalog,
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
} = useWatchSearch({
  catalog,
  getCollectionLabel: (collectionId) => t(`site.watchCollection.${collectionId}`),
  getSearchGroupLabel: (groupId) => t(`site.watchSearch.${groupId}Heading`),
})

const visibleWatches = computed<RolexWatch[]>(() =>
  filteredWatches.value.slice(0, visibleWatchCount.value),
)

const hasMoreWatches = computed(() => visibleWatchCount.value < filteredWatches.value.length)
const displayCurrencyRateDate = computed(() => getExchangeRateDate(selectedDisplayCurrency.value))
const intlLocale = computed(() => getIntlLocale(locale.value))

const loadMoreWatches = (): void => {
  visibleWatchCount.value += PAGE_SIZE
}

const openWatchDetails = (watch: RolexWatch): void => {
  selectedWatch.value = watch
  isWatchDetailsOpen.value = true
}

const getWatchImageAlt = (watch: RolexWatch): string =>
  t('site.watchList.imageAlt', { modelName: watch.modelName })

const formatPrice = (watch: RolexWatch): string => {
  if (watch.priceStatus !== 'listed' || watch.price === null || !catalog.value) {
    return t('site.watchList.priceUnavailable')
  }

  return formatCurrency({
    amount: watch.price,
    currency: catalog.value.priceMarket.currencyCode,
    locale: intlLocale.value,
    // 官方定價在各市場都是整數，補成 .00 只是雜訊。
    minimumFractionDigits: 0,
  })
}

const formatConvertedPrice = (watch: RolexWatch): string | null => {
  if (
    watch.priceStatus !== 'listed' ||
    watch.price === null ||
    !catalog.value ||
    catalog.value.priceMarket.currencyCode === selectedDisplayCurrency.value
  ) {
    return null
  }

  const convertedPrice = convert(watch.price, selectedDisplayCurrency.value)

  if (convertedPrice === null) {
    return null
  }

  return t('site.watchList.convertedPriceValue', {
    price: formatCurrency({
      amount: convertedPrice,
      currency: selectedDisplayCurrency.value,
      locale: intlLocale.value,
    }),
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

const formatPriceUpdatedAt = (): string =>
  catalog.value ? formatMediumDate(catalog.value.priceUpdatedAt, intlLocale.value) : ''

const formatExchangeRateUpdatedAt = (): string =>
  displayCurrencyRateDate.value
    ? formatMediumDate(displayCurrencyRateDate.value, intlLocale.value)
    : ''

watchSource(
  selectedMarket,
  (market) => {
    void loadCatalog(market)
  },
  { immediate: true },
)

watchSource(
  displayCurrencies,
  (currencies) => {
    if (currencies.length > 0 && !currencies.includes(selectedDisplayCurrency.value)) {
      selectedDisplayCurrency.value = currencies.includes(DEFAULT_DISPLAY_CURRENCY)
        ? DEFAULT_DISPLAY_CURRENCY
        : currencies[0]
    }
  },
  { immediate: true },
)

watchSource(
  [() => catalog.value?.priceMarket.currencyCode, displayCurrencies],
  ([currencyCode, currencies]) => {
    if (currencyCode && currencies.length > 0) {
      void loadExchangeRates({ baseCurrency: currencyCode, targetCurrencies: currencies })
    }
  },
)

watchSource(debouncedSearchQuery, () => {
  visibleWatchCount.value = PAGE_SIZE
})
</script>

<template>
  <AppLayout brand="rolex" :lang="locale">
    <AppNav
      v-model:display-currency="selectedDisplayCurrency"
      v-model:market="selectedMarket"
      :display-currencies="displayCurrencies"
    />
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
          v-for="watch in visibleWatches"
          :key="watch.watchId"
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
              <p v-if="formatConvertedPrice(watch)" class="text-muted-foreground tabular-nums">
                {{ formatConvertedPrice(watch) }}
              </p>
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
