import { describe, expect, it } from 'vitest'

import { brands } from '@/lib/brands'
import { createMpaConfig } from '@/lib/mpa-build'

describe('MPA build configuration', () => {
  it('includes both site-index language pages alongside registered brand pages', () => {
    const { pages } = createMpaConfig({
      base: '/',
      brands,
      ghPagesNamespace: 'app',
      ghPagesRepoName: 'watch-index',
      isProd: false,
    })

    expect(pages.map((page) => page.name)).toEqual(
      expect.arrayContaining([
        'site-index-zh-tw',
        'site-index-en-us',
        'rolex-zh-tw',
        'rolex-en-us',
        'omega-zh-tw',
        'omega-en-us',
        'omega-price-compare-zh-tw',
      ]),
    )
  })
})
