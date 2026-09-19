import type { MarketCode, MarketOption } from './markets.ts'

interface BrandPageConfig {
  entry: `/${string}`
  title: { zhTw: string; enUs: string }
  description: { zhTw: string; enUs: string }
}

interface BrandDirectoryConfig {
  id: string
  directory: {
    availability: 'available' | 'coming-soon'
    descriptionKey: string
    nameKey: string
    visual: {
      accent: {
        dark: string
        light: string
      }
    }
  }
}

export interface BrandConfig extends BrandDirectoryConfig, BrandPageConfig {
  directory: BrandDirectoryConfig['directory'] & { availability: 'available' }
  defaultMarket: MarketCode
  marketOptions: readonly MarketOption[]
  siteName: string
  priceComparePage: BrandPageConfig
}

interface ComingSoonBrandConfig extends BrandDirectoryConfig {
  directory: BrandDirectoryConfig['directory'] & { availability: 'coming-soon' }
}

type BrandDirectoryEntry = BrandConfig | ComingSoonBrandConfig

export const isAvailableBrand = (brand: BrandDirectoryEntry): brand is BrandConfig =>
  brand.directory.availability === 'available'

/**
 * 網站品牌目錄的唯一定義來源。只有已完成頁面與資料整合的品牌會進入 `brands`，
 * 供 MPA build 產生可瀏覽的頁面；即將推出的品牌仍可在 Root 顯示，但不會產生死連結。
 */
export const brandDirectory: readonly BrandDirectoryEntry[] = [
  {
    id: 'rolex',
    defaultMarket: 'TW',
    marketOptions: [
      { code: 'TW', flag: '🇹🇼', labelKey: 'site.market.taiwan' },
      { code: 'CN', flag: '🇨🇳', labelKey: 'site.market.china' },
      { code: 'HK', flag: '🇭🇰', labelKey: 'site.market.hongKong' },
      { code: 'SG', flag: '🇸🇬', labelKey: 'site.market.singapore' },
      { code: 'JP', flag: '🇯🇵', labelKey: 'site.market.japan' },
      { code: 'KR', flag: '🇰🇷', labelKey: 'site.market.southKorea' },
      { code: 'AT', flag: '🇦🇹', labelKey: 'site.market.austria' },
      { code: 'DE', flag: '🇩🇪', labelKey: 'site.market.germany' },
      { code: 'FR', flag: '🇫🇷', labelKey: 'site.market.france' },
      { code: 'IT', flag: '🇮🇹', labelKey: 'site.market.italy' },
      { code: 'ES', flag: '🇪🇸', labelKey: 'site.market.spain' },
      { code: 'CH', flag: '🇨🇭', labelKey: 'site.market.switzerland' },
      { code: 'GB', flag: '🇬🇧', labelKey: 'site.market.unitedKingdom' },
      { code: 'US', flag: '🇺🇸', labelKey: 'site.market.unitedStates' },
      { code: 'TH', flag: '🇹🇭', labelKey: 'site.market.thailand' },
    ],
    entry: '/src/pages/rolex/main.ts',
    siteName: 'Rolex Watch Index',
    title: { zhTw: 'Rolex 腕錶索引', enUs: 'Rolex Watch Index' },
    description: { zhTw: '您的全球 Rolex 腕錶索引', enUs: 'Your Global Rolex Watches Index' },
    directory: {
      availability: 'available',
      descriptionKey: 'home.brands.rolex.description',
      nameKey: 'home.brands.rolex.name',
      visual: {
        accent: {
          dark: '#69b982',
          light: '#006039',
        },
      },
    },
    priceComparePage: {
      entry: '/src/pages/rolex/price-compare/main.ts',
      title: { zhTw: 'Rolex 腕錶行情比較', enUs: 'Rolex Watch Price Comparison' },
      description: {
        zhTw: '比較同一支 Rolex 腕錶在各市場的官方定價與退稅估算參考。',
        enUs: 'Compare official Rolex prices and tax-refund estimate references across markets.',
      },
    },
  },
  {
    id: 'omega',
    entry: '/src/pages/omega/main.ts',
    siteName: 'Omega Watch Index',
    title: { zhTw: 'Omega 腕錶索引', enUs: 'Omega Watch Index' },
    description: {
      zhTw: '您的 Omega 腕錶官方定價索引',
      enUs: 'Your Omega official watch price index',
    },
    defaultMarket: 'TW',
    marketOptions: [
      { code: 'TW', flag: '🇹🇼', labelKey: 'site.market.taiwan' },
      { code: 'JP', flag: '🇯🇵', labelKey: 'site.market.japan' },
      { code: 'KR', flag: '🇰🇷', labelKey: 'site.market.southKorea' },
    ],
    directory: {
      availability: 'available',
      descriptionKey: 'home.brands.omega.description',
      nameKey: 'home.brands.omega.name',
      visual: {
        accent: {
          dark: '#ff8f87',
          light: '#b42318',
        },
      },
    },
    priceComparePage: {
      entry: '/src/pages/omega/price-compare/main.ts',
      title: { zhTw: 'Omega 腕錶行情比較', enUs: 'Omega Watch Price Comparison' },
      description: {
        zhTw: '比較同一支 Omega 腕錶在台灣、日本與韓國的官方定價。',
        enUs: 'Compare official Omega prices across Taiwan, Japan, and South Korea.',
      },
    },
  },
]

/** 已完成整合、可產生靜態頁面的品牌。 */
export const brands = brandDirectory.filter(isAvailableBrand)

export type BrandId = BrandConfig['id']
