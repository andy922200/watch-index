import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatMediumDate,
  formatSignedPercent,
  getIntlLocale,
} from '@/lib/formatters'
import { PageLanguage } from '@/lib/pageRoutes'

/** `Intl` 在數值與貨幣代碼之間插入的是不斷行空白（U+00A0），比對前統一換成一般空白。 */
const NON_BREAKING_SPACE = String.fromCharCode(160)

const normalizeSpaces = (value: string): string => value.replaceAll(NON_BREAKING_SPACE, ' ')

describe('getIntlLocale', () => {
  it('maps page languages to Intl language tags', () => {
    expect(getIntlLocale(PageLanguage.zhTw)).toBe('zh-TW')
    expect(getIntlLocale(PageLanguage.enUs)).toBe('en-US')
  })

  it('falls back to en-US for unknown locales', () => {
    expect(getIntlLocale('ja-JP')).toBe('en-US')
  })
})

describe('formatCurrency', () => {
  it('shows the currency code instead of the symbol', () => {
    expect(
      normalizeSpaces(formatCurrency({ amount: 1234.5, currency: 'USD', locale: 'en-US' })),
    ).toBe('USD 1,234.50')
  })

  it('follows the currency default fraction digits when none is given', () => {
    expect(
      normalizeSpaces(formatCurrency({ amount: 1234.56, currency: 'JPY', locale: 'en-US' })),
    ).toBe('JPY 1,235')
  })

  it('keeps whole amounts whole when the minimum is zero', () => {
    expect(
      normalizeSpaces(
        formatCurrency({
          amount: 1234567,
          currency: 'TWD',
          locale: 'en-US',
          minimumFractionDigits: 0,
        }),
      ),
    ).toBe('TWD 1,234,567')
  })

  it('caps the fraction digits when given', () => {
    expect(
      normalizeSpaces(
        formatCurrency({
          amount: 1234.567,
          currency: 'JPY',
          locale: 'en-US',
          maximumFractionDigits: 2,
        }),
      ),
    ).toBe('JPY 1,234.57')
  })
})

describe('formatMediumDate', () => {
  it('formats the date in the given locale', () => {
    expect(formatMediumDate('2026-09-11T12:00:00Z', 'en-US')).toMatch(/^Sep \d{1,2}, 2026$/)
    expect(formatMediumDate('2026-09-11T12:00:00Z', 'zh-TW')).toMatch(/^2026年9月\d{1,2}日$/)
  })
})

describe('formatSignedPercent', () => {
  it('always shows the sign', () => {
    expect(formatSignedPercent(5.34, 'en-US')).toBe('+5.3%')
    expect(formatSignedPercent(-2.14, 'en-US')).toBe('-2.1%')
    expect(formatSignedPercent(0, 'en-US')).toBe('+0%')
  })

  it('accepts a custom fraction digit cap', () => {
    expect(formatSignedPercent(5.34, 'en-US', 2)).toBe('+5.34%')
  })
})
