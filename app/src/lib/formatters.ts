/**
 * 跨頁共用的 `Intl` 格式化工具。
 * 語系一律由呼叫端以參數傳入，不在這裡呼叫 `useI18n()`：
 * 這支要能在沒有 Vue context 的單元測試裡直接使用。
 */

import { PageLanguage } from '@/lib/pageRoutes'

const DEFAULT_PERCENT_FRACTION_DIGITS = 1

/**
 * 把頁面語系代碼（`zh-tw`／`en-us`）換成 `Intl` 需要的 BCP 47 標籤。
 *
 * 兩者不能共用同一個字串：語系代碼同時是網址的語言路徑段（見 `lib/pageRoutes.ts`），
 * 而 `Intl` 只認得 `zh-TW`、`en-US` 這種大小寫形式。
 *
 * @param locale - `useI18n()` 的 `locale.value`；非繁中一律視為英文。
 * @returns 可直接傳給 `Intl` 建構子的語言標籤。
 */
export const getIntlLocale = (locale: string): string =>
  locale === PageLanguage.zhTw ? 'zh-TW' : 'en-US'

export interface FormatCurrencyOptions {
  amount: number
  currency: string
  locale: string
  /**
   * 小數位數上限。未傳入時沿用 `Intl` 對各幣別的慣例（例如 JPY 為 0 位、USD 為 2 位）；
   * 需要固定顯示到小數點後兩位（例如匯率換算後的比價金額）時才傳入。
   */
  maximumFractionDigits?: number
  /**
   * 小數位數下限。未傳入時同樣沿用各幣別慣例，整數金額會補成 `TWD 1,234,567.00`；
   * 傳 0 則整數不補小數點（`TWD 1,234,567`），適合本來就是整數的官方定價。
   */
  minimumFractionDigits?: number
}

/**
 * 金額格式化，例如 `TWD 1,234`。
 *
 * 一律以貨幣代碼而非符號顯示：比價頁會並排多個市場的金額，
 * `$`、`¥` 這類符號在跨市場情境下無法辨識是哪一國的幣別。
 *
 * @param options - 金額、幣別、語系與小數位數上限，見 {@link FormatCurrencyOptions}。
 * @returns 已格式化的金額字串。
 */
export const formatCurrency = ({
  amount,
  currency,
  locale,
  maximumFractionDigits,
  minimumFractionDigits,
}: FormatCurrencyOptions): string =>
  new Intl.NumberFormat(locale, {
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits,
    minimumFractionDigits,
    style: 'currency',
  }).format(amount)

/**
 * 日期格式化，medium 長度（例如 `2026年9月11日`、`Sep 11, 2026`）。
 *
 * @param date - ISO 日期字串。
 * @param locale - {@link getIntlLocale} 的回傳值。
 * @returns 已格式化的日期字串。
 */
export const formatMediumDate = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date))

/**
 * 百分比差異格式化，永遠帶正負號（例如 `+5.3%`、`-2.1%`）。
 *
 * @param percent - 已是百分比刻度的數值（`5.3` 代表 5.3%），而非 0~1 的比例。
 * @param locale - {@link getIntlLocale} 的回傳值。
 * @param maximumFractionDigits - 小數位數上限，預設 1 位。
 * @returns 已格式化的百分比字串。
 */
export const formatSignedPercent = (
  percent: number,
  locale: string,
  maximumFractionDigits: number = DEFAULT_PERCENT_FRACTION_DIGITS,
): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    signDisplay: 'always',
    style: 'percent',
  }).format(percent / 100)
