import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

async function openLibrary(page){
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="tip-library"]').click();
  await expect(page.locator('.tip-library-view')).toBeVisible();
}

test('TIP Library is a normal app workspace with primary navigation alive',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await expect(page.locator('body')).not.toHaveClass(/execution-mode/);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await expect(page.locator('[data-action="library-close"]')).toBeVisible();
  await page.locator('[data-route="golfer"]').click();
  await expect(page).toHaveURL(/#\/golfer$/);
  await expect(page.getByRole('heading',{name:'Journal.',exact:true})).toBeVisible();
});

test('Library can return to TIP without scrolling through the full catalog',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  expect(await page.locator('.tip-library-row').count()).toBe(477);
  const back=page.locator('[data-action="library-close"]');
  await expect(back).toBeInViewport();
  await back.click();
  await expect(page.getByRole('heading',{name:'How can TIP help today?',exact:true})).toBeVisible();
  await expect(page.locator('[data-action="tip-library"]')).toBeVisible();
});

test('Library detail has a top back control and normal Home navigation remains live',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await page.locator('[data-tip-library-search]').fill('Rope Swing Drill');
  const row=page.locator('.tip-library-row').filter({hasText:'Rope Swing Drill'}).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('[data-action="library-detail-back"]')).toBeInViewport();
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await page.locator('[data-route="home"]').click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByRole('heading',{name:'What are we working on today?',exact:true})).toBeVisible();
});
