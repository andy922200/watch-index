import { expect, test } from '@playwright/test'

test('adds Longines watches to the shared comparison selection', async ({ page }) => {
  await page.goto('/longines/en-us/?market_code=TW')
  await page.evaluate(() => localStorage.removeItem('watch-compare-selection-v1'))
  await page.reload()

  const cards = page.getByTestId('watch-grid').locator('[data-watch-id]')
  await expect(cards.first().getByRole('button', { name: 'Add to comparison' })).toBeVisible()

  for (const index of [0, 1, 2]) {
    await cards.nth(index).getByRole('button', { name: 'Add to comparison' }).click()
  }

  await expect(page.getByText('3 / 3 selected')).toBeVisible()
  await expect(
    cards.nth(0).getByRole('button', { name: 'Remove from comparison' }),
  ).toHaveAttribute('aria-pressed', 'true')
  const fourthCompareButton = cards.nth(3).getByRole('button', { name: 'Add to comparison' })
  await expect(fourthCompareButton).toBeDisabled()
  await fourthCompareButton.hover()
  await expect
    .poll(() => fourthCompareButton.evaluate((element) => getComputedStyle(element).cursor))
    .toBe('not-allowed')
  const fourthCompareButtonBox = await fourthCompareButton.boundingBox()
  if (!fourthCompareButtonBox) throw new Error('The disabled comparison button is not visible')
  await page.mouse.click(
    fourthCompareButtonBox.x + fourthCompareButtonBox.width / 2,
    fourthCompareButtonBox.y + fourthCompareButtonBox.height / 2,
  )
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const selectedIds = await cards.evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => element.getAttribute('data-watch-id')),
  )
  const compareLink = page.getByRole('link', { name: 'Compare selected watches' })
  await expect(compareLink).toHaveAttribute('href', /watch-compare\.html\?market_code=TW&watch_id=/)
  await compareLink.click()

  await expect(page).toHaveURL(/watch-compare\.html\?market_code=TW&watch_id=/)
  await expect(page.getByRole('table', { name: 'Watch comparison' })).toBeVisible()
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toEqual(selectedIds)

  await page.goto('/collection-explorer.html?market_code=TW')
  await expect(page.getByText('已選 3／3 支')).toBeVisible()
})
