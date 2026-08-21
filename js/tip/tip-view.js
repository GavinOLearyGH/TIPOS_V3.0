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
  if (!suggestion) return '';
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
      <p class="page-copy">Add to your Golf Journal, ask TIP what to work on next, or browse the full practice library.</p>
    </section>

    ${renderTIPSuggests()}

    <section class="tip-workspace section">
      <div class="tip-workspace-group ${tellOpen ? 'open' : ''}">
        <button class="tip-workspace-row" type="button" data-action="tell-tip" aria-expanded="${tellOpen}">
          <div><div class="eyebrow">TELL TIP</div><h2>Tell TIP about your golf</h2><p>Add a round, practice, lesson, equipment change or note. TIP remembers it and uses what it learns to improve future suggestions.</p></div>
          <span aria-hidden="true">${tellOpen ? '⌄' : '›'}</span>
        </button>
        ${tellOpen ? `<div class="tip-workspace-expand">${workspace.entryHTML || renderEntryTypeChoices()}</div>` : ''}
      </div>

      <div class="tip-workspace-group ${sessionOpen ? 'open' : ''}">
        <button class="tip-workspace-row" type="button" data-action="build-session" aria-expanded="${sessionOpen}">
          <div><div class="eyebrow">ASK TIP</div><h2>Build a custom session</h2><p>Choose your time, location and focus—or let TIP decide. TIP combines your choices with what it knows about your golf.</p></div>
          <span aria-hidden="true">${sessionOpen ? '⌄' : '›'}</span>
        </button>
        ${sessionOpen ? `<div class="tip-workspace-expand">${workspace.sessionHTML || ''}</div>` : ''}
      </div>

      <div class="tip-workspace-group">
        <button class="tip-workspace-row" type="button" data-action="tip-library" aria-label="Browse TIP Library">
          <div><div class="eyebrow">EXPLORE TIP</div><h2>Browse TIP Library</h2><p>Explore the complete Swing, Skill, Stretch and Strength practice curriculum. TIP keeps the coaching connections behind the scenes.</p></div>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  `;
}
