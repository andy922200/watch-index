import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { MARKET_STORAGE_KEY, MarketCode } from '@/lib/markets'
import App from '@/pages/rolex/App.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('Rolex index page', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('renders the page content in the active locale', () => {
    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    screen.getByRole('heading', { name: 'Global Rolex Watches Index' })
  })

  it('restores the selected market from local storage', async () => {
    localStorage.setItem(MARKET_STORAGE_KEY, MarketCode.Japan)

    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Market' }).textContent).toContain('Japan')
    })
  })

  it('falls back to Taiwan when local storage contains an unknown market', () => {
    localStorage.setItem(MARKET_STORAGE_KEY, 'XX')

    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    expect(screen.getByRole('combobox', { name: 'Market' }).textContent).toContain('Taiwan')
  })
})
