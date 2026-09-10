import { expect, test } from '@playwright/test'

test.describe('RsLog wrap layout', () => {
  test('fill-height wrap rows stay content-sized and start at the top', async ({ page }) => {
    await page.goto('/#/visual/rs-log')
    const root = page.getByTestId('rs-log-visual-root')
    await expect(root).toBeVisible()

    const fill = page.getByTestId('rs-log-wrap-fill')
    const viewport = fill.locator('.rs-log__viewport')
    const plain = fill.locator('.rs-log__plain')
    const rows = fill.locator('.rs-log__row')
    await expect(rows).toHaveCount(3)

    const metrics = await page.evaluate(() => {
      const box = document.querySelector('[data-testid="rs-log-wrap-fill"] .rs-log__viewport')
      const list = document.querySelector('[data-testid="rs-log-wrap-fill"] .rs-log__plain')
      const items = [...document.querySelectorAll('[data-testid="rs-log-wrap-fill"] .rs-log__row')]
      if (!(box instanceof HTMLElement) || !(list instanceof HTMLElement)) {
        return null
      }
      const boxRect = box.getBoundingClientRect()
      const first = items[0]?.getBoundingClientRect()
      const heights = items.map((el) => el.getBoundingClientRect().height)
      return {
        viewportHeight: boxRect.height,
        firstTopGap: first ? first.top - boxRect.top : -1,
        heights,
        maxRow: Math.max(...heights),
        sumRows: heights.reduce((n, h) => n + h, 0),
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics!.viewportHeight).toBeGreaterThan(200)
    expect(metrics!.firstTopGap).toBeGreaterThanOrEqual(0)
    expect(metrics!.firstTopGap).toBeLessThan(24)
    expect(metrics!.maxRow).toBeLessThan(metrics!.viewportHeight * 0.45)
    expect(metrics!.sumRows).toBeLessThan(metrics!.viewportHeight)
    await expect(plain).toBeVisible()
    await expect(viewport).toBeVisible()
  })

  test('narrow wrap grows the row instead of clipping to one line', async ({ page }) => {
    await page.goto('/#/visual/rs-log')
    const narrow = page.getByTestId('rs-log-wrap-narrow')
    await expect(narrow.locator('.rs-log__row').first()).toBeVisible()

    const height = await narrow.locator('.rs-log__row').first().evaluate((el) => el.getBoundingClientRect().height)
    expect(height).toBeGreaterThan(36)
  })
})
