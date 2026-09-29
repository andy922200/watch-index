/**
 * WatchComparePage 的比較清單互動動作。
 *
 * 會動到頁面自己的 `selectedIds`／`failedImages`／`loadedImages` ref，不是能脫離頁面重用的
 * 純函式，所以留在這裡而不是搬進 `lib/`。
 */
import type { Ref } from 'vue'

interface RemoveCompareWatchState {
  selectedIds: Ref<string[]>
  removeFromLocalSelection: (id: string) => void
  afterRemove: () => void
}

/** 從比較清單移除指定錶款，同步移除本機選取紀錄，並讓呼叫端處理移除後的網址同步。 */
export const removeCompareWatch = (
  id: string,
  { selectedIds, removeFromLocalSelection, afterRemove }: RemoveCompareWatchState,
): void => {
  selectedIds.value = selectedIds.value.filter((value) => value !== id)
  removeFromLocalSelection(id)
  afterRemove()
}

/** 標記指定錶款的圖片載入失敗。 */
export const markImageFailed = (id: string, failedImages: Ref<ReadonlySet<string>>): void => {
  failedImages.value = new Set([...failedImages.value, id])
}

/** 標記指定錶款的圖片已載入完成。 */
export const markImageLoaded = (id: string, loadedImages: Ref<ReadonlySet<string>>): void => {
  loadedImages.value = new Set([...loadedImages.value, id])
}
