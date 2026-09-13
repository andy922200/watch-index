import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MARKET_STORAGE_KEY, MarketCode } from '@/lib/markets'
import App from '@/pages/rolex/App.vue'
import { i18n, Locale } from '@/plugins/i18n'

vi.mock('@/composables/useWatchCatalog', async () => {
  const { ref } = await import('vue')

  return {
    useWatchCatalog: () => ({
      catalog: ref({
        schemaVersion: 1,
        brandId: 'rolex',
        collectedAt: '2026-09-09T00:00:00.000Z',
        watchCount: 1,
        collections: [{ id: 'submariner', watchCount: 1 }],
        priceMarket: {
          code: 'TW',
          currencyCode: 'TWD',
          priceType: 'tax-include',
          taxRatePercent: 5,
        },
        priceUpdatedAt: '2026-09-09T00:00:00.000Z',
        watchesById: {
          'rolex:m124060-0001': {
            watchId: 'rolex:m124060-0001',
            collectionId: 'submariner',
            modelNumber: 'm124060',
            configurationCode: '0001',
            modelReference: 'm124060-0001',
            imageUrl: 'https://example.com/m124060-0001',
            modelName: 'Submariner',
            caseDescription: 'Oystersteel',
            dialDescription: 'Black',
            localNicknames: [],
            price: 100,
            priceStatus: 'listed',
          },
        },
      }),
      displayCurrencies: ref([]),
      error: ref(null),
      isLoading: ref(false),
      loadCatalog: vi.fn(),
    }),
  }
})

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

  it('renders the price sorting control with the default order', async () => {
    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Sort watches' }).textContent).toContain(
        'Default order',
      )
    })
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
