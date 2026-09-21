import { expect, test } from '@playwright/test'

test.describe('RTL visual', () => {
  test('logical CSS mirrors under dir=rtl', async ({ page }) => {
    await page.goto('/#/visual/rs-rtl')
    const root = page.getByTestId('rs-rtl-visual-root')
    await expect(root).toBeVisible()
    await expect(root).toHaveAttribute('dir', 'rtl')

    const menuItem = root.locator('.rs-menu__item').filter({ hasText: 'Documents' })
    await expect(menuItem).toBeVisible()
    const paddingInlineStart = await menuItem.evaluate((el) => getComputedStyle(el).paddingInlineStart)
    const paddingLeft = await menuItem.evaluate((el) => getComputedStyle(el).paddingLeft)
    expect(Number.parseFloat(paddingInlineStart)).toBeGreaterThan(12)
    expect(paddingLeft).not.toBe(paddingInlineStart)

    await expect(root).toHaveScreenshot('rs-rtl-light.png')
  })
})
