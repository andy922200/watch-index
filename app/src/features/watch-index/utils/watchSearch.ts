import { includesSearchText, normalizeSearchText } from '@/lib/searchText'
import type { BaseWatch } from '@/types/watch-data'

export const DEFAULT_MAX_COLLECTION_SUGGESTIONS = 3
export const DEFAULT_MAX_MODEL_NAME_SUGGESTIONS = 5
export const DEFAULT_MAX_WATCH_SUGGESTIONS = 5

export interface WatchSearchCollection {
  aliases?: readonly string[]
  id: string
  label: string
  localizedLabel?: string
  watchCount: number
}

interface WatchSearchModelName {
  collectionIds: Set<string>
  configurationCount: number
  modelName: string
  normalizedModelName: string
}

export type WatchSearchSuggestion<TWatch extends BaseWatch = BaseWatch> =
  | {
      type: 'collection'
      id: string
      label: string
      description?: string
      watchCount: number
      searchTerm: string
    }
  | { type: 'modelName'; configurationCount: number; modelName: string; searchTerm: string }
  | { type: 'watch'; watch: TWatch; searchTerm: string }

export interface GetWatchSearchSuggestionsOptions<TWatch extends BaseWatch> {
  collections: readonly WatchSearchCollection[]
  maxCollectionSuggestions?: number
  maxModelNameSuggestions?: number
  maxWatchSuggestions?: number
  query: string
  watches: readonly TWatch[]
}

export const matchesWatchSearch = <TWatch extends BaseWatch>(
  watch: TWatch,
  query: string,
  collectionLabel: string,
): boolean => {
  const normalizedQuery = normalizeSearchText(query)

  return (
    !normalizedQuery ||
    [watch.reference, watch.modelName, collectionLabel, ...watch.localNicknames].some((value) =>
      includesSearchText(value, normalizedQuery),
    )
  )
}

const getModelNames = <TWatch extends BaseWatch>(
  watches: readonly TWatch[],
): WatchSearchModelName[] => {
  const modelNamesByValue = new Map<string, WatchSearchModelName>()

  for (const watch of watches) {
    const existing = modelNamesByValue.get(watch.modelName)
    if (existing) {
      existing.collectionIds.add(watch.collectionId)
      existing.configurationCount += 1
    } else {
      modelNamesByValue.set(watch.modelName, {
        collectionIds: new Set([watch.collectionId]),
        configurationCount: 1,
        modelName: watch.modelName,
        normalizedModelName: normalizeSearchText(watch.modelName),
      })
    }
  }

  return [...modelNamesByValue.values()]
}

const getModelNameMatchRank = (modelName: string, query: string): number => {
  if (modelName === query) return 0
  return modelName.startsWith(query) ? 1 : 2
}

const isExactCollectionQuery = (
  collection: WatchSearchCollection,
  normalizedQuery: string,
): boolean =>
  [collection.label, collection.localizedLabel].some(
    (label) => label !== undefined && normalizeSearchText(label) === normalizedQuery,
  )

export const getWatchSearchSuggestions = <TWatch extends BaseWatch>({
  collections,
  maxCollectionSuggestions = DEFAULT_MAX_COLLECTION_SUGGESTIONS,
  maxModelNameSuggestions = DEFAULT_MAX_MODEL_NAME_SUGGESTIONS,
  maxWatchSuggestions = DEFAULT_MAX_WATCH_SUGGESTIONS,
  query,
  watches,
}: GetWatchSearchSuggestionsOptions<TWatch>): WatchSearchSuggestion<TWatch>[] => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const collectionLabels = new Map(
    collections.map((collection) => [collection.id, collection.label]),
  )
  const modelNames = getModelNames(watches)
  const hasExactCollectionQuery = collections.some((collection) =>
    isExactCollectionQuery(collection, normalizedQuery),
  )
  const collectionsWithExactModelName = new Set(
    modelNames
      .filter((model) => model.normalizedModelName === normalizedQuery)
      .flatMap((model) => [...model.collectionIds]),
  )
  const matchingModelNames = hasExactCollectionQuery
    ? []
    : modelNames
        .filter((model) => includesSearchText(model.modelName, normalizedQuery))
        .sort(
          (left, right) =>
            getModelNameMatchRank(left.normalizedModelName, normalizedQuery) -
              getModelNameMatchRank(right.normalizedModelName, normalizedQuery) ||
            left.modelName.localeCompare(right.modelName),
        )
        .slice(0, maxModelNameSuggestions)
  const collectionsWithModelNameSuggestions = new Set(
    matchingModelNames.flatMap((model) => [...model.collectionIds]),
  )
  const modelNameSuggestions: WatchSearchSuggestion<TWatch>[] = matchingModelNames.map((model) => ({
    type: 'modelName',
    configurationCount: model.configurationCount,
    modelName: model.modelName,
    searchTerm: model.modelName,
  }))
  const collectionSuggestions: WatchSearchSuggestion<TWatch>[] = collections
    .filter(
      (collection) =>
        isExactCollectionQuery(collection, normalizedQuery) ||
        (!collectionsWithExactModelName.has(collection.id) &&
          !collectionsWithModelNameSuggestions.has(collection.id)),
    )
    .filter((collection) =>
      [collection.id, collection.label, ...(collection.aliases ?? [])].some((value) =>
        includesSearchText(value, normalizedQuery),
      ),
    )
    .slice(0, maxCollectionSuggestions)
    .map((collection) => ({
      type: 'collection',
      id: collection.id,
      label: collection.localizedLabel ?? collection.label,
      ...(collection.localizedLabel && collection.localizedLabel !== collection.label
        ? { description: collection.label }
        : {}),
      watchCount: collection.watchCount,
      searchTerm: collection.label,
    }))
  const watchSuggestions: WatchSearchSuggestion<TWatch>[] = watches
    .filter((watch) =>
      matchesWatchSearch(watch, query, collectionLabels.get(watch.collectionId) ?? ''),
    )
    .sort((left, right) => left.reference.localeCompare(right.reference))
    .slice(0, maxWatchSuggestions)
    .map((watch) => ({ type: 'watch', watch, searchTerm: watch.reference }))

  return [...modelNameSuggestions, ...collectionSuggestions, ...watchSuggestions]
}
