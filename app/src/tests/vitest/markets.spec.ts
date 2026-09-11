import { afterEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_MARKET,
  FALLBACK_MARKET_FLAG,
  getMarketFlag,
  getMarketFromQuery,
  getMarketLabelKey,
  MarketCode,
  replaceMarketQuery,
} from '@/lib/markets'

describe('market query', () => {
  it('returns null when market_code is absent', () => {
    expect(getMarketFromQuery('?collection=datejust')).toBeNull()
  })

  it('returns the query market when it is supported', () => {
    expect(getMarketFromQuery('?market_code=JP')).toBe(MarketCode.Japan)
  })

  it('supports the China market query', () => {
    expect(getMarketFromQuery('?market_code=CN')).toBe(MarketCode.China)
  })

  it.each([
    ['Italy', 'IT', MarketCode.Italy],
    ['South Korea', 'KR', MarketCode.SouthKorea],
  ])('supports the %s market query', (_marketName, marketCode, expectedMarket) => {
    expect(getMarketFromQuery(`?market_code=${marketCode}`)).toBe(expectedMarket)
  })

  it('falls back to Taiwan when market_code is unsupported', () => {
    expect(getMarketFromQuery('?market_code=XX')).toBe(DEFAULT_MARKET)
  })
})

describe('market lookup', () => {
  it('returns the flag and label key of a supported market', () => {
    expect(getMarketFlag(MarketCode.Japan)).toBe('🇯🇵')
    expect(getMarketLabelKey(MarketCode.Japan)).toBe('site.market.japan')
  })

  it('falls back for unsupported market codes', () => {
    expect(getMarketFlag('XX')).toBe(FALLBACK_MARKET_FLAG)
    expect(getMarketLabelKey('XX')).toBeNull()
  })
})

describe('replaceMarketQuery', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('replaces the market code and keeps the other query params', () => {
    window.history.replaceState(
      null,
      '',
      '/rolex/watch-price-compare.html?watch_id=rolex%3Am126334-0002&market_code=TW',
    )

    replaceMarketQuery(MarketCode.Japan)

    const query = new URLSearchParams(window.location.search)

    expect(window.location.pathname).toBe('/rolex/watch-price-compare.html')
    expect(query.get('market_code')).toBe(MarketCode.Japan)
    expect(query.get('watch_id')).toBe('rolex:m126334-0002')
  })

  it('does not add a browser history entry', () => {
    const historyLength = window.history.length

    replaceMarketQuery(MarketCode.Japan)

    expect(window.history.length).toBe(historyLength)
  })
})
