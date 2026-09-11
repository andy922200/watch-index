/**
 * 旅客退稅政策型別。
 *
 * 這些是市場（法域）層級的制度事實，不隸屬任何品牌的價格歷史，
 * 對應 `data/schemas/traveler-refund-policy.schema.json` 與 `data/traveler-refund-policies.json`。
 */

export type TravelerRefundAvailability = 'available' | 'unavailable'

export interface TravelerRefundPolicySource {
  publisher: string
  title: string
  url: string
  accessedAt: string
}

export interface TravelerRefundEligibilitySummary {
  zhTw: string
  enUs: string
}

export interface TravelerRefundPolicy {
  marketCode: string
  effectiveFrom: string | null
  effectiveTo: string | null
  assessedAt: string
  availability: TravelerRefundAvailability
  eligibilitySummary: TravelerRefundEligibilitySummary
  merchantParticipationRequired: boolean | null
  exportValidationRequired: boolean | null
  evidencePath: string
  sources: TravelerRefundPolicySource[]
}
