/**
 * 判斷值是否為非陣列的物件，供其他資料驗證函式安全讀取欄位。
 *
 * @param value - 待驗證的未知值。
 * @returns 值為可使用字串索引讀取的物件時為 `true`。
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
