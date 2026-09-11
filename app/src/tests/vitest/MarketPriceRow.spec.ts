import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import MarketPriceRow, {
  type MarketPriceRowView,
} from '@/pages/rolex/price-compare/components/MarketPriceRow.vue'
import { i18n, Locale } from '@/plugins/i18n'

const baseRow: MarketPriceRowView = {
  code: 'JP',
  convertedPriceText: 'Converted: TWD 250,000',
  detailsTitle: 'Japan is 12.5% below the baseline',
  differencePercent: -12.5,
  differenceText: 'Difference: -12.5%',
  exchangeRateText: 'Exchange rate updated on Sep 10, 2026',
  flag: '🇯🇵',
  isBaseline: false,
  isDifferenceEmphasized: true,
  marketName: 'Japan',
  priceLabelText: 'Retail price (tax included)',
  priceText: 'JPY 1,234,567',
  priceUpdatedAtText: 'Official price updated on Sep 1, 2026',
  slider: { startPercent: 25, widthPercent: 25 },
  travelerRefundPolicy: null,
}

const renderRow = (row: Partial<MarketPriceRowView> = {}) =>
  render(MarketPriceRow, {
    props: { row: { ...baseRow, ...row } },
    global: { plugins: [i18n] },
  })

describe('MarketPriceRow', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('renders the prepared texts without formatting them again', () => {
    renderRow()

    expect(screen.getByText('JPY 1,234,567')).toBeTruthy()
    expect(screen.getByText('Converted: TWD 250,000')).toBeTruthy()
    expect(screen.getByText('Difference: -12.5%')).toBeTruthy()
    expect(screen.getByText('Exchange rate updated on Sep 10, 2026')).toBeTruthy()
  })

  it('emphasizes a comparable difference and hides the baseline badge', () => {
    renderRow()

    expect(screen.queryByText('Baseline market')).toBeNull()
    expect(screen.getByText('Difference: -12.5%').className).toContain('font-medium')
  })

  it('shows the baseline badge and drops the emphasis for the baseline market', () => {
    renderRow({
      differenceText: 'Baseline market',
      isBaseline: true,
      isDifferenceEmphasized: false,
    })

    // 基準市場的名稱旁有標籤，右側的差異欄位也顯示同一句話。
    const [badge, difference] = screen.getAllByText('Baseline market')

    expect(badge.tagName).toBe('SPAN')
    expect(difference.className).toContain('text-muted-foreground')
  })

  it('only renders the refund policy popover when the market has a policy', () => {
    renderRow()

    expect(screen.queryByRole('button')).toBeNull()
  })
})
