import { createWatchCatalogGuard, isBaseWatch } from '@/lib/validation/watch'
import type { RolexWatch } from '@/types/rolex-watch'
import type { WatchCatalog } from '@/types/watch-data'

/**
 * 驗證未知值是否符合單一 Rolex 錶款資料的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link RolexWatch} 時為 `true`，並將型別縮限為 `RolexWatch`。
 */
export const isRolexWatch = (value: unknown): value is RolexWatch =>
  isBaseWatch(value) &&
  /^rolex:m[0-9a-z]+-[0-9]{4}$/.test(value.watchId) &&
  value.watchId === `rolex:${value.reference}`

/**
 * 驗證由建置程序產生的 Rolex 錶款 catalog 索引格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 `WatchCatalog<RolexWatch>` 時為 `true`，並將型別縮限為該型別。
 */
export const isRolexWatchCatalog: (value: unknown) => value is WatchCatalog<RolexWatch> =
  createWatchCatalogGuard(isRolexWatch)
