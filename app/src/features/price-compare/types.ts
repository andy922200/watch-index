import type { BrandId } from '@/lib/brands'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

/**
 * 單錶跨市場比價頁所需的品牌差異。
 *
 * 價格、匯率與退稅規則由共用頁處理；只有 catalog 的資料驗證、網址識別碼與
 * 品牌自有的參考編號呈現方式，才由品牌入口提供。
 */
export interface PriceCompareBrandConfig<TWatch extends BaseWatch> {
  brandId: BrandId
  getWatchReference: (watch: TWatch) => string
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
  isWatchIdValid: (watchId: string) => boolean
}
