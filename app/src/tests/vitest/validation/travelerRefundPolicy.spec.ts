import { describe, expect, it } from 'vitest'

import {
  isTravelerRefundPolicy,
  isTravelerRefundPolicySource,
} from '@/lib/validation/travelerRefundPolicy'

const validSource = {
  publisher: 'National Tax Agency',
  title: 'Consumption Tax Exemption for Export Items',
  url: 'https://www.nta.go.jp/english/taxes/consumption_tax/index.htm',
  accessedAt: '2026-09-11T00:00:00.000Z',
}

const validPolicy = {
  marketCode: 'JP',
  effectiveFrom: null,
  effectiveTo: null,
  assessedAt: '2026-09-10T16:29:36Z',
  availability: 'available',
  eligibilitySummary: {
    zhTw: '適用於個別取得許可的免稅店。',
    enUs: 'Available through individually authorized tax-free shops.',
  },
  merchantParticipationRequired: true,
  exportValidationRequired: true,
  evidencePath: 'data/evidence/JP/2026-09-11/traveler-refund-policy.json',
  sources: [validSource],
}

describe('traveler refund policy validation', () => {
  it('accepts a policy source carrying publisher, title, url and access time', () => {
    expect(isTravelerRefundPolicySource(validSource)).toBe(true)
  })

  it('rejects a policy source missing its access time', () => {
    expect(
      isTravelerRefundPolicySource({
        publisher: validSource.publisher,
        title: validSource.title,
        url: validSource.url,
      }),
    ).toBe(false)
  })

  it('accepts a fully populated market policy', () => {
    expect(isTravelerRefundPolicy(validPolicy)).toBe(true)
  })

  it('accepts null effective dates and unknown participation requirements', () => {
    expect(
      isTravelerRefundPolicy({
        ...validPolicy,
        availability: 'unavailable',
        merchantParticipationRequired: null,
        exportValidationRequired: null,
      }),
    ).toBe(true)
  })

  it('rejects an availability value outside the allowed set', () => {
    expect(isTravelerRefundPolicy({ ...validPolicy, availability: 'unknown' })).toBe(false)
  })

  it('rejects a policy whose eligibility summary lacks a locale', () => {
    expect(
      isTravelerRefundPolicy({
        ...validPolicy,
        eligibilitySummary: { zhTw: '僅有繁體中文摘要。' },
      }),
    ).toBe(false)
  })

  it('rejects a policy carrying an invalid source entry', () => {
    expect(
      isTravelerRefundPolicy({ ...validPolicy, sources: [{ publisher: 'Only a publisher' }] }),
    ).toBe(false)
  })

  it('rejects non-object values', () => {
    expect(isTravelerRefundPolicy(null)).toBe(false)
    expect(isTravelerRefundPolicy([validPolicy])).toBe(false)
  })
})
