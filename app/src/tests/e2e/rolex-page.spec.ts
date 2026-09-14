import { expect, type Page, test } from '@playwright/test'

interface PriceSortWatchInput {
  modelReference: string
  price: number | null
  priceStatus: 'listed' | 'price-unavailable'
}

const createPriceSortWatch = ({ modelReference, price, priceStatus }: PriceSortWatchInput) => ({
  watchId: `rolex:${modelReference}`,
  collectionId: 'submariner',
  modelNumber: modelReference.slice(0, 7),
  configurationCode: modelReference.slice(8),
  modelReference,
  imageUrl: `https://example.com/${modelReference}.jpg`,
  modelName: `Test ${modelReference}`,
  caseDescription: 'Test case',
  dialDescription: 'Test dial',
  localNicknames: [],
  price,
  priceStatus,
})

const priceSortWatches = [
  ...Array.from({ length: 12 }, (_, index) =>
    createPriceSortWatch({
      modelReference: `m100${String(index).padStart(3, '0')}-0001`,
      price: 100 + Math.max(index - 1, 0) * 10,
      priceStatus: 'listed',
    }),
  ),
  createPriceSortWatch({
    modelReference: 'm999999-0001',
    price: 300,
    priceStatus: 'listed',
  }),
  createPriceSortWatch({
    modelReference: 'm500000-0001',
    price: null,
    priceStatus: 'price-unavailable',
  }),
]

const usePriceSortFixture = async (page: Page): Promise<void> => {
  await page.route(/\/watch-data\/manifest\.json(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: {
        schemaVersion: 1,
        catalog: 'catalog.price-sort.json',
        catalogs: { TW: 'catalog.price-sort.json' },
        comparison: 'comparison.test.json',
        currencies: ['TWD'],
      },
    })
  })
  await page.route('**/watch-data/catalog.price-sort.json', async (route) => {
    await route.fulfill({
      json: {
        schemaVersion: 1,
        brandId: 'rolex',
        collectedAt: '2026-09-09T00:00:00.000Z',
        watchCount: priceSortWatches.length,
        collections: [{ id: 'submariner', watchCount: priceSortWatches.length }],
        priceMarket: {
          code: 'TW',
          currencyCode: 'TWD',
          priceType: 'tax-include',
          taxRatePercent: 5,
        },
        priceUpdatedAt: '2026-09-09T00:00:00.000Z',
        watchesById: Object.fromEntries(priceSortWatches.map((watch) => [watch.watchId, watch])),
      },
    })
  })
}

test('changes the Rolex index page language', async ({ page }) => {
  await page.goto('en-us/')

  await expect(page.getByRole('heading', { name: 'Global Rolex Watches Index' })).toBeVisible()
  await expect(page.getByText('Price data updated Aug 31, 2026')).toBeVisible()

  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '全球 Rolex 腕錶索引' })).toBeVisible()
  await expect(page.getByText('價格資料更新於 2026年8月31日')).toBeVisible()
  await expect(page.getByRole('combobox', { name: '排序' })).toContainText('預設排序')
})

test('sorts all matching watches by price before applying pagination', async ({ page }) => {
  await usePriceSortFixture(page)
  await page.goto('en-us/')

  const sortSelect = page.getByRole('combobox', { name: 'Sort watches' })
  const watchCards = page.locator('[data-slot="card"]')

  await expect(watchCards).toHaveCount(12)
  await page.getByRole('button', { name: 'Load more watches' }).click()
  await expect(watchCards).toHaveCount(14)

  await sortSelect.click()
  await page.getByRole('option', { name: 'Price: low to high' }).click()

  await expect(watchCards).toHaveCount(12)
  await expect(watchCards.nth(0)).toContainText('m100000-0001')
  await expect(watchCards.nth(1)).toContainText('m100001-0001')

  await page.getByRole('button', { name: 'Load more watches' }).click()
  await expect(watchCards).toHaveCount(14)
  await expect(watchCards.last()).toContainText('Price pending confirmation')

  await sortSelect.click()
  await page.getByRole('option', { name: 'Price: high to low' }).click()

  await expect(watchCards).toHaveCount(12)
  await expect(watchCards.nth(0)).toContainText('m999999-0001')
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

test('closes navigation popovers when the viewport is resized', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await marketSelect.click()
  await expect(page.getByRole('option', { name: 'Japan' })).toBeVisible()

  await page.setViewportSize({ width: 1279, height: 900 })
  await expect(page.getByRole('option', { name: 'Japan' })).not.toBeVisible()

  const displayCurrencySelect = page.getByRole('combobox', { name: 'Display currency' })
  await displayCurrencySelect.click()
  await expect(page.getByRole('option', { name: 'Japanese yen (JPY)' })).toBeVisible()

  await page.setViewportSize({ width: 1278, height: 900 })
  await expect(page.getByRole('option', { name: 'Japanese yen (JPY)' })).not.toBeVisible()
})

test('keeps the selected market when changing the page language', async ({ page }) => {
  await page.goto('en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })

  await marketSelect.click()
  await page.getByRole('option', { name: 'Japan' }).click()
  await expect(marketSelect).toContainText('Japan')
  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '全球 Rolex 腕錶索引' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '市場' })).toContainText('日本')
})

test('uses market_code over the saved market and preserves it across language pages', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('selected-market', 'TW')
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

test('offers a model-name option for a complete model name', async ({ page }) => {
  await page.goto('en-us/?market_code=TW')

  const search = page.getByRole('combobox', { name: 'Search watches' })
  await search.fill('Oyster Perpetual 34')

  await expect(page.getByRole('group', { name: 'Collections' })).not.toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Model names' }).getByRole('option', {
      name: /Oyster Perpetual 34/,
    }),
  ).toBeVisible()

  await search.press('Enter')

  await expect(page.getByRole('listbox')).not.toBeVisible()
  await expect(search).toHaveValue('Oyster Perpetual 34')
  await expect(page.getByTestId('watch-grid')).toContainText('Oyster Perpetual 34')
})

test('offers partial model-name candidates without a broader collection', async ({ page }) => {
  await page.goto('en-us/?market_code=TW')

  const search = page.getByRole('combobox', { name: 'Search watches' })
  await search.fill('Oyster Perpetual 3')

  const modelNames = page.getByRole('group', { name: 'Model names' })
  await expect(modelNames.getByRole('option', { name: /Oyster Perpetual 31/ })).toBeVisible()
  await expect(modelNames.getByRole('option', { name: /Oyster Perpetual 34/ })).toBeVisible()
  await expect(modelNames.getByRole('option', { name: /Oyster Perpetual 36/ })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Collections' })).not.toBeVisible()

  await modelNames.getByRole('option', { name: /Oyster Perpetual 36/ }).click()

  await expect(page.getByRole('listbox')).not.toBeVisible()
  await expect(search).toHaveValue('Oyster Perpetual 36')
  await expect(page.getByTestId('watch-grid')).toContainText('Oyster Perpetual 36')

  await search.focus()
  await expect(page.getByRole('group', { name: 'Collections' })).not.toBeVisible()
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
