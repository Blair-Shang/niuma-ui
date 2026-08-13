import { expect, test } from '@playwright/test'

test.describe('RsTable visual', () => {
  test('readonly light fixture', async ({ page }) => {
    await page.goto('/#/visual/rs-table')
    const root = page.getByTestId('rs-table-visual-root')
    await expect(root).toBeVisible()
    const shell = root.locator('.rs-table-shell')
    await expect(shell).toBeVisible()
    await expect(shell).toHaveScreenshot('rs-table-readonly-light.png')
  })
})
