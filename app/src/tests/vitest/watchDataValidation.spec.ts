import { describe, expect, it } from 'vitest'

import { isWatchCatalog, isWatchDataManifest } from '@/lib/watchDataValidation'

describe('watch data validation', () => {
  it('accepts the generated manifest format', () => {
    expect(
      isWatchDataManifest({
        schemaVersion: 3,
        catalog: 'catalog.abc123.json',
        catalogs: { TW: 'catalog.abc123.json' },
        currencies: ['TWD'],
      }),
    ).toBe(true)
  })

  it('rejects catalogs containing invalid watch records', () => {
    expect(
      isWatchCatalog({
        schemaVersion: 1,
        brandId: 'rolex',
        collectedAt: '2026-09-04T00:00:00.000Z',
        watchCount: 1,
        collections: [{ id: 'datejust', watchCount: 1 }],
        watchesById: {
          'm126234-0001': { collectionId: 'datejust' },
        },
      }),
    ).toBe(false)
  })

  it('requires the Taiwan market display fields', () => {
    expect(
      isWatchCatalog({
        schemaVersion: 3,
        brandId: 'rolex',
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
        watchesById: {
          'rolex:m126234-0001': {
            watchId: 'rolex:m126234-0001',
            collectionId: 'datejust',
            modelNumber: 'm126234',
            configurationCode: '0001',
            modelReference: 'm126234-0001',
            imageUrl: 'https://example.com/watch.png',
            modelName: 'Datejust 36',
            caseDescription: 'Oyster, 36 mm, Oystersteel',
            dialDescription: 'Bright blue',
            localNicknames: ['DJ'],
            price: 100000,
            priceStatus: 'listed',
          },
        },
      }),
    ).toBe(true)
  })
})
