import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

async function addBadTeeRound(page,name='Tee control evidence'){
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await page.locator('input[name="title"]').fill(name);
  await page.locator('input[name="score"]').fill('84');
  await page.locator('input[name="fairways"]').fill('4');
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await expect(page.locator('.tip-suggests-row')).toBeVisible();
  await expect(page.locator('.tip-suggests-row')).toContainText('Playable Tee Ball');
}

async function completeSuggestedTip9Poorly(page){
  await page.locator('[data-action="tip-suggestion"]').click();
  const preferredContext=page.locator('[data-tip9-preferred-context]').first();
  if(await preferredContext.count()) await preferredContext.click();
  await page.locator('[data-tip9-setup]').click();
  await page.locator('[data-tip9-begin]').click();
  for(let block=0;block<3;block++){
    await page.locator('[data-tip9-score="0"]').click();
    if(block<2) await page.locator('[data-tip9-ready]').click();
  }
  await expect(page.getByText(/TIP9 COMPLETE/i)).toBeVisible();
  await page.locator('[data-tip9-done]').click();
}

test('completed suggested TIP9 is fulfilled even when the result is poor',async({page})=>{
  await fresh(page);
  await addBadTeeRound(page);
  await completeSuggestedTip9Poorly(page);
  await page.locator('[data-route="tip"]').click();
  await expect(page.getByText('Playable Tee Ball',{exact:true})).toHaveCount(0);
  await expect(page.locator('.tip-suggests-row')).toHaveCount(0);
});

test('new external evidence can make a fulfilled action eligible again',async({page})=>{
  await fresh(page);
  await addBadTeeRound(page);
  await completeSuggestedTip9Poorly(page);
  await page.locator('[data-route="tip"]').click();
  await expect(page.locator('.tip-suggests-row')).toHaveCount(0);
  await page.waitForTimeout(1100);
  await page.locator('[data-action="tell-tip"]').click();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await page.locator('input[name="title"]').fill('New tee evidence');
  await page.locator('input[name="score"]').fill('85');
  await page.locator('input[name="fairways"]').fill('3');
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await expect(page.locator('.tip-suggests-row')).toBeVisible();
  await expect(page.locator('.tip-suggests-row')).toContainText('Playable Tee Ball');
});
