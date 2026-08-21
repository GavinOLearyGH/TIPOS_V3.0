import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

test('TIP page uses a calmer headline and compact workspace rows', async ({ page }) => {
  await fresh(page);
  const homeTitleSize = await page.locator('.page-header .page-title').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.locator('[data-route="tip"]').click();
  const tipTitle = page.locator('.tip-page-header .page-title');
  const tipTitleSize = await tipTitle.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(tipTitleSize).toBeLessThan(homeTitleSize);
  await expect(page.locator('.tip-workspace-row')).toHaveCount(2);
  const paddingTop = await page.locator('.tip-workspace-row').first().evaluate(el => parseFloat(getComputedStyle(el).paddingTop));
  expect(paddingTop).toBeLessThanOrEqual(20);
});

test('center TIP nav mark has padded viewBox and remains fully visible', async ({ page }) => {
  await fresh(page);
  const mark = page.locator('.nav-tip-logo');
  await expect(mark).toHaveAttribute('viewBox', '-3 -2 98 46');
  await page.locator('[data-route="tip"]').click();
  await page.waitForTimeout(200);
  const styles = await mark.evaluate(el => ({
    overflow: getComputedStyle(el).overflow,
    width: el.getBoundingClientRect().width,
    height: el.getBoundingClientRect().height
  }));
  expect(styles.overflow).toBe('visible');
  expect(styles.width).toBeGreaterThan(20);
  expect(styles.height).toBeGreaterThan(20);
});
