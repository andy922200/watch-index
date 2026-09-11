import type { TravelerRefundPolicy } from '@/types/traveler-refund-policy'

export interface WatchCollection {
  id: string
  watchCount: number
}

/**
 * 各品牌腕錶共用的欄位。
 *
 * 僅包含不依賴任何品牌型號規則的資料，供跨品牌的資料載入、驗證與比價流程使用。
 */
export interface BaseWatch {
  watchId: string
  collectionId: string
  imageUrl: string
  modelName: string
  caseDescription: string
  dialDescription: string
  localNicknames: string[]
  price: number | null
  priceStatus: PriceStatus
}

export type PriceStatus = 'listed' | 'price-unavailable' | 'not-listed'

export type PriceType = 'tax-include' | 'tax-exclude' | 'no-tax'

export interface PriceMarket {
  code: string
  currencyCode: string
  priceType: PriceType
  taxRatePercent: number | null
}

export interface ComparisonMarket {
  code: string
  currencyCode: string
  priceType: PriceType
  taxRatePercent: number | null
  priceUpdatedAt: string
  travelerRefundPolicy: TravelerRefundPolicy | null
}

export interface ComparisonPrice {
  price: number | null
  priceStatus: PriceStatus
}

export interface WatchPriceComparisonPayload {
  schemaVersion: number
  brandId: string
  watchCount: number
  marketsByCode: Record<string, ComparisonMarket>
  pricesByWatchId: Record<string, Record<string, ComparisonPrice>>
}

/**
 * 建置程序產生的錶款 catalog 索引。
 *
 * `TWatch` 需由呼叫端指定為該品牌的腕錶型別（例如 `RolexWatch`），
 * 刻意不提供預設值，讓每個使用點都必須表明自己綁定的品牌。
 */
export interface WatchCatalog<TWatch extends BaseWatch> {
  schemaVersion: number
  brandId: string
  collectedAt: string
  watchCount: number
  collections: WatchCollection[]
  priceMarket: PriceMarket
  priceUpdatedAt: string
  watchesById: Record<string, TWatch>
}

interface WatchDataManifest {
  schemaVersion: number
  catalog: string
  catalogs: Record<string, string>
  comparison: string
  currencies: string[]
}

export type { WatchDataManifest }
