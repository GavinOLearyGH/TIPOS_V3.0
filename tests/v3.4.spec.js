import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

test('Home uses behavioral page header', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('.page-header .eyebrow')).toHaveText('TODAY');
  await expect(page.locator('.page-header .page-title')).toHaveText('What are you working on?');
  await expect(page.locator('.home-core-row')).toHaveCount(3);
});

test('TIP and Golfer share the same page-header grammar', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-route="tip"]').click();
  await expect(page.locator('.page-header .eyebrow')).toHaveText('TIP');
  await expect(page.locator('.page-header .page-title')).toHaveText('How can TIP help today?');
  await page.locator('[data-route="golfer"]').click();
  await expect(page.locator('.page-header .eyebrow')).toHaveText('GOLFER');
  await expect(page.locator('.page-header .page-title')).toHaveText('Journal.');
});

test('inactive TIP nav mark is smaller than active mark', async ({ page }) => {
  await fresh(page);
  const tip = page.locator('[data-route="tip"] .nav-tip-logo');
  const inactive = await tip.evaluate(el => el.getBoundingClientRect().width);
  await page.locator('[data-route="tip"]').click();
  await page.waitForTimeout(200);
  const active = await tip.evaluate(el => el.getBoundingClientRect().width);
  expect(active).toBeGreaterThan(inactive);
});
