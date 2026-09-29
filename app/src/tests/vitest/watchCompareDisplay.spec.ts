import { describe, expect, it, vi } from 'vitest'

import {
  buildColumnDisplays,
  buildCompareRows,
  type CompareColumn,
  getBrandDisplayName,
  getCollectionLabel,
  getDetailText,
  getPriceText,
  getPriceTypeLabel,
} from '@/features/watch-compare/utils/watchCompareDisplay'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

const t = vi.fn((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key,
)
const te = vi.fn((key: string) => key === 'site.watchCollection.submariner')

const makeWatch = (overrides: Partial<BaseWatch> = {}): BaseWatch => ({
  watchId: 'rolex:submariner-124060',
  collectionId: 'submariner',
  reference: '124060',
  imageUrl: 'https://example.com/watch.jpg',
  dialColors: ['blue'],
  modelName: 'Submariner',
  caseDescription: '41mm Oystersteel',
  dialDescription: 'Black dial',
  localNicknames: ['小黑水鬼'],
  price: 100000,
  priceStatus: 'listed',
  ...overrides,
})

const makeCatalog = (
  overrides: Partial<WatchCatalog<BaseWatch>> = {},
): WatchCatalog<BaseWatch> => ({
  schemaVersion: 5,
  brandId: 'rolex',
  collectedAt: '2026-09-28T00:00:00.000Z',
  watchCount: 1,
  collections: [],
  priceMarket: { code: 'TW', currencyCode: 'TWD', priceType: 'tax-include', taxRatePercent: null },
  priceUpdatedAt: '2026-09-28T00:00:00.000Z',
  watchesById: {},
  ...overrides,
})

const makeColumn = (overrides: Partial<CompareColumn> = {}): CompareColumn => ({
  id: 'rolex:submariner-124060',
  brandId: 'rolex',
  catalog: makeCatalog(),
  watch: makeWatch(),
  ...overrides,
})

describe('getBrandDisplayName', () => {
  it('translates a known brand id', () => {
    expect(getBrandDisplayName('rolex', { t })).toBe('home.brands.rolex.name')
  })

  it('falls back to the not-provided label when the brand id is null', () => {
    expect(getBrandDisplayName(null, { t })).toBe('site.explorer.notProvided')
  })
})

describe('getCollectionLabel', () => {
  it('translates a known collection id', () => {
    expect(getCollectionLabel('submariner', { t, te })).toBe('site.watchCollection.submariner')
  })

  it('falls back to the raw id when no translation exists', () => {
    expect(getCollectionLabel('unknown-collection', { t, te })).toBe('unknown-collection')
  })
})

describe('getPriceTypeLabel', () => {
  it('reports missing-local when the column has no catalog', () => {
    expect(getPriceTypeLabel(makeColumn({ catalog: null }), { t })).toBe(
      'site.explorer.missingLocal',
    )
  })

  it('translates the catalog price type', () => {
    expect(getPriceTypeLabel(makeColumn(), { t })).toBe('site.watchList.priceLabelIncludingTax')
  })
})

describe('getPriceText', () => {
  it('reports missing-local when the watch or catalog is absent', () => {
    expect(getPriceText(makeColumn({ watch: null }), { t, intlLocale: 'zh-TW' })).toBe(
      'site.explorer.missingLocal',
    )
  })

  it('reports price-unavailable when there is no public price', () => {
    const column = makeColumn({ watch: makeWatch({ priceStatus: 'not-listed', price: null }) })
    expect(getPriceText(column, { t, intlLocale: 'zh-TW' })).toBe('site.explorer.priceUnavailable')
  })

  it('formats the amount using the catalog currency and locale', () => {
    const text = getPriceText(makeColumn(), { t, intlLocale: 'zh-TW' })
    expect(text).toContain('100,000')
  })
})

describe('getDetailText', () => {
  it('returns the requested detail field', () => {
    expect(getDetailText(makeColumn(), 'caseDescription', { t })).toBe('41mm Oystersteel')
  })

  it('falls back to the not-provided label when the field is empty', () => {
    const column = makeColumn({ watch: makeWatch({ dialDescription: '' }) })
    expect(getDetailText(column, 'dialDescription', { t })).toBe('site.explorer.notProvided')
  })
})

describe('buildColumnDisplays', () => {
  it('pre-computes brandLabel and referenceLabel once per column', () => {
    const [display] = buildColumnDisplays([makeColumn()], { t })
    expect(display?.brandLabel).toBe('home.brands.rolex.name')
    expect(display?.referenceLabel).toBe('124060')
  })

  it('falls back the reference label to the column id when the watch is missing', () => {
    const [display] = buildColumnDisplays([makeColumn({ watch: null })], { t })
    expect(display?.referenceLabel).toBe('rolex:submariner-124060')
  })
})

describe('buildCompareRows', () => {
  it('builds a text cell per row for a fully-known column', () => {
    const [display] = buildColumnDisplays([makeColumn()], { t })
    const rows = buildCompareRows([display!], { t, te, intlLocale: 'zh-TW' })

    expect(rows.map((row) => row.key)).toEqual([
      'brand',
      'collection',
      'model',
      'reference',
      'price',
      'case',
      'dial',
      'nicknames',
    ])
    expect(rows[0]?.cells[0]).toEqual({ kind: 'text', text: 'home.brands.rolex.name' })
    expect(rows[7]?.cells[0]).toEqual({ kind: 'text', text: '小黑水鬼' })
  })

  it('marks the price cell to show retailer-only and the updated date', () => {
    const [display] = buildColumnDisplays(
      [makeColumn({ watch: makeWatch({ priceStatus: 'retailer-only' }) })],
      { t },
    )
    const rows = buildCompareRows([display!], { t, te, intlLocale: 'zh-TW' })
    const priceCell = rows.find((row) => row.key === 'price')?.cells[0]

    expect(priceCell?.kind).toBe('price')
    if (priceCell?.kind === 'price') {
      expect(priceCell.showRetailerOnly).toBe(true)
      expect(priceCell.showTypeLabel).toBe(true)
      expect(priceCell.updatedLabel).not.toBeNull()
    }
  })

  it('hides the price type label and update date when the watch is missing', () => {
    const [display] = buildColumnDisplays([makeColumn({ watch: null, catalog: null })], { t })
    const rows = buildCompareRows([display!], { t, te, intlLocale: 'zh-TW' })
    const priceCell = rows.find((row) => row.key === 'price')?.cells[0]

    expect(priceCell?.kind).toBe('price')
    if (priceCell?.kind === 'price') {
      expect(priceCell.showTypeLabel).toBe(false)
      expect(priceCell.updatedLabel).toBeNull()
    }
  })
})
