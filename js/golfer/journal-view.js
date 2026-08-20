import { getRecentJournal } from '../core/journal.js';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
}

function prettyDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

function entryHTML(entry) {
  const note = entry.reflection?.text || '';
  return `
    <article class="card">
      <div class="card-top">
        <div>
          <div class="eyebrow">${esc(entry.type)}</div>
          <h3>${esc(entry.title)}</h3>
        </div>
        <small>${esc(prettyDate(entry.createdAt))}</small>
      </div>
      ${note ? `<p>${esc(note)}</p>` : ''}
    </article>
  `;
}

export function renderGolfer() {
  const entries = getRecentJournal(10);
  return `
    <section>
      <div class="eyebrow">GOLFER</div>
      <h1 class="page-title">Journal.</h1>
      <p class="page-copy">Your golf has a memory. Rounds, practice, TIP7, TIP9 and the things worth remembering live here.</p>
    </section>

    <section class="section">
      <button class="primary-button" type="button" data-action="add-entry">+ ADD ENTRY</button>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <div class="eyebrow">YOUR GOLF</div>
          <h2>${entries.length ? 'Recent entries' : 'Nothing here yet'}</h2>
        </div>
      </div>
      ${entries.length ? `<div class="journal-preview">${entries.map(entryHTML).join('')}</div>` : `<div class="empty-state">The Journal is intentionally empty. V3.0-B adds round, practice and note entry flows; TIP7 and TIP9 will then write here automatically.</div>`}
    </section>
  `;
}
