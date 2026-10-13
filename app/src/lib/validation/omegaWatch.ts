import { createWatchCatalogGuard, isBaseWatch } from '@/lib/validation/watch'
import type { OmegaWatch } from '@/types/omega-watch'
import type { WatchCatalog } from '@/types/watch-data'

const OMEGA_REFERENCE_PATTERN =
  /^(?:[0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}|[0-9]{4}\.[0-9]{2}\.[0-9]{2})$/

/** 驗證完整 Omega 官方參考號與其跨品牌 watchId。 */
export const isOmegaWatch = (value: unknown): value is OmegaWatch =>
  isBaseWatch(value) &&
  OMEGA_REFERENCE_PATTERN.test(value.reference) &&
  value.watchId === `omega:${value.reference}`

/** 驗證由建置程序產生的 Omega 市場 catalog。 */
export const isOmegaWatchCatalog: (value: unknown) => value is WatchCatalog<OmegaWatch> =
  createWatchCatalogGuard(isOmegaWatch)
