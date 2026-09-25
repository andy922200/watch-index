import { createWatchCatalogGuard, isBaseWatch } from '@/lib/validation/watch'
import type { LonginesWatch } from '@/types/longines-watch'
import type { WatchCatalog } from '@/types/watch-data'

/**
 * 驗證未知值是否符合單一 Longines 錶款資料的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link LonginesWatch} 時為 `true`，並將型別縮限為 `LonginesWatch`。
 */
export const isLonginesWatch = (value: unknown): value is LonginesWatch =>
  isBaseWatch(value) &&
  /^longines:L\d\.\d{3}\.\d\.\d{2}\.[0-9A]$/.test(value.watchId) &&
  value.watchId === `longines:${value.reference}`

/**
 * 驗證由建置程序產生的 Longines 錶款 catalog 索引格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 `WatchCatalog<LonginesWatch>` 時為 `true`，並將型別縮限為該型別。
 */
export const isLonginesWatchCatalog: (value: unknown) => value is WatchCatalog<LonginesWatch> =
  createWatchCatalogGuard(isLonginesWatch)
