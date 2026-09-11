import { describe, expect, it } from 'vitest'

import {
  createWatchCatalogGuard,
  isBaseWatch,
  isWatchDataManifest,
  isWatchPriceComparisonPayload,
} from '@/lib/validation/watch'

const baseWatch = {
  watchId: 'rolex:m126234-0001',
  collectionId: 'datejust',
  imageUrl: 'https://example.com/watch.png',
  modelName: 'Datejust 36',
  caseDescription: 'Oyster, 36 mm, Oystersteel',
  dialDescription: 'Bright blue',
  localNicknames: ['DJ'],
  price: 100000,
  priceStatus: 'listed',
}

const catalogWithWatches = (watchesById: Record<string, unknown>): unknown => ({
  schemaVersion: 3,
  brandId: 'example',
  collectedAt: '2026-09-04T00:00:00.000Z',
  watchCount: 1,
  collections: [{ id: 'datejust', watchCount: 1 }],
  priceMarket: {
    code: 'TW',
    currencyCode: 'TWD',
    priceType: 'tax-include',
    taxRatePercent: 5,
  },
  priceUpdatedAt: '2026-09-04T00:00:00.000Z',
  watchesById,
})

describe('watch data validation', () => {
  it('accepts the generated manifest format', () => {
    expect(
      isWatchDataManifest({
        schemaVersion: 3,
        catalog: 'catalog.abc123.json',
        catalogs: { TW: 'catalog.abc123.json' },
        comparison: 'comparison.abc123.json',
        currencies: ['TWD'],
      }),
    ).toBe(true)
  })

  it('accepts a watch carrying only the shared fields as a base watch', () => {
    expect(isBaseWatch(baseWatch)).toBe(true)
  })

  it('rejects a watch carrying an unknown price status as a base watch', () => {
    expect(isBaseWatch({ ...baseWatch, priceStatus: 'sold-out' })).toBe(false)
  })

  it('validates a catalog against the watch guard it is created with', () => {
    const isBaseWatchCatalog = createWatchCatalogGuard(isBaseWatch)

    expect(isBaseWatchCatalog(catalogWithWatches({ 'rolex:m126234-0001': baseWatch }))).toBe(true)
    expect(
      isBaseWatchCatalog(
        catalogWithWatches({ 'rolex:m126234-0001': { collectionId: 'datejust' } }),
      ),
    ).toBe(false)
  })

  it('rejects a catalog whose watchesById key does not match the watch id', () => {
    const isBaseWatchCatalog = createWatchCatalogGuard(isBaseWatch)

    expect(isBaseWatchCatalog(catalogWithWatches({ 'rolex:m126234-0002': baseWatch }))).toBe(false)
  })

  it('accepts a comparison payload with market price metadata', () => {
    expect(
      isWatchPriceComparisonPayload({
        schemaVersion: 1,
        brandId: 'rolex',
        watchCount: 1,
        marketsByCode: {
          TW: {
            code: 'TW',
            currencyCode: 'TWD',
            priceType: 'tax-include',
            taxRatePercent: 5,
            priceUpdatedAt: '2026-09-10T00:00:00.000Z',
            travelerRefundPolicy: null,
          },
        },
        pricesByWatchId: {
          'rolex:m126234-0001': {
            TW: { price: 100000, priceStatus: 'listed' },
          },
        },
      }),
    ).toBe(true)
  })
})
