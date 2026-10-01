<script setup lang="ts">
import { ArrowLeft, Check, Link } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppBreadcrumb from '@/components/layout/AppBreadcrumb.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { Button } from '@/components/ui/button'
import { useCrossBrandCatalogs } from '@/features/collection-explorer/composables/useCrossBrandCatalogs'
import { useWatchCompareSelection } from '@/features/collection-explorer/composables/useWatchCompareSelection'
import { brands } from '@/lib/brands'
import { getIntlLocale } from '@/lib/formatters'
import { DEFAULT_MARKET, getMarketFromQuery, type MarketCode, marketOptions } from '@/lib/markets'
import { getSitePageLanguagePaths, getSitePageUrl } from '@/lib/pageUrls'
import {
  brandIdForWatch,
  MAX_COMPARE_WATCHES,
  parseCompareSelection,
  syncCompareUrl,
} from '@/lib/watchCompareUrl'
import { Locale } from '@/plugins/i18n'

import CompareStatusBanners from './components/CompareStatusBanners.vue'
import WatchCompareTable from './components/WatchCompareTable.vue'
import { removeCompareWatch } from './utils/watchCompareActions'
import {
  buildColumnDisplays,
  buildCompareRows,
  type CompareColumn,
} from './utils/watchCompareDisplay'

const { locale, t, te } = useI18n()
const localSelection = useWatchCompareSelection()
const { copied: isLinkCopied, copy: copyText } = useClipboard({ copiedDuring: 2000 })
const { catalogs, currencyMismatch, failedBrandIds, isLoading, loadCatalogs, missingGuards } =
  useCrossBrandCatalogs(brands)
const languagePaths = getSitePageLanguagePaths('watch-compare')
const parsedUrl = parseCompareSelection(window.location.search)
const knownBrandIds = new Set(brands.map((brand) => brand.id))
const selectedIds = ref<string[]>(
  parsedUrl.isUrlDriven ? parsedUrl.ids : [...localSelection.selectedIds.value],
)
const selectedMarket = ref<MarketCode | null>(
  getMarketFromQuery(window.location.search, marketOptions, DEFAULT_MARKET) ?? DEFAULT_MARKET,
)
const pageLanguage = computed(() => (locale.value === Locale.enUs ? Locale.enUs : Locale.zhTw))
const intlLocale = computed(() => getIntlLocale(locale.value))
const requestedBrandIds = computed(() => [
  ...new Set(
    selectedIds.value.map((id) => brandIdForWatch(id, knownBrandIds)).filter((id) => id !== null),
  ),
])
const loadableBrandIds = computed(() =>
  requestedBrandIds.value.filter((brandId) =>
    brands.some(
      (brand) =>
        brand.id === brandId &&
        brand.marketOptions.some((option) => option.code === selectedMarket.value),
    ),
  ),
)
const catalogByBrand = computed(
  () => new Map(catalogs.value.map((catalog) => [catalog.brandId, catalog])),
)
const columns = computed<CompareColumn[]>(() =>
  selectedIds.value.map((id) => {
    const brandId = brandIdForWatch(id, knownBrandIds)
    const catalog = brandId ? (catalogByBrand.value.get(brandId) ?? null) : null
    return { id, brandId, catalog, watch: catalog?.watchesById[id] ?? null }
  }),
)
const columnDisplays = computed(() => buildColumnDisplays(columns.value, { t }))
const compareRows = computed(() =>
  buildCompareRows(columnDisplays.value, { t, te, intlLocale: intlLocale.value }),
)
const invalidIds = computed(() =>
  columns.value.filter((column) => !column.brandId).map((column) => column.id),
)
const validCount = computed(() => columns.value.filter((column) => column.watch).length)
const tooMany = computed(() => selectedIds.value.length > MAX_COMPARE_WATCHES)
const explorerHref = computed(() => {
  const url = getSitePageUrl({ language: pageLanguage.value, page: 'collection-explorer' })
  return `${url}?market_code=${selectedMarket.value}`
})
const showComparisonResult = computed(
  () =>
    !missingGuards.length &&
    selectedIds.value.length >= 2 &&
    !isLoading.value &&
    !failedBrandIds.value.length,
)

/* 工具函式包裝 Start */
const removeWatch = (id: string): void =>
  removeCompareWatch(id, {
    selectedIds,
    removeFromLocalSelection: localSelection.remove,
    afterRemove: () => {
      if (selectedMarket.value) syncCompareUrl(selectedMarket.value, selectedIds.value)
    },
  })
const copyShareLink = (): Promise<void> => copyText(window.location.href)
/* 工具函式包裝 End */

watch(
  selectedMarket,
  (market) => {
    if (!market) return
    syncCompareUrl(market, selectedIds.value)
    void loadCatalogs(market, loadableBrandIds.value)
  },
  { immediate: true },
)
watch(requestedBrandIds, () => {
  if (selectedMarket.value) void loadCatalogs(selectedMarket.value, loadableBrandIds.value)
})
</script>

<template>
  <AppLayout brand="root" :lang="locale">
    <AppNav :language-paths="languagePaths" :show-market-controls="false" />
    <AppBreadcrumb
      :current="t('site.explorer.compareTitle')"
      :trail="[{ href: explorerHref, label: t('site.explorer.backToExplorer') }]"
      class="my-3 self-start"
    />
    <div class="w-full max-w-6xl pb-24">
      <header class="border-border mt-10 border-b pb-10 sm:mt-16 sm:pb-14">
        <p class="text-muted-foreground font-mono text-xs tracking-[0.22em]">
          {{ t('site.explorer.compareEyebrow') }}
        </p>
        <h1 class="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          {{ t('site.explorer.compareTitle') }}
        </h1>
        <p class="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
          {{ t('site.explorer.compareDescription') }}
        </p>
        <div class="mt-8 flex flex-wrap items-end justify-between gap-5">
          <Button variant="outline" as-child class="h-11">
            <a :href="explorerHref">
              <ArrowLeft aria-hidden="true" />
              {{ t('site.explorer.backToExplorer') }}
            </a>
          </Button>
          <Button variant="outline" class="h-11 cursor-pointer" @click="copyShareLink">
            <Check v-if="isLinkCopied" aria-hidden="true" />
            <Link v-else aria-hidden="true" />
            <span aria-live="polite">
              {{ t(isLinkCopied ? 'site.explorer.shareLinkCopied' : 'site.explorer.shareLink') }}
            </span>
          </Button>
        </div>
      </header>
      <CompareStatusBanners
        :missing-guards="missingGuards"
        :too-many="tooMany"
        :selected-count="selectedIds.length"
        :is-loading="isLoading"
        :failed-brand-ids="failedBrandIds"
        :currency-mismatch="currencyMismatch"
        :invalid-ids="invalidIds"
        :valid-count="validCount"
        @retry="selectedMarket && loadCatalogs(selectedMarket, loadableBrandIds)"
      />
      <template v-if="showComparisonResult">
        <p class="text-muted-foreground mt-8 text-sm">{{ t('site.explorer.share') }}</p>
        <WatchCompareTable
          :columns="columnDisplays"
          :rows="compareRows"
          :selected-market="selectedMarket"
          :page-language="pageLanguage"
          @remove="removeWatch"
        />
      </template>
    </div>
  </AppLayout>
</template>
