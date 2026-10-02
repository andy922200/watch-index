import { type Ref, ref } from 'vue'

import { MAX_COMPARE_WATCHES } from '@/lib/watchCompareUrl'

export const COMPARE_SELECTION_STORAGE_KEY = 'watch-compare-selection-v1'

export interface UseWatchCompareSelectionResult {
  selectedIds: Ref<string[]>
  add: (id: string) => boolean
  remove: (id: string) => void
  clear: () => void
}

/**
 * 將任意來源（如 localStorage JSON.parse 的結果）解析為合法的比較清單 id 陣列：
 * 過濾非字串／空白字串、去除重複，並裁切到 `MAX_COMPARE_WATCHES` 上限。
 *
 * @param value - 待解析的原始值，格式不明時一律回傳空陣列。
 */
export const parseStoredSelection = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)),
  ].slice(0, MAX_COMPARE_WATCHES)
}

/** 從 localStorage 讀取並解析既有的比較清單；讀取或解析失敗時回傳空陣列。 */
const readSelection = (): string[] => {
  try {
    return parseStoredSelection(
      JSON.parse(window.localStorage.getItem(COMPARE_SELECTION_STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return []
  }
}

/**
 * 管理跨頁面共用的「比較清單」選取狀態，並將選取結果持久化到 localStorage
 * （鍵值為 `COMPARE_SELECTION_STORAGE_KEY`），初始化時自動還原上次的選取。
 *
 * @returns 目前選取的 id 清單，以及 `add`／`remove`／`clear` 操作函式。
 */
export const useWatchCompareSelection = (): UseWatchCompareSelectionResult => {
  const selectedIds = ref<string[]>(readSelection())
  const persist = (): void => {
    try {
      window.localStorage.setItem(COMPARE_SELECTION_STORAGE_KEY, JSON.stringify(selectedIds.value))
    } catch {
      // Storage can be disabled; in-memory selection still works for this page.
    }
  }
  const add = (id: string): boolean => {
    if (!id || selectedIds.value.includes(id)) return true
    if (selectedIds.value.length >= MAX_COMPARE_WATCHES) return false
    selectedIds.value = [...selectedIds.value, id]
    persist()
    return true
  }
  const remove = (id: string): void => {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
    persist()
  }
  const clear = (): void => {
    selectedIds.value = []
    persist()
  }

  return { selectedIds, add, remove, clear }
}
