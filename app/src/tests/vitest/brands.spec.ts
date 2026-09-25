import { describe, expect, it } from 'vitest'

import { brands } from '@/lib/brands'

describe('brand market options', () => {
  it('exposes Longines Taiwan, Hong Kong, Japan, and South Korea markets', () => {
    const longines = brands.find((brand) => brand.id === 'longines')

    expect(longines?.marketOptions.map((market) => market.code)).toEqual(['TW', 'HK', 'JP', 'KR'])
  })
})
