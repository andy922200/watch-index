<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { computed, watch as watchSource } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useComparisonExchangeRates } from '@/composables/useExchangeRates'
import { useWatchComparison } from '@/composables/useWatchComparison'
import {
  DEFAULT_DISPLAY_CURRENCY,
  DISPLAY_CURRENCY_STORAGE_KEY,
  isCurrencyCode,
} from '@/lib/displayCurrencies'
import {
  formatCurrency,
  formatMediumDate,
  formatSignedPercent,
  getIntlLocale,
} from '@/lib/formatters'
import {
  DEFAULT_MARKET,
  getMarketFlag,
  getMarketFromQuery,
  getMarketLabelKey,
  isMarketCode,
  MARKET_STORAGE_KEY,
  type MarketCode,
  marketOptions,
  replaceMarketQuery,
} from '@/lib/markets'
import { getBrandPageLanguagePaths } from '@/lib/pageUrls'
import { isRolexWatchCatalog } from '@/lib/validation/rolexWatch'
import {
  createMarketComparisonRows,
  type MarketComparisonRow,
  type PriceComparisonLabel,
  PriceComparisonLabelKeys,
  PriceComparisonMode,
  type PriceComparisonModeId,
} from '@/lib/watchPriceComparison'

import { BRAND_ID } from '../brand'
import BackToIndexButton from './components/BackToIndexButton.vue'
import MarketPriceRow, { type MarketPriceRowView } from './components/MarketPriceRow.vue'

const languagePaths = getBrandPageLanguagePaths({ brandId: BRAND_ID, page: 'price-compare' })

const WatchIdPattern = /^rolex:m[0-9a-z]+-[0-9]{4}$/

/** 比價金額經匯率換算後常有小數，統一顯示到小數點後兩位，不沿用各幣別的預設位數。 */
const PRICE_MAX_FRACTION_DIGITS = 2

/**
 * 頁面在「還沒有東西可比」時要顯示的訊息卡。三種情況（載入中、載入失敗、找不到這支錶）
 * 只差在文字、ARIA role 與要不要回首頁按鈕，因此收斂成同一份資料，
 * 讓優先順序寫在這裡，而不是隱含在 template 的分支排列順序裡。
 */
interface PageStatus {
  messageKey: string
  role: 'alert' | 'status'
  showBackToIndex: boolean
}

const { locale, t } = useI18n()
const watchId = new URLSearchParams(window.location.search).get('watch_id')
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
const selectedMode = useStorage<PriceComparisonModeId>(
  'rolex-price-comparison-mode',
  PriceComparisonMode.Official,
  undefined,
  {
    serializer: {
      read: (value: string): PriceComparisonModeId =>
        value === PriceComparisonMode.RefundEstimate
          ? PriceComparisonMode.RefundEstimate
          : PriceComparisonMode.Official,
      write: (mode: PriceComparisonModeId): string => mode,
    },
  },
)
const { catalog, comparison, displayCurrencies, error, isLoading, loadComparison } =
  useWatchComparison({ isCatalog: isRolexWatchCatalog })
const {
  convertToDisplayCurrency,
  error: exchangeRateError,
  getExchangeRateDate,
  loadExchangeRates,
} = useComparisonExchangeRates()
const marketFromQuery = getMarketFromQuery(window.location.search)

if (marketFromQuery !== null) {
  selectedMarket.value = marketFromQuery
}

const isWatchIdValid = computed(() => watchId !== null && WatchIdPattern.test(watchId))
const watch = computed(() =>
  watchId === null ? null : (catalog.value?.watchesById[watchId] ?? null),
)
const isWatchUnavailable = computed(
  () => !isLoading.value && !error.value && (!isWatchIdValid.value || watch.value === null),
)
const pageStatus = computed<PageStatus | null>(() => {
  if (isLoading.value) {
    return {
      messageKey: 'site.watchPriceComparison.loading',
      role: 'status',
      showBackToIndex: false,
    }
  }

  if (error.value) {
    return { messageKey: 'site.watchPriceComparison.error', role: 'alert', showBackToIndex: false }
  }

  if (isWatchUnavailable.value) {
    return {
      messageKey: 'site.watchPriceComparison.invalidWatch',
      role: 'alert',
      showBackToIndex: true,
    }
  }

  return null
})
const comparisonRows = computed(() => {
  if (!comparison.value || watchId === null) {
    return []
  }

  return createMarketComparisonRows({
    comparison: comparison.value,
    convertToDisplayCurrency,
    displayCurrency: selectedDisplayCurrency.value,
    marketCodes: marketOptions.map((market) => market.code),
    mode: selectedMode.value,
    selectedMarketCode: selectedMarket.value,
    watchId,
  })
})
const intlLocale = computed(() => getIntlLocale(locale.value))

const getMarketName = (marketCode: string): string => {
  const labelKey = getMarketLabelKey(marketCode)

  return labelKey === null ? marketCode : t(labelKey)
}

const formatPrice = (amount: number | null, currency: string): string | null =>
  amount === null
    ? null
    : formatCurrency({
        amount,
        currency,
        locale: intlLocale.value,
        maximumFractionDigits: PRICE_MAX_FRACTION_DIGITS,
      })

const formatDate = (date: string): string => formatMediumDate(date, intlLocale.value)

const formatDifference = (differencePercent: number | null): string | null =>
  differencePercent === null ? null : formatSignedPercent(differencePercent, intlLocale.value)

const getPriceLabel = (label: PriceComparisonLabel): string => t(PriceComparisonLabelKeys[label])

const getRowDetails = (marketCode: string): string =>
  t('site.watchPriceComparison.rowDetails', { marketName: getMarketName(marketCode) })

const getConvertedPriceText = (convertedAmount: number | null): string => {
  const convertedPrice = formatPrice(convertedAmount, selectedDisplayCurrency.value)

  return convertedPrice === null
    ? t('site.watchPriceComparison.exchangeRateUnavailable')
    : t('site.watchPriceComparison.convertedPrice', { price: convertedPrice })
}

const getDifferenceText = (row: MarketComparisonRow): string => {
  if (row.isBaseline) {
    return t('site.watchPriceComparison.baseline')
  }

  const difference = formatDifference(row.differencePercent)

  return difference === null
    ? t('site.watchPriceComparison.differenceUnavailable')
    : t('site.watchPriceComparison.difference', { difference })
}

const getExchangeRateText = (currencyCode: string): string => {
  if (currencyCode === selectedDisplayCurrency.value) {
    return t('site.watchPriceComparison.exchangeRateNotRequired')
  }

  const exchangeRateDate = getExchangeRateDate(currencyCode)

  return exchangeRateDate
    ? t('site.watchPriceComparison.exchangeRateUpdatedAt', {
        date: formatDate(exchangeRateDate),
      })
    : t('site.watchPriceComparison.exchangeRateUnavailable')
}

const comparisonRowViews = computed<MarketPriceRowView[]>(() =>
  comparisonRows.value.map((row) => ({
    code: row.market.code,
    convertedPriceText: getConvertedPriceText(row.convertedAmount),
    detailsTitle: getRowDetails(row.market.code),
    differencePercent: row.differencePercent,
    differenceText: getDifferenceText(row),
    exchangeRateText: getExchangeRateText(row.market.currencyCode),
    flag: getMarketFlag(row.market.code),
    isBaseline: row.isBaseline,
    isDifferenceEmphasized: !row.isBaseline && row.differencePercent !== null,
    marketName: getMarketName(row.market.code),
    priceLabelText: getPriceLabel(row.label),
    priceText:
      formatPrice(row.localAmount, row.market.currencyCode) ??
      t('site.watchPriceComparison.priceUnavailable'),
    priceUpdatedAtText: t('site.watchPriceComparison.officialPriceUpdatedAt', {
      date: formatDate(row.market.priceUpdatedAt),
    }),
    slider: row.slider,
    travelerRefundPolicy: row.market.travelerRefundPolicy,
  })),
)

watchSource(
  selectedMarket,
  (market) => {
    // 沒有 watch_id 的網址本身就是無效頁面，不必也不該把市場寫回去。
    if (watchId !== null) {
      replaceMarketQuery(market)
    }

    void loadComparison(market)
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
  [comparison, selectedDisplayCurrency],
  ([payload, displayCurrency]) => {
    if (!payload) {
      return
    }

    void loadExchangeRates({
      displayCurrency,
      sourceCurrencies: Object.values(payload.marketsByCode).map((market) => market.currencyCode),
    })
  },
  { immediate: true },
)
</script>

<template>
  <AppLayout brand="rolex" :lang="locale">
    <AppNav
      v-model:display-currency="selectedDisplayCurrency"
      v-model:market="selectedMarket"
      :display-currencies="displayCurrencies"
      :language-paths="languagePaths"
    />
    <section class="mt-8 w-full max-w-6xl" aria-labelledby="page-title">
      <BackToIndexButton class="mb-4" show-icon variant="ghost" />
      <h1 id="page-title" class="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        {{
          watch
            ? t('site.watchPriceComparison.title', { modelName: watch.modelName })
            : t('site.watchPriceComparison.pageTitle')
        }}
      </h1>
      <h2 v-if="watch" class="text-muted-foreground mt-3 text-center text-sm">
        {{ t('site.watchPriceComparison.heading', { marketName: getMarketName(selectedMarket) }) }}
      </h2>

      <Card v-if="pageStatus" class="mt-8 items-center py-12">
        <p :role="pageStatus.role">{{ t(pageStatus.messageKey) }}</p>
        <BackToIndexButton v-if="pageStatus.showBackToIndex" class="mt-2" />
      </Card>
      <template v-else-if="watch && comparison">
        <fieldset class="bg-card mx-auto mt-8 flex w-fit gap-1 rounded-lg border p-1">
          <legend class="sr-only">{{ t('site.watchPriceComparison.pageTitle') }}</legend>
          <label
            class="has-checked:bg-primary has-checked:text-primary-foreground focus-within:ring-ring cursor-pointer rounded-md px-3 py-2 text-sm font-medium focus-within:ring-2"
          >
            <input
              v-model="selectedMode"
              class="sr-only"
              type="radio"
              :value="PriceComparisonMode.Official"
            />
            {{ t('site.watchPriceComparison.officialPrice') }}
          </label>
          <label
            class="has-checked:bg-primary has-checked:text-primary-foreground focus-within:ring-ring cursor-pointer rounded-md px-3 py-2 text-sm font-medium focus-within:ring-2"
          >
            <input
              v-model="selectedMode"
              class="sr-only"
              type="radio"
              :value="PriceComparisonMode.RefundEstimate"
            />
            {{ t('site.watchPriceComparison.refundEstimate') }}
          </label>
        </fieldset>
        <p class="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm">
          {{ t('site.watchPriceComparison.modeDescription') }}
        </p>
        <p class="text-muted-foreground mx-auto mt-2 max-w-2xl text-center text-xs">
          {{ t('site.watchPriceComparison.dataBasis', { currency: selectedDisplayCurrency }) }}
        </p>
        <p
          v-if="exchangeRateError"
          class="text-muted-foreground mt-2 text-center text-xs"
          role="status"
        >
          {{ t('site.exchangeRateUnavailable') }}
        </p>

        <Card
          class="mt-6 gap-0 overflow-hidden py-0 lg:max-h-[calc(100dvh-11rem)] lg:min-h-0 lg:flex-row"
          data-testid="watch-price-comparison-card"
        >
          <aside class="border-b p-6 lg:w-80 lg:shrink-0 lg:border-r lg:border-b-0">
            <img
              class="mx-auto aspect-square w-full max-w-56 object-contain"
              :src="watch.imageUrl"
              :alt="t('site.watchList.imageAlt', { modelName: watch.modelName })"
            />
            <CardHeader class="px-0 pt-5 pb-0">
              <CardTitle>{{ watch.modelName }}</CardTitle>
              <CardDescription>{{
                t('site.watchPriceComparison.modelReference', { reference: watch.modelReference })
              }}</CardDescription>
            </CardHeader>
            <dl class="mt-5 grid gap-4 text-sm">
              <div>
                <dt class="font-medium">{{ t('site.watchDetails.caseDescriptionLabel') }}</dt>
                <dd class="text-muted-foreground mt-1">{{ watch.caseDescription }}</dd>
              </div>
              <div>
                <dt class="font-medium">{{ t('site.watchDetails.dialDescriptionLabel') }}</dt>
                <dd class="text-muted-foreground mt-1">{{ watch.dialDescription }}</dd>
              </div>
            </dl>
          </aside>
          <CardContent class="min-h-0 flex-1 p-0 lg:overflow-y-auto">
            <section class="p-6" :aria-label="t('site.watchPriceComparison.marketRows')">
              <h3 class="text-lg font-semibold">{{ t('site.watchPriceComparison.marketRows') }}</h3>
              <ul class="mt-5 grid gap-3">
                <MarketPriceRow v-for="row in comparisonRowViews" :key="row.code" :row="row" />
              </ul>
            </section>
          </CardContent>
        </Card>

        <section class="mt-8 rounded-xl border p-6" aria-labelledby="comparison-limitations">
          <h2 id="comparison-limitations" class="text-xl font-semibold">
            {{ t('site.watchPriceComparison.estimateAndLimitations') }}
          </h2>
          <p class="text-muted-foreground mt-3 text-sm leading-relaxed">
            {{ t('site.watchPriceComparison.estimateExplanation') }}
          </p>
          <p class="text-muted-foreground mt-3 text-sm leading-relaxed">
            {{ t('site.watchPriceComparison.excludedCosts') }}
          </p>
        </section>
      </template>
    </section>
  </AppLayout>
</template>
