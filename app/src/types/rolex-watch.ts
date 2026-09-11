import type { BaseWatch } from '@/types/watch-data'

/**
 * Rolex 腕錶資料，於 {@link BaseWatch} 之上加入 Rolex 專屬的型號欄位。
 *
 * `modelReference` 由 `modelNumber` 與 `configurationCode` 組成，此規則為 Rolex 專屬，
 * 其他品牌不得假設可沿用。
 */
export interface RolexWatch extends BaseWatch {
  modelNumber: string
  configurationCode: string
  modelReference: string
}
