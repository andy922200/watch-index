import { type Ref, ref } from 'vue'

import { getWatchDataFile, getWatchDataManifest } from '@/api/watchDataApi'
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

interface RawCatalogResponse {
  catalog: unknown
  currencies: string[]
}

interface UseWatchCatalogOptions<TWatch extends BaseWatch> {
  /** 該品牌 catalog 的 type guard，例如 `isRolexWatchCatalog`。 */
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
}

interface UseWatchCatalogResult<TWatch extends BaseWatch> {
  catalog: Readonly<Ref<WatchCatalog<TWatch> | null>>
  displayCurrencies: Readonly<Ref<readonly string[]>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadCatalog: (market?: MarketCode) => Promise<void>
}

const fetchCatalog = async (market: MarketCode): Promise<RawCatalogResponse> => {
  const manifest = await getWatchDataManifest()
  const catalogFileName = manifest.catalogs[market]

  if (!catalogFileName) {
    throw new Error(`Watch data manifest does not contain the ${market} market`)
  }

  const catalog = await getWatchDataFile(catalogFileName)

  return { catalog, currencies: manifest.currencies }
}

/**
 * 載入指定市場的錶款 catalog，並以品牌自己的 guard 驗證格式。
 *
 * 請求本身由 {@link getWatchDataFile} 依檔名共用，因此同一份資料不會重複下載。
 *
 * @param options - 需包含該品牌的 catalog type guard。
 * @returns catalog 狀態與載入函式。
 */
export const useWatchCatalog = <TWatch extends BaseWatch>({
  isCatalog,
}: UseWatchCatalogOptions<TWatch>): UseWatchCatalogResult<TWatch> => {
  const catalog = ref<WatchCatalog<TWatch> | null>(null)
  const displayCurrencies = ref<readonly string[]>([])
  const error = ref<unknown>(null)
  const isLoading = ref(false)

  const loadCatalog = async (market: MarketCode = DEFAULT_MARKET): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetchCatalog(market)

      if (!isCatalog(response.catalog)) {
        throw new Error('Watch catalog has an invalid format')
      }

      catalog.value = response.catalog
      displayCurrencies.value = response.currencies
    } catch (requestError) {
      error.value = requestError
    } finally {
      isLoading.value = false
    }
  }

  return { catalog, displayCurrencies, error, isLoading, loadCatalog }
}
