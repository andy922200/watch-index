export const DEFAULT_DISPLAY_CURRENCY = 'TWD'
export const DISPLAY_CURRENCY_STORAGE_KEY = 'display-currency'

export const getBrandDisplayCurrencyStorageKey = (brandId: string): string =>
  `${DISPLAY_CURRENCY_STORAGE_KEY}-${brandId}`

export const isCurrencyCode = (value: string): boolean => /^[A-Z]{3}$/.test(value)
