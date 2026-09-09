import { type Ref, ref } from 'vue'

import { Method, useFetchData } from '@/composables/useFetchData'
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets'
import { isWatchCatalog, isWatchDataManifest } from '@/lib/watchDataValidation'
import type { WatchCatalog } from '@/types/watch-data'

interface CatalogResponse {
  catalog: WatchCatalog
  currencies: string[]
}

const catalogRequests = new Map<MarketCode, Promise<CatalogResponse>>()

const getWatchDataUrl = (fileName: string): string => {
  const versionQuery = fileName === 'manifest.json' ? `?v=${__WATCH_DATA_VERSION__}` : ''
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  return `${baseUrl}watch-data/${fileName}${versionQuery}`
}

/**
 * 透過共用資料請求 composable 取得 JSON 回應內容。
 *
 * @param url - watch-data 靜態 JSON 的完整應用程式路徑。
 * @returns 未經格式驗證的 JSON 回應資料。
 * @throws 當請求失敗或未包含回應內容時拋出錯誤。
 */
const getJson = async (url: string): Promise<unknown> => {
  const { result } = await useFetchData<unknown>({
    url,
    method: Method.GET,
    isAbsolutePath: true,
  })
  const [response, error] = result

  if (error) {
    throw error
  }

  if (!response) {
    throw new Error('Watch data request returned no response')
  }

  return response.data
}

const fetchCatalog = async (market: MarketCode): Promise<CatalogResponse> => {
  const manifest = await getJson(getWatchDataUrl('manifest.json'))

  if (!isWatchDataManifest(manifest)) {
    throw new Error('Watch data manifest has an invalid format')
  }

  const catalogFileName = manifest.catalogs[market]

  if (!catalogFileName) {
    throw new Error(`Watch data manifest does not contain the ${market} market`)
  }

  const catalog = await getJson(getWatchDataUrl(catalogFileName))

  if (!isWatchCatalog(catalog)) {
    throw new Error('Watch catalog has an invalid format')
  }

  return { catalog, currencies: manifest.currencies }
}

export const useWatchCatalog = (): {
  catalog: Readonly<Ref<WatchCatalog | null>>
  displayCurrencies: Readonly<Ref<readonly string[]>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadCatalog: (market?: MarketCode) => Promise<void>
} => {
  const catalog = ref<WatchCatalog | null>(null)
  const displayCurrencies = ref<readonly string[]>([])
  const error = ref<unknown>(null)
  const isLoading = ref(false)

  const loadCatalog = async (market: MarketCode = DEFAULT_MARKET): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const request = catalogRequests.get(market) ?? fetchCatalog(market)
      catalogRequests.set(market, request)
      const response = await request
      catalog.value = response.catalog
      displayCurrencies.value = response.currencies
    } catch (requestError) {
      error.value = requestError
      catalogRequests.delete(market)
    } finally {
      isLoading.value = false
    }
  }

  return { catalog, displayCurrencies, error, isLoading, loadCatalog }
}
