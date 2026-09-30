import { expect, test } from '@playwright/test'

test('loads the newly available Longines markets', async ({ page }) => {
  await page.goto('/longines/en-us/')

  const marketSelect = page.getByRole('combobox', { name: 'Market' })
  await expect(page.getByRole('heading', { name: 'Longines Watch Index' })).toBeVisible()
  await marketSelect.click()
  await expect(page.getByRole('option')).toHaveCount(12)

  for (const marketName of ['Singapore', 'Germany', 'France', 'Italy', 'Spain']) {
    await page.getByRole('option', { name: marketName }).click()
    await expect(marketSelect).toContainText(marketName)
    await expect(page.getByTestId('watch-grid').locator('[data-slot="card"]')).toHaveCount(12)
    await marketSelect.click()
  }
})
