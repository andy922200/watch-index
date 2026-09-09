import type { Watch } from '@/types/watch-data'

export const DEFAULT_MAX_COLLECTION_SUGGESTIONS = 3
export const DEFAULT_MAX_WATCH_SUGGESTIONS = 5

export interface WatchSearchCollection {
  id: string
  label: string
  watchCount: number
}

export type WatchSearchSuggestion =
  | {
      type: 'collection'
      id: string
      label: string
      watchCount: number
      searchTerm: string
    }
  | {
      type: 'watch'
      watch: Watch
      searchTerm: string
    }

export interface GetWatchSearchSuggestionsOptions {
  collections: readonly WatchSearchCollection[]
  maxCollectionSuggestions?: number
  maxWatchSuggestions?: number
  query: string
  watches: readonly Watch[]
}

/**
 * Normalizes user-entered watch search text for comparison.
 *
 * @param value - Raw text entered by the user or stored in watch data.
 * @returns Lower-cased text without whitespace or hyphens.
 */
export const normalizeWatchSearchText = (value: string): string =>
  value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s-]/g, '')

/**
 * Checks whether a normalized query is included in a searchable value.
 *
 * @param value - The watch field to compare.
 * @param normalizedQuery - A query already normalized with normalizeWatchSearchText.
 * @returns Whether the value contains the query.
 */
const includesSearchText = (value: string, normalizedQuery: string): boolean =>
  normalizeWatchSearchText(value).includes(normalizedQuery)

/**
 * Determines whether a watch matches a model, collection, name, or nickname query.
 *
 * @param watch - The watch to evaluate.
 * @param query - Raw search text.
 * @param collectionLabel - Localized label for the watch collection.
 * @returns Whether the watch should be included in the search results.
 */
export const matchesWatchSearch = (
  watch: Watch,
  query: string,
  collectionLabel: string,
): boolean => {
  const normalizedQuery = normalizeWatchSearchText(query)

  return (
    !normalizedQuery ||
    [
      watch.modelNumber,
      watch.modelReference,
      watch.modelName,
      collectionLabel,
      ...watch.localNicknames,
    ].some((value) => includesSearchText(value, normalizedQuery))
  )
}

/**
 * Builds the grouped, limited suggestion source for the Rolex watch search.
 *
 * @param options - Catalog data, query, and optional suggestion limits.
 * @returns Collection suggestions followed by matching watch suggestions.
 */
export const getWatchSearchSuggestions = ({
  collections,
  maxCollectionSuggestions = DEFAULT_MAX_COLLECTION_SUGGESTIONS,
  maxWatchSuggestions = DEFAULT_MAX_WATCH_SUGGESTIONS,
  query,
  watches,
}: GetWatchSearchSuggestionsOptions): WatchSearchSuggestion[] => {
  const normalizedQuery = normalizeWatchSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const collectionSuggestions: WatchSearchSuggestion[] = collections
    .filter(
      (collection) =>
        includesSearchText(collection.id, normalizedQuery) ||
        includesSearchText(collection.label, normalizedQuery),
    )
    .slice(0, maxCollectionSuggestions)
    .map((collection) => ({ ...collection, type: 'collection', searchTerm: collection.label }))
  const collectionLabels = new Map(
    collections.map((collection) => [collection.id, collection.label]),
  )
  const watchSuggestions: WatchSearchSuggestion[] = watches
    .filter((watch) =>
      matchesWatchSearch(watch, query, collectionLabels.get(watch.collectionId) ?? ''),
    )
    .sort((left, right) => left.modelReference.localeCompare(right.modelReference))
    .slice(0, maxWatchSuggestions)
    .map((watch) => ({ type: 'watch', watch, searchTerm: watch.modelReference }))

  return [...collectionSuggestions, ...watchSuggestions]
}
