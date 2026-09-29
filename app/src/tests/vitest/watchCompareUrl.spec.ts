import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  brandIdForWatch,
  buildCompareSearch,
  MAX_COMPARE_WATCHES,
  parseCompareSelection,
  syncCompareUrl,
} from '@/lib/watchCompareUrl'

describe('parseCompareSelection', () => {
  it('marks the selection as url-driven and dedupes ids when watch_id is present', () => {
    const result = parseCompareSelection('?watch_id=rolex:a&watch_id=rolex:a&watch_id=omega:b')

    expect(result.isUrlDriven).toBe(true)
    expect(result.ids).toEqual(['rolex:a', 'omega:b'])
    expect(result.isTooMany).toBe(false)
  })

  it('reports isTooMany when the selection exceeds the max', () => {
    const ids = Array.from({ length: MAX_COMPARE_WATCHES + 1 }, (_, i) => `rolex:${i}`)
    const search = ids.map((id) => `watch_id=${id}`).join('&')

    expect(parseCompareSelection(`?${search}`).isTooMany).toBe(true)
  })

  it('is not url-driven when watch_id is absent', () => {
    expect(parseCompareSelection('?market_code=TW').isUrlDriven).toBe(false)
  })
})

describe('buildCompareSearch', () => {
  it('sets the market and rewrites watch_id while keeping other params', () => {
    const search = buildCompareSearch('?locale=en-us&watch_id=old', 'TW', ['rolex:a', 'omega:b'])
    const query = new URLSearchParams(search)

    expect(query.get('locale')).toBe('en-us')
    expect(query.get('market_code')).toBe('TW')
    expect(query.getAll('watch_id')).toEqual(['rolex:a', 'omega:b'])
  })
})

describe('brandIdForWatch', () => {
  const knownBrandIds = new Set(['rolex', 'omega'])

  it('extracts the brand id when it is known', () => {
    expect(brandIdForWatch('rolex:submariner-124060', knownBrandIds)).toBe('rolex')
  })

  it('returns null when the brand id is not known', () => {
    expect(brandIdForWatch('longines:l2', knownBrandIds)).toBeNull()
  })

  it('returns null when there is no delimiter', () => {
    expect(brandIdForWatch('rolex', knownBrandIds)).toBeNull()
  })

  it('returns null when the delimiter is at the start or end', () => {
    expect(brandIdForWatch(':a', knownBrandIds)).toBeNull()
    expect(brandIdForWatch('rolex:', knownBrandIds)).toBeNull()
  })

  it('returns null when there is more than one delimiter', () => {
    expect(brandIdForWatch('rolex:a:b', knownBrandIds)).toBeNull()
  })
})

describe('syncCompareUrl', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/watch-compare?locale=en-us&watch_id=old')
    vi.spyOn(window.history, 'replaceState')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rewrites the market and watch_id params in the current url', () => {
    syncCompareUrl('TW', ['rolex:a', 'omega:b'])

    expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    const [, , url] = vi.mocked(window.history.replaceState).mock.calls[0]!
    const query = new URLSearchParams(String(url).split('?')[1])

    expect(query.get('locale')).toBe('en-us')
    expect(query.get('market_code')).toBe('TW')
    expect(query.getAll('watch_id')).toEqual(['rolex:a', 'omega:b'])
  })
})
