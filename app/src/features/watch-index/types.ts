import type { BrandId } from '@/lib/brands'
import type { MarketCode, MarketOption } from '@/lib/markets'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

/** 品牌索引與比價頁共用的品牌差異。 */
export interface WatchBrandConfig<TWatch extends BaseWatch> {
  brandId: BrandId
  defaultMarket: MarketCode
  getWatchReference: (watch: TWatch) => string
  isCatalog: (value: unknown) => value is WatchCatalog<TWatch>
  isWatchIdValid: (watchId: string) => boolean
  marketOptions: readonly MarketOption[]
  titleKey: string
}
