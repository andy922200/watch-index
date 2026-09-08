import { expect, test } from '@playwright/test'

test('changes the Rolex index page language', async ({ page }) => {
  await page.goto('en-us/')

  await expect(page.getByRole('heading', { name: 'Your Global Rolex Watches Index' })).toBeVisible()

  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '您的全球 Rolex 腕錶索引' })).toBeVisible()
})

test('selects a watch collection from the combobox listbox', async ({ page }) => {
  await page.goto('en-us/')

  const combobox = page.getByRole('combobox', { name: 'Watch collection' })
  await expect(combobox).toBeVisible()
  await combobox.click()
  await page.getByRole('option', { name: /^Datejust \d+$/ }).click()

  await expect(combobox).toContainText('Datejust')
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

test('resets the visible watches when filtering by collection', async ({ page }) => {
  await page.goto('en-us/')

  await page.getByRole('button', { name: 'Load more watches' }).click()
  await expect(page.locator('[data-slot="card"]')).toHaveCount(24)

  await page.getByRole('combobox', { name: 'Watch collection' }).click()
  await page.getByRole('option', { name: /^Datejust \d+$/ }).click()

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
