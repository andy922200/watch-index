import { describe, expect, it } from 'vitest'

import { includesSearchText, normalizeSearchText } from '@/lib/searchText'

describe('normalizeSearchText', () => {
  it('lower-cases and drops whitespace and hyphens', () => {
    expect(normalizeSearchText(' M12406-0 ')).toBe('m124060')
    expect(normalizeSearchText('m12406 0-0001')).toBe('m1240600001')
  })

  it('folds full-width characters to their half-width form', () => {
    expect(normalizeSearchText('Ｍ１２４０６０')).toBe('m124060')
  })

  it('keeps non-latin text searchable', () => {
    expect(normalizeSearchText(' 黑水鬼 ')).toBe('黑水鬼')
  })
})

describe('includesSearchText', () => {
  it('normalizes the value before comparing it with the query', () => {
    expect(includesSearchText('M124060-0001', normalizeSearchText('m12406 0'))).toBe(true)
    expect(includesSearchText('M124060-0001', normalizeSearchText('126334'))).toBe(false)
  })
})
