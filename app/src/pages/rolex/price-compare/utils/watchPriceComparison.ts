import type {
  ComparisonMarket,
  ComparisonPrice,
  PriceStatus,
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
  | 'refund-policy-reference'
  | 'tax-exclusive-reference'
  | 'traveler-refund-unavailable'
  | 'tax-exclusive-price'
  | 'no-tax-price'
  | 'tax-rate-unavailable'
  | 'price-unavailable'

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
  watchId: string
}

interface ResolvedPrice {
  amount: number | null
  label: PriceComparisonLabel
  priceStatus: PriceStatus
}

const getUnavailablePrice = (priceStatus: PriceStatus): ResolvedPrice => ({
  amount: null,
  label: 'price-unavailable',
  priceStatus,
})

const resolveRefundEstimate = ({
  market,
  price,
}: {
  market: ComparisonMarket
  price: ComparisonPrice
}): ResolvedPrice => {
  if (price.priceStatus !== 'listed' || price.price === null) {
    return getUnavailablePrice(price.priceStatus)
  }

  if (market.priceType === 'tax-exclude') {
    return { amount: price.price, label: 'tax-exclusive-price', priceStatus: price.priceStatus }
  }

  if (market.priceType === 'no-tax') {
    return { amount: price.price, label: 'no-tax-price', priceStatus: price.priceStatus }
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

const resolvePrice = ({
  market,
  mode,
  price,
}: {
  market: ComparisonMarket
  mode: PriceComparisonModeId
  price: ComparisonPrice
}): ResolvedPrice => {
  if (mode === PriceComparisonMode.RefundEstimate) {
    return resolveRefundEstimate({ market, price })
  }

  if (price.priceStatus !== 'listed' || price.price === null) {
    return getUnavailablePrice(price.priceStatus)
  }

  return { amount: price.price, label: 'official-price', priceStatus: price.priceStatus }
}

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

export const createMarketComparisonRows = ({
  comparison,
  convertToDisplayCurrency,
  displayCurrency,
  marketCodes,
  mode,
  selectedMarketCode,
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

    const resolvedPrice = resolvePrice({ market, mode, price })
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
