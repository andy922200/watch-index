export const MarketCode = {
  Austria: 'AT',
  China: 'CN',
  Switzerland: 'CH',
  Germany: 'DE',
  France: 'FR',
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
export const MARKET_QUERY_KEY = 'market_code'

export const marketOptions: readonly MarketOption[] = [
  { code: MarketCode.Taiwan, flag: '🇹🇼', labelKey: 'site.market.taiwan' },
  { code: MarketCode.China, flag: '🇨🇳', labelKey: 'site.market.china' },
  { code: MarketCode.HongKong, flag: '🇭🇰', labelKey: 'site.market.hongKong' },
  { code: MarketCode.Singapore, flag: '🇸🇬', labelKey: 'site.market.singapore' },
  { code: MarketCode.Japan, flag: '🇯🇵', labelKey: 'site.market.japan' },
  { code: MarketCode.Austria, flag: '🇦🇹', labelKey: 'site.market.austria' },
  { code: MarketCode.Germany, flag: '🇩🇪', labelKey: 'site.market.germany' },
  { code: MarketCode.France, flag: '🇫🇷', labelKey: 'site.market.france' },
  { code: MarketCode.Switzerland, flag: '🇨🇭', labelKey: 'site.market.switzerland' },
  { code: MarketCode.UnitedKingdom, flag: '🇬🇧', labelKey: 'site.market.unitedKingdom' },
  { code: MarketCode.UnitedStates, flag: '🇺🇸', labelKey: 'site.market.unitedStates' },
]

export const isMarketCode = (value: string): value is MarketCode =>
  marketOptions.some((market) => market.code === value)

/**
 * 讀取 URL query 的市場代碼。未提供 query 時回傳 null；提供未知代碼時則回退台灣，
 * 以確保 query 一旦存在就不會改用 localStorage 的舊選擇。
 */
export const getMarketFromQuery = (search: string): MarketCode | null => {
  const marketCode = new URLSearchParams(search).get(MARKET_QUERY_KEY)

  if (marketCode === null) {
    return null
  }

  return isMarketCode(marketCode) ? marketCode : DEFAULT_MARKET
}
