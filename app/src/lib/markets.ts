export const MarketCode = {
  Austria: 'AT',
  Switzerland: 'CH',
  Germany: 'DE',
  UnitedKingdom: 'GB',
  HongKong: 'HK',
  Japan: 'JP',
  Singapore: 'SG',
  Taiwan: 'TW',
  UnitedStates: 'US',
} as const

export type MarketCode = (typeof MarketCode)[keyof typeof MarketCode]

export interface MarketOption {
  code: MarketCode
  flag: string
  labelKey: `site.market.${string}`
}

export const DEFAULT_MARKET = MarketCode.Taiwan
export const MARKET_STORAGE_KEY = 'rolex-selected-market'

export const marketOptions: readonly MarketOption[] = [
  { code: MarketCode.Taiwan, flag: '🇹🇼', labelKey: 'site.market.taiwan' },
  { code: MarketCode.HongKong, flag: '🇭🇰', labelKey: 'site.market.hongKong' },
  { code: MarketCode.Singapore, flag: '🇸🇬', labelKey: 'site.market.singapore' },
  { code: MarketCode.Japan, flag: '🇯🇵', labelKey: 'site.market.japan' },
  { code: MarketCode.Austria, flag: '🇦🇹', labelKey: 'site.market.austria' },
  { code: MarketCode.Germany, flag: '🇩🇪', labelKey: 'site.market.germany' },
  { code: MarketCode.Switzerland, flag: '🇨🇭', labelKey: 'site.market.switzerland' },
  { code: MarketCode.UnitedKingdom, flag: '🇬🇧', labelKey: 'site.market.unitedKingdom' },
  { code: MarketCode.UnitedStates, flag: '🇺🇸', labelKey: 'site.market.unitedStates' },
]

export const isMarketCode = (value: string): value is MarketCode =>
  marketOptions.some((market) => market.code === value)
