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

const createOysterPerpetual = (
  modelName: string,
  modelNumber: string,
  configurationCode: string,
): RolexWatch => ({
  watchId: `rolex:${modelNumber}-${configurationCode}`,
  collectionId: 'oyster-perpetual',
  modelNumber,
  configurationCode,
  modelReference: `${modelNumber}-${configurationCode}`,
  imageUrl: `https://example.com/${modelNumber}-${configurationCode}`,
  modelName,
  caseDescription: 'Oystersteel',
  dialDescription: 'Blue',
  localNicknames: [],
  price: 100,
  priceStatus: 'listed',
})

const oysterPerpetual31Watches = ['0001', '0002'].map((configurationCode) =>
  createOysterPerpetual('Oyster Perpetual 31', 'm277200', configurationCode),
)
const oysterPerpetual34Watches = ['0001', '0002', '0003', '0004', '0005', '0006'].map(
  (configurationCode) => createOysterPerpetual('Oyster Perpetual 34', 'm124200', configurationCode),
)
const oysterPerpetual36Watches = ['0001', '0002', '0003'].map((configurationCode) =>
  createOysterPerpetual('Oyster Perpetual 36', 'm126000', configurationCode),
)
const oysterPerpetualWatches = [
  ...oysterPerpetual31Watches,
  ...oysterPerpetual34Watches,
  ...oysterPerpetual36Watches,
]

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

  it('prefers exact model names over broader collection suggestions', () => {
    const collections = [
      {
        aliases: ['Oyster Perpetual 34'],
        id: 'oyster-perpetual',
        label: 'Oyster Perpetual',
        watchCount: 62,
      },
    ]

    expect(
      getWatchSearchSuggestions({
        watches: oysterPerpetual34Watches,
        collections,
        query: 'OYSTER  PERPETUAL-34',
      }),
    ).toEqual([
      {
        type: 'modelName',
        configurationCount: 6,
        modelName: 'Oyster Perpetual 34',
        searchTerm: 'Oyster Perpetual 34',
      },
      ...oysterPerpetual34Watches.slice(0, 5).map((watch) => ({
        type: 'watch',
        watch,
        searchTerm: watch.modelReference,
      })),
    ])
    expect(
      getWatchSearchSuggestions({
        watches: oysterPerpetual34Watches,
        collections,
        query: 'Oyster Perpetual',
      }),
    ).toContainEqual({
      type: 'collection',
      id: 'oyster-perpetual',
      label: 'Oyster Perpetual',
      watchCount: 62,
      searchTerm: 'Oyster Perpetual',
    })
  })

  it('groups partial model-name matches before individual configurations', () => {
    expect(
      getWatchSearchSuggestions({
        watches: oysterPerpetualWatches,
        collections: [
          {
            aliases: ['Oyster Perpetual 31', 'Oyster Perpetual 34', 'Oyster Perpetual 36'],
            id: 'oyster-perpetual',
            label: 'Oyster Perpetual',
            watchCount: 62,
          },
        ],
        maxWatchSuggestions: 0,
        query: 'Oyster Perpetual 3',
      }),
    ).toEqual([
      {
        type: 'modelName',
        configurationCount: 2,
        modelName: 'Oyster Perpetual 31',
        searchTerm: 'Oyster Perpetual 31',
      },
      {
        type: 'modelName',
        configurationCount: 6,
        modelName: 'Oyster Perpetual 34',
        searchTerm: 'Oyster Perpetual 34',
      },
      {
        type: 'modelName',
        configurationCount: 3,
        modelName: 'Oyster Perpetual 36',
        searchTerm: 'Oyster Perpetual 36',
      },
    ])
  })

  it('keeps collection suggestions available when model-name suggestions are disabled', () => {
    expect(
      getWatchSearchSuggestions({
        watches: oysterPerpetualWatches,
        collections: [
          {
            aliases: ['Oyster Perpetual 31', 'Oyster Perpetual 34', 'Oyster Perpetual 36'],
            id: 'oyster-perpetual',
            label: 'Oyster Perpetual',
            watchCount: 62,
          },
        ],
        maxModelNameSuggestions: 0,
        maxWatchSuggestions: 0,
        query: 'Oyster Perpetual 3',
      }),
    ).toEqual([
      {
        type: 'collection',
        id: 'oyster-perpetual',
        label: 'Oyster Perpetual',
        watchCount: 62,
        searchTerm: 'Oyster Perpetual',
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
