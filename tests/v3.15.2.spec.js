import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

test('Home TIP row uses the new action language and coaching status',async({page})=>{
  await fresh(page);
  const row=page.locator('.home-core-tip');
  await expect(row).toContainText('Tell TIP. Ask TIP. Explore TIP.');
  await expect(row).toContainText('HELP TIP HELP YOUR GOLF');
  await expect(row).not.toContainText('Add to your Golf Journal');
});

test('Journal Add Note is a calm action row with supporting copy',async({page})=>{
  await fresh(page);
  await page.locator('[data-route="golfer"]').click();
  const row=page.locator('.journal-add-row');
  await expect(row).toBeVisible();
  await expect(row).toContainText('ADD NOTE');
  await expect(row).toContainText('Something worth remembering?');
  const marker=await row.evaluate(el=>getComputedStyle(el).listStyleType);
  expect(marker).toBe('none');
  const rect=await row.boundingBox();
  expect(rect.height).toBeLessThanOrEqual(76);
});
