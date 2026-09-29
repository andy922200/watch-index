import { computed, type Ref, ref } from 'vue'

import { useWatchCatalog } from '@/composables/useWatchCatalog'
import type { BrandConfig } from '@/lib/brands'
import { type MarketCode } from '@/lib/markets'
import { isLonginesWatchCatalog } from '@/lib/validation/longinesWatch'
import { isOmegaWatchCatalog } from '@/lib/validation/omegaWatch'
import { isRolexWatchCatalog } from '@/lib/validation/rolexWatch'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

type CatalogGuard = (value: unknown) => value is WatchCatalog<BaseWatch>

const catalogGuards: Record<string, CatalogGuard> = {
  rolex: isRolexWatchCatalog,
  omega: isOmegaWatchCatalog,
  longines: isLonginesWatchCatalog,
}

interface BrandCatalogState {
  brand: BrandConfig
  catalog: Readonly<Ref<WatchCatalog<BaseWatch> | null>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadCatalog: (market: MarketCode) => Promise<void>
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
  const states: BrandCatalogState[] = brands.flatMap((brand) => {
    const isCatalog = catalogGuards[brand.id]
    if (!isCatalog) return []

    return [{ brand, ...useWatchCatalog<BaseWatch>({ brandId: brand.id, isCatalog }) }]
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
      .flatMap((state) => (state.catalog.value ? [state.catalog.value] : [])),
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
