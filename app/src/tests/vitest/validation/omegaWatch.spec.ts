import { describe, expect, it } from 'vitest'

import { isOmegaWatch, isOmegaWatchCatalog } from '@/lib/validation/omegaWatch'

const omegaWatch = {
  watchId: 'omega:220.10.28.60.54.001',
  collectionId: 'seamaster',
  reference: '220.10.28.60.54.001',
  imageUrl: 'https://example.com/watch.png',
  modelName: 'Seamaster Aqua Terra 150M',
  caseDescription: 'Steel',
  dialDescription: 'Green',
  localNicknames: [],
  price: 100000,
  priceStatus: 'listed',
}

describe('omega watch validation', () => {
  it('accepts an Omega watch carrying its complete official reference', () => {
    expect(isOmegaWatch(omegaWatch)).toBe(true)
  })

  it('rejects a watchId that does not preserve the complete Omega reference', () => {
    expect(isOmegaWatch({ ...omegaWatch, watchId: 'omega:22010286054001' })).toBe(false)
  })

  it('accepts a market catalog of Omega watches', () => {
    expect(
      isOmegaWatchCatalog({
        schemaVersion: 5,
        brandId: 'omega',
        collectedAt: '2026-09-19T00:00:00.000Z',
        watchCount: 1,
        collections: [{ id: 'seamaster', watchCount: 1 }],
        priceMarket: {
          code: 'TW',
          currencyCode: 'TWD',
          priceType: 'tax-include',
          taxRatePercent: 5,
        },
        priceUpdatedAt: '2026-09-19T00:00:00.000Z',
        watchesById: { [omegaWatch.watchId]: omegaWatch },
      }),
    ).toBe(true)
  })
})
