import { expect, type Page, test } from '@playwright/test'

const comparisonUrl = 'en-us/watch-price-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001'

const mockExchangeRates = async (page: Page): Promise<void> => {
  await page.route('https://api.frankfurter.dev/v2/rates*', async (route) => {
    const requestUrl = new URL(route.request().url())
    const base = requestUrl.searchParams.get('base') ?? 'TWD'
    const quotes = (requestUrl.searchParams.get('quotes') ?? '').split(',').filter(Boolean)

    await route.fulfill({
      json: quotes.map((quote) => ({ base, date: '2026-09-11', quote, rate: 1 })),
    })
  })
}

test('links an index card to its matching market comparison', async ({ page }) => {
  await page.goto('en-us/')

  const comparisonLink = page.getByRole('link', { name: 'Compare markets' }).first()

  await expect(comparisonLink).toHaveAttribute(
    'href',
    /watch-price-compare\.html\?market_code=TW&watch_id=rolex%3A/,
  )
})

test('loads a single-watch cross-market comparison and changes its baseline', async ({ page }) => {
  await mockExchangeRates(page)
  await page.goto(comparisonUrl)

  await expect(page.getByRole('heading', { name: 'Submariner market comparison' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Official price comparison using Taiwan as the baseline' }),
  ).toBeVisible()
  await expect(page.getByTestId('watch-price-comparison-card')).toBeVisible()
  await expect(page.getByTestId('market-price-TW')).toContainText('Baseline market')

  await page.getByRole('combobox', { name: 'Market' }).click()
  await page.getByRole('option', { name: 'Japan' }).click()

  await expect(page).toHaveURL(/market_code=JP/)
  await expect(page.getByRole('heading', { name: /using Japan as the baseline/ })).toBeVisible()
  await expect(page.getByTestId('market-price-JP')).toContainText('Baseline market')
})

test('changes values and labels in refund estimate mode', async ({ page }) => {
  await mockExchangeRates(page)
  await page.goto(comparisonUrl)

  await page.getByText('Refund estimate', { exact: true }).click()

  await expect(page.getByRole('radio', { name: 'Refund estimate' })).toBeChecked()
  await expect(page.getByTestId('market-price-TW')).toContainText(
    'Pre-tax reference with a verified refund policy',
  )
  await expect(page.getByTestId('market-price-US')).toContainText('Tax-exclusive price')
})

test('keeps one comparison card and no horizontal overflow on mobile', async ({ page }) => {
  await mockExchangeRates(page)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(comparisonUrl)

  await expect(page.getByTestId('watch-price-comparison-card')).toHaveCount(1)
  await expect(page.getByTestId('watch-price-comparison-card').getByRole('img')).toBeVisible()
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth === window.innerWidth),
  ).toBe(true)
})
