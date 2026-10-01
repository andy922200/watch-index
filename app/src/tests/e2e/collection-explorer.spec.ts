import { expect, test } from '@playwright/test'

test('explores three brands, enforces selection limit, and shares a comparison', async ({
  page,
}) => {
  await page.goto('/collection-explorer.html')

  await expect(page.getByRole('heading', { name: '探索每一種可能。' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /支腕錶/ })).toBeVisible()

  for (const brand of ['rolex', 'omega', 'longines']) {
    await page.getByRole('searchbox', { name: '搜尋品牌、系列、型號、型號編號或暱稱' }).fill(brand)
    await page
      .locator(`[data-watch-id^="${brand}:"]`)
      .first()
      .getByRole('button', { name: '加入比較' })
      .click()
  }
  await expect(page.getByText('已選 3／3 支')).toBeVisible()

  await page.getByRole('searchbox', { name: '搜尋品牌、系列、型號、型號編號或暱稱' }).fill('rolex')
  const fourthWatchButton = page
    .locator('[data-watch-id^="rolex:"]')
    .nth(1)
    .getByRole('button', { name: '加入比較' })
  await expect(fourthWatchButton).toBeDisabled()
  await expect(page.getByText('已選 3／3 支')).toBeVisible()

  await page.getByRole('link', { name: '比較心儀錶款' }).click()
  await expect(page).toHaveURL(/watch-compare\.html\?market_code=TW&watch_id=/)
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeVisible()
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toHaveLength(3)

  const sharedUrl = page.url()
  await page.evaluate(() => localStorage.removeItem('watch-compare-selection-v1'))
  await page.goto(sharedUrl)
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeVisible()
  await expect(page.getByRole('link', { name: /查看單錶跨市場比價/ }).first()).toHaveAttribute(
    'href',
    /watch-price-compare\.html/,
  )
})

test('keeps URL selection authoritative, including invalid and incomplete links', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'watch-compare-selection-v1',
      JSON.stringify(['rolex:m124060-0001', 'omega:wrong']),
    ),
  )
  await page.goto('/watch-compare.html?market_code=TW&watch_id=')
  await expect(page.getByText('請先選擇至少兩支腕錶。')).toBeVisible()
  await expect(page.getByRole('table', { name: '腕錶比較' })).toHaveCount(0)
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toEqual([''])

  await page.goto('/watch-compare.html?watch_id=a&watch_id=b&watch_id=c&watch_id=d')
  await expect(page.getByText('網址包含超過三支腕錶，請移除多餘項目。')).toBeVisible()
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toHaveLength(4)
})

test('supports market and language changes on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/collection-explorer.html?market_code=TW')
  await expect(page.locator('[data-watch-id^="longines:"]').first()).toBeVisible()
  await page.getByRole('button', { name: '展開篩選條件' }).click()
  await expect(page.getByRole('slider')).toHaveCount(2)
  await page.getByRole('combobox', { name: '市場' }).click()
  await page.getByRole('option', { name: /日本/ }).click()
  await expect(page).toHaveURL(/market_code=JP/)
  await expect(page.locator('[data-watch-id^="longines:"]').first()).toBeVisible()
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth <= window.innerWidth),
  ).toBe(true)
})

test('keeps the selected market and comparison query in sync across language and removal', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'watch-compare-selection-v1',
      JSON.stringify(['rolex:m124060-0001', 'longines:L1.648.4.52.2']),
    ),
  )
  await page.goto(
    '/watch-compare.html?market_code=JP&watch_id=rolex%3Am124060-0001&watch_id=longines%3AL1.648.4.52.2',
  )
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeVisible()
  await expect(page).toHaveURL(/market_code=JP/)
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toHaveLength(2)

  await page.getByRole('combobox', { name: '語言' }).click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en-us\/watch-compare\.html\?market_code=JP/)
  await expect(page.getByRole('heading', { name: 'Put your choices side by side.' })).toBeVisible()

  await page.getByRole('button', { name: 'Remove m124060-0001' }).click()
  expect(new URL(page.url()).searchParams.getAll('watch_id')).toEqual(['longines:L1.648.4.52.2'])
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('watch-compare-selection-v1')))
    .toBe(JSON.stringify(['longines:L1.648.4.52.2']))
  await expect(page.getByText('Select at least two watches to compare.')).toBeVisible()
})

test('shows comparison cards at 375px without horizontal overflow and names missing local data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=longines%3Aunknown',
  )
  await expect(page.locator('[data-compare-card]')).toHaveCount(2)
  await expect(
    page.locator('[data-compare-card]').getByText('此市場無當地展示資料').first(),
  ).toBeVisible()
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeHidden()
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth <= window.innerWidth),
  ).toBe(true)
})

test('reports IDs with an unknown brand without falling back to local selection', async ({
  page,
}) => {
  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=unknown%3A123',
  )
  await expect(page.getByText(/無法辨識的腕錶：unknown:123/)).toBeVisible()
})

test('switches between cards and table at the 1024px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 900 })
  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=longines%3AL1.648.4.52.2',
  )
  await expect(page.locator('[data-compare-card]')).toHaveCount(2)
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeHidden()
  await page.setViewportSize({ width: 1024, height: 900 })
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeVisible()
  await expect(page.locator('[data-compare-card]').first()).toBeHidden()
})

test('keeps the tablet comparison contained in light and dark themes', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=longines%3AL1.648.4.52.2',
  )
  await expect(page.locator('[data-compare-card]')).toHaveCount(2)
  const main = page.locator('main')
  const lightBackground = await main.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  await page.locator('html').evaluate((element) => element.classList.add('dark'))
  const darkBackground = await main.evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(darkBackground).not.toBe(lightBackground)
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth <= window.innerWidth),
  ).toBe(true)
})

test('filters official prices with a two-thumb slider and can reset the range', async ({
  page,
}) => {
  await page.goto('/collection-explorer.html')
  await expect(page.locator('[data-watch-id]').first()).toBeVisible()
  const thumbs = page.getByRole('slider')
  await expect(thumbs).toHaveCount(2)
  await expect(thumbs.first()).toHaveAccessibleName('最低官方價格')
  await expect(thumbs.nth(1)).toHaveAccessibleName('最高官方價格')
  const initialMinimum = await thumbs.first().getAttribute('aria-valuenow')
  await thumbs.first().focus()
  await thumbs.first().press('ArrowRight')
  await expect(thumbs.first()).not.toHaveAttribute('aria-valuenow', initialMinimum ?? '')
  await expect(page.getByRole('button', { name: '重設價格範圍' })).toBeVisible()
  await page.getByRole('button', { name: '重設價格範圍' }).click()
  await expect(thumbs.first()).toHaveAttribute('aria-valuenow', initialMinimum ?? '')
  await expect(page.getByRole('button', { name: '重設價格範圍' })).toHaveCount(0)
  await page.getByRole('combobox', { name: '市場' }).click()
  await page.getByRole('option', { name: /日本/ }).click()
  await expect(page.locator('[data-price-range-values]')).toContainText('JPY')
})

test('removes image fallback text after a watch picture loads', async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'image') {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4"/></svg>',
      })
      return
    }
    await route.continue()
  })

  await page.goto('/collection-explorer.html')
  const explorerImage = page.locator('[data-watch-id]').first().locator('img')
  await expect(explorerImage).toBeVisible()
  await expect(explorerImage.locator('xpath=..')).toHaveAttribute(
    'href',
    /watch-price-compare\.html/,
  )
  await expect(explorerImage.locator('xpath=..').locator('[data-image-fallback]')).toHaveCount(0)

  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=longines%3AL1.648.4.52.2',
  )
  const compareImage = page.getByRole('table', { name: '腕錶比較' }).locator('img').first()
  await expect(compareImage).toBeVisible()
  await expect(compareImage.locator('xpath=..').locator('[data-image-fallback]')).toHaveCount(0)
})

test('scrolls back to the results top after a filter change only when it is off screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/collection-explorer.html?market_code=TW')
  await expect(page.locator('[data-watch-id]').first()).toBeVisible()
  const resultsHeading = page.locator('#explorer-results')
  const brandCheckbox = page.getByRole('checkbox', { name: 'LONGINES' })

  // 已在頁面上方時，篩選不應造成捲動。
  await brandCheckbox.click()
  await expect(page.locator('[data-watch-id]').first()).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await brandCheckbox.click()

  // 捲到結果列表深處後（側邊欄為 sticky，仍可操作），篩選應回到結果起點。
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800)
  await brandCheckbox.click()
  await expect
    .poll(async () => (await resultsHeading.boundingBox())?.y ?? Number.NaN)
    .toBeGreaterThanOrEqual(0)
  const headingTop = (await resultsHeading.boundingBox())?.y ?? Number.NaN
  expect(headingTop).toBeLessThan(400)
})

test('copies the current comparison URL from the share link button', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(
    '/watch-compare.html?market_code=TW&watch_id=rolex%3Am124060-0001&watch_id=longines%3AL1.648.4.52.2',
  )
  await expect(page.getByRole('table', { name: '腕錶比較' })).toBeVisible()

  const shareButton = page.getByRole('button', { name: '複製分享連結' })
  await shareButton.click()

  await expect(page.getByRole('button', { name: '已複製連結' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
  await expect(shareButton).toBeVisible()
})
