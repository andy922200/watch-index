import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { brandDirectory } from '@/lib/brands'
import App from '@/pages/index/App.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('Root brand directory', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('renders available brands without loading a catalog', () => {
    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    expect(screen.getByRole('heading', { name: /Explore watches\s+by brand\./ })).toBeTruthy()
    expect(screen.getByText('01')).toBeTruthy()
    expect(screen.getByText('02')).toBeTruthy()
    expect(screen.getByRole('link', { name: /ROLEX/i }).getAttribute('href')).toBe('/rolex/en-us/')
    expect(screen.getByRole('link', { name: /OMEGA/i }).getAttribute('href')).toBe('/omega/en-us/')
  })

  it('uses the default-language Rolex URL for the Traditional Chinese Root', () => {
    i18n.global.locale.value = Locale.zhTw

    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    expect(screen.getByRole('link', { name: /ROLEX/i }).getAttribute('href')).toBe('/rolex/')
    expect(screen.getByRole('link', { name: /OMEGA/i }).getAttribute('href')).toBe('/omega/')
  })

  it('defines light and dark directory accent colors for every brand', () => {
    for (const brand of brandDirectory) {
      expect(brand.directory.visual.accent.light).toMatch(/^#[0-9a-f]{6}$/i)
      expect(brand.directory.visual.accent.dark).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('binds each brand accent to the corresponding directory row', () => {
    const { container } = render(App, {
      global: {
        plugins: [i18n],
      },
    })

    const rolexRow = container.querySelector<HTMLElement>('[data-brand-id="rolex"]')
    const omegaRow = container.querySelector<HTMLElement>('[data-brand-id="omega"]')

    expect(rolexRow?.style.getPropertyValue('--directory-accent-light')).toBe('#006039')
    expect(rolexRow?.style.getPropertyValue('--directory-accent-dark')).toBe('#69b982')
    expect(omegaRow?.style.getPropertyValue('--directory-accent-light')).toBe('#b42318')
    expect(omegaRow?.style.getPropertyValue('--directory-accent-dark')).toBe('#ff8f87')
  })
})
