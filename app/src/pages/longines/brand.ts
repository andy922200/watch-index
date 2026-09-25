import type { PriceCompareBrandConfig } from '@/features/price-compare/types'
import type { WatchBrandConfig } from '@/features/watch-index/types'
import { type BrandId, brands } from '@/lib/brands'
import { isLonginesWatchCatalog } from '@/lib/validation/longinesWatch'
import type { LonginesWatch } from '@/types/longines-watch'

/** 本頁面群組對應的品牌；同時決定網址子路徑與載入的資料檔。 */
export const BRAND_ID: BrandId = 'longines'

const LONGINES_WATCH_ID_PATTERN = /^longines:L\d\.\d{3}\.\d\.\d{2}\.[0-9A]$/

const longinesBrand = brands.find((brand) => brand.id === BRAND_ID)

if (!longinesBrand) {
  throw new Error('Longines brand configuration is unavailable')
}

const isLonginesWatchId = (watchId: string): boolean => LONGINES_WATCH_ID_PATTERN.test(watchId)

/** Longines 對共用跨市場比價功能提供的資料驗證與顯示設定。 */
export const longinesWatchIndexConfig: WatchBrandConfig<LonginesWatch> = {
  brandId: BRAND_ID,
  defaultMarket: longinesBrand.defaultMarket,
  getWatchReference: (watch: LonginesWatch): string => watch.reference,
  isCatalog: isLonginesWatchCatalog,
  isWatchIdValid: isLonginesWatchId,
  marketOptions: longinesBrand.marketOptions,
  titleKey: 'site.brandTitle.longines',
}

export const longinesPriceCompareConfig: PriceCompareBrandConfig<LonginesWatch> =
  longinesWatchIndexConfig
