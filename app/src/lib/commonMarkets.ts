import type { BrandConfig } from '@/lib/brands'
import { MarketCode, type MarketOption, marketOptions } from '@/lib/markets'

/**
 * 篩出品牌清單「共同」有上架的市場（所有品牌都要有），與 {@link getAvailableMarketOptions}
 * 的「至少一個品牌有上架」不同。
 *
 * @param brands - 欲比對的品牌清單；空陣列回傳空陣列。
 */
export const getCommonMarketOptions = (brands: readonly BrandConfig[]): readonly MarketOption[] => {
  if (brands.length === 0) return []

  return marketOptions.filter((market) =>
    brands.every((brand) => brand.marketOptions.some((option) => option.code === market.code)),
  )
}

/**
 * 篩出品牌清單有上架的市場
 */
export const getAvailableMarketOptions = (
  brands: readonly BrandConfig[],
): readonly MarketOption[] =>
  marketOptions.filter((market) =>
    brands.some((brand) => brand.marketOptions.some((option) => option.code === market.code)),
  )

/**
 * 從市場選項中挑出預設市場：優先選台灣，若台灣不在清單中則退回第一個選項。
 *
 * @param options - 可選的市場選項；空陣列回傳 `null`。
 */
export const getCommonDefaultMarket = (options: readonly MarketOption[]): MarketOption | null =>
  options.find((option) => option.code === MarketCode.Taiwan) ?? options[0] ?? null

/**
 * 篩出在指定市場有上架的品牌，與 {@link getAvailableMarketOptions} 方向相反
 */
export const getMarketBrands = (
  brands: readonly BrandConfig[],
  market: MarketCode,
): readonly BrandConfig[] =>
  brands.filter((brand) => brand.marketOptions.some((option) => option.code === market))
