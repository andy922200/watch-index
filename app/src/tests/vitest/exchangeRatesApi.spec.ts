import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useFetchDataMock } = vi.hoisted(() => ({
  useFetchDataMock: vi.fn<(options: { params?: { quotes?: string } }) => Promise<unknown>>(),
}))

vi.mock('@/composables/useFetchData', () => ({
  Method: { GET: 'get' },
  useFetchData: useFetchDataMock,
}))

const respondWithRate = (): void => {
  useFetchDataMock.mockResolvedValue({
    result: [
      {
        data: [
          { base: 'TWD', date: '2026-09-10', quote: 'JPY', rate: 4.8 },
          { base: 'TWD', date: '2026-09-10', quote: 'USD', rate: 0.031 },
        ],
      },
      null,
    ],
  })
}

const requestedQuotes = (): (string | undefined)[] =>
  useFetchDataMock.mock.calls.map(([options]) => options.params?.quotes)

describe('exchangeRatesApi request caching', () => {
  beforeEach(() => {
    vi.resetModules()
    useFetchDataMock.mockReset()
    respondWithRate()
  })

  it('shares one request for the same normalized currency set', async () => {
    const { getExchangeRates } = await import('@/api/exchangeRatesApi')

    await Promise.all([
      getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['JPY', 'USD'] }),
      getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['USD', 'JPY', 'JPY'] }),
    ])
    await getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['USD', 'JPY'] })

    expect(requestedQuotes()).toEqual(['JPY,USD'])
  })

  it('drops malformed currency codes when building the request', async () => {
    const { getExchangeRates } = await import('@/api/exchangeRatesApi')

    await getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['JPY', 'jpy', 'EURO', 'USD'] })

    expect(requestedQuotes()).toEqual(['JPY,USD'])
  })

  it('rejects a malformed base currency without making a request', async () => {
    const { getExchangeRates } = await import('@/api/exchangeRatesApi')

    await expect(
      getExchangeRates({ baseCurrency: 'twd', targetCurrencies: ['JPY'] }),
    ).rejects.toThrow('Exchange rate base currency is invalid')
    expect(useFetchDataMock).not.toHaveBeenCalled()
  })

  it('clears the cached request when it fails so a retry refetches', async () => {
    const { getExchangeRates } = await import('@/api/exchangeRatesApi')

    useFetchDataMock.mockResolvedValueOnce({ result: [null, new Error('offline')] })
    await expect(
      getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['JPY'] }),
    ).rejects.toThrow('offline')

    await getExchangeRates({ baseCurrency: 'TWD', targetCurrencies: ['JPY'] })

    expect(requestedQuotes()).toEqual(['JPY', 'JPY'])
  })
})
