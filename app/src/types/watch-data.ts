export interface WatchCollection {
  id: string
  watchCount: number
}

export interface Watch {
  collectionId: string
  modelNumber: string
  configurationCode: string
  modelReference: string
  imageUrl: string
  modelName: string
  caseDescription: string
  dialDescription: string
  localNicknames: string[]
  price: number | null
  priceStatus: 'listed' | 'price-unavailable' | 'not-listed'
}

export interface PriceMarket {
  code: string
  currencyCode: string
  priceType: 'tax-include' | 'tax-exclude' | 'no-tax'
  taxRatePercent: number | null
}

export interface WatchCatalog {
  schemaVersion: number
  collectedAt: string
  watchCount: number
  collections: WatchCollection[]
  priceMarket: PriceMarket
  priceUpdatedAt: string
  watchesByReference: Record<string, Watch>
}

interface WatchDataManifest {
  schemaVersion: number
  catalog: string
  catalogs: Record<string, string>
}

export type { WatchDataManifest }
