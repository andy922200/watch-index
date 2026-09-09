import { describe, expect, it } from 'vitest'

import { DEFAULT_MARKET, getMarketFromQuery, MarketCode } from '@/lib/markets'

describe('market query', () => {
  it('returns null when market_code is absent', () => {
    expect(getMarketFromQuery('?collection=datejust')).toBeNull()
  })

  it('returns the query market when it is supported', () => {
    expect(getMarketFromQuery('?market_code=JP')).toBe(MarketCode.Japan)
  })

  it('falls back to Taiwan when market_code is unsupported', () => {
    expect(getMarketFromQuery('?market_code=XX')).toBe(DEFAULT_MARKET)
  })
})
