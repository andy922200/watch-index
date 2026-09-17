import { describe, expect, it } from 'vitest'

import { isRolexWatch, isRolexWatchCatalog } from '@/lib/validation/rolexWatch'

const baseWatch = {
  watchId: 'rolex:m126234-0001',
  collectionId: 'datejust',
  reference: 'm126234-0001',
  imageUrl: 'https://example.com/watch.png',
  modelName: 'Datejust 36',
  caseDescription: 'Oyster, 36 mm, Oystersteel',
  dialDescription: 'Bright blue',
  localNicknames: ['DJ'],
  price: 100000,
  priceStatus: 'listed',
}

const watchWithoutReference: Record<string, unknown> = { ...baseWatch }
delete watchWithoutReference.reference

describe('rolex watch validation', () => {
  it('accepts a watch carrying the canonical reference', () => {
    expect(isRolexWatch(baseWatch)).toBe(true)
  })

  it('rejects a watch without the canonical reference', () => {
    expect(isRolexWatch(watchWithoutReference)).toBe(false)
  })

  it('rejects a reference that does not match watchId', () => {
    expect(isRolexWatch({ ...baseWatch, reference: 'm126234-0002' })).toBe(false)
  })

  it('rejects catalogs containing invalid watch records', () => {
    expect(
      isRolexWatchCatalog({
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
      isRolexWatchCatalog({
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
        watchesById: { 'rolex:m126234-0001': baseWatch },
      }),
    ).toBe(true)
  })

  it('rejects a catalog whose watches omit the canonical reference', () => {
    expect(
      isRolexWatchCatalog({
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
        watchesById: { 'rolex:m126234-0001': watchWithoutReference },
      }),
    ).toBe(false)
  })
})
