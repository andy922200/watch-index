/**
 * 單錶跨市場比價的計算。
 *
 * 放在 `lib/` 而非某個品牌頁底下：這裡只相依 `types/watch-data` 的通用型別，
 * 沒有任何品牌專屬欄位，而 `price-compare` 依 `lib/pageRoutes.ts` 的定義是
 * 每個品牌都會有的頁面種類，計算方式也一致。
 *
 * 因此新增品牌時請直接沿用這支，不要複製一份改成品牌專屬版本——
 * 一旦分家，退稅估算與差價基準這類規則就會在各品牌之間悄悄長歪。
 */

import { isEuMember } from '@/lib/markets'
import type {
  ComparisonMarket,
  ComparisonPrice,
  PriceStatus,
  PriceType,
  WatchPriceComparisonPayload,
} from '@/types/watch-data'

export type PriceComparisonModeId = 'official' | 'refund-estimate'

export const PriceComparisonMode: {
  Official: PriceComparisonModeId
  RefundEstimate: PriceComparisonModeId
} = {
  Official: 'official',
  RefundEstimate: 'refund-estimate',
}

export type PriceComparisonLabel =
  | 'official-price'
  | 'retailer-only-price'
  | 'refund-policy-reference'
  | 'tax-exclusive-reference'
  | 'traveler-refund-unavailable'
  | 'tax-exclusive-price'
  | 'no-tax-price'
  | 'tax-rate-unavailable'
  | 'price-unavailable'
  | 'tax-resident-original-price'

/**
 * 各價格標示對應的 i18n key。刻意與 {@link PriceComparisonLabel} 放在同一支：
 * 新增標示時型別與對應表在同一個畫面內，不會只補了其中一邊。
 */
export const PriceComparisonLabelKeys: Record<PriceComparisonLabel, string> = {
  'official-price': 'site.watchPriceComparison.officialPriceLabel',
  'retailer-only-price': 'site.watchPriceComparison.retailerOnlyPriceLabel',
  'refund-policy-reference': 'site.watchPriceComparison.refundPolicyReference',
  'tax-exclusive-reference': 'site.watchPriceComparison.taxExclusiveReference',
  'traveler-refund-unavailable': 'site.watchPriceComparison.travelerRefundUnavailable',
  'tax-exclusive-price': 'site.watchPriceComparison.taxExclusivePrice',
  'no-tax-price': 'site.watchPriceComparison.noTaxPrice',
  'tax-rate-unavailable': 'site.watchPriceComparison.taxRateUnavailable',
  'price-unavailable': 'site.watchPriceComparison.priceUnavailable',
  'tax-resident-original-price': 'site.watchPriceComparison.taxResidentOriginalPrice',
}

/**
 * 各稅制標示對應的 i18n key。刻意與 {@link PriceType} 放在同一支（雖然定義在 `types/watch-data`）：
 * 新增稅制種類時，這份對應表跟 {@link PriceComparisonLabelKeys} 一樣容易被 CollectionExplorer、
 * WatchIndex、WatchCompare 三個頁面各自重複實作一份，同一份查表可以避免三邊各自長歪。
 */
export const PriceTypeLabelKeys: Record<PriceType, string> = {
  'tax-include': 'site.watchList.priceLabelIncludingTax',
  'tax-exclude': 'site.watchList.priceLabelExcludingTax',
  'no-tax': 'site.watchList.priceLabelNoTax',
}

export interface MarketComparisonRow {
  market: ComparisonMarket
  localAmount: number | null
  convertedAmount: number | null
  differencePercent: number | null
  isBaseline: boolean
  label: PriceComparisonLabel
  priceStatus: PriceStatus
  slider: {
    startPercent: number
    widthPercent: number
  } | null
}

interface CreateMarketComparisonRowsOptions {
  comparison: WatchPriceComparisonPayload
  convertToDisplayCurrency: (amount: number, sourceCurrency: string) => number | null
  displayCurrency: string
  marketCodes: readonly string[]
  mode: PriceComparisonModeId
  selectedMarketCode: string
  taxResidencyMarketCodes: readonly string[]
  watchId: string
}

interface ResolvedPrice {
  amount: number | null
  label: PriceComparisonLabel
  priceStatus: PriceStatus
}

/** 組出「無公開價格」情境下要顯示的比較結果，統一使用 `price-unavailable` 標示。 */
const getUnavailablePrice = (priceStatus: PriceStatus): ResolvedPrice => ({
  amount: null,
  label: 'price-unavailable',
  priceStatus,
})

/**
 * `listed` 與 `retailer-only` 都有官方公開價格，差異只在購買通路
 * （官方線上結帳 vs. 僅提供經銷商導購），比價邏輯上一視同仁。
 */
export const hasPublicPrice = (priceStatus: PriceStatus): boolean =>
  priceStatus === 'listed' || priceStatus === 'retailer-only'

/** 依價格狀態決定「官方模式」下要顯示的價格標示（一般價 vs. 僅限經銷商）。 */
const getOfficialPriceLabel = (priceStatus: PriceStatus): PriceComparisonLabel =>
  priceStatus === 'retailer-only' ? 'retailer-only-price' : 'official-price'

/**
 * 稅務居民身分是否讓這個市場失去退稅資格：本人是該市場的稅務居民，
 * 或者該市場是歐盟成員國且本人在任一歐盟市場具稅務居民身分——
 * 歐盟旅客退稅制度通常要求申請人「非歐盟居民」，因此喪失資格會擴及整個歐盟，
 * 不只是本人實際居住的那一國。
 */
const isRefundIneligibleForResidency = ({
  market,
  taxResidencyMarketCodes,
}: {
  market: ComparisonMarket
  taxResidencyMarketCodes: readonly string[]
}): boolean => {
  const isExactResidencyMatch = taxResidencyMarketCodes.includes(market.code)
  const isEuWideDisqualification =
    isEuMember(market.code) && taxResidencyMarketCodes.some(isEuMember)

  return isExactResidencyMatch || isEuWideDisqualification
}

/**
 * 依市場稅制與退稅政策，算出「退稅估算模式」下該顯示的金額與標示。
 *
 * 判斷順序即優先順序：先看該市場稅制本來就無需計算退稅（未稅／免稅），
 * 再看使用者的稅務居民身分是否讓這個市場（或整個歐盟）喪失退稅資格，
 * 接著看該市場的旅客退稅政策是否明確不可用，最後才是稅率未知或正常估算退稅後金額。
 */
const resolveRefundEstimate = ({
  market,
  price,
  taxResidencyMarketCodes,
}: {
  market: ComparisonMarket
  price: ComparisonPrice
  taxResidencyMarketCodes: readonly string[]
}): ResolvedPrice => {
  if (!hasPublicPrice(price.priceStatus) || price.price === null) {
    return getUnavailablePrice(price.priceStatus)
  }

  if (market.priceType === 'tax-exclude') {
    return { amount: price.price, label: 'tax-exclusive-price', priceStatus: price.priceStatus }
  }

  if (market.priceType === 'no-tax') {
    return { amount: price.price, label: 'no-tax-price', priceStatus: price.priceStatus }
  }

  // 這裡是「本來有得退，但你是當地（或歐盟）居民所以不能退」，語意不同。
  if (isRefundIneligibleForResidency({ market, taxResidencyMarketCodes })) {
    return {
      amount: price.price,
      label: 'tax-resident-original-price',
      priceStatus: price.priceStatus,
    }
  }

  if (market.travelerRefundPolicy?.availability === 'unavailable') {
    return {
      amount: price.price,
      label: 'traveler-refund-unavailable',
      priceStatus: price.priceStatus,
    }
  }

  if (market.taxRatePercent === null) {
    return { amount: null, label: 'tax-rate-unavailable', priceStatus: price.priceStatus }
  }

  return {
    amount: price.price / (1 + market.taxRatePercent / 100),
    label:
      market.travelerRefundPolicy?.availability === 'available'
        ? 'refund-policy-reference'
        : 'tax-exclusive-reference',
    priceStatus: price.priceStatus,
  }
}

/** 依比價模式將某市場的原始價格解析為顯示金額與標示，分派到官方或退稅估算邏輯。 */
const resolvePrice = ({
  market,
  mode,
  price,
  taxResidencyMarketCodes,
}: {
  market: ComparisonMarket
  mode: PriceComparisonModeId
  price: ComparisonPrice
  taxResidencyMarketCodes: readonly string[]
}): ResolvedPrice => {
  if (mode === PriceComparisonMode.RefundEstimate) {
    return resolveRefundEstimate({ market, price, taxResidencyMarketCodes })
  }

  if (!hasPublicPrice(price.priceStatus) || price.price === null) {
    return getUnavailablePrice(price.priceStatus)
  }

  return {
    amount: price.price,
    label: getOfficialPriceLabel(price.priceStatus),
    priceStatus: price.priceStatus,
  }
}

/**
 * 依價差百分比算出比較列的視覺化滑桿位置：以中線（50%）為基準點向左（較便宜）或
 * 向右（較貴）延伸，寬度依相對於本次比較中最大價差的比例縮放，使各列的視覺長度可互相比較。
 *
 * @returns 沒有價差可比較（如缺價）時回傳 `null`。
 */
const getSlider = ({
  differencePercent,
  maximumDifferencePercent,
}: {
  differencePercent: number | null
  maximumDifferencePercent: number
}): MarketComparisonRow['slider'] => {
  if (differencePercent === null) {
    return null
  }

  const widthPercent = (Math.abs(differencePercent) / maximumDifferencePercent) * 50

  return {
    startPercent: differencePercent < 0 ? 50 - widthPercent : 50,
    widthPercent,
  }
}

/**
 * 組出單錶跨市場比價表的每一列資料：換算成顯示幣別、算出相對於選定市場的價差百分比，
 * 並附上供視覺化呈現的滑桿位置。
 *
 * @param options - 比價資料、幣別轉換函式與目標市場等條件，見 {@link CreateMarketComparisonRowsOptions}。
 * @returns 該錶在指定市場清單下的比較列；查無此錶的比價資料時回傳空陣列。
 */
export const createMarketComparisonRows = ({
  comparison,
  convertToDisplayCurrency,
  displayCurrency,
  marketCodes,
  mode,
  selectedMarketCode,
  taxResidencyMarketCodes,
  watchId,
}: CreateMarketComparisonRowsOptions): MarketComparisonRow[] => {
  const pricesByMarket = comparison.pricesByWatchId[watchId]

  if (!pricesByMarket) {
    return []
  }

  const preliminaryRows = marketCodes.flatMap((marketCode) => {
    const market = comparison.marketsByCode[marketCode]
    const price = pricesByMarket[marketCode]

    if (!market || !price) {
      return []
    }

    const resolvedPrice = resolvePrice({ market, mode, price, taxResidencyMarketCodes })
    const convertedAmount =
      resolvedPrice.amount === null
        ? null
        : market.currencyCode === displayCurrency
          ? resolvedPrice.amount
          : convertToDisplayCurrency(resolvedPrice.amount, market.currencyCode)

    return [
      {
        market,
        localAmount: resolvedPrice.amount,
        convertedAmount,
        differencePercent: null,
        isBaseline: marketCode === selectedMarketCode,
        label: resolvedPrice.label,
        priceStatus: resolvedPrice.priceStatus,
        slider: null,
      },
    ]
  })
  const baselineAmount = preliminaryRows.find((row) => row.isBaseline)?.convertedAmount ?? null
  const rowsWithDifference = preliminaryRows.map((row) => ({
    ...row,
    differencePercent:
      baselineAmount === null || row.convertedAmount === null
        ? null
        : (row.convertedAmount / baselineAmount - 1) * 100,
  }))
  const maximumDifferencePercent = Math.max(
    1,
    ...rowsWithDifference.flatMap((row) =>
      row.differencePercent === null ? [] : [Math.abs(row.differencePercent)],
    ),
  )

  return rowsWithDifference.map((row) => ({
    ...row,
    slider: getSlider({
      differencePercent: row.differencePercent,
      maximumDifferencePercent,
    }),
  }))
}
