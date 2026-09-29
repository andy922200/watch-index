/**
 * CollectionExplorerPage 專用的顯示文字／連結組裝。
 *
 * 翻譯與 locale 一律由呼叫端傳入參數，而不是在這裡呼叫 `useI18n()`，讓這些函式仍可脫離 Vue
 * context 被單元測試涵蓋。
 */
import type { ExplorerWatch } from '@/lib/explorerFilters'
import { formatCurrency } from '@/lib/formatters'
import type { MarketCode } from '@/lib/markets'
import type { PageLanguageCode } from '@/lib/pageRoutes'
import { getPriceCompareUrl } from '@/lib/pageUrls'
import { hasPublicPrice } from '@/lib/watchPriceComparison'

type TranslateFn = (key: string) => string
type TranslationExistsFn = (key: string) => boolean

/** 取得品牌顯示名稱的翻譯文字。 */
export const getBrandName = (id: string, t: TranslateFn): string => t(`home.brands.${id}.name`)

/**
 * 取得系列（collection）的顯示標籤；若 locale 中沒有對應翻譯，直接回傳原始 id 作為後備文字。
 */
export const getCollectionLabel = (
  id: string,
  { t, te }: { t: TranslateFn; te: TranslationExistsFn },
): string => (te(`site.watchCollection.${id}`) ? t(`site.watchCollection.${id}`) : id)

/**
 * 組出腕錶的顯示價格文字；沒有公開價格時直接回傳呼叫端傳入的缺價文案。
 */
export const getExplorerPriceText = (
  item: ExplorerWatch,
  { locale, unavailableLabel }: { locale: string; unavailableLabel: string },
): string => {
  if (!hasPublicPrice(item.watch.priceStatus) || item.watch.price === null) return unavailableLabel
  return formatCurrency({
    amount: item.watch.price,
    currency: item.currencyCode,
    locale,
    minimumFractionDigits: 0,
  })
}

/**
 * 組出單錶跨市場比價頁的連結；尚未選定市場時回傳 '#'。
 */
export const getSingleWatchCompareHref = (
  item: ExplorerWatch,
  { market, language }: { market: MarketCode | null; language: PageLanguageCode },
): string => {
  if (!market) return '#'

  return getPriceCompareUrl({
    brandId: item.brandId,
    watchId: item.watch.watchId,
    market,
    language,
  })
}
