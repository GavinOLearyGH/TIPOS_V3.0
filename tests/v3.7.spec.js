import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
  await page.locator('[data-route="tip"]').click();
}

test('Tell TIP expands inline instead of opening a modal', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-action="tell-tip"]').click();
  await expect(page.locator('.tip-entry-types')).toBeVisible();
  await expect(page.locator('.tip-entry-type')).toHaveCount(5);
  await expect(page.locator('#entryDialog')).not.toHaveAttribute('open', '');
});

test('choosing a Journal type replaces the selector with a compact inline form', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await expect(page.locator('.tip-entry-types')).toHaveCount(0);
  await expect(page.locator('#journalEntryForm.entry-form-inline')).toBeVisible();
  await expect(page.locator('input[name="score"]')).toBeVisible();
  await expect(page.locator('input[name="fairways"]')).toBeVisible();
  await expect(page.locator('input[name="gir"]')).toBeVisible();
  await expect(page.locator('input[name="putts"]')).toBeVisible();
  await expect(page.locator('input[name="upDowns"]')).toBeVisible();
  await expect(page.locator('input[name="penalties"]')).toBeVisible();
  await expect(page.locator('.entry-details')).toHaveCount(1);
  await expect(page.locator('.entry-details summary')).toContainText('Focus');
  await page.locator('[data-action="tip-entry-change"]').click();
  await expect(page.locator('.tip-entry-types')).toBeVisible();
});

test('saving an inline entry stays on TIP and writes to Journal', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="note"]').click();
  await page.locator('input[name="title"]').fill('Range thought');
  await page.locator('textarea[name="note"]').fill('Smooth tempo felt better.');
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await expect(page.locator('.tip-workspace')).toBeVisible();
  await expect(page.locator('#journalEntryForm')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/tip$/);
  await page.locator('[data-route="golfer"]').click();
  await expect(page.getByText('Range thought')).toBeVisible();
});

test('Add Entry from Journal routes into the same inline TIP selector', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-route="golfer"]').click();
  await page.locator('[data-action="add-entry"]').click();
  await expect(page).toHaveURL(/#\/tip$/);
  await expect(page.locator('.tip-entry-types')).toBeVisible();
  await expect(page.locator('#entryDialog')).not.toHaveAttribute('open', '');
});

test('Build today session expands and produces plan inline', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-action="build-session"]').click();
  await expect(page.locator('#sessionBuilderForm.session-builder-inline')).toBeVisible();
  await page.locator('label.session-choice:has(input[name="minutes"][value="15"])').click();
  await page.locator('label.session-choice:has(input[name="context"][value="range"])').click();
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await expect(page.locator('.inline-session-plan')).toBeVisible();
  await expect(page.locator('[data-action="session-start"]')).toBeVisible();
  await expect(page.getByRole('heading', { name:'How can TIP help today?' })).toBeVisible();
});
