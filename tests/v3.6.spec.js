import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

async function addRound(page) {
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await page.locator('input[name="title"]').fill('Springhaven');
  await page.locator('input[name="score"]').fill('82');
  await page.locator('.entry-details').first().locator('summary').click();
  await page.locator('input[name="fairways"]').fill('4');
  await page.locator('input[name="gir"]').fill('3');
  await page.locator('input[name="putts"]').fill('31');
  await page.locator('textarea[name="note"]').fill('Over drawing when trying to shape it.');
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await page.locator('[data-route="golfer"]').click();
}

test('Journal uses a calm compact header and empty state', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-route="golfer"]').click();
  await expect(page.locator('.journal-page-header .page-copy')).toHaveText('Everything TIP remembers about your golf.');
  await expect(page.locator('.journal-add-row')).toContainText('ADD NOTE');
  await expect(page.locator('.journal-add-row')).toContainText('Something worth remembering?');
  await expect(page.locator('.journal-empty')).toContainText('Nothing here yet.');
  await expect(page.locator('.empty-state')).toHaveCount(0);
});

test('Journal entries render as compact log rows with tucked-away actions', async ({ page }) => {
  await fresh(page);
  await addRound(page);
  const row = page.locator('.journal-row').filter({ hasText: 'Springhaven' }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('82 score');
  await expect(row).toContainText('31 putts');
  await expect(row).not.toHaveClass(/card/);
  await expect(row.locator('[data-action="edit-entry"]')).not.toBeVisible();
  await row.locator('.journal-more summary').click();
  await expect(row.locator('[data-action="edit-entry"]')).toBeVisible();
  await expect(row.locator('[data-action="delete-entry"]')).toBeVisible();
});

test('TIP center navigation mark uses a circular branded control', async ({ page }) => {
  await fresh(page);
  const logo = page.locator('.nav-tip-logo');
  const size = await logo.evaluate(el => ({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,r:getComputedStyle(el).borderRadius}));
  expect(Math.abs(size.w-size.h)).toBeLessThan(1);
  expect(size.r).not.toBe('0px');
});
