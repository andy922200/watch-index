import { type Ref, ref } from 'vue'

import { Method, useFetchData } from '@/composables/useFetchData'
import { isCurrencyCode } from '@/lib/displayCurrencies'

const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates'

interface FrankfurterRate {
  base: string
  date: string
  quote: string
  rate: number
}

interface ExchangeRateSet {
  baseCurrency: string
  rates: ReadonlyMap<string, FrankfurterRate>
}

interface LoadExchangeRatesOptions {
  baseCurrency: string
  targetCurrencies: readonly string[]
}

interface ExchangeRateResult {
  convert: (amount: number, targetCurrency: string) => number | null
  error: Readonly<Ref<unknown>>
  getExchangeRateDate: (targetCurrency: string) => string | null
  isLoading: Readonly<Ref<boolean>>
  loadExchangeRates: (options: LoadExchangeRatesOptions) => Promise<void>
}

const rateRequests = new Map<string, Promise<ExchangeRateSet>>()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFrankfurterRate = (value: unknown): value is FrankfurterRate =>
  isRecord(value) &&
  typeof value.base === 'string' &&
  typeof value.date === 'string' &&
  typeof value.quote === 'string' &&
  typeof value.rate === 'number' &&
  Number.isFinite(value.rate) &&
  value.rate > 0

const getExchangeRates = async ({
  baseCurrency,
  targetCurrencies,
}: LoadExchangeRatesOptions): Promise<ExchangeRateSet> => {
  if (!isCurrencyCode(baseCurrency)) {
    throw new Error('Exchange rate base currency is invalid')
  }

  const supportedCurrencies = [...new Set(targetCurrencies.filter(isCurrencyCode))].sort()

  if (supportedCurrencies.length === 0) {
    throw new Error('Exchange rate request does not include supported currencies')
  }

  const { result } = await useFetchData<unknown, { base: string; quotes: string }>({
    url: EXCHANGE_RATES_URL,
    method: Method.GET,
    params: {
      base: baseCurrency,
      quotes: supportedCurrencies.join(','),
    },
    isAbsolutePath: true,
  })
  const [response, requestError] = result

  if (requestError) {
    throw requestError
  }

  if (!response) {
    throw new Error('Exchange rate request returned no response')
  }

  if (!Array.isArray(response.data)) {
    throw new Error('Exchange rate response has an invalid format')
  }

  const rates = new Map<string, FrankfurterRate>()

  for (const value of response.data) {
    if (
      !isFrankfurterRate(value) ||
      value.base !== baseCurrency ||
      !supportedCurrencies.includes(value.quote)
    ) {
      continue
    }

    rates.set(value.quote, value)
  }

  if (rates.size === 0) {
    throw new Error('Exchange rate response does not include supported currencies')
  }

  return { baseCurrency, rates }
}

export const useExchangeRates = (): ExchangeRateResult => {
  const exchangeRateSet = ref<ExchangeRateSet | null>(null)
  const error = ref<unknown>(null)
  const isLoading = ref(false)
  let latestRequestId = 0

  const loadExchangeRates = async (options: LoadExchangeRatesOptions): Promise<void> => {
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    try {
      const requestKey = `${options.baseCurrency}:${[...options.targetCurrencies].sort().join(',')}`
      const request = rateRequests.get(requestKey) ?? getExchangeRates(options)
      rateRequests.set(requestKey, request)
      const result = await request

      if (requestId === latestRequestId) {
        exchangeRateSet.value = result
      }
    } catch (requestError) {
      rateRequests.delete(
        `${options.baseCurrency}:${[...options.targetCurrencies].sort().join(',')}`,
      )

      if (requestId === latestRequestId) {
        exchangeRateSet.value = null
        error.value = requestError
      }
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  const convert = (amount: number, targetCurrency: string): number | null => {
    const rateSet = exchangeRateSet.value

    if (rateSet?.baseCurrency === targetCurrency) {
      return amount
    }

    const rate = rateSet?.rates.get(targetCurrency)

    return rate === undefined ? null : amount * rate.rate
  }

  const getExchangeRateDate = (targetCurrency: string): string | null =>
    exchangeRateSet.value?.rates.get(targetCurrency)?.date ?? null

  return { convert, error, getExchangeRateDate, isLoading, loadExchangeRates }
}
