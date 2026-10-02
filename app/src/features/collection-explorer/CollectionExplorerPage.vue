<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { useScroll, useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppBreadcrumb from '@/components/layout/AppBreadcrumb.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { Button } from '@/components/ui/button'
import WatchSelectionBar, {
  type SelectionBarItem,
} from '@/features/watch-compare/components/WatchSelectionBar.vue'
import { useWatchCompareSelection } from '@/features/watch-compare/composables/useWatchCompareSelection'
import {
  clearWatchSelection,
  toggleWatchSelection,
} from '@/features/watch-compare/utils/watchSelectionActions'
import { brands } from '@/lib/brands'
import {
  getAvailableMarketOptions,
  getCommonDefaultMarket,
  getMarketBrands,
} from '@/lib/commonMarkets'
import { DIAL_COLORS, type DialColor } from '@/lib/dialColors'
import {
  buildExplorerCollectionOptions,
  type ExplorerSort,
  type ExplorerWatch,
  filterExplorerWatches,
  getExplorerPriceDomain,
  type PriceDomain,
} from '@/lib/explorerFilters'
import { formatMediumDate, getIntlLocale } from '@/lib/formatters'
import {
  getMarketFromQuery,
  isMarketInOptions,
  type MarketCode,
  replaceMarketQuery,
} from '@/lib/markets'
import { getSitePageLanguagePaths, getSitePageUrl } from '@/lib/pageUrls'
import { buildCompareSearch, MAX_COMPARE_WATCHES } from '@/lib/watchCompareUrl'
import { PriceTypeLabelKeys } from '@/lib/watchPriceComparison'
import { Locale } from '@/plugins/i18n'

import ExplorerBrandFilter from './components/ExplorerBrandFilter.vue'
import ExplorerCollectionSelect from './components/ExplorerCollectionSelect.vue'
import ExplorerDialColorFilter from './components/ExplorerDialColorFilter.vue'
import ExplorerMarketSelect from './components/ExplorerMarketSelect.vue'
import ExplorerPriceRangeFilter from './components/ExplorerPriceRangeFilter.vue'
import ExplorerSearchBox from './components/ExplorerSearchBox.vue'
import ExplorerSortSelect from './components/ExplorerSortSelect.vue'
import ExplorerWatchImage from './components/ExplorerWatchImage.vue'
import { useCrossBrandCatalogs } from './composables/useCrossBrandCatalogs'
import {
  getBrandName,
  getCollectionLabel,
  getExplorerPriceText,
  getSingleWatchCompareHref,
} from './utils/explorerDisplay'

const MARKET_STORAGE_KEY = 'collection-explorer-market'
const PAGE_SIZE = 36
const SCROLL_STOP_IDLE_MS = 400

const { locale, t, te } = useI18n()
const { isScrolling } = useScroll(window, { idle: SCROLL_STOP_IDLE_MS })
const {
  catalogs,
  currencyMismatch,
  failedBrandIds,
  isLoading,
  isReady,
  loadCatalogs,
  missingGuards,
} = useCrossBrandCatalogs(brands)
const { selectedIds, add, remove, clear } = useWatchCompareSelection()

const languagePaths = getSitePageLanguagePaths('collection-explorer')
const availableMarkets = getAvailableMarketOptions(brands)
const defaultMarket = getCommonDefaultMarket(availableMarkets)

// 需在 defaultMarket 宣告後才能算出初始值。
const selectedMarket = useStorage<MarketCode | null>(
  MARKET_STORAGE_KEY,
  defaultMarket?.code ?? null,
  undefined,
  {
    serializer: {
      read: (value) =>
        isMarketInOptions(value, availableMarkets) ? value : (defaultMarket?.code ?? null),
      write: (market) => market ?? '',
    },
  },
)

// 需在 selectedMarket 宣告後才能覆寫其初始值。
const marketFromQuery = defaultMarket
  ? getMarketFromQuery(window.location.search, availableMarkets, defaultMarket.code)
  : null
if (marketFromQuery) selectedMarket.value = marketFromQuery

const query = ref('')
const selectedBrands = ref<string[]>([])
const filtersExpanded = ref(false)
const selectedCollection = ref('')
const selectedDialColors = ref<DialColor[]>([])
const priceRange = ref<number[]>([0, 0])
const priceFilterActive = ref(false)
const sort = ref<ExplorerSort>('default')
const visibleCount = ref(PAGE_SIZE)
const announcement = ref('')
const resultsSection = ref<HTMLElement | null>(null)

const pageLanguage = computed(() => (locale.value === Locale.enUs ? Locale.enUs : Locale.zhTw))
const availableBrandIds = computed(() =>
  selectedMarket.value
    ? getMarketBrands(brands, selectedMarket.value).map((brand) => brand.id)
    : [],
)
const intlLocale = computed(() => getIntlLocale(locale.value))
const watches = computed<ExplorerWatch[]>(() => {
  if (!isReady.value) return []
  return catalogs.value.flatMap((catalog) =>
    Object.values(catalog.watchesById).map((watch) => ({
      brandId: catalog.brandId,
      brandName: getBrandName(catalog.brandId, t),
      collectionLabel: getCollectionLabel(watch.collectionId, { t, te }),
      watch,
      currencyCode: catalog.priceMarket.currencyCode,
      priceType: catalog.priceMarket.priceType,
      priceUpdatedAt: catalog.priceUpdatedAt,
    })),
  )
})
const dialColorOptions = computed<DialColor[]>(() => {
  const present = new Set(watches.value.flatMap((item) => item.watch.dialColors))
  return DIAL_COLORS.filter((color) => present.has(color))
})
const priceDomain = computed<PriceDomain | null>(() => getExplorerPriceDomain(watches.value))
const collectionOptions = computed(() =>
  buildExplorerCollectionOptions(watches.value, selectedBrands.value),
)
const filteredWatches = computed(() =>
  filterExplorerWatches(watches.value, {
    query: query.value,
    brandIds: selectedBrands.value,
    collectionKey: selectedCollection.value === 'all' ? '' : selectedCollection.value,
    dialColors: selectedDialColors.value,
    minPrice: priceFilterActive.value ? (priceRange.value[0] ?? null) : null,
    maxPrice: priceFilterActive.value ? (priceRange.value[1] ?? null) : null,
    sort: sort.value,
    allowPriceComparison: !currencyMismatch.value,
  }),
)
const visibleWatches = computed(() => filteredWatches.value.slice(0, visibleCount.value))
const resultsGridColsClass = computed(() => {
  const count = visibleWatches.value.length
  if (count >= 3) return 'sm:grid-cols-2 xl:grid-cols-3'
  if (count === 2) return 'sm:grid-cols-2'
  return ''
})
const watchById = computed(() => new Map(watches.value.map((item) => [item.watch.watchId, item])))
const selectionItems = computed<SelectionBarItem[]>(() =>
  selectedIds.value.map((id) => {
    const item = watchById.value.get(id)
    return { id, reference: item?.watch.reference ?? id, missing: !item }
  }),
)
const compareHref = computed(() =>
  selectedMarket.value
    ? `${getSitePageUrl({ language: pageLanguage.value, page: 'watch-compare' })}?${buildCompareSearch('', selectedMarket.value, selectedIds.value)}`
    : '#',
)
const visibleBrandOptions = computed(() =>
  (selectedMarket.value ? getMarketBrands(brands, selectedMarket.value) : []).map((brand) => ({
    id: brand.id,
    name: getBrandName(brand.id, t),
  })),
)

/* 工具函式包裝 Start */
const getPriceText = (item: ExplorerWatch): string =>
  getExplorerPriceText(item, {
    locale: intlLocale.value,
    unavailableLabel: t('site.explorer.priceUnavailable'),
  })
const getSingleCompareHref = (item: ExplorerWatch): string =>
  getSingleWatchCompareHref(item, { market: selectedMarket.value, language: pageLanguage.value })

const toggleWatch = (id: string): void => {
  announcement.value = toggleWatchSelection(
    id,
    { selectedIds, add, remove },
    { changed: t('site.explorer.selectionChanged'), full: t('site.explorer.selectionFull') },
  )
}
const clearSelection = (): void => {
  announcement.value = clearWatchSelection(clear, t('site.explorer.selectionChanged'))
}
/** 結果頂端已被捲出視窗時，拉回結果區塊起點，避免筆數變動後停在列表中段或空白處。 */
const scrollResultsIntoView = (): void => {
  const section = resultsSection.value
  if (!section || section.getBoundingClientRect().top >= 0) return
  section.scrollIntoView({ block: 'start' })
}
/* 工具函式包裝 End */

watch(
  [
    selectedMarket,
    query,
    selectedBrands,
    selectedCollection,
    selectedDialColors,
    priceRange,
    priceFilterActive,
    sort,
  ],
  () => {
    visibleCount.value = PAGE_SIZE
    scrollResultsIntoView()
  },
  { flush: 'post' },
)
watch(
  priceDomain,
  (domain) => {
    priceRange.value = domain ? [domain.min, domain.max] : [0, 0]
    priceFilterActive.value = false
  },
  { immediate: true },
)
watch(selectedBrands, () => {
  if (
    selectedCollection.value &&
    !collectionOptions.value.some(([key]) => key === selectedCollection.value)
  )
    selectedCollection.value = ''
})
watch(dialColorOptions, (options) => {
  selectedDialColors.value = selectedDialColors.value.filter((color) => options.includes(color))
})
watch(availableBrandIds, (brandIds) => {
  selectedBrands.value = selectedBrands.value.filter((brandId) => brandIds.includes(brandId))
})
watch(currencyMismatch, (mismatch) => {
  if (mismatch && sort.value.startsWith('price')) sort.value = 'default'
})
watch(
  selectedMarket,
  (market) => {
    if (!market) return
    replaceMarketQuery(market)
    void loadCatalogs(market, availableBrandIds.value)
  },
  { immediate: true },
)
</script>

<template>
  <AppLayout brand="root" :lang="locale">
    <AppNav :language-paths="languagePaths" :show-market-controls="false" />
    <AppBreadcrumb :current="t('site.explorer.title')" class="my-3 self-start" />
    <div class="w-full max-w-6xl pb-40">
      <header class="border-border mt-10 border-b pb-10 sm:mt-16 sm:pb-14">
        <p class="text-muted-foreground font-mono text-xs tracking-[0.22em]">
          {{ t('site.explorer.eyebrow') }}
        </p>
        <h1 class="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          {{ t('site.explorer.title') }}
        </h1>
        <p class="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
          {{ t('site.explorer.description') }}
        </p>
      </header>

      <p v-if="!defaultMarket" role="alert" class="text-destructive mt-8">
        {{ t('site.explorer.noCommonMarket') }}
      </p>
      <p v-else-if="missingGuards.length" role="alert" class="text-destructive mt-8">
        {{ t('site.explorer.missingGuard', { brands: missingGuards.join(', ') }) }}
      </p>
      <template v-else>
        <div class="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <aside class="lg:sticky lg:top-20 lg:self-start" :aria-label="t('site.explorer.brands')">
            <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <ExplorerMarketSelect v-model="selectedMarket" :options="availableMarkets" />
              <Button
                variant="outline"
                class="h-11 justify-between self-end lg:hidden"
                :aria-expanded="filtersExpanded"
                @click="filtersExpanded = !filtersExpanded"
              >
                {{ t(filtersExpanded ? 'site.explorer.hideFilters' : 'site.explorer.showFilters') }}
              </Button>
              <ExplorerBrandFilter
                v-model="selectedBrands"
                :options="visibleBrandOptions"
                :filters-expanded="filtersExpanded"
              />
              <ExplorerCollectionSelect
                v-model="selectedCollection"
                :options="collectionOptions"
                :filters-expanded="filtersExpanded"
              />
              <ExplorerDialColorFilter
                v-model="selectedDialColors"
                :options="dialColorOptions"
                :filters-expanded="filtersExpanded"
              />
              <ExplorerPriceRangeFilter
                v-model="priceRange"
                v-model:active="priceFilterActive"
                :domain="priceDomain"
                :currency-mismatch="currencyMismatch"
                :locale="intlLocale"
                :filters-expanded="filtersExpanded"
              />
            </div>
          </aside>

          <section
            ref="resultsSection"
            aria-labelledby="explorer-results"
            class="min-w-0 scroll-mt-20"
          >
            <div class="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <ExplorerSearchBox v-model="query" />
              <ExplorerSortSelect v-model="sort" :currency-mismatch="currencyMismatch" />
            </div>
            <p
              v-if="currencyMismatch"
              role="alert"
              class="border-destructive/30 bg-destructive/5 mt-5 border p-4 text-sm"
            >
              {{ t('site.explorer.currencyMismatch') }}
            </p>
            <div class="border-border mt-6 flex items-center justify-between border-b pb-3">
              <h2 id="explorer-results" class="text-xs font-semibold tracking-widest uppercase">
                {{ t('site.explorer.results', { count: filteredWatches.length }) }}
              </h2>
              <span v-if="catalogs[0]" class="text-muted-foreground font-mono text-xs">
                {{ catalogs[0].priceMarket.currencyCode }}
              </span>
            </div>
            <p v-if="isLoading" role="status" class="text-muted-foreground py-16 text-center">
              {{ t('site.explorer.loading') }}
            </p>
            <div v-else-if="failedBrandIds.length" class="py-12" role="alert">
              <p>
                {{
                  t('site.explorer.loadError', {
                    brands: failedBrandIds.map((id) => getBrandName(id, t)).join(', '),
                  })
                }}
              </p>
              <Button
                class="mt-5"
                variant="outline"
                @click="selectedMarket && loadCatalogs(selectedMarket, availableBrandIds)"
              >
                {{ t('site.explorer.retry') }}
              </Button>
            </div>
            <p
              v-else-if="isReady && !filteredWatches.length"
              class="text-muted-foreground py-16 text-center"
            >
              {{ t('site.explorer.empty') }}
            </p>
            <div v-else class="border-border grid border-t border-l" :class="resultsGridColsClass">
              <article
                v-for="item in visibleWatches"
                :key="item.watch.watchId"
                :data-watch-id="item.watch.watchId"
                class="bg-background border-border flex min-w-0 flex-col border-r border-b p-5 sm:p-6"
              >
                <ExplorerWatchImage
                  :view="{
                    imageUrl: item.watch.imageUrl,
                    alt: `${item.brandName} ${item.watch.reference}`,
                    brandName: item.brandName,
                    reference: item.watch.reference,
                    href: getSingleCompareHref(item),
                    compareLabel: t('site.explorer.singleCompare'),
                  }"
                  :is-scrolling="isScrolling"
                />
                <p
                  class="text-muted-foreground mt-5 font-mono text-[11px] tracking-wider uppercase"
                >
                  {{ item.brandName }} / {{ item.collectionLabel }}
                </p>
                <h3 class="mt-2 line-clamp-2 min-h-12 text-lg leading-snug font-medium">
                  {{ item.watch.modelName }}
                </h3>
                <p class="text-muted-foreground mt-1 font-mono text-xs break-all">
                  {{ item.watch.reference }}
                </p>
                <div class="mt-auto pt-5">
                  <p class="text-muted-foreground text-xs">
                    {{ t(PriceTypeLabelKeys[item.priceType]) }}
                  </p>
                  <p class="mt-1 text-base font-semibold">{{ getPriceText(item) }}</p>
                  <p
                    v-if="item.watch.priceStatus === 'retailer-only'"
                    class="text-muted-foreground mt-1 text-xs"
                  >
                    {{ t('site.explorer.retailerOnly') }}
                  </p>
                  <p class="text-muted-foreground mt-2 text-xs">
                    {{
                      t('site.explorer.updated', {
                        date: formatMediumDate(item.priceUpdatedAt, intlLocale),
                      })
                    }}
                  </p>
                  <Button
                    variant="outline"
                    class="mt-5 w-full justify-between"
                    :aria-pressed="selectedIds.includes(item.watch.watchId)"
                    :disabled="
                      selectedIds.length >= MAX_COMPARE_WATCHES &&
                      !selectedIds.includes(item.watch.watchId)
                    "
                    @click="toggleWatch(item.watch.watchId)"
                  >
                    {{
                      t(
                        selectedIds.includes(item.watch.watchId)
                          ? 'site.explorer.remove'
                          : 'site.explorer.add',
                      )
                    }}
                    <X v-if="selectedIds.includes(item.watch.watchId)" aria-hidden="true" />
                    <Plus v-else aria-hidden="true" />
                  </Button>
                </div>
              </article>
            </div>
            <Button
              v-if="visibleCount < filteredWatches.length"
              variant="outline"
              class="mt-8 w-full"
              @click="visibleCount += PAGE_SIZE"
            >
              {{ t('site.explorer.loadMore') }}
            </Button>
          </section>
        </div>
      </template>
    </div>
    <div class="sr-only" aria-live="polite">{{ announcement }}</div>
    <WatchSelectionBar
      v-if="selectedIds.length"
      :items="selectionItems"
      :compare-href="compareHref"
      @remove="toggleWatch"
      @clear="clearSelection"
    />
  </AppLayout>
</template>
