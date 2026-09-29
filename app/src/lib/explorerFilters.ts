import type { DialColor } from '@/lib/dialColors'
import { includesSearchText, normalizeSearchText } from '@/lib/searchText'
import { hasPublicPrice } from '@/lib/watchPriceComparison'
import type { BaseWatch, PriceType } from '@/types/watch-data'

export interface ExplorerWatch {
  brandId: string
  brandName: string
  collectionLabel: string
  watch: BaseWatch
  currencyCode: string
  priceType: PriceType
  priceUpdatedAt: string
}

export type ExplorerSort = 'default' | 'price-asc' | 'price-desc'

export interface ExplorerFilterOptions {
  query: string
  brandIds: readonly string[]
  collectionKey: string
  dialColors: readonly DialColor[]
  minPrice: number | null
  maxPrice: number | null
  sort: ExplorerSort
  allowPriceComparison: boolean
}

/** 跨品牌探索頁的官方價格範圍篩選器的可選區間，單位與 {@link ExplorerWatch.currencyCode} 一致。 */
export interface PriceDomain {
  /** 篩選器下限，已取整到 {@link PriceDomain.step} 的倍數。 */
  min: number
  /** 篩選器上限，已取整到 {@link PriceDomain.step} 的倍數。 */
  max: number
  /** 拖曳滑桿的刻度大小。 */
  step: number
  /** 這個價格範圍所屬的幣別代碼。 */
  currencyCode: string
}

/** 組出跨品牌唯一的系列複合鍵，避免不同品牌剛好有同名系列 ID 而互相衝突。 */
export const getCollectionKey = (brandId: string, collectionId: string): string =>
  `${brandId}:${collectionId}`

/** 取得可用於價格篩選／排序的公開價格；沒有公開價格時回傳 `null`。 */
const getPublicPrice = (item: ExplorerWatch): number | null =>
  hasPublicPrice(item.watch.priceStatus) ? item.watch.price : null

/**
 * 依目前有公開價格的腕錶，算出價格範圍篩選器的可選區間。
 *
 * 沒有任何腕錶有公開價格時（例如切到只有 retailer-only／price-unavailable 的市場）回傳 `null`，
 * 呼叫端應停用篩選器而不是顯示一個沒有意義的區間。
 *
 * 刻度大小（`step`）刻意取整到「1、2、5 乘以 10 的次方」這類易讀刻度，而不是直接用
 * `(max - min) / 200`：滑桿兩端顯示的數字才不會是 137、263 這種難以判讀的隨機值。
 *
 * @returns 沒有可比價的公開價格時回傳 `null`；否則回傳已取整的 {@link PriceDomain}。
 */
export const getExplorerPriceDomain = (watches: readonly ExplorerWatch[]): PriceDomain | null => {
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  let currencyCode = ''

  for (const item of watches) {
    if (!hasPublicPrice(item.watch.priceStatus) || item.watch.price === null) continue
    minimum = Math.min(minimum, item.watch.price)
    maximum = Math.max(maximum, item.watch.price)
    currencyCode = item.currencyCode
  }
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return null

  const rawStep = Math.max(1, (maximum - minimum) / 200)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = Math.ceil(rawStep / magnitude) * magnitude
  const min = Math.floor(minimum / step) * step
  const max = Math.max(min + step, Math.ceil(maximum / step) * step)

  return { min, max, step, currencyCode }
}

/**
 * 依（可選的）已選品牌，組出系列篩選下拉選單的選項清單。
 *
 * 選項用「品牌:系列」複合鍵去重（見 {@link getCollectionKey}），因為不同品牌可能剛好
 * 有同名系列 ID；顯示文字統一加上品牌名稱前綴，避免使用者選錯品牌。
 *
 * @param selectedBrandIds - 目前已勾選的品牌；空陣列代表未篩選品牌，回傳所有品牌的系列。
 * @returns 依顯示文字排序的 `[複合鍵, 顯示文字]` 選項清單。
 */
export const buildExplorerCollectionOptions = (
  watches: readonly ExplorerWatch[],
  selectedBrandIds: readonly string[],
): readonly (readonly [string, string])[] => {
  const options = new Map<string, string>()
  for (const item of watches) {
    if (selectedBrandIds.length === 0 || selectedBrandIds.includes(item.brandId)) {
      options.set(
        getCollectionKey(item.brandId, item.watch.collectionId),
        `${item.brandName} · ${item.collectionLabel}`,
      )
    }
  }
  return [...options].sort((left, right) => left[1].localeCompare(right[1]))
}

/**
 * 依搜尋文字、品牌、系列、錶盤顏色（多選，命中任一色即保留）與（可選的）價格範圍篩選跨品牌腕錶清單，並依 `options.sort` 排序。
 *
 * 價格篩選與排序只在 `allowPriceComparison` 為真時生效（例如目前市場沒有可比價資料時應關閉）；
 * 依價格排序時，沒有公開價格的項目一律排到最後。
 *
 * @param watches - 待篩選的跨品牌腕錶清單。
 * @param options - 篩選與排序條件，見 {@link ExplorerFilterOptions}。
 * @returns 篩選並排序後的腕錶清單（新陣列）。
 */
export const filterExplorerWatches = (
  watches: readonly ExplorerWatch[],
  options: ExplorerFilterOptions,
): ExplorerWatch[] => {
  const query = normalizeSearchText(options.query)
  const filtered = watches.filter((item) => {
    if (options.brandIds.length > 0 && !options.brandIds.includes(item.brandId)) return false
    if (
      options.collectionKey &&
      getCollectionKey(item.brandId, item.watch.collectionId) !== options.collectionKey
    )
      return false
    if (
      options.dialColors.length > 0 &&
      !item.watch.dialColors.some((color) => options.dialColors.includes(color))
    )
      return false
    if (
      query &&
      ![
        item.brandName,
        item.brandId,
        item.collectionLabel,
        item.watch.collectionId,
        item.watch.modelName,
        item.watch.reference,
        ...item.watch.localNicknames,
      ].some((field) => includesSearchText(field, query))
    )
      return false
    if (options.allowPriceComparison && (options.minPrice !== null || options.maxPrice !== null)) {
      const price = getPublicPrice(item)
      if (
        price === null ||
        (options.minPrice !== null && price < options.minPrice) ||
        (options.maxPrice !== null && price > options.maxPrice)
      )
        return false
    }
    return true
  })

  return filtered.sort((left, right) => {
    if (options.allowPriceComparison && options.sort.startsWith('price')) {
      const leftPrice = getPublicPrice(left)
      const rightPrice = getPublicPrice(right)
      if (leftPrice === null && rightPrice !== null) return 1
      if (leftPrice !== null && rightPrice === null) return -1
      if (leftPrice !== null && rightPrice !== null && leftPrice !== rightPrice) {
        return options.sort === 'price-asc' ? leftPrice - rightPrice : rightPrice - leftPrice
      }
    }
    return (
      left.brandId.localeCompare(right.brandId) ||
      left.watch.reference.localeCompare(right.watch.reference)
    )
  })
}
