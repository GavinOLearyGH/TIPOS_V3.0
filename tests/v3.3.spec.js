import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

test('splash has no duplicate Irish Par eyebrow', async ({ page }) => {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const welcome = page.locator('#welcomeDialog');
  await expect(welcome).toHaveAttribute('open', '');
  await expect(welcome.locator('.welcome-brand')).toContainText('THE IRISH PAR');
  await expect(welcome.locator('.eyebrow')).toHaveCount(0);
  await expect(welcome).toContainText('Build your golfer.');
});

test('fresh Home shows only TIP7 TIP9 TIP and no coaching suggestion', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('.home-core-row')).toHaveCount(3);
  await expect(page.locator('[data-action="tip7"]')).toContainText('7 Minute Stretch & Strength');
  await expect(page.locator('[data-action="tip9"]')).toContainText('9 Ball Challenge for Swing & Skill');
  await expect(page.locator('.home-core-tip')).toContainText('Tell TIP about your golf. Let TIP help with what comes next.');
  await expect(page.locator('.home-suggests')).toHaveCount(0);
  await expect(page.getByText('MAINTAIN', { exact: true })).toHaveCount(0);
});

test('TIP Suggests appears only after real Journal evidence', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await page.locator('input[name="title"]').fill('Springhaven');
  await page.locator('input[name="score"]').fill('81');
  await page.locator('textarea[name="note"]').fill('Driver was good. Irons were heavy and approaches were short.');
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await page.locator('[data-route="home"]').click();
  await expect(page.locator('.home-suggests')).toBeVisible();
  await expect(page.locator('.tip-suggestion-card')).toBeVisible();
});

test('center nav uses the TIP graphic mark', async ({ page }) => {
  await fresh(page);
  const logo = page.locator('[data-route="tip"] svg.nav-tip-logo');
  await expect(logo).toBeVisible();
  await expect(logo.locator('path')).toHaveCount(1);
});
