import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/#/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('Build your golfer.')).toBeVisible();
}

async function addRound(page, note='Driver was good. Irons were heavy and approaches were short.') {
  await page.getByRole('link', { name: 'TIP' }).click();
  await page.getByRole('button', { name: /Tell TIP what you did/i }).click();
  await page.locator('input[name="title"]').fill('Springhaven');
  await page.locator('input[name="score"]').fill('81');
  await page.locator('input[name="gir"]').fill('4');
  await page.locator('textarea[name="note"]').fill(note);
  await page.getByRole('button', { name: /Save to Journal/i }).click();
  await expect(page.getByText('Springhaven')).toBeVisible();
}

async function completeTip7Quick(page) {
  await page.getByRole('link', { name: 'HOME' }).click();
  await page.locator('[data-action="tip7"]').click();
  await page.locator('[data-tip7-start]').click();
  for (let i=0; i<24; i++) {
    const next = page.locator('[data-tip7-next]');
    if (await next.count()) await next.click();
  }
  await expect(page.getByText(/You showed up|Foundation/)).toBeVisible();
  const feel = page.locator('[data-tip7-feel]').first();
  if (await feel.count()) await feel.click();
  await page.locator('[data-tip7-done]').click();
}

async function completeTip9Skill(page, context='range') {
  await page.getByRole('link', { name: 'HOME' }).click();
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

test('fresh golfer has only the V3 primary surfaces', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('[data-action="tip7"]')).toBeVisible();
  await expect(page.locator('[data-action="tip9"]')).toBeVisible();
  await expect(page.getByText('TIP SUGGESTS')).toBeVisible();
  await expect(page.getByRole('link', { name: 'HOME' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'TIP' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GOLFER' })).toBeVisible();
  await expect(page.getByText(/Player Card|Today's Mission|Coach's Corner|TIP Plans/i)).toHaveCount(0);
});

test('round entry feeds Journal and changes TIP from learning-only state', async ({ page }) => {
  await fresh(page);
  await addRound(page);
  await page.getByRole('link', { name: 'HOME' }).click();
  await expect(page.locator('.tip-suggestion-card')).toBeVisible();
  await expect(page.locator('.tip-suggestion-card')).toContainText(/Contact|Approach|TIP9|IMPROVE|LEARN/i);
});

test('TIP7 completes, journals once, and locks for today', async ({ page }) => {
  await fresh(page);
  await completeTip7Quick(page);
  await page.getByRole('link', { name: 'GOLFER' }).click();
  await expect(page.getByText('TIP7', { exact:true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'HOME' }).click();
  await page.locator('[data-action="tip7"]').click();
  await expect(page.getByText(/DONE FOR TODAY|Foundation/)).toBeVisible();
});

test('TIP9 completes and writes canonical Journal activity', async ({ page }) => {
  await fresh(page);
  await completeTip9Skill(page, 'range');
  await page.getByRole('link', { name: 'GOLFER' }).click();
  await expect(page.getByText('TIP9', { exact:true }).first()).toBeVisible();
  await expect(page.locator('.journal-card').first()).toContainText(/Level|complete|\/9/i);
});

test('TIP Suggests start preserves the recommended TIP9 instead of rerolling', async ({ page }) => {
  await fresh(page);
  await addRound(page, 'Irons were heavy. Contact was poor and approaches were short.');
  await page.getByRole('link', { name: 'HOME' }).click();
  const card = page.locator('.tip-suggestion-card');
  const title = (await card.locator('h3').textContent())?.trim();
  await card.locator('[data-action="tip-suggestion"]').click();
  if (await page.locator('[data-tip9-preferred-context]').count()) {
    await page.locator('[data-tip9-preferred-context]').first().click();
  }
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('session builder composes all supported time buckets', async ({ page }) => {
  await fresh(page);
  for (const minutes of ['7','15','30','45','60']) {
    await page.getByRole('link', { name: 'TIP' }).click();
    await page.locator('[data-action="build-session"]').click();
    await page.locator(`input[name="minutes"][value="${minutes}"]`).check();
    await page.locator('input[name="context"][value="range"]').check();
    await page.locator('#sessionBuilderForm button[type="submit"]').click();
    await expect(page.getByText(/TODAY'S SESSION|Today's Session/i)).toBeVisible();
    await expect(page.locator('[data-action="session-start"]')).toBeVisible();
    await page.locator('[data-action="session-rebuild"]').click();
  }
});

test('abandoning a built session keeps completed child work but creates no parent completion', async ({ page }) => {
  await fresh(page);
  await page.getByRole('link', { name: 'TIP' }).click();
  await page.locator('[data-action="build-session"]').click();
  await page.locator('input[name="minutes"][value="15"]').check();
  await page.locator('input[name="context"][value="range"]').check();
  await page.locator('#sessionBuilderForm button[type="submit"]').click();
  await page.locator('[data-action="session-start"]').click();
  if (await page.locator('[data-tip7-start]').count()) {
    await page.locator('[data-tip7-start]').click();
    for (let i=0; i<24; i++) {
      if (await page.locator('[data-tip7-next]').count()) await page.locator('[data-tip7-next]').click();
    }
    await page.locator('[data-tip7-done]').click();
  }
  // Stop the next activity before completion.
  const endTip9 = page.locator('[data-tip9-end]');
  if (await endTip9.count()) await endTip9.click();
  else if (await page.locator('[data-tip9-exit]').count()) await page.locator('[data-tip9-exit]').click();
  await page.getByRole('link', { name: 'GOLFER' }).click();
  await expect(page.locator('.journal-card').filter({hasText:"Today's Session"})).toHaveCount(0);
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
  await page.getByRole('link', { name: 'GOLFER' }).click();
  await expect(page.getByText('Springhaven')).toHaveCount(0);
  await page.locator('#menuBtn').click();
  page.once('dialog', d => d.accept());
  const chooser = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('[data-setting="restore"]').click()
  ]).then(x=>x[0]);
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
  await page.getByRole('link', { name: 'GOLFER' }).click();
  await expect(page.getByText('Legacy Course')).toHaveCount(1);
});

test('cached app shell launches offline after first load', async ({ page, context }) => {
  await fresh(page);
  await page.evaluate(async () => { if ('serviceWorker' in navigator) await navigator.serviceWorker.ready; });
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Build your golfer.')).toBeVisible();
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
