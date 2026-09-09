export interface BrandConfig {
  id: string
  entry: `/${string}`
  siteName: string
  title: { zhTw: string; enUs: string }
  description: { zhTw: string; enUs: string }
  /** 相對於 repo 根目錄，變動時會讓 watch-data 版本雜湊改變。 */
  hashSourceFiles: string[]
}

export const brands: BrandConfig[] = [
  {
    id: 'rolex',
    entry: '/src/pages/rolex/main.ts',
    siteName: 'Rolex Watch Index',
    title: { zhTw: 'Rolex 腕錶索引', enUs: 'Rolex Watch Index' },
    description: { zhTw: '您的全球 Rolex 腕錶索引', enUs: 'Your Global Rolex Watches Index' },
    hashSourceFiles: ['data/catalog/rolex-catalog.json', 'data/markets/rolex-taiwan-market.json'],
  },
]
