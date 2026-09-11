import { Method, useFetchData } from '@/composables/useFetchData'
import { isWatchDataManifest } from '@/lib/validation/watch'
import type { WatchDataManifest } from '@/types/watch-data'

export const getWatchDataUrl = (fileName: string): string => {
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

/** manifest 是整份 watch-data 的固定入口，每次載入只需取得一次。 */
let manifestRequest: Promise<WatchDataManifest> | null = null

/**
 * 版本化資料檔的請求快取。
 *
 * 鍵是 manifest 解析出的檔名，而檔名帶有內容雜湊，因此同一份內容只會被下載一次，
 * 不同市場、不同品牌或不同版本的資料檔天然不會互相覆蓋。
 */
const fileRequests = new Map<string, Promise<unknown>>()

const fetchManifest = async (): Promise<WatchDataManifest> => {
  const manifest = await getWatchDataJson(getWatchDataUrl('manifest.json'))

  if (!isWatchDataManifest(manifest)) {
    throw new Error('Watch data manifest has an invalid format')
  }

  return manifest
}

/**
 * 取得 watch-data manifest，同一次頁面載入內只會實際請求一次。
 *
 * @returns 已驗證格式的 manifest。
 * @throws 當請求失敗或格式不符時拋出錯誤，並清除快取讓後續呼叫可重試。
 */
export const getWatchDataManifest = (): Promise<WatchDataManifest> => {
  manifestRequest ??= fetchManifest().catch((error: unknown) => {
    manifestRequest = null

    throw error
  })

  return manifestRequest
}

/**
 * 取得 manifest 指向的版本化資料檔，並以檔名為鍵共用同一個請求。
 *
 * 回傳的是未經格式驗證的 JSON：下載與品牌無關，格式驗證由呼叫端依品牌自行負責。
 *
 * @param fileName - manifest 解析出的內容雜湊檔名。
 * @returns 未經格式驗證的 JSON 回應資料。
 * @throws 當請求失敗時拋出錯誤，並一併清除 manifest 快取，
 *   讓重試能重新解析檔名（涵蓋部署後舊雜湊檔已移除的情況）。
 */
export const getWatchDataFile = (fileName: string): Promise<unknown> => {
  const cachedRequest = fileRequests.get(fileName)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = getWatchDataJson(getWatchDataUrl(fileName)).catch((error: unknown) => {
    fileRequests.delete(fileName)
    manifestRequest = null

    throw error
  })
  fileRequests.set(fileName, request)

  return request
}
