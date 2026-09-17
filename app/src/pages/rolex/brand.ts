import type { PriceCompareBrandConfig } from '@/features/price-compare/types'
import type { BrandId } from '@/lib/brands'
import { isRolexWatchCatalog } from '@/lib/validation/rolexWatch'
import type { RolexWatch } from '@/types/rolex-watch'

/** 本頁面群組對應的品牌；同時決定網址子路徑與載入的資料檔。 */
export const BRAND_ID: BrandId = 'rolex'

const ROLEX_WATCH_ID_PATTERN = /^rolex:m[0-9a-z]+-[0-9]{4}$/

const isRolexWatchId = (watchId: string): boolean => ROLEX_WATCH_ID_PATTERN.test(watchId)

/** Rolex 對共用跨市場比價功能提供的資料驗證與顯示設定。 */
export const rolexPriceCompareConfig: PriceCompareBrandConfig<RolexWatch> = {
  brandId: BRAND_ID,
  getWatchReference: (watch: RolexWatch): string => watch.reference,
  isCatalog: isRolexWatchCatalog,
  isWatchIdValid: isRolexWatchId,
}
