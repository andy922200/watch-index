import { includesSearchText, normalizeSearchText } from '@/lib/searchText'
import type { RolexWatch } from '@/types/rolex-watch'

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
      type: 'modelName'
      configurationCount: number
      modelName: string
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
  maxModelNameSuggestions?: number
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
    [watch.reference, watch.modelName, collectionLabel, ...watch.localNicknames].some((value) =>
      includesSearchText(value, normalizedQuery),
    )
  )
}

/**
 * Groups configurations by their display model name for model-level suggestions.
 *
 * @param watches - The current market's watches.
 * @returns Each model name with its configuration count and collection memberships.
 */
const getModelNames = (watches: readonly RolexWatch[]): WatchSearchModelName[] => {
  const modelNamesByValue = new Map<string, WatchSearchModelName>()

  for (const watch of watches) {
    const existingModelName = modelNamesByValue.get(watch.modelName)

    if (existingModelName) {
      existingModelName.collectionIds.add(watch.collectionId)
      existingModelName.configurationCount += 1
      continue
    }

    modelNamesByValue.set(watch.modelName, {
      collectionIds: new Set([watch.collectionId]),
      configurationCount: 1,
      modelName: watch.modelName,
      normalizedModelName: normalizeSearchText(watch.modelName),
    })
  }

  return [...modelNamesByValue.values()]
}

/**
 * 將型號名稱依精確、前綴、包含比對分為 0、1、2，數字越小越優先。
 *
 * @example
 * getModelNameMatchRank('oysterperpetual34', 'oysterperpetual3') // 1
 *
 * @param normalizedModelName - 已正規化的顯示型號名稱。
 * @param normalizedQuery - 已正規化的使用者查詢。
 * @returns 型號名稱的比對優先順序。
 */
const getModelNameMatchRank = (normalizedModelName: string, normalizedQuery: string): number => {
  if (normalizedModelName === normalizedQuery) {
    return 0
  }

  return normalizedModelName.startsWith(normalizedQuery) ? 1 : 2
}

/**
 * Determines whether a query explicitly names a collection in either page or market-localized text.
 *
 * @param collection - Collection labels and aliases for the active market.
 * @param normalizedQuery - Normalized user query.
 * @returns Whether the query is an exact collection label.
 */
const isExactCollectionQuery = (
  { label, localizedLabel }: WatchSearchCollection,
  normalizedQuery: string,
): boolean =>
  [label, localizedLabel].some(
    (collectionLabel) =>
      collectionLabel !== undefined && normalizeSearchText(collectionLabel) === normalizedQuery,
  )

/**
 * 依查詢字串建立型號名稱、系列與單一配置的分組建議。
 *
 * 型號名稱以部分比對分組並優先顯示；同系列已有精確或顯示中的型號名稱候選時，
 * 會隱藏較寬泛的系列。完整系列名稱例外，仍會依系列 ID、名稱或別名比對後保留。
 * 個別配置最後依型號編號排序。
 *
 * @param options - Catalog、查詢字串與各類建議的上限。
 * @returns 目前查詢的型號名稱、系列與配置建議。
 */
export const getWatchSearchSuggestions = ({
  collections,
  maxCollectionSuggestions = DEFAULT_MAX_COLLECTION_SUGGESTIONS,
  maxModelNameSuggestions = DEFAULT_MAX_MODEL_NAME_SUGGESTIONS,
  maxWatchSuggestions = DEFAULT_MAX_WATCH_SUGGESTIONS,
  query,
  watches,
}: GetWatchSearchSuggestionsOptions): WatchSearchSuggestion[] => {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const collectionLabels = new Map(
    collections.map((collection) => [collection.id, collection.label]),
  )
  const modelNames = getModelNames(watches)
  const hasExactCollectionQuery = collections.some((collection) =>
    isExactCollectionQuery(collection, normalizedQuery),
  )
  const collectionsWithExactModelName = new Set(
    modelNames
      .filter(({ normalizedModelName }) => normalizedModelName === normalizedQuery)
      .flatMap(({ collectionIds }) => [...collectionIds]),
  )
  const matchingModelNames = hasExactCollectionQuery
    ? []
    : modelNames
        .filter(({ modelName }) => includesSearchText(modelName, normalizedQuery))
        .sort((left, right) => {
          const rankDifference =
            getModelNameMatchRank(left.normalizedModelName, normalizedQuery) -
            getModelNameMatchRank(right.normalizedModelName, normalizedQuery)

          return rankDifference || left.modelName.localeCompare(right.modelName)
        })
        .slice(0, maxModelNameSuggestions)
  const collectionsWithModelNameSuggestions = new Set(
    matchingModelNames.flatMap(({ collectionIds }) => [...collectionIds]),
  )
  const modelNameSuggestions: WatchSearchSuggestion[] = matchingModelNames.map(
    ({ configurationCount, modelName }) => ({
      type: 'modelName',
      configurationCount,
      modelName,
      searchTerm: modelName,
    }),
  )
  const collectionSuggestions: WatchSearchSuggestion[] = collections
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
    .map(({ id, label, localizedLabel, watchCount }) => ({
      type: 'collection',
      id,
      label: localizedLabel ?? label,
      ...(localizedLabel && localizedLabel !== label ? { description: label } : {}),
      watchCount,
      searchTerm: label,
    }))
  const watchSuggestions: WatchSearchSuggestion[] = watches
    .filter((watch) =>
      matchesWatchSearch(watch, query, collectionLabels.get(watch.collectionId) ?? ''),
    )
    .sort((left, right) => left.reference.localeCompare(right.reference))
    .slice(0, maxWatchSuggestions)
    .map((watch) => ({ type: 'watch', watch, searchTerm: watch.reference }))

  return [...modelNameSuggestions, ...collectionSuggestions, ...watchSuggestions]
}
