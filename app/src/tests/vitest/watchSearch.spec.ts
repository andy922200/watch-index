import { describe, expect, it } from 'vitest'

import { getWatchSearchSuggestions, matchesWatchSearch } from '@/pages/rolex/utils/watchSearch'
import type { RolexWatch } from '@/types/rolex-watch'

const submariner: RolexWatch = {
  watchId: 'rolex:m124060-0001',
  collectionId: 'submariner',
  modelNumber: 'm124060',
  configurationCode: '0001',
  modelReference: 'm124060-0001',
  imageUrl: 'https://example.com/m124060-0001',
  modelName: 'Submariner',
  caseDescription: 'Oystersteel',
  dialDescription: 'Black',
  localNicknames: ['黑水鬼'],
  price: 100,
  priceStatus: 'listed',
}

describe('watch search', () => {
  it('normalizes case, whitespace, and hyphens in model queries', () => {
    expect(matchesWatchSearch(submariner, 'M12406', 'Submariner')).toBe(true)
    expect(matchesWatchSearch(submariner, 'm12406 0-0001', 'Submariner')).toBe(true)
  })

  it('matches collection names and local nicknames', () => {
    expect(matchesWatchSearch(submariner, 'submariner', 'Submariner')).toBe(true)
    expect(matchesWatchSearch(submariner, '黑水鬼', 'Submariner')).toBe(true)
    expect(matchesWatchSearch(submariner, 'datejust', 'Submariner')).toBe(false)
  })

  it('groups matching collection and watch suggestions', () => {
    expect(
      getWatchSearchSuggestions({
        watches: [submariner],
        collections: [{ id: 'submariner', label: 'Submariner', watchCount: 1 }],
        query: 'submariner',
      }),
    ).toEqual([
      {
        type: 'collection',
        id: 'submariner',
        label: 'Submariner',
        watchCount: 1,
        searchTerm: 'Submariner',
      },
      { type: 'watch', watch: submariner, searchTerm: 'm124060-0001' },
    ])
  })

  it('matches collection aliases from a market-localized catalog', () => {
    expect(
      getWatchSearchSuggestions({
        watches: [submariner],
        collections: [
          {
            aliases: ['デイトジャスト 41'],
            id: 'datejust',
            label: 'Datejust',
            localizedLabel: 'デイトジャスト',
            watchCount: 1,
          },
        ],
        query: 'デイトジャスト',
      }),
    ).toEqual([
      {
        type: 'collection',
        id: 'datejust',
        label: 'デイトジャスト',
        description: 'Datejust',
        watchCount: 1,
        searchTerm: 'Datejust',
      },
    ])
  })

  it('honors caller-provided suggestion limits', () => {
    expect(
      getWatchSearchSuggestions({
        watches: [submariner],
        collections: [{ id: 'submariner', label: 'Submariner', watchCount: 1 }],
        maxCollectionSuggestions: 0,
        maxWatchSuggestions: 0,
        query: 'submariner',
      }),
    ).toEqual([])
  })
})
