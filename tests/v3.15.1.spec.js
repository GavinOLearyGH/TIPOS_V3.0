import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
  await page.locator('[data-route="golfer"]').click();
  await expect(page.getByRole('heading',{name:'Journal.'})).toBeVisible();
}

async function expectNoHorizontalOverflow(page){
  const width=await page.evaluate(()=>({
    inner:window.innerWidth,
    doc:document.documentElement.scrollWidth,
    body:document.body.scrollWidth
  }));
  expect(width.doc).toBeLessThanOrEqual(width.inner+1);
  expect(width.body).toBeLessThanOrEqual(width.inner+1);
}

async function openQuickNote(page){
  await page.locator('.journal-add-row').click();
}

test('Quick Note stays inside the mobile viewport before during and after save',async({page})=>{
  await fresh(page);
  await expectNoHorizontalOverflow(page);
  await openQuickNote(page);
  await expectNoHorizontalOverflow(page);
  const textarea=page.locator('#quickJournalNoteForm textarea[name="note"]');
  await textarea.fill('A compact note should not change the Journal viewport.');
  await page.getByRole('button',{name:'SAVE NOTE'}).click();
  await expect(page.locator('.journal-row').filter({hasText:'A compact note should not change the Journal viewport.'})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Quick Note mobile controls are compact and use an iOS-safe text size',async({page})=>{
  await fresh(page);
  await openQuickNote(page);
  const textarea=page.locator('#quickJournalNoteForm textarea[name="note"]');
  const style=await textarea.evaluate(el=>({fontSize:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
  expect(style.fontSize).toBeGreaterThanOrEqual(16);
  expect(style.height).toBeLessThan(120);
  const save=page.getByRole('button',{name:'SAVE NOTE'});
  const cancel=page.getByRole('button',{name:'CANCEL'});
  const buttons=await Promise.all([save,cancel].map(locator=>locator.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,border:getComputedStyle(el).borderStyle}))));
  expect(buttons[0].height).toBeLessThanOrEqual(48);
  expect(buttons[1].height).toBeLessThanOrEqual(48);
  expect(buttons[1].border).toBe('none');
  expect(buttons[1].width).toBeLessThan(buttons[0].width);
});
