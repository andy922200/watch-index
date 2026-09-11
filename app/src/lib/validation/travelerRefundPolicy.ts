import { isRecord } from '@/lib/validation/shared'
import type {
  TravelerRefundPolicy,
  TravelerRefundPolicySource,
} from '@/types/traveler-refund-policy'

/**
 * 驗證未知值是否符合旅客退稅政策來源的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link TravelerRefundPolicySource} 時為 `true`，並將型別縮限為 `TravelerRefundPolicySource`。
 */
export const isTravelerRefundPolicySource = (value: unknown): value is TravelerRefundPolicySource =>
  isRecord(value) &&
  typeof value.publisher === 'string' &&
  typeof value.title === 'string' &&
  typeof value.url === 'string' &&
  typeof value.accessedAt === 'string'

/**
 * 驗證未知值是否符合單一市場的旅客退稅政策格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link TravelerRefundPolicy} 時為 `true`，並將型別縮限為 `TravelerRefundPolicy`。
 */
export const isTravelerRefundPolicy = (value: unknown): value is TravelerRefundPolicy =>
  isRecord(value) &&
  typeof value.marketCode === 'string' &&
  (typeof value.effectiveFrom === 'string' || value.effectiveFrom === null) &&
  (typeof value.effectiveTo === 'string' || value.effectiveTo === null) &&
  typeof value.assessedAt === 'string' &&
  (value.availability === 'available' || value.availability === 'unavailable') &&
  isRecord(value.eligibilitySummary) &&
  typeof value.eligibilitySummary.zhTw === 'string' &&
  typeof value.eligibilitySummary.enUs === 'string' &&
  (typeof value.merchantParticipationRequired === 'boolean' ||
    value.merchantParticipationRequired === null) &&
  (typeof value.exportValidationRequired === 'boolean' ||
    value.exportValidationRequired === null) &&
  typeof value.evidencePath === 'string' &&
  Array.isArray(value.sources) &&
  value.sources.every(isTravelerRefundPolicySource)
