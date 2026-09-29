import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  markImageFailed,
  markImageLoaded,
  removeCompareWatch,
} from '@/features/watch-compare/utils/watchCompareActions'

describe('removeCompareWatch', () => {
  it('removes the id from the selection and notifies the local selection and caller', () => {
    const selectedIds = ref(['rolex:a', 'omega:b'])
    const removeFromLocalSelection = vi.fn()
    const afterRemove = vi.fn()

    removeCompareWatch('rolex:a', { selectedIds, removeFromLocalSelection, afterRemove })

    expect(selectedIds.value).toEqual(['omega:b'])
    expect(removeFromLocalSelection).toHaveBeenCalledWith('rolex:a')
    expect(afterRemove).toHaveBeenCalledOnce()
  })

  it('leaves the selection untouched when the id is not present', () => {
    const selectedIds = ref(['rolex:a'])
    const removeFromLocalSelection = vi.fn()
    const afterRemove = vi.fn()

    removeCompareWatch('omega:b', { selectedIds, removeFromLocalSelection, afterRemove })

    expect(selectedIds.value).toEqual(['rolex:a'])
  })
})

describe('markImageFailed', () => {
  it('adds the id to the failed-image set', () => {
    const failedImages = ref<ReadonlySet<string>>(new Set())

    markImageFailed('rolex:a', failedImages)

    expect(failedImages.value.has('rolex:a')).toBe(true)
  })
})

describe('markImageLoaded', () => {
  it('adds the id to the loaded-image set', () => {
    const loadedImages = ref<ReadonlySet<string>>(new Set(['omega:b']))

    markImageLoaded('rolex:a', loadedImages)

    expect([...loadedImages.value]).toEqual(['omega:b', 'rolex:a'])
  })
})
