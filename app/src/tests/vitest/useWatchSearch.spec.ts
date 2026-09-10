import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useWatchSearch } from '@/pages/rolex/composables/useWatchSearch'
import type { WatchCatalog } from '@/types/watch-data'

const catalog: WatchCatalog = {
  schemaVersion: 1,
  brandId: 'rolex',
  collectedAt: '2026-09-09T00:00:00.000Z',
  watchCount: 2,
  collections: [
    { id: 'submariner', watchCount: 1 },
    { id: 'datejust', watchCount: 1 },
  ],
  priceMarket: {
    code: 'TW',
    currencyCode: 'TWD',
    priceType: 'tax-include',
    taxRatePercent: 5,
  },
  priceUpdatedAt: '2026-09-09T00:00:00.000Z',
  watchesById: {
    'rolex:m124060-0001': {
      watchId: 'rolex:m124060-0001',
      collectionId: 'submariner',
      modelNumber: 'm124060',
      configurationCode: '0001',
      modelReference: 'm124060-0001',
      imageUrl: 'https://example.com/m124060-0001',
      modelName: 'Submariner',
      caseDescription: 'Oystersteel',
      dialDescription: 'Black',
      localNicknames: [],
      price: 100,
      priceStatus: 'listed',
    },
    'rolex:m126234-0001': {
      watchId: 'rolex:m126234-0001',
      collectionId: 'datejust',
      modelNumber: 'm126234',
      configurationCode: '0001',
      modelReference: 'm126234-0001',
      imageUrl: 'https://example.com/m126234-0001',
      modelName: 'Datejust',
      caseDescription: 'Oystersteel',
      dialDescription: 'Blue',
      localNicknames: [],
      price: 200,
      priceStatus: 'listed',
    },
  },
}

describe('useWatchSearch', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces model-reference filtering and provides generic combobox groups', async () => {
    vi.useFakeTimers()
    const { filteredWatches, isSearchPending, searchComboboxGroups, searchQuery } = useWatchSearch({
      catalog: ref(catalog),
      debounceMs: 50,
      getCollectionLabel: (collectionId) =>
        collectionId === 'submariner' ? 'Submariner' : 'Datejust',
      getSearchGroupLabel: (groupId) => (groupId === 'collections' ? 'Collections' : 'Watches'),
    })

    searchQuery.value = 'm12406'
    expect(isSearchPending.value).toBe(true)
    expect(filteredWatches.value).toHaveLength(2)

    await nextTick()
    vi.advanceTimersByTime(49)
    expect(isSearchPending.value).toBe(true)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(isSearchPending.value).toBe(false)
    expect(filteredWatches.value.map((watch) => watch.modelReference)).toEqual(['m124060-0001'])
    expect(searchComboboxGroups.value).toEqual([
      {
        id: 'watches',
        label: 'Watches',
        options: [
          {
            id: 'watch-rolex:m124060-0001',
            label: 'Submariner',
            description: 'm124060-0001',
          },
        ],
      },
    ])
  })

  it('applies the search term associated with a selected generic option id', async () => {
    vi.useFakeTimers()
    const { searchQuery, selectSearchSuggestion } = useWatchSearch({
      catalog: ref(catalog),
      getCollectionLabel: (collectionId) =>
        collectionId === 'submariner' ? 'Submariner' : 'Datejust',
      getSearchGroupLabel: (groupId) => (groupId === 'collections' ? 'Collections' : 'Watches'),
    })

    searchQuery.value = 'submariner'
    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    selectSearchSuggestion('collection-submariner')
    expect(searchQuery.value).toBe('Submariner')
  })

  it('uses the model reference after selecting a watch identified by watchId', async () => {
    vi.useFakeTimers()
    const { searchQuery, selectSearchSuggestion } = useWatchSearch({
      catalog: ref(catalog),
      getCollectionLabel: (collectionId) =>
        collectionId === 'submariner' ? 'Submariner' : 'Datejust',
      getSearchGroupLabel: (groupId) => (groupId === 'collections' ? 'Collections' : 'Watches'),
    })

    searchQuery.value = 'm124060'
    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    selectSearchSuggestion('watch-rolex:m124060-0001')
    expect(searchQuery.value).toBe('m124060-0001')
  })

  it('uses localized model names as collection search aliases', async () => {
    vi.useFakeTimers()
    const japanCatalog: WatchCatalog = {
      ...catalog,
      watchesById: {
        ...catalog.watchesById,
        'rolex:m126234-0001': {
          ...catalog.watchesById['rolex:m126234-0001'],
          modelName: 'デイトジャスト 36',
        },
      },
    }
    const { searchComboboxGroups, searchQuery } = useWatchSearch({
      catalog: ref(japanCatalog),
      getCollectionLabel: (collectionId) =>
        collectionId === 'submariner' ? 'Submariner' : 'Datejust',
      getSearchGroupLabel: (groupId) => (groupId === 'collections' ? 'Collections' : 'Watches'),
    })

    searchQuery.value = 'デイトジャスト'
    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(searchComboboxGroups.value[0]?.id).toBe('collections')
    expect(searchComboboxGroups.value[0]?.options[0]).toEqual({
      id: 'collection-datejust',
      label: 'デイトジャスト',
      description: 'Datejust',
      trailing: '1',
    })
  })
})
