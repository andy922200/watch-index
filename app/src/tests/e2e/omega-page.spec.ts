import { expect, test } from '@playwright/test'

test('browses Omega by its seven supported markets and opens specifications', async ({ page }) => {
  await page.goto('/omega/en-us/')

  await expect(page.getByRole('heading', { name: 'Omega Watch Index' })).toBeVisible()
  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await marketSelect.click()
  await expect(page.getByRole('option', { name: 'Taiwan' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Japan' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'South Korea' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Hong Kong' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Switzerland' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Germany' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'United States' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'China' })).toHaveCount(0)

  await page.getByRole('option', { name: 'Hong Kong' }).click()
  await expect(marketSelect).toContainText('Hong Kong')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)

  await marketSelect.click()
  await page.getByRole('option', { name: 'Switzerland' }).click()
  await expect(marketSelect).toContainText('Switzerland')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)

  await marketSelect.click()
  await page.getByRole('option', { name: 'Germany' }).click()
  await expect(marketSelect).toContainText('Germany')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)

  await marketSelect.click()
  await page.getByRole('option', { name: 'United States' }).click()
  await expect(marketSelect).toContainText('United States')
  await expect(page.locator('[data-slot="card"]')).toHaveCount(12)

  await page.getByRole('combobox', { name: 'Search watches' }).fill('Diver')
  await expect(page.getByTestId('watch-grid')).toContainText('Diver')
  await page.getByRole('button', { name: 'View specifications' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('uses Hong Kong and Switzerland as Omega comparison baselines', async ({ page }) => {
  await page.goto(
    '/omega/en-us/watch-price-compare.html?market_code=HK&watch_id=omega%3A131.10.25.60.02.002',
  )

  await expect(page.getByTestId('watch-price-comparison-card')).toBeVisible()
  await expect(page.getByTestId('market-price-HK')).toContainText('Baseline market')
  await expect(page.getByTestId('market-price-CH')).toBeVisible()
  await expect(page.getByTestId('market-price-DE')).toBeVisible()
  await expect(page.getByTestId('market-price-US')).toBeVisible()

  await page.getByRole('combobox', { name: 'Market' }).click()
  await page.getByRole('option', { name: 'Switzerland' }).click()

  await expect(page).toHaveURL(/market_code=CH/)
  await expect(page.getByTestId('market-price-CH')).toContainText('Baseline market')
  await expect(page.getByTestId('market-price-HK')).toBeVisible()
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
