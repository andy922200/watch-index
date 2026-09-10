import { expect, test } from '@playwright/test'

test('changes the Rolex index page language', async ({ page }) => {
  await page.goto('en-us/')

  await expect(page.getByRole('heading', { name: 'Global Rolex Watches Index' })).toBeVisible()
  await expect(page.getByText('Price data updated Aug 31, 2026')).toBeVisible()

  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '全球 Rolex 腕錶索引' })).toBeVisible()
  await expect(page.getByText('價格資料更新於 2026年8月31日')).toBeVisible()
})

test('uses the more menu for language and theme controls below the desktop breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1023, height: 900 })
  await page.goto('en-us/')

  await expect(page.getByRole('combobox', { name: 'Language' })).not.toBeVisible()
  await page.getByRole('button', { name: 'More options' }).click()
  await expect(page.getByRole('menuitemradio', { name: '繁體中文' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Switch to dark mode' })).toBeVisible()
})

test('keeps the selected market when changing the page language', async ({ page }) => {
  await page.goto('en-us/')

  await page.getByRole('combobox', { name: 'Market' }).click()
  await page.getByRole('option', { name: 'Japan' }).click()
  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '全球 Rolex 腕錶索引' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '市場' })).toContainText('日本')
})

test('uses market_code over the saved market and preserves it across language pages', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('rolex-selected-market', 'TW')
  })
  await page.goto('en-us/?market_code=JP')

  await expect(page.getByRole('combobox', { name: 'Market' })).toContainText('Japan')

  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page).toHaveURL(/\?market_code=JP$/)
  await expect(page.getByRole('combobox', { name: '市場' })).toContainText('日本')
})

test('switches the displayed prices to the selected market', async ({ page }) => {
  await page.goto('en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await expect(marketSelect).toContainText('Taiwan')

  await marketSelect.click()
  await page.getByRole('option', { name: 'Japan' }).click()

  await expect(marketSelect).toContainText('Japan')
  await expect(page.locator('[data-slot="card"]').first()).toContainText('JPY')
})

test('switches the displayed prices to the China market', async ({ page }) => {
  await page.goto('en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await marketSelect.click()
  await page.getByRole('option', { name: 'China' }).click()

  await expect(marketSelect).toContainText('China')
  await expect(page.locator('[data-slot="card"]').first()).toContainText('CNY')
})

test('switches the displayed prices to the Korea and Italy markets', async ({ page }) => {
  await page.goto('en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await marketSelect.click()
  await page.getByRole('option', { name: 'South Korea' }).click()

  await expect(marketSelect).toContainText('South Korea')
  await expect(page.locator('[data-slot="card"]').first()).toContainText('KRW')

  await marketSelect.click()
  await page.getByRole('option', { name: 'Italy' }).click()

  await expect(marketSelect).toContainText('Italy')
  await expect(page.locator('[data-slot="card"]').first()).toContainText('EUR')
})

test('shows an approximate price in the selected display currency', async ({ page }) => {
  await page.route('https://api.frankfurter.dev/v2/rates*', async (route) => {
    await route.fulfill({
      json: [
        { base: 'TWD', date: '2026-08-31', quote: 'JPY', rate: 4.8 },
        { base: 'TWD', date: '2026-08-31', quote: 'USD', rate: 0.031 },
      ],
    })
  })
  await page.goto('en-us/')

  await page.getByRole('combobox', { name: 'Display currency' }).click()
  await page.getByRole('option', { name: 'Japanese yen (JPY)' }).click()

  await expect(page.locator('[data-slot="card"]').first()).toContainText(/Approx\. JPY/)
  await expect(page.getByText('Exchange rate updated Aug 31, 2026 (Frankfurter)')).toBeVisible()
})

test('filters watches with a partial model reference', async ({ page }) => {
  await page.goto('en-us/')

  const search = page.getByRole('combobox', { name: 'Search watches' })
  await search.fill('m12406')

  await expect(page.getByTestId('watch-grid')).toContainText('m124060')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(1)
})

test('closes search suggestions after selection and clicking outside', async ({ page }) => {
  await page.goto('en-us/')

  const search = page.getByRole('combobox', { name: 'Search watches' })
  await search.fill('m12406')
  const watchSuggestion = page.getByRole('option', { name: /m124060/ })
  await expect(watchSuggestion).toBeVisible()

  await watchSuggestion.click()
  await expect(page.getByRole('listbox')).not.toBeVisible()

  await search.fill('m12406')
  await expect(watchSuggestion).toBeVisible()
  await page.getByRole('heading', { name: 'Global Rolex Watches Index' }).click()
  await expect(page.getByRole('listbox')).not.toBeVisible()
})

test('shows twelve watches at first and loads more on demand', async ({ page }) => {
  await page.goto('en-us/')

  const watchCards = page.locator('[data-slot="card"]')
  await expect(watchCards).toHaveCount(12)

  await page.getByRole('button', { name: 'Load more watches' }).click()

  await expect(watchCards).toHaveCount(24)
})

test('keeps specification buttons aligned in cards with and without nicknames', async ({
  page,
}) => {
  await page.goto('en-us/')

  const watchCards = page.locator('[data-slot="card"]')
  await expect(watchCards).toHaveCount(12)

  const buttonBottomOffsets = await watchCards.evaluateAll((cards) =>
    cards.map((card) => {
      const button = card.querySelector('[data-slot="button"]')

      if (!button) {
        throw new Error('Watch card is missing its specification button')
      }

      return Math.round(card.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom)
    }),
  )

  expect(new Set(buttonBottomOffsets).size).toBe(1)
})

test('shows a selected watch’s complete specifications in a dialog', async ({ page }) => {
  await page.goto('en-us/')

  await page.getByRole('button', { name: 'View specifications' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Case', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Dial', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Close watch specifications' }).click()
  await expect(dialog).not.toBeVisible()
})

test('resets the visible watches when searching', async ({ page }) => {
  await page.goto('en-us/')

  await page.getByRole('button', { name: 'Load more watches' }).click()
  await expect(page.locator('[data-slot="card"]')).toHaveCount(24)

  await page.getByRole('combobox', { name: 'Search watches' }).fill('m126')

  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)
})

test('uses the requested responsive watch grid columns', async ({ page }) => {
  const grid = page.getByTestId('watch-grid')

  for (const [width, expectedColumnCount] of [
    [375, 2],
    [768, 4],
    [1024, 6],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('en-us/')
    await expect(grid).toBeVisible()

    const columnCount = await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    )

    expect(columnCount).toBe(expectedColumnCount)
  }
})
