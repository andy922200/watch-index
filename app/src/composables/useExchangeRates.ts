import { type Ref, ref } from 'vue'

import { type ExchangeRateSet, getExchangeRates } from '@/api/exchangeRatesApi'
import { isCurrencyCode } from '@/lib/displayCurrencies'

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

interface LoadComparisonExchangeRatesOptions {
  displayCurrency: string
  sourceCurrencies: readonly string[]
}

interface ComparisonExchangeRateResult {
  convertToDisplayCurrency: (amount: number, sourceCurrency: string) => number | null
  error: Readonly<Ref<unknown>>
  getExchangeRateDate: (sourceCurrency: string) => string | null
  isLoading: Readonly<Ref<boolean>>
  loadExchangeRates: (options: LoadComparisonExchangeRatesOptions) => Promise<void>
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
      const result = await getExchangeRates(options)

      if (requestId === latestRequestId) {
        exchangeRateSet.value = result
      }
    } catch (requestError) {
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

/**
 * 將多個市場幣別轉換為同一個顯示幣別。Frankfurter 請求以顯示幣別為 base，
 * 因此每個來源金額都以 quote rate 的倒數換算，避免同時維護多組 base rate state。
 */
export const useComparisonExchangeRates = (): ComparisonExchangeRateResult => {
  const activeDisplayCurrency = ref<string | null>(null)
  const exchangeRateSet = ref<ExchangeRateSet | null>(null)
  const error = ref<unknown>(null)
  const isLoading = ref(false)
  let latestRequestId = 0

  const loadExchangeRates = async ({
    displayCurrency,
    sourceCurrencies,
  }: LoadComparisonExchangeRatesOptions): Promise<void> => {
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    try {
      if (!isCurrencyCode(displayCurrency)) {
        throw new Error('Comparison display currency is invalid')
      }

      activeDisplayCurrency.value = displayCurrency
      const quoteCurrencies = sourceCurrencies.filter((currency) => currency !== displayCurrency)

      // 只有顯示幣別本身時不需要任何匯率，直接給一組空的 rate set 讓換算走等值路徑。
      if (quoteCurrencies.filter(isCurrencyCode).length === 0) {
        if (requestId === latestRequestId) {
          exchangeRateSet.value = { baseCurrency: displayCurrency, rates: new Map() }
        }

        return
      }

      const result = await getExchangeRates({
        baseCurrency: displayCurrency,
        targetCurrencies: quoteCurrencies,
      })

      if (requestId === latestRequestId) {
        exchangeRateSet.value = result
      }
    } catch (requestError) {
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

  const convertToDisplayCurrency = (amount: number, sourceCurrency: string): number | null => {
    const rateSet = exchangeRateSet.value

    if (!isCurrencyCode(sourceCurrency)) {
      return null
    }

    if (activeDisplayCurrency.value === sourceCurrency) {
      return amount
    }

    if (!rateSet) {
      return null
    }

    const rate = rateSet.rates.get(sourceCurrency)

    return rate === undefined ? null : amount / rate.rate
  }

  const getExchangeRateDate = (sourceCurrency: string): string | null => {
    const rateSet = exchangeRateSet.value

    if (!rateSet || activeDisplayCurrency.value === sourceCurrency) {
      return null
    }

    return rateSet.rates.get(sourceCurrency)?.date ?? null
  }

  return { convertToDisplayCurrency, error, getExchangeRateDate, isLoading, loadExchangeRates }
}
