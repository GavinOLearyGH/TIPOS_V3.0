import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

async function openBuilder(page){
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="build-session"]').click();
  await expect(page.locator('#sessionBuilderForm')).toBeVisible();
}

async function selectRadio(page,name,value){
  await page.locator(`input[name="${name}"][value="${value}"]`).check({force:true});
}

test('V3.11 teaches the Journal and coaching relationship calmly',async({page})=>{
  await fresh(page);
  await expect(page.locator('.home-core-tip')).toContainText('TIP learns from what you record');
  await page.locator('[data-route="tip"]').click();
  await expect(page.locator('.tip-page-header')).toContainText('Add to your Golf Journal');
  await expect(page.locator('[data-action="tell-tip"]')).toContainText('Tell TIP about your golf');
  await expect(page.locator('[data-action="tell-tip"]')).toContainText('future suggestions');
  await expect(page.locator('[data-action="build-session"]')).toContainText('Build a custom session');
});

test('custom builder exposes time location and focus with Let TIP Decide',async({page})=>{
  await fresh(page);
  await openBuilder(page);
  await expect(page.locator('input[name="minutes"]')).toHaveCount(5);
  await expect(page.locator('input[name="context"]')).toHaveCount(6);
  await expect(page.locator('input[name="focus"]')).toHaveCount(8);
  await expect(page.locator('input[name="focus"][value="auto"]')).toBeChecked();
  await expect(page.getByText('Let TIP Decide',{exact:true})).toBeVisible();
});

test('Putting focus constrains prescription to putting practice families',async({page})=>{
  await fresh(page);
  await openBuilder(page);
  await selectRadio(page,'minutes','15');
  await selectRadio(page,'context','anywhere');
  await selectRadio(page,'focus','putting');
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await expect(page.locator('.inline-session-head')).toContainText('Putting Session');
  const titles=await page.locator('.compact-session-block h3').allTextContents();
  const allowed=['Start Line','Lag Putting','Short Putting','Speed Ladder','Read & Commit'];
  expect(titles.length).toBe(2);
  expect(titles.every(title=>allowed.includes(title.trim()))).toBeTruthy();
});

test('TIP explains when selected focus is unavailable at the chosen location',async({page})=>{
  await fresh(page);
  await openBuilder(page);
  await selectRadio(page,'minutes','15');
  await selectRadio(page,'context','green');
  await selectRadio(page,'focus','tee');
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await expect(page.locator('.session-reason')).toContainText('Tee Game is not available in Putting Green');
  await expect(page.locator('.compact-session-block')).toHaveCount(2);
});

test('Body focus stays inside TIP7 instead of filling time with unrelated TIP9 work',async({page})=>{
  await fresh(page);
  await openBuilder(page);
  await selectRadio(page,'minutes','30');
  await selectRadio(page,'context','anywhere');
  await selectRadio(page,'focus','body');
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await expect(page.locator('.inline-session-head')).toContainText('Body Session');
  await expect(page.locator('.compact-session-block')).toHaveCount(1);
  await expect(page.locator('.compact-session-block .eyebrow')).toHaveText('TIP7');
  await expect(page.locator('.session-reason')).toContainText('next TIP7 session');
});
