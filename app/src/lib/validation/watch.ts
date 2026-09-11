import { isRecord } from '@/lib/validation/shared'
import { isTravelerRefundPolicy } from '@/lib/validation/travelerRefundPolicy'
import type {
  BaseWatch,
  ComparisonMarket,
  ComparisonPrice,
  PriceMarket,
  WatchCatalog,
  WatchCollection,
  WatchDataManifest,
  WatchPriceComparisonPayload,
} from '@/types/watch-data'

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string')

/**
 * 驗證未知值是否符合單一錶款系列統計資料的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link WatchCollection} 時為 `true`，並將型別縮限為 `WatchCollection`。
 */
export const isWatchCollection = (value: unknown): value is WatchCollection =>
  isRecord(value) && typeof value.id === 'string' && typeof value.watchCount === 'number'

/**
 * 驗證未知值是否符合各品牌共用的腕錶欄位格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link BaseWatch} 時為 `true`，並將型別縮限為 `BaseWatch`。
 */
export const isBaseWatch = (value: unknown): value is BaseWatch =>
  isRecord(value) &&
  typeof value.watchId === 'string' &&
  typeof value.collectionId === 'string' &&
  typeof value.imageUrl === 'string' &&
  typeof value.modelName === 'string' &&
  typeof value.caseDescription === 'string' &&
  typeof value.dialDescription === 'string' &&
  Array.isArray(value.localNicknames) &&
  value.localNicknames.every((nickname) => typeof nickname === 'string') &&
  (typeof value.price === 'number' || value.price === null) &&
  (value.priceStatus === 'listed' ||
    value.priceStatus === 'price-unavailable' ||
    value.priceStatus === 'not-listed')

export const isPriceMarket = (value: unknown): value is PriceMarket =>
  isRecord(value) &&
  typeof value.code === 'string' &&
  typeof value.currencyCode === 'string' &&
  (value.priceType === 'tax-include' ||
    value.priceType === 'tax-exclude' ||
    value.priceType === 'no-tax') &&
  (typeof value.taxRatePercent === 'number' || value.taxRatePercent === null)

const isComparisonMarket = (value: unknown): value is ComparisonMarket =>
  isRecord(value) &&
  typeof value.code === 'string' &&
  typeof value.currencyCode === 'string' &&
  (value.priceType === 'tax-include' ||
    value.priceType === 'tax-exclude' ||
    value.priceType === 'no-tax') &&
  (typeof value.taxRatePercent === 'number' || value.taxRatePercent === null) &&
  typeof value.priceUpdatedAt === 'string' &&
  (value.travelerRefundPolicy === null || isTravelerRefundPolicy(value.travelerRefundPolicy))

const isComparisonPrice = (value: unknown): value is ComparisonPrice =>
  isRecord(value) &&
  ((value.priceStatus === 'listed' && typeof value.price === 'number') ||
    ((value.priceStatus === 'price-unavailable' || value.priceStatus === 'not-listed') &&
      value.price === null))

const isWatchesById = <TWatch extends BaseWatch>(
  value: unknown,
  isWatch: (candidate: unknown) => candidate is TWatch,
): value is Record<string, TWatch> =>
  isRecord(value) &&
  Object.entries(value).every(([watchId, watch]) => isWatch(watch) && watch.watchId === watchId)

/**
 * 驗證版本化 watch-data manifest 的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link WatchDataManifest} 時為 `true`，並將型別縮限為 `WatchDataManifest`。
 */
export const isWatchDataManifest = (value: unknown): value is WatchDataManifest =>
  isRecord(value) &&
  typeof value.schemaVersion === 'number' &&
  typeof value.catalog === 'string' &&
  isStringRecord(value.catalogs) &&
  typeof value.comparison === 'string' &&
  Array.isArray(value.currencies) &&
  value.currencies.every((currency) => typeof currency === 'string' && /^[A-Z]{3}$/.test(currency))

/**
 * 以指定品牌的腕錶 guard 建立對應的 catalog 驗證函式。
 *
 * catalog 的外層結構（schemaVersion、collections、priceMarket 等）各品牌共用，
 * 僅 `watchesById` 的內容依品牌而異，因此由呼叫端帶入該品牌的腕錶 guard。
 *
 * @param isWatch - 該品牌腕錶資料的 type guard，例如 `isRolexWatch`。
 * @returns 驗證該品牌 {@link WatchCatalog} 的 type guard。
 */
export const createWatchCatalogGuard =
  <TWatch extends BaseWatch>(
    isWatch: (value: unknown) => value is TWatch,
  ): ((value: unknown) => value is WatchCatalog<TWatch>) =>
  (value: unknown): value is WatchCatalog<TWatch> =>
    isRecord(value) &&
    typeof value.schemaVersion === 'number' &&
    typeof value.brandId === 'string' &&
    typeof value.collectedAt === 'string' &&
    typeof value.watchCount === 'number' &&
    Array.isArray(value.collections) &&
    value.collections.every(isWatchCollection) &&
    isPriceMarket(value.priceMarket) &&
    typeof value.priceUpdatedAt === 'string' &&
    isWatchesById(value.watchesById, isWatch)

const isComparisonPricesByWatchId = (
  value: unknown,
): value is Record<string, Record<string, ComparisonPrice>> =>
  isRecord(value) &&
  Object.values(value).every(
    (marketPrices) =>
      isRecord(marketPrices) && Object.values(marketPrices).every(isComparisonPrice),
  )

export const isWatchPriceComparisonPayload = (
  value: unknown,
): value is WatchPriceComparisonPayload =>
  isRecord(value) &&
  typeof value.schemaVersion === 'number' &&
  typeof value.brandId === 'string' &&
  typeof value.watchCount === 'number' &&
  isRecord(value.marketsByCode) &&
  Object.entries(value.marketsByCode).every(
    ([marketCode, market]) => isComparisonMarket(market) && market.code === marketCode,
  ) &&
  isComparisonPricesByWatchId(value.pricesByWatchId)
