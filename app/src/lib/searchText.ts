/**
 * 搜尋文字的正規化與比對。
 *
 * 這一層只認得「字串」，不認得任何腕錶或品牌欄位：要比對哪些欄位由呼叫端決定
 * （例如 `pages/rolex/utils/watchSearch.ts` 知道 Rolex 要比對型號與暱稱）。
 * 因為正規化規則一旦在各品牌之間長歪，同一個查詢就會在不同品牌頁得到不同結果。
 */

/**
 * 把使用者輸入或資料中的搜尋文字正規化，供比對使用。
 *
 * 會做四件事：NFKC（全形轉半形）、去頭尾空白、轉小寫、移除空白與連字號。
 * 移除空白與連字號是為了讓 `m12406-0001`、`M12406 0001`、`m124060001`
 * 這幾種輸入都能對到同一支錶。
 *
 * @param value - 使用者輸入的原始文字，或資料中的可搜尋欄位。
 * @returns 已轉小寫、不含空白與連字號的文字。
 */
export const normalizeSearchText = (value: string): string =>
  value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s-]/g, '')

/**
 * 檢查正規化後的查詢字串是否包含在某個可搜尋欄位中。
 *
 * @param value - 要比對的欄位值，尚未正規化。
 * @param normalizedQuery - 已經過 {@link normalizeSearchText} 正規化的查詢字串。
 * @returns 欄位值是否包含該查詢。
 */
export const includesSearchText = (value: string, normalizedQuery: string): boolean =>
  normalizeSearchText(value).includes(normalizedQuery)
