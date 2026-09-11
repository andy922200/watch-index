export const MarketCode = {
  Austria: 'AT',
  China: 'CN',
  Switzerland: 'CH',
  Germany: 'DE',
  France: 'FR',
  UnitedKingdom: 'GB',
  HongKong: 'HK',
  Italy: 'IT',
  Japan: 'JP',
  Singapore: 'SG',
  SouthKorea: 'KR',
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

/** 未登錄市場代碼時的退路圖示。 */
export const FALLBACK_MARKET_FLAG = '🌐'

export const marketOptions: readonly MarketOption[] = [
  { code: MarketCode.Taiwan, flag: '🇹🇼', labelKey: 'site.market.taiwan' },
  { code: MarketCode.China, flag: '🇨🇳', labelKey: 'site.market.china' },
  { code: MarketCode.HongKong, flag: '🇭🇰', labelKey: 'site.market.hongKong' },
  { code: MarketCode.Singapore, flag: '🇸🇬', labelKey: 'site.market.singapore' },
  { code: MarketCode.Japan, flag: '🇯🇵', labelKey: 'site.market.japan' },
  { code: MarketCode.SouthKorea, flag: '🇰🇷', labelKey: 'site.market.southKorea' },
  { code: MarketCode.Austria, flag: '🇦🇹', labelKey: 'site.market.austria' },
  { code: MarketCode.Germany, flag: '🇩🇪', labelKey: 'site.market.germany' },
  { code: MarketCode.France, flag: '🇫🇷', labelKey: 'site.market.france' },
  { code: MarketCode.Italy, flag: '🇮🇹', labelKey: 'site.market.italy' },
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

/**
 * 查出市場選項。未登錄的市場代碼回傳 `null`，讓呼叫端自行決定退路。
 */
export const getMarketOption = (marketCode: string): MarketOption | null =>
  marketOptions.find((option) => option.code === marketCode) ?? null

/**
 * 查出市場名稱的 i18n key。刻意不在這裡呼叫 `t()`——這支要能被建置期與測試直接使用，
 * 不該相依 Vue i18n 的執行期 context；翻譯由元件端完成。
 *
 * @returns 未登錄的市場代碼回傳 `null`，呼叫端通常直接顯示原始代碼。
 */
export const getMarketLabelKey = (marketCode: string): MarketOption['labelKey'] | null =>
  getMarketOption(marketCode)?.labelKey ?? null

/**
 * 查出市場國旗；未登錄的市場代碼回退為地球圖示。
 */
export const getMarketFlag = (marketCode: string): string =>
  getMarketOption(marketCode)?.flag ?? FALLBACK_MARKET_FLAG

/**
 * 把目前選擇的市場寫回網址，與 {@link getMarketFromQuery} 成對使用，
 * 讓使用者複製出去的連結會帶著當下的市場。
 *
 * 用 `replaceState` 而非 `pushState`：切換市場是同一個頁面的檢視調整，
 * 不該在瀏覽器歷史裡堆出一連串需要逐一按上一頁才能離開的紀錄。
 */
export const replaceMarketQuery = (market: MarketCode): void => {
  const query = new URLSearchParams(window.location.search)
  query.set(MARKET_QUERY_KEY, market)
  window.history.replaceState(null, '', `${window.location.pathname}?${query.toString()}`)
}
