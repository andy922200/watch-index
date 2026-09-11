import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useFetchDataMock } = vi.hoisted(() => ({
  useFetchDataMock: vi.fn(),
}))

vi.mock('@/composables/useFetchData', () => ({
  Method: { GET: 'get' },
  useFetchData: useFetchDataMock,
}))

import { useComparisonExchangeRates, useExchangeRates } from '@/composables/useExchangeRates'

describe('useExchangeRates', () => {
  beforeEach(() => {
    useFetchDataMock.mockReset()
  })

  it('loads Frankfurter rates and converts a price', async () => {
    useFetchDataMock.mockResolvedValue({
      result: [
        {
          data: [
            { base: 'JPY', date: '2026-08-31', quote: 'TWD', rate: 0.21 },
            { base: 'JPY', date: '2026-08-31', quote: 'USD', rate: 0.0068 },
            { base: 'JPY', date: '2026-08-31', quote: 'JPY', rate: 1 },
          ],
        },
        null,
      ],
    })
    const { convert, getExchangeRateDate, loadExchangeRates } = useExchangeRates()

    await loadExchangeRates({ baseCurrency: 'JPY', targetCurrencies: ['JPY', 'TWD', 'USD'] })

    expect(getExchangeRateDate('TWD')).toBe('2026-08-31')
    expect(convert(100, 'TWD')).toBe(21)
    expect(convert(100, 'JPY')).toBe(100)
    expect(convert(100, 'EUR')).toBeNull()
  })

  it('exposes an error when the response format is invalid', async () => {
    useFetchDataMock.mockResolvedValue({ result: [{ data: {} }, null] })
    const { error, loadExchangeRates } = useExchangeRates()

    await loadExchangeRates({ baseCurrency: 'CAD', targetCurrencies: ['USD'] })

    expect(error.value).toBeInstanceOf(Error)
  })

  it('inverts display-currency rates for multi-market conversion', async () => {
    useFetchDataMock.mockResolvedValue({
      result: [
        {
          data: [{ base: 'TWD', date: '2026-09-10', quote: 'JPY', rate: 4.8 }],
        },
        null,
      ],
    })
    const { convertToDisplayCurrency, getExchangeRateDate, loadExchangeRates } =
      useComparisonExchangeRates()

    await loadExchangeRates({ displayCurrency: 'TWD', sourceCurrencies: ['JPY', 'TWD'] })

    expect(convertToDisplayCurrency(480, 'JPY')).toBe(100)
    expect(convertToDisplayCurrency(100, 'TWD')).toBe(100)
    expect(getExchangeRateDate('JPY')).toBe('2026-09-10')
    expect(getExchangeRateDate('TWD')).toBeNull()
  })
})
