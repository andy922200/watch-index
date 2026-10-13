import { computed, type Ref, ref } from 'vue'

import { getWatchDataFile, getWatchDataManifest } from '@/api/watchDataApi'
import { useWatchCatalog } from '@/composables/useWatchCatalog'
import type { BrandConfig } from '@/lib/brands'
import { buildExplorerCatalog } from '@/lib/explorerFilters'
import { type MarketCode } from '@/lib/markets'
import { isLonginesWatchCatalog } from '@/lib/validation/longinesWatch'
import { isOmegaWatchCatalog } from '@/lib/validation/omegaWatch'
import { isRolexWatchCatalog } from '@/lib/validation/rolexWatch'
import { isWatchPriceComparisonPayload } from '@/lib/validation/watch'
import type { BaseWatch, WatchCatalog, WatchPriceComparisonPayload } from '@/types/watch-data'

type CatalogGuard = (value: unknown) => value is WatchCatalog<BaseWatch>

const catalogGuards: Record<string, CatalogGuard> = {
  rolex: isRolexWatchCatalog,
  omega: isOmegaWatchCatalog,
  longines: isLonginesWatchCatalog,
}

interface BrandCatalogState {
  brand: BrandConfig
  catalog: Readonly<Ref<WatchCatalog<BaseWatch> | null>>
  comparisonCatalog: Readonly<Ref<WatchCatalog<BaseWatch> | null>>
  comparison: Readonly<Ref<WatchPriceComparisonPayload | null>>
  marketCode: Readonly<Ref<MarketCode | null>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadCatalog: (market: MarketCode) => Promise<void>
}

const createBrandCatalogState = (brand: BrandConfig): BrandCatalogState | null => {
  const isCatalog = catalogGuards[brand.id]
  if (!isCatalog) return null

  const marketCatalogState = useWatchCatalog<BaseWatch>({ brandId: brand.id, isCatalog })
  const comparisonCatalog = ref<WatchCatalog<BaseWatch> | null>(null)
  const comparison = ref<WatchPriceComparisonPayload | null>(null)
  const marketCode = ref<MarketCode | null>(null)
  const comparisonError = ref<unknown>(null)
  const isComparisonLoading = ref(false)
  const error = computed(() => marketCatalogState.error.value ?? comparisonError.value)
  const isLoading = computed(() => marketCatalogState.isLoading.value || isComparisonLoading.value)
  let latestRequestId = 0

  const loadCatalog = async (market: MarketCode): Promise<void> => {
    const requestId = ++latestRequestId
    marketCode.value = market
    comparisonCatalog.value = null
    comparison.value = null
    comparisonError.value = null
    isComparisonLoading.value = true

    const loadComparisonData = async (): Promise<void> => {
      try {
        const manifest = await getWatchDataManifest(brand.id)
        if (!manifest.comparisonCatalog) {
          throw new Error(`Watch data manifest has no comparison catalog for ${brand.id}`)
        }

        const [rawComparisonCatalog, rawComparison] = await Promise.all([
          getWatchDataFile(brand.id, manifest.comparisonCatalog),
          getWatchDataFile(brand.id, manifest.comparison),
        ])

        if (!isCatalog(rawComparisonCatalog) || !isWatchPriceComparisonPayload(rawComparison)) {
          throw new Error(`Cross-market watch data has an invalid format for ${brand.id}`)
        }
        if (
          rawComparisonCatalog.brandId !== brand.id ||
          rawComparison.brandId !== brand.id ||
          !Object.prototype.hasOwnProperty.call(rawComparison.marketsByCode, market)
        ) {
          throw new Error(`Cross-market watch data does not match ${brand.id}:${market}`)
        }
        const missingMarketPrice = Object.keys(rawComparisonCatalog.watchesById).find(
          (watchId) => rawComparison.pricesByWatchId[watchId]?.[market] === undefined,
        )
        if (missingMarketPrice) {
          throw new Error(
            `Cross-market price data is missing ${brand.id}:${market}:${missingMarketPrice}`,
          )
        }

        if (requestId === latestRequestId) {
          comparisonCatalog.value = rawComparisonCatalog
          comparison.value = rawComparison
        }
      } catch (requestError) {
        if (requestId === latestRequestId) comparisonError.value = requestError
      } finally {
        if (requestId === latestRequestId) isComparisonLoading.value = false
      }
    }

    await Promise.all([marketCatalogState.loadCatalog(market), loadComparisonData()])
  }

  return {
    brand,
    catalog: marketCatalogState.catalog,
    comparisonCatalog,
    comparison,
    marketCode,
    error,
    isLoading,
    loadCatalog,
  }
}

/**
 * 整合多個品牌的 catalog 載入狀態，供跨品牌頁面（如收藏總覽）依「目前請求中的品牌清單」
 * 統一判斷載入中、錯誤與幣別不一致等情形。
 *
 * @param brands - 欲支援的品牌設定清單；缺少對應 type guard 的品牌會被排除，其 id 會列在回傳的
 * `missingGuards` 中。
 * @returns 各品牌 catalog 的彙總狀態與 `loadCatalogs` 載入函式。
 */
export const useCrossBrandCatalogs = (brands: readonly BrandConfig[]) => {
  const missingGuards = brands.filter((brand) => !catalogGuards[brand.id]).map((brand) => brand.id)
  const states = brands.flatMap((brand) => {
    const state = createBrandCatalogState(brand)
    return state ? [state] : []
  })
  const requestedBrandIds = ref<readonly string[]>([])
  const currencyMismatch = computed(() => {
    const currencies = states
      .filter((state) => requestedBrandIds.value.includes(state.brand.id))
      .map((state) => state.catalog.value?.priceMarket.currencyCode)
      .filter((currency) => currency !== undefined)
    return new Set(currencies).size > 1
  })
  const failedBrandIds = computed(() =>
    states
      .filter((state) => requestedBrandIds.value.includes(state.brand.id) && state.error.value)
      .map((state) => state.brand.id),
  )
  const isLoading = computed(() =>
    states.some(
      (state) => requestedBrandIds.value.includes(state.brand.id) && state.isLoading.value,
    ),
  )
  const catalogs = computed(() =>
    states
      .filter((state) => requestedBrandIds.value.includes(state.brand.id))
      .flatMap((state) => {
        const marketCatalog = state.catalog.value
        const unionCatalog = state.comparisonCatalog.value
        const priceComparison = state.comparison.value
        const marketCode = state.marketCode.value
        if (!marketCatalog || !unionCatalog || !priceComparison || !marketCode) return []

        return [
          buildExplorerCatalog({
            marketCatalog,
            comparisonCatalog: unionCatalog,
            comparison: priceComparison,
            marketCode,
          }),
        ]
      }),
  )
  const isReady = computed(
    () =>
      missingGuards.length === 0 &&
      !isLoading.value &&
      !currencyMismatch.value &&
      failedBrandIds.value.length === 0 &&
      catalogs.value.length === requestedBrandIds.value.length,
  )

  const loadCatalogs = async (
    market: MarketCode,
    brandIds: readonly string[] = brands.map((brand) => brand.id),
  ): Promise<void> => {
    requestedBrandIds.value = [...brandIds]
    await Promise.all(
      states
        .filter((state) => brandIds.includes(state.brand.id))
        .map((state) => state.loadCatalog(market)),
    )
  }

  return {
    catalogs,
    currencyMismatch,
    failedBrandIds,
    isLoading,
    isReady,
    loadCatalogs,
    missingGuards,
  }
}
