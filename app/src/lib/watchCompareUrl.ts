import { MARKET_QUERY_KEY, type MarketCode } from '@/lib/markets'

export const WATCH_ID_QUERY_KEY = 'watch_id'
export const MAX_COMPARE_WATCHES = 3

export interface ParsedCompareSelection {
  isUrlDriven: boolean
  ids: string[]
  isTooMany: boolean
}

/**
 * 從比較頁的 query string 解析出選取的腕錶清單。
 *
 * `isUrlDriven` 用來區分「網址本身就帶了 `watch_id`」（例如分享連結、重新整理）
 * 與「尚未指定，應由頁面 state 接手」兩種情況；`ids` 去重但不裁切上限，
 * 超過上限交由 `isTooMany` 標記，讓呼叫端自行決定如何提示使用者。
 *
 * @param search - 完整或部分的 query string（含或不含開頭 `?` 皆可）。
 * @returns 解析結果，見 {@link ParsedCompareSelection}。
 */
export const parseCompareSelection = (search: string): ParsedCompareSelection => {
  const query = new URLSearchParams(search)
  const isUrlDriven = query.has(WATCH_ID_QUERY_KEY)
  const ids = [...new Set(query.getAll(WATCH_ID_QUERY_KEY).map((id) => id.trim()))]

  return { isUrlDriven, ids, isTooMany: ids.length > MAX_COMPARE_WATCHES }
}

/**
 * 依市場與腕錶選取清單組出比較頁的 query string，取代既有的市場與 `watch_id` 參數，
 * 其餘既有查詢參數維持不變。
 *
 * @param search - 目前的 query string，作為保留其餘參數的基底。
 * @param market - 要寫入的市場代碼。
 * @param ids - 要寫入的腕錶 id 清單，依傳入順序寫成多個 `watch_id` 參數。
 * @returns 組好的 query string（不含開頭 `?`）。
 */
export const buildCompareSearch = (
  search: string,
  market: MarketCode,
  ids: readonly string[],
): string => {
  const query = new URLSearchParams(search)
  query.set(MARKET_QUERY_KEY, market)
  query.delete(WATCH_ID_QUERY_KEY)
  ids.forEach((id) => query.append(WATCH_ID_QUERY_KEY, id))

  return query.toString()
}

/**
 * 依比較頁腕錶 id 的 `<brandId>:<watchId>` 格式解析出品牌 id；格式不合法（缺少分隔符、
 * 分隔符在頭尾、或出現一個以上分隔符）或品牌不在已知清單中時回傳 `null`。
 *
 * @param id - 比較頁使用的腕錶 id。
 * @param knownBrandIds - 目前已知的品牌 id 清單，用來判斷解析出的品牌是否有效。
 */
export const brandIdForWatch = (id: string, knownBrandIds: ReadonlySet<string>): string | null => {
  const delimiter = id.indexOf(':')
  if (delimiter <= 0 || delimiter === id.length - 1 || id.indexOf(':', delimiter + 1) !== -1)
    return null
  const brandId = id.slice(0, delimiter)
  return knownBrandIds.has(brandId) ? brandId : null
}

/**
 * 依目前市場與選取清單，把比較頁網址的 query string 換成對應內容並寫回瀏覽器網址列，
 * 不觸發整頁重新載入，讓使用者重新整理或分享連結時能還原目前的比較狀態。
 *
 * @param market - 目前選定的市場代碼。
 * @param ids - 目前選取的腕錶 id 清單。
 */
export const syncCompareUrl = (market: MarketCode, ids: readonly string[]): void => {
  const query = buildCompareSearch(window.location.search, market, ids)
  window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
}
