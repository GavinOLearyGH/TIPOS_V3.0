import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.log(`BROWSER_PAGE_ERROR: ${error.message}`));
  page.on('console', msg => { if (msg.type() === 'error') console.log(`BROWSER_CONSOLE_ERROR: ${msg.text()}`); });
});

const nav = (page, route) => page.locator(`[data-route="${route}"]`).click();

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const welcome = page.locator('#welcomeDialog');
  await expect(welcome).toHaveAttribute('open', '');
  await expect(welcome.getByText('7 Minute Stretch & Strength')).toBeVisible();
  await expect(welcome.getByText('9 Ball Challenge for Swing & Skill')).toBeVisible();
  await page.locator('#welcomeStartBtn').click();
  await expect(page.locator('[data-action="tip7"]')).toBeVisible();
}

async function addRound(page, note='Driver was good. Irons were heavy and approaches were short.') {
  await nav(page, 'tip');
  await page.locator('[data-action="tell-tip"]').click();
  await expect(page.locator('.tip-entry-types')).toBeVisible();
  await page.locator('[data-action="tip-entry-type"][data-entry-type="round"]').click();
  await expect(page.locator('#journalEntryForm.entry-form-inline')).toBeVisible();
  await expect(page.locator('#entryDialog')).not.toHaveAttribute('open', '');
  await page.locator('input[name="title"]').fill('Springhaven');
  await page.locator('input[name="score"]').fill('81');
  const details = page.locator('.entry-details').first();
  if (await details.count()) await details.locator('summary').click();
  await page.locator('input[name="gir"]').fill('4');
  await page.locator('textarea[name="note"]').fill(note);
  await page.locator('#journalEntryForm button[type="submit"]').click();
  await nav(page, 'golfer');
  await expect(page.getByText('Springhaven')).toBeVisible();
}

async function completeTip7Quick(page) {
  await nav(page, 'home');
  await page.locator('[data-action="tip7"]').click();
  await page.locator('[data-tip7-start]').click();
  for (let i=0; i<24; i++) await page.locator('[data-tip7-next]').click();
  await expect(page.getByText(/You showed up|Foundation/)).toBeVisible();
  const feel = page.locator('[data-tip7-feel]').first();
  if (await feel.count()) await feel.click();
  await page.locator('[data-tip7-done]').click();
}

async function completeTip9(page, context='range') {
  await nav(page, 'home');
  await page.locator('[data-action="tip9"]').click();
  await page.locator(`[data-tip9-context="${context}"]`).click();
  await page.locator('[data-tip9-setup]').click();
  await page.locator('[data-tip9-begin]').click();
  for (let block=0; block<3; block++) {
    await page.locator('[data-tip9-score="3"]').click();
    if (block<2) await page.locator('[data-tip9-ready]').click();
  }
  await expect(page.getByText(/TIP9 COMPLETE/i)).toBeVisible();
  const feel = page.locator('[data-tip9-feel]').first();
  if (await feel.count()) await feel.click();
  await page.locator('[data-tip9-done]').click();
}

function chooseSessionOption(page, name, value) {
  return page.locator(`label.session-choice:has(input[name="${name}"][value="${value}"])`).click();
}

test('first-run welcome sets the simple TIP7 TIP9 TIP tone', async ({ page }) => {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const welcome = page.locator('#welcomeDialog');
  await expect(welcome).toHaveAttribute('open', '');
  await expect(welcome).toContainText('Build your golfer.');
  await expect(welcome).toContainText('7 Minute Stretch & Strength');
  await expect(welcome).toContainText('9 Ball Challenge for Swing & Skill');
  await expect(welcome).toContainText('Tell TIP about your golf. Let TIP help with what comes next.');
  await expect(welcome).not.toContainText(/PLAY.*PRACTICE.*REMEMBER.*IMPROVE/i);
  await page.locator('#welcomeStartBtn').click();
  await page.reload();
  await expect(page.locator('#welcomeDialog')).not.toHaveAttribute('open', '');
});

test('Home mirrors the three core splash pillars', async ({ page }) => {
  await fresh(page);
  const rows = page.locator('.home-core-row');
  await expect(rows).toHaveCount(3);
  await expect(page.locator('[data-action="tip7"]')).toContainText('TIP7');
  await expect(page.locator('[data-action="tip7"]')).toContainText('7 Minute Stretch & Strength');
  await expect(page.locator('[data-action="tip9"]')).toContainText('TIP9');
  await expect(page.locator('[data-action="tip9"]')).toContainText('9 Ball Challenge for Swing & Skill');
  await expect(page.locator('.home-core-tip')).toContainText('TIP');
  await expect(page.locator('.home-core-tip')).toContainText('Tell TIP about your golf. Let TIP help with what comes next.');
  await expect(page.locator('[data-route="tip"] .nav-tip-logo')).toBeVisible();
  await expect(page.getByText(/Player Card|Today's Mission|Coach's Corner|TIP Plans/i)).toHaveCount(0);
});

test('round entry feeds Journal and changes TIP from learning-only state', async ({ page }) => {
  await fresh(page);
  await addRound(page);
  await nav(page, 'home');
  await expect(page.locator('.home-tip-suggestion')).toBeVisible();
  await expect(page.locator('.home-tip-suggestion')).toContainText(/Contact|Approach|TIP9|IMPROVE|LEARN/i);
});

test('TIP7 completes, journals once, and locks for today', async ({ page }) => {
  await fresh(page);
  await completeTip7Quick(page);
  await nav(page, 'golfer');
  await expect(page.locator('.journal-row').filter({ hasText:'TIP7' })).toHaveCount(1);
  await nav(page, 'home');
  await page.locator('[data-action="tip7"]').click();
  await expect(page.getByText(/DONE FOR TODAY|Foundation/)).toBeVisible();
});

test('TIP9 completes and writes canonical Journal activity', async ({ page }) => {
  await fresh(page);
  await completeTip9(page, 'range');
  await nav(page, 'golfer');
  const tip9 = page.locator('.journal-row').filter({ hasText:'TIP9' }).first();
  await expect(tip9).toBeVisible();
  await expect(tip9).toContainText(/Level|complete|\/9/i);
});

test('TIP Suggests start preserves the recommended TIP9 instead of rerolling', async ({ page }) => {
  await fresh(page);
  await addRound(page, 'Irons were heavy. Contact was poor and approaches were short.');
  await nav(page, 'home');
  const card = page.locator('.home-tip-suggestion');
  const title = (await card.locator('h2').textContent())?.trim();
  await card.locator('[data-action="tip-suggestion"]').click();
  if (await page.locator('[data-tip9-preferred-context]').count()) await page.locator('[data-tip9-preferred-context]').first().click();
  await expect(page.getByRole('heading', { name: title, exact:true })).toBeVisible();
});

test('session builder composes all supported time buckets', async ({ page }) => {
  await fresh(page);
  await nav(page, 'tip');
  await page.locator('[data-action="build-session"]').click();
  for (const minutes of ['7','15','30','45','60']) {
    await chooseSessionOption(page, 'minutes', minutes);
    await chooseSessionOption(page, 'context', 'range');
    await page.locator('#sessionBuilderForm button[type="submit"]').click();
    await expect(page.locator('[data-action="session-start"]')).toBeVisible();
    await page.locator('[data-action="session-rebuild"]').click();
  }
});

test('abandoning a built session keeps child work but creates no parent completion', async ({ page }) => {
  await fresh(page);
  await nav(page, 'tip');
  await page.locator('[data-action="build-session"]').click();
  await chooseSessionOption(page, 'minutes', '15');
  await chooseSessionOption(page, 'context', 'range');
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await page.locator('[data-action="session-start"]').click();
  if (await page.locator('[data-tip7-start]').count()) {
    await page.locator('[data-tip7-start]').click();
    for (let i=0; i<24; i++) await page.locator('[data-tip7-next]').click();
    await page.locator('[data-tip7-done]').click();
  }
  await page.evaluate(() => { location.hash = '#/golfer'; });
  await expect(page.getByRole('heading', { name:'Journal.' })).toBeVisible();
  await expect(page.locator('.journal-row').filter({hasText:"Today's Session"})).toHaveCount(0);
});

test('export then reset then restore preserves Journal', async ({ page }) => {
  await fresh(page);
  await addRound(page, 'Solid round.');
  await page.locator('#menuBtn').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-setting="export"]').click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.locator('#menuBtn').click();
  page.once('dialog', d => d.accept());
  await page.locator('[data-setting="reset"]').click();
  await page.locator('#welcomeStartBtn').click();
  await nav(page, 'golfer');
  await expect(page.getByText('Springhaven')).toHaveCount(0);
  await page.locator('#menuBtn').click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-setting="restore"]').click();
  const chooser = await chooserPromise;
  page.once('dialog', d => d.accept());
  await chooser.setFiles(path);
  await expect(page.getByText('Springhaven')).toBeVisible();
});

test('V2 import is idempotent', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    localStorage.setItem('tip_genesis_rounds', JSON.stringify([{id:'r1',course:'Legacy Course',score:82,date:'2026-08-01',note:'Legacy round'}]));
  });
  for (let i=0; i<2; i++) {
    await page.locator('#menuBtn').click();
    page.once('dialog', d => d.accept());
    await page.locator('[data-setting="import-v2"]').click();
  }
  await nav(page, 'golfer');
  await expect(page.getByText('Legacy Course')).toHaveCount(1);
});

test('cached app shell launches offline after first load', async ({ page, context }) => {
  await fresh(page);
  await page.evaluate(async () => { if ('serviceWorker' in navigator) await navigator.serviceWorker.ready; });
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[data-action="tip7"]')).toBeVisible();
  await context.setOffline(false);
});

test('hash navigation during execution exits cleanly without parent session', async ({ page }) => {
  await fresh(page);
  await page.locator('[data-action="tip7"]').click();
  await page.locator('[data-tip7-start]').click();
  await page.evaluate(() => { location.hash = '#/golfer'; });
  await expect(page.getByRole('heading', { name: 'Journal.' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/execution-mode/);
});
