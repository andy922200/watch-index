import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useCrossBrandCatalogs } from '@/features/collection-explorer/composables/useCrossBrandCatalogs'
import { brands } from '@/lib/brands'
import type { MarketCode } from '@/lib/markets'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

const { useWatchCatalogMock } = vi.hoisted(() => ({
  useWatchCatalogMock: vi.fn<(options: { brandId: string }) => unknown>(),
}))

vi.mock('@/composables/useWatchCatalog', () => ({ useWatchCatalog: useWatchCatalogMock }))

const makeCatalog = (
  brandId: string,
  market: MarketCode,
  currencyCode: string,
): WatchCatalog<BaseWatch> => ({
  schemaVersion: 5,
  brandId,
  collectedAt: '2026-09-28T00:00:00.000Z',
  watchCount: 0,
  collections: [],
  priceMarket: { code: market, currencyCode, priceType: 'tax-include', taxRatePercent: null },
  priceUpdatedAt: '2026-09-28T00:00:00.000Z',
  watchesById: {},
})

describe('useCrossBrandCatalogs', () => {
  beforeEach(() => {
    useWatchCatalogMock.mockReset()
  })

  it('reports the failed brand instead of presenting partial results as complete', async () => {
    useWatchCatalogMock.mockImplementation(({ brandId }) => {
      const catalog = ref<WatchCatalog<BaseWatch> | null>(null)
      const error = ref<unknown>(null)
      const isLoading = ref(false)
      return {
        catalog,
        error,
        isLoading,
        displayCurrencies: ref<string[]>([]),
        loadCatalog: async (market: MarketCode) => {
          if (brandId === 'omega') error.value = new Error('offline')
          else catalog.value = makeCatalog(brandId, market, 'TWD')
        },
      }
    })

    const subject = useCrossBrandCatalogs(brands)
    await subject.loadCatalogs('TW')

    expect(subject.failedBrandIds.value).toEqual(['omega'])
    expect(subject.catalogs.value).toHaveLength(2)
    expect(subject.isReady.value).toBe(false)
  })

  it('rejects a mixed-currency all-brand result', async () => {
    useWatchCatalogMock.mockImplementation(({ brandId }) => {
      const catalog = ref<WatchCatalog<BaseWatch> | null>(null)
      return {
        catalog,
        error: ref<unknown>(null),
        isLoading: ref(false),
        displayCurrencies: ref<string[]>([]),
        loadCatalog: async (market: MarketCode) => {
          catalog.value = makeCatalog(brandId, market, brandId === 'omega' ? 'USD' : 'TWD')
        },
      }
    })

    const subject = useCrossBrandCatalogs(brands)
    await subject.loadCatalogs('TW')

    expect(subject.currencyMismatch.value).toBe(true)
    expect(subject.isReady.value).toBe(false)
  })

  it('does not silently skip an available brand without a catalog guard', () => {
    const unconfiguredBrand = { ...brands[0]!, id: 'new-brand' }
    const subject = useCrossBrandCatalogs([unconfiguredBrand])

    expect(subject.missingGuards).toEqual(['new-brand'])
    expect(subject.isReady.value).toBe(false)
  })
})
