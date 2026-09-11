import { describe, expect, it } from 'vitest'

import {
  createMarketComparisonRows,
  PriceComparisonMode,
} from '@/pages/rolex/price-compare/utils/watchPriceComparison'
import type { WatchPriceComparisonPayload } from '@/types/watch-data'

const createPayload = (): WatchPriceComparisonPayload => ({
  schemaVersion: 1,
  brandId: 'rolex',
  watchCount: 1,
  marketsByCode: {
    JP: {
      code: 'JP',
      currencyCode: 'JPY',
      priceType: 'tax-include',
      taxRatePercent: 10,
      priceUpdatedAt: '2026-09-01T00:00:00.000Z',
      travelerRefundPolicy: null,
    },
    TW: {
      code: 'TW',
      currencyCode: 'TWD',
      priceType: 'tax-include',
      taxRatePercent: 5,
      priceUpdatedAt: '2026-09-10T00:00:00.000Z',
      travelerRefundPolicy: {
        marketCode: 'TW',
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        assessedAt: '2026-09-11T00:00:00.000Z',
        availability: 'available',
        eligibilitySummary: { zhTw: '摘要', enUs: 'Summary' },
        merchantParticipationRequired: true,
        exportValidationRequired: true,
        evidencePath: 'data/evidence/TW/2026-09-11/traveler-refund-policy.json',
        sources: [
          {
            publisher: 'Test authority',
            title: 'Test source',
            url: 'https://example.test/tax-refund',
            accessedAt: '2026-09-11T00:00:00.000Z',
          },
        ],
      },
    },
    US: {
      code: 'US',
      currencyCode: 'USD',
      priceType: 'tax-exclude',
      taxRatePercent: null,
      priceUpdatedAt: '2026-09-01T00:00:00.000Z',
      travelerRefundPolicy: null,
    },
  },
  pricesByWatchId: {
    'rolex:m126234-0001': {
      JP: { price: 110_000, priceStatus: 'listed' },
      TW: { price: 105_000, priceStatus: 'listed' },
      US: { price: null, priceStatus: 'price-unavailable' },
    },
  },
})

const convertToTwd = (amount: number, sourceCurrency: string): number | null => {
  if (sourceCurrency === 'TWD') {
    return amount
  }

  if (sourceCurrency === 'JPY') {
    return amount * 0.8
  }

  return null
}

describe('createMarketComparisonRows', () => {
  it('calculates a tax-exclusive reference by removing embedded tax', () => {
    const rows = createMarketComparisonRows({
      comparison: createPayload(),
      convertToDisplayCurrency: convertToTwd,
      displayCurrency: 'TWD',
      marketCodes: ['TW', 'JP', 'US'],
      mode: PriceComparisonMode.RefundEstimate,
      selectedMarketCode: 'TW',
      watchId: 'rolex:m126234-0001',
    })

    expect(rows[0].localAmount).toBe(100_000)
    expect(rows[0].label).toBe('refund-policy-reference')
    expect(rows[1].localAmount).toBeCloseTo(100_000)
    expect(rows[1].label).toBe('tax-exclusive-reference')
  })

  it('centers the baseline and places a lower comparison price on the left', () => {
    const rows = createMarketComparisonRows({
      comparison: createPayload(),
      convertToDisplayCurrency: convertToTwd,
      displayCurrency: 'TWD',
      marketCodes: ['TW', 'JP', 'US'],
      mode: PriceComparisonMode.Official,
      selectedMarketCode: 'TW',
      watchId: 'rolex:m126234-0001',
    })

    expect(rows[0].differencePercent).toBe(0)
    expect(rows[0].slider).toEqual({ startPercent: 50, widthPercent: 0 })
    expect(rows[1].differencePercent).not.toBeNull()
    expect(rows[1].slider?.startPercent).toBeLessThan(50)
    expect(rows[2].slider).toBeNull()
    expect(rows[2].priceStatus).toBe('price-unavailable')
  })
})
