import { Method, useFetchData } from '@/composables/useFetchData'
import type { BrandId } from '@/lib/brands'
import { isWatchDataManifest } from '@/lib/validation/watch'
import type { WatchDataManifest } from '@/types/watch-data'

export const getWatchDataUrl = (brandId: BrandId, fileName: string): string => {
  const versionQuery = fileName === 'manifest.json' ? `?v=${__WATCH_DATA_VERSION__}` : ''
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  return `${baseUrl}watch-data/${brandId}/${fileName}${versionQuery}`
}

/**
 * 透過共用資料請求 composable 取得 JSON 回應內容。
 *
 * @param url - watch-data 靜態 JSON 的完整應用程式路徑。
 * @returns 未經格式驗證的 JSON 回應資料。
 * @throws 當請求失敗或未包含回應內容時拋出錯誤。
 */
export const getWatchDataJson = async (url: string): Promise<unknown> => {
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

/** 每個品牌各有一份 manifest；同品牌在單次頁面載入內只會實際請求一次。 */
const manifestRequests = new Map<BrandId, Promise<WatchDataManifest>>()

/**
 * 版本化資料檔的請求快取。
 *
 * 鍵包含品牌與 manifest 解析出的檔名。檔名帶有內容雜湊，因此同一份內容只會被下載一次，
 * 不同市場、品牌或版本的資料檔不會互相覆蓋。
 */
const fileRequests = new Map<string, Promise<unknown>>()

const getFileRequestKey = (brandId: BrandId, fileName: string): string => `${brandId}:${fileName}`

const fetchManifest = async (brandId: BrandId): Promise<WatchDataManifest> => {
  const manifest = await getWatchDataJson(getWatchDataUrl(brandId, 'manifest.json'))

  if (!isWatchDataManifest(manifest)) {
    throw new Error('Watch data manifest has an invalid format')
  }

  return manifest
}

/**
 * 取得指定品牌的 watch-data manifest，同品牌在同一次頁面載入內只會實際請求一次。
 *
 * @param brandId - 要讀取的品牌資料目錄。
 * @returns 已驗證格式的 manifest。
 * @throws 當請求失敗或格式不符時拋出錯誤，並清除快取讓後續呼叫可重試。
 */
export const getWatchDataManifest = (brandId: BrandId): Promise<WatchDataManifest> => {
  const request = manifestRequests.get(brandId)

  if (request) {
    return request
  }

  const nextRequest = fetchManifest(brandId).catch((error: unknown) => {
    manifestRequests.delete(brandId)

    throw error
  })

  manifestRequests.set(brandId, nextRequest)

  return nextRequest
}

/**
 * 取得 manifest 指向的版本化資料檔，並以品牌與檔名為鍵共用同一個請求。
 *
 * 回傳的是未經格式驗證的 JSON：下載與品牌無關，格式驗證由呼叫端依品牌自行負責。
 *
 * @param brandId - 要讀取的品牌資料目錄。
 * @param fileName - manifest 解析出的內容雜湊檔名。
 * @returns 未經格式驗證的 JSON 回應資料。
 * @throws 當請求失敗時拋出錯誤，並一併清除 manifest 快取，
 *   讓重試能重新解析檔名（涵蓋部署後舊雜湊檔已移除的情況）。
 */
export const getWatchDataFile = (brandId: BrandId, fileName: string): Promise<unknown> => {
  const requestKey = getFileRequestKey(brandId, fileName)
  const cachedRequest = fileRequests.get(requestKey)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = getWatchDataJson(getWatchDataUrl(brandId, fileName)).catch((error: unknown) => {
    fileRequests.delete(requestKey)
    manifestRequests.delete(brandId)

    throw error
  })
  fileRequests.set(requestKey, request)

  return request
}
