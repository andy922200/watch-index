interface BrandPageConfig {
  entry: `/${string}`
  title: { zhTw: string; enUs: string }
  description: { zhTw: string; enUs: string }
}

export interface BrandConfig extends BrandPageConfig {
  id: string
  siteName: string
  priceComparePage: BrandPageConfig
}

export const brands = [
  {
    id: 'rolex',
    entry: '/src/pages/rolex/main.ts',
    siteName: 'Rolex Watch Index',
    title: { zhTw: 'Rolex 腕錶索引', enUs: 'Rolex Watch Index' },
    description: { zhTw: '您的全球 Rolex 腕錶索引', enUs: 'Your Global Rolex Watches Index' },
    priceComparePage: {
      entry: '/src/pages/rolex/price-compare/main.ts',
      title: { zhTw: 'Rolex 腕錶行情比較', enUs: 'Rolex Watch Price Comparison' },
      description: {
        zhTw: '比較同一支 Rolex 腕錶在各市場的官方定價與退稅估算參考。',
        enUs: 'Compare official Rolex prices and tax-refund estimate references across markets.',
      },
    },
  },
] as const satisfies readonly BrandConfig[]

export type BrandId = (typeof brands)[number]['id']
