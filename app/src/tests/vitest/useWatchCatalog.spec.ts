import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWatchCatalog } from '@/composables/useWatchCatalog'
import { createWatchCatalogGuard, isBaseWatch } from '@/lib/validation/watch'
import type { BaseWatch, WatchCatalog, WatchDataManifest } from '@/types/watch-data'

const { getWatchDataFileMock, getWatchDataManifestMock } = vi.hoisted(() => ({
  getWatchDataFileMock: vi.fn<(brandId: string, fileName: string) => Promise<unknown>>(),
  getWatchDataManifestMock: vi.fn<(brandId: string) => Promise<WatchDataManifest>>(),
}))

vi.mock('@/api/watchDataApi', () => ({
  getWatchDataFile: getWatchDataFileMock,
  getWatchDataManifest: getWatchDataManifestMock,
}))

const manifest: WatchDataManifest = {
  schemaVersion: 5,
  catalog: 'tw.json',
  catalogs: { TW: 'tw.json', JP: 'jp.json' },
  comparison: 'comparison.json',
  currencies: ['JPY', 'TWD'],
}

const createCatalog = (market: string, brandId = 'rolex'): WatchCatalog<BaseWatch> => ({
  schemaVersion: 5,
  brandId,
  collectedAt: '2026-09-28T00:00:00.000Z',
  watchCount: 0,
  collections: [],
  priceMarket: {
    code: market,
    currencyCode: market === 'JP' ? 'JPY' : 'TWD',
    priceType: 'tax-include',
    taxRatePercent: null,
  },
  priceUpdatedAt: '2026-09-28T00:00:00.000Z',
  watchesById: {},
})

const createSubject = () =>
  useWatchCatalog({ brandId: 'rolex', isCatalog: createWatchCatalogGuard(isBaseWatch) })

describe('useWatchCatalog', () => {
  beforeEach(() => {
    getWatchDataFileMock.mockReset()
    getWatchDataManifestMock.mockReset()
    getWatchDataManifestMock.mockResolvedValue(manifest)
  })

  it('keeps the latest market when an older request resolves later', async () => {
    let resolveTaiwan: (catalog: unknown) => void = () => undefined
    const taiwanResponse = new Promise<unknown>((resolve) => {
      resolveTaiwan = resolve
    })
    getWatchDataFileMock.mockImplementation((_brandId, fileName) =>
      fileName === 'tw.json' ? taiwanResponse : Promise.resolve(createCatalog('JP')),
    )

    const subject = createSubject()
    const taiwanRequest = subject.loadCatalog('TW')
    const japanRequest = subject.loadCatalog('JP')

    await japanRequest
    resolveTaiwan(createCatalog('TW'))
    await taiwanRequest

    expect(subject.catalog.value?.priceMarket.code).toBe('JP')
    expect(subject.error.value).toBeNull()
    expect(subject.isLoading.value).toBe(false)
  })

  it('clears the previous market while a new market loads', async () => {
    let resolveJapan: (catalog: unknown) => void = () => undefined
    const japanResponse = new Promise<unknown>((resolve) => {
      resolveJapan = resolve
    })
    getWatchDataFileMock.mockImplementation((_brandId, fileName) =>
      fileName === 'tw.json' ? Promise.resolve(createCatalog('TW')) : japanResponse,
    )

    const subject = createSubject()
    await subject.loadCatalog('TW')
    const japanRequest = subject.loadCatalog('JP')

    expect(subject.catalog.value).toBeNull()
    expect(subject.isLoading.value).toBe(true)

    resolveJapan(createCatalog('JP'))
    await japanRequest
    expect(subject.catalog.value?.priceMarket.code).toBe('JP')
  })

  it.each([
    ['another market', createCatalog('JP')],
    ['another brand', createCatalog('TW', 'omega')],
  ])('rejects a catalog from %s', async (_reason, response) => {
    getWatchDataFileMock.mockResolvedValue(response)
    const subject = createSubject()

    await subject.loadCatalog('TW')

    expect(subject.catalog.value).toBeNull()
    expect(subject.error.value).toBeInstanceOf(Error)
    expect(subject.isLoading.value).toBe(false)
  })
})
