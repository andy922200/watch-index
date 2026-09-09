export const DEFAULT_DISPLAY_CURRENCY = 'TWD'
export const DISPLAY_CURRENCY_STORAGE_KEY = 'rolex-display-currency'

export const isCurrencyCode = (value: string): boolean => /^[A-Z]{3}$/.test(value)
