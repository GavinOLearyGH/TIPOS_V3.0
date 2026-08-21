import { TIPState } from '../core/storage.js';
import { getTIPSuggestion, suggestionModeLabel } from '../coach/recommend.js';

const ENTRY_TYPES = [
  ['round','Round','Score, stats, course, notes'],
  ['practice','Practice','Range, short game, putting'],
  ['lesson','Lesson','What we worked on'],
  ['equipment','Equipment','Change, adjustment, test'],
  ['note','Note','Anything worth remembering']
];

function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function renderEntryTypeChoices() {
  return `<div class="tip-entry-types" aria-label="Choose Journal entry type">
    ${ENTRY_TYPES.map(([key,label,copy]) => `<button type="button" class="tip-entry-type" data-action="tip-entry-type" data-entry-type="${key}"><span><strong>${label}</strong><small>${copy}</small></span><b aria-hidden="true">›</b></button>`).join('')}
  </div>`;
}

function renderTIPSuggests() {
  const state = TIPState.get();
  const totalEvidence = Number(state.memory?.summary?.totalEvidence || 0);
  if (totalEvidence <= 0) return '';
  const suggestion = getTIPSuggestion();
  return `
    <section class="tip-suggests section" aria-label="TIP Suggests">
      <div class="eyebrow">TIP SUGGESTS</div>
      <article class="tip-suggests-row">
        <div class="tip-suggests-main">
          <div class="tip-suggests-meta">${esc(suggestionModeLabel(suggestion.mode))} · ${esc(suggestion.label)}</div>
          <h2>${esc(suggestion.title)}</h2>
          <p>${esc(suggestion.reason)}</p>
        </div>
        <button class="tip-suggests-start" type="button" data-action="tip-suggestion">START</button>
      </article>
    </section>
  `;
}

export function renderTIP(workspace = {}) {
  const mode = workspace.mode || null;
  const tellOpen = mode === 'entry-types' || mode === 'entry';
  const sessionOpen = mode === 'session' || mode === 'session-plan';
  return `
    <section class="page-header tip-page-header">
      <div class="eyebrow">TIP</div>
      <h1 class="page-title">How can TIP help today?</h1>
      <p class="page-copy">Tell TIP what happened, or let TIP build the work.</p>
    </section>

    ${renderTIPSuggests()}

    <section class="tip-workspace section">
      <div class="tip-workspace-group ${tellOpen ? 'open' : ''}">
        <button class="tip-workspace-row" type="button" data-action="tell-tip" aria-expanded="${tellOpen}">
          <div><div class="eyebrow">TELL TIP</div><h2>Tell TIP what you did</h2><p>Round · Practice · Lesson · Equipment · Note</p></div>
          <span aria-hidden="true">${tellOpen ? '⌄' : '›'}</span>
        </button>
        ${tellOpen ? `<div class="tip-workspace-expand">${workspace.entryHTML || renderEntryTypeChoices()}</div>` : ''}
      </div>

      <div class="tip-workspace-group ${sessionOpen ? 'open' : ''}">
        <button class="tip-workspace-row" type="button" data-action="build-session" aria-expanded="${sessionOpen}">
          <div><div class="eyebrow">TODAY'S WORK</div><h2>Build today's session</h2><p>Time · place · what TIP knows about your golf</p></div>
          <span aria-hidden="true">${sessionOpen ? '⌄' : '›'}</span>
        </button>
        ${sessionOpen ? `<div class="tip-workspace-expand">${workspace.sessionHTML || ''}</div>` : ''}
      </div>
    </section>
  `;
}
