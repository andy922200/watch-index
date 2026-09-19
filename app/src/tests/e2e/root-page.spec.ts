import { expect, test } from '@playwright/test'

test('renders the Root brand directory without market controls', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '探索腕錶品牌 與全球官方定價' })).toBeVisible()
  await expect(page.getByRole('link', { name: /ROLEX/i })).toHaveAttribute('href', '/rolex/')
  await expect(page.getByRole('link', { name: /OMEGA/i })).toHaveAttribute('href', '/omega/')
  await expect(page.getByRole('combobox', { name: '市場' })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: '顯示貨幣' })).toHaveCount(0)

  await page.getByRole('link', { name: /ROLEX/i }).click()
  await expect(page).toHaveURL(/\/rolex\/$/)
})

test('uses the English Root URL and English Rolex link', async ({ page }) => {
  await page.goto('/en-us/')

  await expect(page.getByRole('heading', { name: 'Explore watches by brand.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /ROLEX/i })).toHaveAttribute('href', '/rolex/en-us/')
})

test('keeps brand accents distinct and keyboard focus visible in light and dark modes', async ({
  page,
}) => {
  await page.goto('/')

  const rolexRow = page.locator('[data-brand-id="rolex"]')
  const omegaRow = page.locator('[data-brand-id="omega"]')
  const rolexLink = page.getByRole('link', { name: /ROLEX/i })

  await expect(rolexRow).toHaveCSS('--directory-accent', '#006039')
  await expect(omegaRow).toHaveCSS('--directory-accent', '#b42318')

  await rolexLink.focus()
  await expect(rolexLink).toBeFocused()
  expect(await rolexLink.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
    'none',
  )

  await page.locator('html').evaluate((element) => element.classList.add('dark'))
  await expect(rolexRow).toHaveCSS('--directory-accent', '#69b982')
  await expect(omegaRow).toHaveCSS('--directory-accent', '#ff8f87')
})
