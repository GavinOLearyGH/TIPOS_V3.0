import { test, expect } from '@playwright/test';

async function freshTip(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
  await page.locator('[data-route="tip"]').click();
}

async function assertNoHorizontalOverflow(page) {
  const dims = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(dims.documentWidth).toBeLessThanOrEqual(dims.clientWidth);
  expect(dims.bodyWidth).toBeLessThanOrEqual(dims.innerWidth);
}

test('inline Round keeps datetime inside the mobile workspace', async ({ page }) => {
  await freshTip(page);
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  const input = page.locator('input[name="createdAt"]');
  await expect(input).toBeVisible();
  const bounds = await input.evaluate(el => {
    const r = el.getBoundingClientRect();
    const form = el.closest('.entry-form-inline').getBoundingClientRect();
    return { left:r.left, right:r.right, formLeft:form.left, formRight:form.right };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(bounds.formLeft - 1);
  expect(bounds.right).toBeLessThanOrEqual(bounds.formRight + 1);
  await assertNoHorizontalOverflow(page);
});

test('round coaching evidence metrics are visible without opening details', async ({ page }) => {
  await freshTip(page);
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  for (const name of ['score','fairways','gir','putts','upDowns','penalties']) {
    await expect(page.locator(`input[name="${name}"]`)).toBeVisible();
  }
  await expect(page.locator('.entry-details')).toHaveCount(1);
  await expect(page.locator('.entry-details summary')).toContainText('Focus');
});

test('inline session builder never expands the mobile viewport', async ({ page }) => {
  await freshTip(page);
  const initialWidth = await page.evaluate(() => document.documentElement.clientWidth);
  await page.locator('[data-action="build-session"]').click();
  await expect(page.locator('#sessionBuilderForm.session-builder-inline')).toBeVisible();
  await assertNoHorizontalOverflow(page);
  const afterWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(afterWidth).toBe(initialWidth);
  const form = page.locator('#sessionBuilderForm');
  const formBounds = await form.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { left:r.left, right:r.right, width:r.width };
  });
  expect(formBounds.left).toBeGreaterThanOrEqual(0);
  expect(formBounds.right).toBeLessThanOrEqual(initialWidth);
});
