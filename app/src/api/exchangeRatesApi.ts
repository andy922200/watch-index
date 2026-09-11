import { Method, useFetchData } from '@/composables/useFetchData'
import { isCurrencyCode } from '@/lib/displayCurrencies'
import { isRecord } from '@/lib/validation/shared'

const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates'

/** Frankfurter `/v2/rates` 回應中的單筆匯率。 */
export interface FrankfurterRate {
  base: string
  date: string
  quote: string
  rate: number
}

/** 單一 base 幣別對應的匯率集合，以 quote 幣別為鍵。 */
export interface ExchangeRateSet {
  baseCurrency: string
  rates: ReadonlyMap<string, FrankfurterRate>
}

export interface GetExchangeRatesOptions {
  baseCurrency: string
  targetCurrencies: readonly string[]
}

/**
 * 匯率請求快取。
 *
 * 鍵由正規化後的 base 與 quote 幣別組成，因此不同呼叫端只要要的是同一組匯率，
 * 即使傳入的幣別順序或重複情況不同，也會共用同一個請求。
 */
const rateRequests = new Map<string, Promise<ExchangeRateSet>>()

const isFrankfurterRate = (value: unknown): value is FrankfurterRate =>
  isRecord(value) &&
  typeof value.base === 'string' &&
  typeof value.date === 'string' &&
  typeof value.quote === 'string' &&
  typeof value.rate === 'number' &&
  Number.isFinite(value.rate) &&
  value.rate > 0

const fetchExchangeRates = async (
  baseCurrency: string,
  supportedCurrencies: readonly string[],
): Promise<ExchangeRateSet> => {
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

/**
 * 取得指定 base 幣別對一組 quote 幣別的匯率，並以正規化後的幣別組合共用同一個請求。
 *
 * @param options - base 幣別與想取得的 quote 幣別；不支援的幣別會被忽略。
 * @returns 已驗證格式的匯率集合。
 * @throws 當幣別無效、請求失敗或回應格式不符時拋出錯誤，並清除該組合的快取讓後續呼叫可重試。
 */
export const getExchangeRates = async ({
  baseCurrency,
  targetCurrencies,
}: GetExchangeRatesOptions): Promise<ExchangeRateSet> => {
  if (!isCurrencyCode(baseCurrency)) {
    throw new Error('Exchange rate base currency is invalid')
  }

  const supportedCurrencies = [...new Set(targetCurrencies.filter(isCurrencyCode))].sort()

  if (supportedCurrencies.length === 0) {
    throw new Error('Exchange rate request does not include supported currencies')
  }

  const requestKey = `${baseCurrency}:${supportedCurrencies.join(',')}`
  const cachedRequest = rateRequests.get(requestKey)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = fetchExchangeRates(baseCurrency, supportedCurrencies).catch((error: unknown) => {
    rateRequests.delete(requestKey)

    throw error
  })
  rateRequests.set(requestKey, request)

  return request
}
