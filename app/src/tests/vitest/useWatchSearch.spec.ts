import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useWatchSearch } from '@/pages/rolex/composables/useWatchSearch'
import type { RolexWatch } from '@/types/rolex-watch'
import type { WatchCatalog } from '@/types/watch-data'

const createOysterPerpetual34Catalog = (): WatchCatalog<RolexWatch> => {
  const watchesById: Record<string, RolexWatch> = {}

  for (let index = 1; index <= 15; index += 1) {
    const configurationCode = String(index).padStart(4, '0')
    const modelReference = `m124200-${configurationCode}`

    watchesById[`rolex:${modelReference}`] = {
      watchId: `rolex:${modelReference}`,
      collectionId: 'oyster-perpetual',
      modelNumber: 'm124200',
      configurationCode,
      modelReference,
      imageUrl: `https://example.com/${modelReference}`,
      modelName: 'Oyster Perpetual 34',
      caseDescription: 'Oystersteel',
      dialDescription: 'Blue',
      localNicknames: [],
      price: 100,
      priceStatus: 'listed',
    }
  }

  return {
    schemaVersion: 1,
    brandId: 'rolex',
    collectedAt: '2026-09-09T00:00:00.000Z',
    watchCount: 15,
    collections: [{ id: 'oyster-perpetual', watchCount: 62 }],
    priceMarket: {
      code: 'TW',
      currencyCode: 'TWD',
      priceType: 'tax-include',
      taxRatePercent: 5,
    },
    priceUpdatedAt: '2026-09-09T00:00:00.000Z',
    watchesById,
  }
}

const createOysterPerpetualWatch = (
  modelName: string,
  modelNumber: string,
  configurationCode: string,
): RolexWatch => {
  const modelReference = `${modelNumber}-${configurationCode}`

  return {
    watchId: `rolex:${modelReference}`,
    collectionId: 'oyster-perpetual',
    modelNumber,
    configurationCode,
    modelReference,
    imageUrl: `https://example.com/${modelReference}`,
    modelName,
    caseDescription: 'Oystersteel',
    dialDescription: 'Blue',
    localNicknames: [],
    price: 100,
    priceStatus: 'listed',
  }
}

const createOysterPerpetualModelNameCatalog = (): WatchCatalog<RolexWatch> => {
  const baseCatalog = createOysterPerpetual34Catalog()
  const oysterPerpetual31First = createOysterPerpetualWatch(
    'Oyster Perpetual 31',
    'm277200',
    '0001',
  )
  const oysterPerpetual31Second = createOysterPerpetualWatch(
    'Oyster Perpetual 31',
    'm277200',
    '0002',
  )
  const oysterPerpetual36First = createOysterPerpetualWatch(
    'Oyster Perpetual 36',
    'm126000',
    '0001',
  )
  const oysterPerpetual36Second = createOysterPerpetualWatch(
    'Oyster Perpetual 36',
    'm126000',
    '0002',
  )
  const oysterPerpetual36Third = createOysterPerpetualWatch(
    'Oyster Perpetual 36',
    'm126000',
    '0003',
  )

  return {
    ...baseCatalog,
    watchCount: 20,
    watchesById: {
      ...baseCatalog.watchesById,
      [oysterPerpetual31First.watchId]: oysterPerpetual31First,
      [oysterPerpetual31Second.watchId]: oysterPerpetual31Second,
      [oysterPerpetual36First.watchId]: oysterPerpetual36First,
      [oysterPerpetual36Second.watchId]: oysterPerpetual36Second,
      [oysterPerpetual36Third.watchId]: oysterPerpetual36Third,
    },
  }
}

const catalog: WatchCatalog<RolexWatch> = {
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

  it('offers exact model-name configurations without a broader collection option', async () => {
    vi.useFakeTimers()
    const {
      filteredWatches,
      isSearchPending,
      searchComboboxGroups,
      searchQuery,
      selectSearchSuggestion,
    } = useWatchSearch({
      catalog: ref(createOysterPerpetual34Catalog()),
      getCollectionLabel: () => 'Oyster Perpetual',
      getSearchGroupLabel: (groupId) => {
        if (groupId === 'collections') {
          return 'Collections'
        }

        return groupId === 'modelNames' ? 'Model names' : 'Watches'
      },
    })

    searchQuery.value = 'Oyster Perpetual 34'
    expect(isSearchPending.value).toBe(true)
    expect(searchComboboxGroups.value).toEqual([])

    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(isSearchPending.value).toBe(false)
    expect(filteredWatches.value).toHaveLength(15)
    expect(searchComboboxGroups.value).toEqual([
      {
        id: 'modelNames',
        label: 'Model names',
        options: [
          {
            id: 'model-name-Oyster Perpetual 34',
            label: 'Oyster Perpetual 34',
            trailing: '15',
          },
        ],
      },
      {
        id: 'watches',
        label: 'Watches',
        options: [
          {
            id: 'watch-rolex:m124200-0001',
            label: 'Oyster Perpetual 34',
            description: 'm124200-0001',
          },
          {
            id: 'watch-rolex:m124200-0002',
            label: 'Oyster Perpetual 34',
            description: 'm124200-0002',
          },
          {
            id: 'watch-rolex:m124200-0003',
            label: 'Oyster Perpetual 34',
            description: 'm124200-0003',
          },
          {
            id: 'watch-rolex:m124200-0004',
            label: 'Oyster Perpetual 34',
            description: 'm124200-0004',
          },
          {
            id: 'watch-rolex:m124200-0005',
            label: 'Oyster Perpetual 34',
            description: 'm124200-0005',
          },
        ],
      },
    ])

    selectSearchSuggestion('model-name-Oyster Perpetual 34')
    expect(searchQuery.value).toBe('Oyster Perpetual 34')
    expect(searchComboboxGroups.value.some((group) => group.id === 'collections')).toBe(false)
  })

  it('offers partial model-name candidates and filters their configurations after selection', async () => {
    vi.useFakeTimers()
    const { filteredWatches, searchComboboxGroups, searchQuery, selectSearchSuggestion } =
      useWatchSearch({
        catalog: ref(createOysterPerpetualModelNameCatalog()),
        getCollectionLabel: () => 'Oyster Perpetual',
        getSearchGroupLabel: (groupId) => {
          if (groupId === 'collections') {
            return 'Collections'
          }

          return groupId === 'modelNames' ? 'Model names' : 'Watches'
        },
      })

    searchQuery.value = 'Oyster Perpetual 3'
    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(searchComboboxGroups.value[0]).toEqual({
      id: 'modelNames',
      label: 'Model names',
      options: [
        {
          id: 'model-name-Oyster Perpetual 31',
          label: 'Oyster Perpetual 31',
          trailing: '2',
        },
        {
          id: 'model-name-Oyster Perpetual 34',
          label: 'Oyster Perpetual 34',
          trailing: '15',
        },
        {
          id: 'model-name-Oyster Perpetual 36',
          label: 'Oyster Perpetual 36',
          trailing: '3',
        },
      ],
    })
    expect(searchComboboxGroups.value.some((group) => group.id === 'collections')).toBe(false)

    selectSearchSuggestion('model-name-Oyster Perpetual 36')
    expect(searchQuery.value).toBe('Oyster Perpetual 36')

    await nextTick()
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(filteredWatches.value).toHaveLength(3)
    expect(filteredWatches.value.map((watch) => watch.modelName)).toEqual([
      'Oyster Perpetual 36',
      'Oyster Perpetual 36',
      'Oyster Perpetual 36',
    ])
    expect(searchComboboxGroups.value.some((group) => group.id === 'collections')).toBe(false)
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
    const japanCatalog: WatchCatalog<RolexWatch> = {
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
