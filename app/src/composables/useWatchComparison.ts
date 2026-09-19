import { type Ref, ref } from 'vue'

import { getWatchDataFile, getWatchDataManifest } from '@/api/watchDataApi'
import type { BrandId } from '@/lib/brands'
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets'
import { isWatchPriceComparisonPayload } from '@/lib/validation/watch'
import type { BaseWatch, WatchCatalog, WatchPriceComparisonPayload } from '@/types/watch-data'

interface RawComparisonResponse {
  catalog: unknown
  comparison: unknown
  currencies: readonly string[]
  /**
   * 全品牌市場聯集 catalog 的檔名，供市場專屬 catalog 缺某支錶時補資料用。
   * 選定市場本身沒有專屬 catalog、已經直接借用這份聯集資料時為 null，
   * 因為那種情況下 catalog 就是聯集本身，不需要再多查一次。
   */
  fallbackCatalogFileName: string | null
}

interface UseWatchComparisonOptions<TWatch extends BaseWatch> {
  brandId: BrandId
  /** 該品牌 catalog 的 type guard，例如 `isRolexWatchCatalog`。 */
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
}

interface LoadComparisonOptions {
  market?: MarketCode
  /** 目前檢視的錶款 id；為 null 代表尚未鎖定特定錶款，不需要跨市場補資料。 */
  watchId: string | null
}

interface UseWatchComparisonResult<TWatch extends BaseWatch> {
  catalog: Readonly<Ref<WatchCatalog<TWatch> | null>>
  comparison: Readonly<Ref<WatchPriceComparisonPayload | null>>
  displayCurrencies: Readonly<Ref<readonly string[]>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadComparison: (options: LoadComparisonOptions) => Promise<void>
}

const fetchComparison = async (
  brandId: BrandId,
  market: MarketCode,
): Promise<RawComparisonResponse> => {
  const manifest = await getWatchDataManifest(brandId)
  const catalogFileName = manifest.catalogs[market] ?? manifest.comparisonCatalog

  if (!catalogFileName) {
    throw new Error(`Watch data manifest does not contain the ${market} market`)
  }

  const [catalog, comparison] = await Promise.all([
    getWatchDataFile(brandId, catalogFileName),
    getWatchDataFile(brandId, manifest.comparison),
  ])

  return {
    catalog,
    comparison,
    currencies: manifest.currencies,
    fallbackCatalogFileName:
      catalogFileName === manifest.comparisonCatalog ? null : (manifest.comparisonCatalog ?? null),
  }
}

interface ResolveWatchFallbackOptions<TWatch extends BaseWatch> {
  brandId: BrandId
  fallbackCatalogFileName: string
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
  marketCatalog: WatchCatalog<TWatch>
  watchId: string
}

/**
 * 市場專屬 catalog 只收錄「該市場實際上市」的錶；跨市場比價卻常常是在瀏覽一支
 * 選定市場沒上市、但其他市場買得到的錶（例如台灣未上市的錶款）。這種情況市場
 * catalog 裡查不到這個 watchId，因此才需要補抓涵蓋全品牌所有市場聯集文字的
 * comparisonCatalog，只取出這一支錶的資料補進去——只在真的缺資料時才多打這次
 * 請求，且只覆蓋這一筆，其餘原本就查得到的錶不受影響，避免整份改用聯集資料
 * 反而丟掉其他錶原本的市場在地文字。
 */
const resolveWatchFallback = async <TWatch extends BaseWatch>({
  brandId,
  fallbackCatalogFileName,
  isCatalog,
  marketCatalog,
  watchId,
}: ResolveWatchFallbackOptions<TWatch>): Promise<WatchCatalog<TWatch>> => {
  const fallbackCatalog = await getWatchDataFile(brandId, fallbackCatalogFileName)

  if (!isCatalog(fallbackCatalog)) {
    throw new Error('Watch comparison catalog has an invalid format')
  }

  const fallbackWatch = fallbackCatalog.watchesById[watchId]

  if (!fallbackWatch) {
    return marketCatalog
  }

  return {
    ...marketCatalog,
    watchesById: { ...marketCatalog.watchesById, [watchId]: fallbackWatch },
  }
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
  brandId,
  isCatalog,
}: UseWatchComparisonOptions<TWatch>): UseWatchComparisonResult<TWatch> => {
  const catalog = ref<WatchCatalog<TWatch> | null>(null)
  const comparison = ref<WatchPriceComparisonPayload | null>(null)
  const displayCurrencies = ref<readonly string[]>([])
  const error = ref<unknown>(null)
  const isLoading = ref(false)
  let latestRequestId = 0

  const loadComparison = async ({
    market = DEFAULT_MARKET,
    watchId,
  }: LoadComparisonOptions): Promise<void> => {
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    try {
      const response = await fetchComparison(brandId, market)

      if (!isCatalog(response.catalog)) {
        throw new Error('Watch catalog has an invalid format')
      }

      if (!isWatchPriceComparisonPayload(response.comparison)) {
        throw new Error('Watch comparison payload has an invalid format')
      }

      // 條件寫在同一個三元運算式裡（而非拆成獨立的布林變數）是刻意的：
      // TypeScript 才能在為真分支把 fallbackCatalogFileName／watchId 縮限為
      // 非 null 的 string，不必再用 `as` 斷言掩蓋。
      const resolvedCatalog =
        watchId !== null &&
        response.fallbackCatalogFileName !== null &&
        !(watchId in response.catalog.watchesById)
          ? await resolveWatchFallback({
              brandId,
              fallbackCatalogFileName: response.fallbackCatalogFileName,
              isCatalog,
              marketCatalog: response.catalog,
              watchId,
            })
          : response.catalog

      if (requestId === latestRequestId) {
        catalog.value = resolvedCatalog
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
