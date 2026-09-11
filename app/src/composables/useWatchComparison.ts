import { type Ref, ref } from 'vue'

import { getWatchDataFile, getWatchDataManifest } from '@/api/watchDataApi'
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets'
import { isWatchPriceComparisonPayload } from '@/lib/validation/watch'
import type { BaseWatch, WatchCatalog, WatchPriceComparisonPayload } from '@/types/watch-data'

interface RawComparisonResponse {
  catalog: unknown
  comparison: unknown
  currencies: readonly string[]
}

interface UseWatchComparisonOptions<TWatch extends BaseWatch> {
  /** 該品牌 catalog 的 type guard，例如 `isRolexWatchCatalog`。 */
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
}

interface UseWatchComparisonResult<TWatch extends BaseWatch> {
  catalog: Readonly<Ref<WatchCatalog<TWatch> | null>>
  comparison: Readonly<Ref<WatchPriceComparisonPayload | null>>
  displayCurrencies: Readonly<Ref<readonly string[]>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadComparison: (market?: MarketCode) => Promise<void>
}

const fetchComparison = async (market: MarketCode): Promise<RawComparisonResponse> => {
  const manifest = await getWatchDataManifest()
  const catalogFileName = manifest.catalogs[market]

  if (!catalogFileName) {
    throw new Error(`Watch data manifest does not contain the ${market} market`)
  }

  const [catalog, comparison] = await Promise.all([
    getWatchDataFile(catalogFileName),
    getWatchDataFile(manifest.comparison),
  ])

  return { catalog, comparison, currencies: manifest.currencies }
}

/**
 * 載入指定市場的 catalog 與跨市場比價資料，並以品牌自己的 guard 驗證 catalog 格式。
 *
 * 比價 payload 僅以 watchId 為鍵，與品牌無關，因此沿用共用 guard。
 *
 * @param options - 需包含該品牌的 catalog type guard。
 * @returns 比價資料狀態與載入函式。
 */
export const useWatchComparison = <TWatch extends BaseWatch>({
  isCatalog,
}: UseWatchComparisonOptions<TWatch>): UseWatchComparisonResult<TWatch> => {
  const catalog = ref<WatchCatalog<TWatch> | null>(null)
  const comparison = ref<WatchPriceComparisonPayload | null>(null)
  const displayCurrencies = ref<readonly string[]>([])
  const error = ref<unknown>(null)
  const isLoading = ref(false)
  let latestRequestId = 0

  const loadComparison = async (market: MarketCode = DEFAULT_MARKET): Promise<void> => {
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    try {
      const response = await fetchComparison(market)

      if (!isCatalog(response.catalog)) {
        throw new Error('Watch catalog has an invalid format')
      }

      if (!isWatchPriceComparisonPayload(response.comparison)) {
        throw new Error('Watch comparison payload has an invalid format')
      }

      if (requestId === latestRequestId) {
        catalog.value = response.catalog
        comparison.value = response.comparison
        displayCurrencies.value = response.currencies
      }
    } catch (requestError) {
      if (requestId === latestRequestId) {
        catalog.value = null
        comparison.value = null
        displayCurrencies.value = []
        error.value = requestError
      }
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  return { catalog, comparison, displayCurrencies, error, isLoading, loadComparison }
}
