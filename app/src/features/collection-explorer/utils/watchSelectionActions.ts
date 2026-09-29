/**
 * CollectionExplorerPage 的比較清單選取動作。
 * 會動到 `useWatchCompareSelection` composable 的 state／action，不是能脫離頁面重用的純函式，
 * 所以留在這裡而不是搬進 `lib/`。回傳值是「這次操作該顯示的公告文字」，實際寫入
 * `announcement` ref 的動作留給呼叫端。
 */
import type { Ref } from 'vue'

interface WatchSelectionState {
  selectedIds: Ref<string[]>
  add: (id: string) => boolean
  remove: (id: string) => void
}

interface ToggleLabels {
  changed: string
  full: string
}

/**
 * 依目前是否已選取切換比較清單的加入／移除，回傳這次操作對應的公告文字。
 */
export const toggleWatchSelection = (
  id: string,
  { selectedIds, add, remove }: WatchSelectionState,
  labels: ToggleLabels,
): string => {
  if (selectedIds.value.includes(id)) {
    remove(id)
    return labels.changed
  }
  return add(id) ? labels.changed : labels.full
}

/**
 * 清空整份比較清單，回傳操作完成後該顯示的公告文字。
 */
export const clearWatchSelection = (clear: () => void, changedLabel: string): string => {
  clear()
  return changedLabel
}
