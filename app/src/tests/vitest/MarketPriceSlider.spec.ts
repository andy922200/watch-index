import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import MarketPriceSlider from '@/pages/rolex/price-compare/components/MarketPriceSlider.vue'

describe('MarketPriceSlider', () => {
  it('renders a left-side green fill for a negative difference', () => {
    const { container } = render(MarketPriceSlider, {
      props: {
        differencePercent: -12.5,
        slider: { startPercent: 25, widthPercent: 25 },
        title: 'Japan is 12.5% below the baseline',
      },
    })

    const fill = container.querySelector('.bg-primary')

    expect(fill).not.toBeNull()
    expect(fill?.getAttribute('style')).toContain('left: 25%')
    expect(fill?.getAttribute('style')).toContain('width: 25%')
    expect(screen.getByTitle('Japan is 12.5% below the baseline').getAttribute('aria-hidden')).toBe(
      'true',
    )
  })

  it('renders a right-side red fill for a positive difference', () => {
    const { container } = render(MarketPriceSlider, {
      props: {
        differencePercent: 12.5,
        slider: { startPercent: 50, widthPercent: 25 },
        title: 'China is 12.5% above the baseline',
      },
    })

    const fill = container.querySelector('.bg-pink-600')

    expect(fill).not.toBeNull()
    expect(fill?.getAttribute('style')).toContain('left: 50%')
    expect(fill?.getAttribute('style')).toContain('width: 25%')
  })

  it('does not render a colored fill when comparison data is unavailable', () => {
    const { container } = render(MarketPriceSlider, {
      props: {
        differencePercent: null,
        slider: null,
        title: 'Japan is not comparable with the baseline',
      },
    })

    expect(container.querySelector('.bg-primary')).toBeNull()
    expect(container.querySelector('.bg-pink-600')).toBeNull()
    expect(container.querySelector('[role="slider"]')).toBeNull()
  })
})
