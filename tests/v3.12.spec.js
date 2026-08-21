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

test('TIP Library exposes the full leaf-level four-dimension curriculum',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await expect(page.getByRole('heading',{name:'TIP Library',exact:true})).toBeVisible();
  await expect(page.locator('[data-tip9-filter]')).toHaveCount(5);
  await expect(page.locator('[data-tip9-filter="All"]')).toBeVisible();
  await expect(page.locator('[data-tip9-filter="Swing"]')).toBeVisible();
  await expect(page.locator('[data-tip9-filter="Skill"]')).toBeVisible();
  await expect(page.locator('[data-tip9-filter="Stretch"]')).toBeVisible();
  await expect(page.locator('[data-tip9-filter="Strength"]')).toBeVisible();
  await expect(page.locator('.tip-library-row')).toHaveCount(477);
});

test('dimension taps preserve the complete V2 practice-ready curriculum',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  const minimum={Swing:102,Skill:183,Stretch:75,Strength:80};
  for(const [dimension,count] of Object.entries(minimum)){
    await page.locator(`[data-tip9-filter="${dimension}"]`).click();
    await expect(page.locator('.tip-library-row').first()).toBeVisible();
    expect(await page.locator('.tip-library-row').count()).toBeGreaterThanOrEqual(count);
  }
});

test('legacy V2 execution content survives migration into browsable detail',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await page.locator('[data-tip-library-search]').fill('Rope Swing Drill');
  await page.waitForTimeout(220);
  const row=page.locator('.tip-library-row').filter({hasText:'Rope Swing Drill'}).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole('heading',{name:'Rope Swing Drill',exact:true})).toBeVisible();
  await expect(page.locator('.tip-library-detail')).toContainText('Make five continuous rehearsal swings');
  await expect(page.locator('.tip-library-detail')).toContainText('At least 4 of 6 shots finish in balance');
});

test('Stretch and Strength include migrated curriculum plus unique TIP7 movement content',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await page.locator('[data-tip9-filter="Stretch"]').click();
  await expect(page.locator('.tip-library-row').filter({hasText:'Open Books'}).first()).toBeVisible();
  await page.locator('[data-tip9-filter="Strength"]').click();
  await expect(page.locator('.tip-library-row').filter({hasText:'Pallof Press'}).first()).toBeVisible();
});

test('TIP9 family taxonomy stays behind the golfer-facing Library',async({page})=>{
  await fresh(page);
  await openLibrary(page);
  await expect(page.locator('.tip-library-view')).not.toContainText('TIP9 · LEVEL');
  await page.locator('[data-tip-library-search]').fill('Playable Tee Ball');
  await page.waitForTimeout(220);
  const row=page.locator('.tip-library-row').filter({hasText:'Playable Tee Ball'}).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('.tip-library-detail')).toBeVisible();
  await expect(page.locator('.tip-library-tip9-start')).toHaveCount(0);
  await expect(page.locator('[data-tip9-library-context]')).toHaveCount(0);
});
