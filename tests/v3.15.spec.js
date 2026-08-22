import { test, expect } from '@playwright/test';

async function fresh(page){
  await page.goto('/#/home');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#welcomeStartBtn').click();
}

async function openJournal(page){
  await page.locator('[data-route="golfer"]').click();
  await expect(page.getByRole('heading',{name:'Journal.'})).toBeVisible();
}

async function openQuickNote(page){
  await page.locator('.journal-add-row').click();
}

test('Journal offers a local Add Note instead of routing into Tell TIP',async({page})=>{
  await fresh(page);
  await openJournal(page);
  await expect(page.getByText('ADD NOTE',{exact:true})).toBeVisible();
  await expect(page.getByText('Something worth remembering?',{exact:true})).toBeVisible();
  await openQuickNote(page);
  await expect(page.getByText('What do you want TIP to remember?')).toBeVisible();
  await expect(page.locator('#quickJournalNoteForm textarea[name="note"]')).toBeVisible();
  expect(page.url()).toContain('#/golfer');
});

test('saving Quick Journal Note stays on Journal and shows the new note immediately',async({page})=>{
  await fresh(page);
  await openJournal(page);
  await openQuickNote(page);
  await page.locator('#quickJournalNoteForm textarea[name="note"]').fill('Driver felt much better when I slowed the transition.');
  await page.getByRole('button',{name:'SAVE NOTE'}).click();
  expect(page.url()).toContain('#/golfer');
  await expect(page.getByRole('heading',{name:'Journal.'})).toBeVisible();
  const note=page.locator('.journal-row').filter({hasText:'Driver felt much better when I slowed the transition.'}).first();
  await expect(note).toBeVisible();
  await expect(note).toContainText('Note');
  await expect(page.locator('#quickJournalNoteForm')).not.toBeVisible();
});

test('cancel closes Quick Journal Note without creating an entry',async({page})=>{
  await fresh(page);
  await openJournal(page);
  await openQuickNote(page);
  await page.locator('#quickJournalNoteForm textarea[name="note"]').fill('Do not save this.');
  await page.getByRole('button',{name:'CANCEL'}).click();
  await expect(page.locator('#quickJournalNoteForm')).not.toBeVisible();
  await expect(page.locator('.journal-row')).toHaveCount(0);
  expect(page.url()).toContain('#/golfer');
});

test('Tell TIP retains the full structured entry list',async({page})=>{
  await fresh(page);
  await page.locator('[data-route="tip"]').click();
  await page.locator('[data-action="tell-tip"]').click();
  await expect(page.locator('[data-action="tip-entry-type"]')).toHaveCount(5);
  for(const label of ['Round','Practice','Lesson','Equipment','Note']) await expect(page.getByText(label,{exact:true}).first()).toBeVisible();
});
