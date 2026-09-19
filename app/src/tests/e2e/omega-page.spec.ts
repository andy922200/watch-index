import { expect, test } from '@playwright/test'

test('browses Omega by its three supported markets and opens specifications', async ({ page }) => {
  await page.goto('/omega/en-us/')

  await expect(page.getByRole('heading', { name: 'Omega Watch Index' })).toBeVisible()
  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await marketSelect.click()
  await expect(page.getByRole('option', { name: 'Taiwan' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Japan' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'South Korea' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'China' })).toHaveCount(0)

  await page.getByRole('option', { name: 'Japan' }).click()
  await expect(marketSelect).toContainText('Japan')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)

  await page.getByRole('combobox', { name: 'Search watches' }).fill('Diver')
  await expect(page.getByTestId('watch-grid')).toContainText('Diver')
  await page.getByRole('button', { name: 'View specifications' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('marks market-limited Omega configurations as not listed in comparison', async ({ page }) => {
  await page.goto(
    '/omega/en-us/watch-price-compare.html?market_code=TW&watch_id=omega%3A220.10.28.60.54.001',
  )

  await expect(page.getByTestId('watch-price-comparison-card')).toBeVisible()
  await expect(page.getByTestId('market-price-TW')).toContainText(
    'Price is unavailable or not listed',
  )
  await expect(page.getByTestId('market-price-JP')).toContainText(
    'Price is unavailable or not listed',
  )
  await expect(page.getByTestId('market-price-KR')).not.toContainText(
    'Price is unavailable or not listed',
  )
})
