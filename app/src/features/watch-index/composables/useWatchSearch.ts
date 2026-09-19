import { refDebounced } from '@vueuse/core'
import { computed, type ComputedRef, type Ref, ref } from 'vue'

import type {
  SearchComboboxGroup,
  SearchComboboxOption,
} from '@/components/search-combobox/SearchCombobox.vue'
import {
  DEFAULT_MAX_COLLECTION_SUGGESTIONS,
  DEFAULT_MAX_MODEL_NAME_SUGGESTIONS,
  DEFAULT_MAX_WATCH_SUGGESTIONS,
  getWatchSearchSuggestions,
  matchesWatchSearch,
  type WatchSearchCollection,
  type WatchSearchSuggestion,
} from '@/features/watch-index/utils/watchSearch'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

export const DEFAULT_SEARCH_DEBOUNCE_MS = 200

type CollectionLabelResolver = (collectionId: string) => string
type SearchGroupLabelResolver = (groupId: 'collections' | 'modelNames' | 'watches') => string

/**
 * Converts a localized model name into a concise collection label by removing
 * a trailing case-size number, while preserving names such as "1908".
 */
const getLocalizedCollectionLabel = (modelNames: readonly string[], fallback: string): string =>
  [...modelNames]
    .map((modelName) => modelName.replace(/\s(?:2[6-9]|3[0-9]|4[0-9])$/, ''))
    .sort((left, right) => left.length - right.length)[0] ?? fallback

interface UseWatchSearchResult<TWatch extends BaseWatch> {
  debouncedSearchQuery: Readonly<Ref<string>>
  filteredWatches: Readonly<ComputedRef<TWatch[]>>
  isSearchPending: Readonly<ComputedRef<boolean>>
  searchComboboxGroups: Readonly<ComputedRef<SearchComboboxGroup[]>>
  searchQuery: Ref<string>
  selectSearchSuggestion: (optionId: string) => void
}

export interface UseWatchSearchOptions<TWatch extends BaseWatch> {
  catalog: Readonly<Ref<WatchCatalog<TWatch> | null>>
  debounceMs?: number
  getCollectionLabel: CollectionLabelResolver
  getSearchGroupLabel: SearchGroupLabelResolver
  maxCollectionSuggestions?: number
  maxModelNameSuggestions?: number
  maxWatchSuggestions?: number
}

/**
 * Creates the Rolex page's debounced search state and adapts domain suggestions
 * to the generic SearchCombobox interface.
 *
 * @param options - Catalog, localized label resolvers, and optional search settings.
 * @returns Search state, combobox groups, filtered watches, and selection handler.
 */
export const useWatchSearch = <TWatch extends BaseWatch>({
  catalog,
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  getCollectionLabel,
  getSearchGroupLabel,
  maxCollectionSuggestions = DEFAULT_MAX_COLLECTION_SUGGESTIONS,
  maxModelNameSuggestions = DEFAULT_MAX_MODEL_NAME_SUGGESTIONS,
  maxWatchSuggestions = DEFAULT_MAX_WATCH_SUGGESTIONS,
}: UseWatchSearchOptions<TWatch>): UseWatchSearchResult<TWatch> => {
  const searchQuery = ref('')
  const debouncedSearchQuery = refDebounced(searchQuery, debounceMs)
  const isSearchPending = computed(() => searchQuery.value !== debouncedSearchQuery.value)
  const collectionOptions = computed<WatchSearchCollection[]>(() => {
    const modelNamesByCollectionId = new Map<string, string[]>()

    for (const watch of Object.values(catalog.value?.watchesById ?? {})) {
      const modelNames = modelNamesByCollectionId.get(watch.collectionId) ?? []
      modelNames.push(watch.modelName)
      modelNamesByCollectionId.set(watch.collectionId, modelNames)
    }

    return (catalog.value?.collections ?? []).map((collection) => {
      const aliases = modelNamesByCollectionId.get(collection.id) ?? []
      const label = getCollectionLabel(collection.id)

      return {
        aliases,
        id: collection.id,
        label,
        localizedLabel: getLocalizedCollectionLabel(aliases, label),
        watchCount: collection.watchCount,
      }
    })
  })
  const searchSuggestions = computed<WatchSearchSuggestion<TWatch>[]>(() =>
    getWatchSearchSuggestions({
      watches: Object.values(catalog.value?.watchesById ?? {}),
      collections: collectionOptions.value,
      maxCollectionSuggestions,
      maxModelNameSuggestions,
      maxWatchSuggestions,
      query: debouncedSearchQuery.value,
    }),
  )

  /**
   * Creates a stable generic-combobox id for a Rolex search suggestion.
   *
   * @param suggestion - A collection, model-name, or watch suggestion.
   * @returns A namespaced option id that cannot collide across suggestion types.
   */
  const getSearchOptionId = (suggestion: WatchSearchSuggestion<TWatch>): string => {
    if (suggestion.type === 'collection') {
      return `collection-${suggestion.id}`
    }

    if (suggestion.type === 'modelName') {
      return `model-name-${suggestion.modelName}`
    }

    return `watch-${suggestion.watch.watchId}`
  }

  const searchComboboxGroups = computed<SearchComboboxGroup[]>(() => {
    const collectionOptions: SearchComboboxOption[] = []
    const modelNameOptions: SearchComboboxOption[] = []
    const watchOptions: SearchComboboxOption[] = []

    for (const suggestion of searchSuggestions.value) {
      if (suggestion.type === 'collection') {
        collectionOptions.push({
          id: getSearchOptionId(suggestion),
          label: suggestion.label,
          ...(suggestion.description ? { description: suggestion.description } : {}),
          trailing: String(suggestion.watchCount),
        })
      } else if (suggestion.type === 'modelName') {
        modelNameOptions.push({
          id: getSearchOptionId(suggestion),
          label: suggestion.modelName,
          trailing: String(suggestion.configurationCount),
        })
      } else {
        watchOptions.push({
          id: getSearchOptionId(suggestion),
          label: suggestion.watch.modelName,
          description: suggestion.watch.reference,
        })
      }
    }

    return [
      ...(modelNameOptions.length > 0
        ? [
            {
              id: 'modelNames',
              label: getSearchGroupLabel('modelNames'),
              options: modelNameOptions,
            },
          ]
        : []),
      ...(collectionOptions.length > 0
        ? [
            {
              id: 'collections',
              label: getSearchGroupLabel('collections'),
              options: collectionOptions,
            },
          ]
        : []),
      ...(watchOptions.length > 0
        ? [{ id: 'watches', label: getSearchGroupLabel('watches'), options: watchOptions }]
        : []),
    ]
  })
  const searchSuggestionsByOptionId = computed(
    () =>
      new Map(
        searchSuggestions.value.map((suggestion) => [getSearchOptionId(suggestion), suggestion]),
      ),
  )
  const filteredWatches = computed<TWatch[]>(() => {
    const watches = Object.values(catalog.value?.watchesById ?? {})
    const collectionLabels = new Map(
      collectionOptions.value.map((collection) => [collection.id, collection.label]),
    )

    return watches
      .filter((watch) =>
        matchesWatchSearch(
          watch,
          debouncedSearchQuery.value,
          collectionLabels.get(watch.collectionId) ?? '',
        ),
      )
      .sort((left, right) => left.reference.localeCompare(right.reference))
  })

  /**
   * Applies the search term represented by a generic combobox option id.
   *
   * @param optionId - The id emitted by SearchCombobox after the user selects an option.
   */
  const selectSearchSuggestion = (optionId: string): void => {
    const suggestion = searchSuggestionsByOptionId.value.get(optionId)

    if (suggestion) {
      searchQuery.value = suggestion.searchTerm
    }
  }

  return {
    debouncedSearchQuery,
    filteredWatches,
    isSearchPending,
    searchComboboxGroups,
    searchQuery,
    selectSearchSuggestion,
  }
}
