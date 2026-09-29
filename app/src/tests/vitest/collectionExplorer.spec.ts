import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  parseStoredSelection,
  useWatchCompareSelection,
} from '@/features/collection-explorer/composables/useWatchCompareSelection'
import {
  getBrandName,
  getCollectionLabel,
  getExplorerPriceText,
  getSingleWatchCompareHref,
} from '@/features/collection-explorer/utils/explorerDisplay'
import {
  clearWatchSelection,
  toggleWatchSelection,
} from '@/features/collection-explorer/utils/watchSelectionActions'
import { brands } from '@/lib/brands'
import {
  getAvailableMarketOptions,
  getCommonDefaultMarket,
  getCommonMarketOptions,
  getMarketBrands,
} from '@/lib/commonMarkets'
import {
  buildExplorerCollectionOptions,
  type ExplorerFilterOptions,
  type ExplorerWatch,
  filterExplorerWatches,
  getCollectionKey,
  getExplorerPriceDomain,
} from '@/lib/explorerFilters'
import { getMarketOptions, MarketCode } from '@/lib/markets'
import { buildCompareSearch, parseCompareSelection } from '@/lib/watchCompareUrl'

const makeItem = (
  brandId: string,
  reference: string,
  price: number | null,
  priceStatus: ExplorerWatch['watch']['priceStatus'],
): ExplorerWatch => ({
  brandId,
  brandName: brandId,
  collectionLabel: 'Heritage',
  currencyCode: 'TWD',
  priceType: 'tax-include',
  priceUpdatedAt: '2026-09-01T00:00:00.000Z',
  watch: {
    watchId: `${brandId}:${reference}`,
    collectionId: 'heritage',
    reference,
    imageUrl: '',
    modelName: 'Classic',
    caseDescription: '',
    dialDescription: '',
    localNicknames: ['Moon'],
    price,
    priceStatus,
  },
})

describe('common markets', () => {
  it('uses the intersection in global order with Taiwan as default', () => {
    const options = getCommonMarketOptions(brands)
    expect(options.map((option) => option.code)).toEqual([
      'TW',
      'HK',
      'JP',
      'KR',
      'DE',
      'FR',
      'CH',
      'GB',
      'US',
    ])
    expect(getCommonDefaultMarket(options)?.code).toBe(MarketCode.Taiwan)
  })

  it('does not fall back to a brand-specific market when the intersection is empty', () => {
    const first = { ...brands[0]!, marketOptions: getMarketOptions([MarketCode.Taiwan]) }
    const second = { ...brands[1]!, marketOptions: getMarketOptions([MarketCode.Japan]) }
    expect(getCommonMarketOptions([first, second])).toEqual([])
    expect(getCommonDefaultMarket([])).toBeNull()
  })
})

describe('available markets', () => {
  it('includes every market where at least one available brand has data', () => {
    expect(getAvailableMarketOptions(brands).map((option) => option.code)).toEqual([
      'TW',
      'CN',
      'HK',
      'SG',
      'JP',
      'KR',
      'AT',
      'DE',
      'FR',
      'IT',
      'ES',
      'CH',
      'GB',
      'US',
      'TH',
    ])
  })
})

describe('market brands', () => {
  it('filters brands down to the ones available in the given market', () => {
    const first = { ...brands[0]!, marketOptions: getMarketOptions([MarketCode.Taiwan]) }
    const second = { ...brands[1]!, marketOptions: getMarketOptions([MarketCode.Japan]) }
    expect(getMarketBrands([first, second], MarketCode.Taiwan)).toEqual([first])
    expect(getMarketBrands([first, second], MarketCode.Japan)).toEqual([second])
    expect(getMarketBrands([first, second], MarketCode.HongKong)).toEqual([])
  })
})

describe('explorer filters', () => {
  const items = [
    makeItem('rolex', 'B', 100, 'listed'),
    makeItem('omega', 'A', 100, 'retailer-only'),
    makeItem('longines', 'C', null, 'price-unavailable'),
  ]
  const base: ExplorerFilterOptions = {
    query: '',
    brandIds: [],
    collectionKey: '',
    minPrice: null,
    maxPrice: null,
    sort: 'price-asc',
    allowPriceComparison: true,
  }

  it('includes retailer-only, places null last, and resolves same-price ties consistently', () => {
    expect(filterExplorerWatches(items, base).map((item) => item.watch.reference)).toEqual([
      'A',
      'B',
      'C',
    ])
    expect(
      filterExplorerWatches(items, { ...base, minPrice: 100 }).map((item) => item.watch.reference),
    ).toEqual(['A', 'B'])
  })

  it('searches nicknames and filters by composite collection key', () => {
    expect(
      filterExplorerWatches(items, {
        ...base,
        query: 'moon',
        collectionKey: getCollectionKey('omega', 'heritage'),
      }).map((item) => item.brandId),
    ).toEqual(['omega'])
  })

  it('does not numerically compare prices when currencies disagree', () => {
    expect(
      filterExplorerWatches(items, { ...base, minPrice: 1000, allowPriceComparison: false }),
    ).toHaveLength(3)
  })

  it('derives a price domain from public prices only, and null without any', () => {
    expect(getExplorerPriceDomain(items)).toEqual({
      min: 100,
      max: 101,
      step: 1,
      currencyCode: 'TWD',
    })
    expect(getExplorerPriceDomain([items[2]!])).toBeNull()
  })

  it('builds collection options keyed by brand and collection, filtered by selected brands', () => {
    expect(buildExplorerCollectionOptions(items, [])).toEqual([
      [getCollectionKey('longines', 'heritage'), 'longines · Heritage'],
      [getCollectionKey('omega', 'heritage'), 'omega · Heritage'],
      [getCollectionKey('rolex', 'heritage'), 'rolex · Heritage'],
    ])
    expect(buildExplorerCollectionOptions(items, ['omega'])).toEqual([
      [getCollectionKey('omega', 'heritage'), 'omega · Heritage'],
    ])
  })
})

describe('explorer display', () => {
  const t = (key: string): string => `t:${key}`

  it('builds the brand name translation key', () => {
    expect(getBrandName('rolex', t)).toBe('t:home.brands.rolex.name')
  })

  it('falls back to the raw ID when no collection translation exists', () => {
    expect(getCollectionLabel('heritage', { t, te: () => true })).toBe(
      't:site.watchCollection.heritage',
    )
    expect(getCollectionLabel('heritage', { t, te: () => false })).toBe('heritage')
  })

  it('formats the price, or shows the fallback label without a public price', () => {
    const item = makeItem('rolex', 'A', 1000, 'listed')
    expect(
      getExplorerPriceText(item, { locale: 'zh-TW', unavailableLabel: 'unavailable' }),
    ).toContain('1,000')
    expect(
      getExplorerPriceText(makeItem('rolex', 'B', null, 'price-unavailable'), {
        locale: 'zh-TW',
        unavailableLabel: 'unavailable',
      }),
    ).toBe('unavailable')
  })

  it('links to the price-compare page only when a market is selected', () => {
    const item = makeItem('rolex', 'A', 1000, 'listed')
    expect(getSingleWatchCompareHref(item, { market: null, language: 'zh-tw' })).toBe('#')
    expect(
      getSingleWatchCompareHref(item, { market: MarketCode.Taiwan, language: 'zh-tw' }),
    ).toContain('rolex')
  })
})

describe('watch selection actions', () => {
  it('adds, rejects when full, and removes by toggling the same ID', () => {
    const selectedIds = ref<string[]>([])
    const add = vi.fn((id: string) => {
      if (selectedIds.value.length >= 1) return false
      selectedIds.value = [...selectedIds.value, id]
      return true
    })
    const remove = vi.fn((id: string) => {
      selectedIds.value = selectedIds.value.filter((value) => value !== id)
    })
    const labels = { changed: 'changed', full: 'full' }

    expect(toggleWatchSelection('a', { selectedIds, add, remove }, labels)).toBe('changed')
    expect(selectedIds.value).toEqual(['a'])
    expect(toggleWatchSelection('b', { selectedIds, add, remove }, labels)).toBe('full')
    expect(toggleWatchSelection('a', { selectedIds, add, remove }, labels)).toBe('changed')
    expect(selectedIds.value).toEqual([])
  })

  it('clears the selection and returns the given label', () => {
    const clear = vi.fn()
    expect(clearWatchSelection(clear, 'cleared')).toBe('cleared')
    expect(clear).toHaveBeenCalledOnce()
  })
})

describe('comparison selection and URL', () => {
  it('validates stored IDs, deduplicates, and caps at three', () => {
    expect(parseStoredSelection(['a', 'b', 'a', 5, 'c', 'd'])).toEqual(['a', 'b', 'c'])
    expect(parseStoredSelection({ watchIds: ['a'] })).toEqual([])
  })

  it('keeps an in-memory selection when storage is unavailable and rejects a fourth watch', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const selection = useWatchCompareSelection()
      expect(selection.add('a')).toBe(true)
      expect(selection.add('b')).toBe(true)
      expect(selection.add('c')).toBe(true)
      expect(selection.add('d')).toBe(false)
      expect(selection.selectedIds.value).toEqual(['a', 'b', 'c'])
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })

  it('persists removals from the selection', () => {
    window.localStorage.clear()
    const selection = useWatchCompareSelection()

    selection.add('a')
    selection.add('b')
    selection.remove('a')

    expect(JSON.parse(window.localStorage.getItem('watch-compare-selection-v1') ?? 'null')).toEqual(
      ['b'],
    )
    window.localStorage.clear()
  })

  it('treats the presence of watch_id as authoritative, even when empty', () => {
    expect(parseCompareSelection('?watch_id=')).toEqual({
      isUrlDriven: true,
      ids: [''],
      isTooMany: false,
    })
    expect(parseCompareSelection('?market_code=TW').isUrlDriven).toBe(false)
    expect(parseCompareSelection('?watch_id=a&watch_id=a&watch_id=b').ids).toEqual(['a', 'b'])
  })

  it('preserves order and other query parameters and rejects more than three', () => {
    const query = buildCompareSearch('?campaign=one&watch_id=old', MarketCode.Taiwan, [
      'omega:A',
      'rolex:B',
    ])
    expect(new URLSearchParams(query).getAll('watch_id')).toEqual(['omega:A', 'rolex:B'])
    expect(new URLSearchParams(query).get('campaign')).toBe('one')
    expect(parseCompareSelection('?watch_id=a&watch_id=b&watch_id=c&watch_id=d').isTooMany).toBe(
      true,
    )
  })
})
