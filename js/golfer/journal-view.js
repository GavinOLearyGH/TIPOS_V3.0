import { getJournal } from '../core/journal.js';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]);
}

function prettyDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

function metricLine(entry) {
  if (entry.type === 'tip7') {
    const seconds = Number(entry.activity?.durationSeconds || 0);
    const duration = seconds ? `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}` : '';
    const parts = [`Day ${entry.result?.day || entry.activity?.day || ''}`, 'Level 1', duration].filter(Boolean);
    return `<div class="journal-metrics">${parts.map(esc).join('<span>·</span>')}</div>`;
  }

  const m = entry.metrics || {};
  const parts = [];
  if (m.score != null) parts.push(`<strong>${esc(m.score)}</strong> score`);
  if (m.fairways != null) parts.push(`${esc(m.fairways)} FW`);
  if (m.gir != null) parts.push(`${esc(m.gir)} GIR`);
  if (m.putts != null) parts.push(`${esc(m.putts)} putts`);
  if (m.penalties != null) parts.push(`${esc(m.penalties)} penalties`);
  if (m.duration != null) parts.push(`${esc(m.duration)} min`);
  if (m.balls != null) parts.push(`${esc(m.balls)} balls/reps`);
  return parts.length ? `<div class="journal-metrics">${parts.join('<span>·</span>')}</div>` : '';
}

function entryHTML(entry) {
  const note = entry.reflection?.text || '';
  const imported = entry.source === 'v2-import' ? '<span class="source-pill">V2</span>' : '';
  const automatic = entry.source === 'tip7' || entry.source === 'tip9';
  return `
    <article class="card journal-card">
      <div class="card-top">
        <div>
          <div class="eyebrow">${esc(entry.type)} ${imported}</div>
          <h3>${esc(entry.title)}</h3>
        </div>
        <small>${esc(prettyDate(entry.createdAt))}</small>
      </div>
      ${metricLine(entry)}
      ${note ? `<p class="journal-note">${esc(note)}</p>` : ''}
      ${entry.topics?.length ? `<div class="journal-tags">${entry.topics.map(t => `<span>${esc(t.replace(/([A-Z])/g,' $1'))}</span>`).join('')}</div>` : ''}
      ${automatic ? `<div class="card-meta">Saved automatically by ${esc(entry.source.toUpperCase())}.</div>` : `<div class="journal-actions"><button type="button" data-action="edit-entry" data-entry-id="${esc(entry.id)}">Edit</button><button type="button" data-action="delete-entry" data-entry-id="${esc(entry.id)}">Delete</button></div>`}
    </article>`;
}

export function renderGolfer() {
  const entries = getJournal();
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
      <div class="section-head"><div><div class="eyebrow">YOUR GOLF</div><h2>${entries.length ? `${entries.length} ${entries.length===1?'entry':'entries'}` : 'Nothing here yet'}</h2></div></div>
      ${entries.length ? `<div class="journal-preview">${entries.map(entryHTML).join('')}</div>` : `<div class="empty-state"><strong>Start with what happened.</strong><p>Add a round, practice, lesson, equipment change or simple note. TIP7 now writes here automatically.</p></div>`}
    </section>`;
}
