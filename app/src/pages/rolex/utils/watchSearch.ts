import { includesSearchText, normalizeSearchText } from '@/lib/searchText'
import type { RolexWatch } from '@/types/rolex-watch'

export const DEFAULT_MAX_COLLECTION_SUGGESTIONS = 3
export const DEFAULT_MAX_WATCH_SUGGESTIONS = 5

export interface WatchSearchCollection {
  aliases?: readonly string[]
  id: string
  label: string
  localizedLabel?: string
  watchCount: number
}

export type WatchSearchSuggestion =
  | {
      type: 'collection'
      id: string
      label: string
      description?: string
      watchCount: number
      searchTerm: string
    }
  | {
      type: 'watch'
      watch: RolexWatch
      searchTerm: string
    }

export interface GetWatchSearchSuggestionsOptions {
  collections: readonly WatchSearchCollection[]
  maxCollectionSuggestions?: number
  maxWatchSuggestions?: number
  query: string
  watches: readonly RolexWatch[]
}

/**
 * Determines whether a watch matches a model, collection, name, or nickname query.
 *
 * @param watch - The watch to evaluate.
 * @param query - Raw search text.
 * @param collectionLabel - Localized label for the watch collection.
 * @returns Whether the watch should be included in the search results.
 */
export const matchesWatchSearch = (
  watch: RolexWatch,
  query: string,
  collectionLabel: string,
): boolean => {
  const normalizedQuery = normalizeSearchText(query)

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
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const collectionSuggestions: WatchSearchSuggestion[] = collections
    .filter((collection) =>
      [collection.id, collection.label, ...(collection.aliases ?? [])].some((value) =>
        includesSearchText(value, normalizedQuery),
      ),
    )
    .slice(0, maxCollectionSuggestions)
    .map(({ id, label, localizedLabel, watchCount }) => ({
      type: 'collection',
      id,
      label: localizedLabel ?? label,
      ...(localizedLabel && localizedLabel !== label ? { description: label } : {}),
      watchCount,
      searchTerm: label,
    }))
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
