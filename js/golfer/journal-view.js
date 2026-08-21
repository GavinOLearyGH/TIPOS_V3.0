import { addJournalEntry, getJournal } from '../core/journal.js';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
function prettyDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; return date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); }
function metricLine(entry) {
  if (entry.type === 'tip7') {
    const seconds = Number(entry.activity?.durationSeconds || 0); const duration = seconds ? `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}` : '';
    const parts = [`Day ${entry.result?.day || entry.activity?.day || ''}`, 'Level 1', duration].filter(Boolean);
    return parts.join(' · ');
  }
  if (entry.type === 'tip9') {
    const result=entry.result||{}; const context=String(entry.context?.practiceContext||'').replace('range','Range').replace('bay','Hitting Bay').replace('green','Putting Green').replace('short','Short Game').replace('noball','No Ball');
    const score=result.practiceType==='SKILL'&&result.score!=null?`${result.score}/9`:result.practiceType==='SWING'?'9 complete':'';
    return [result.practiceType,`Level ${result.level||1}`,context,score].filter(Boolean).join(' · ');
  }
  if (entry.type === 'session') {
    const blocks=Number(entry.result?.completedBlocks||0); const context=entry.context?.sessionContextLabel||''; const duration=entry.metrics?.duration!=null?`${entry.metrics.duration} min`:'';
    return [duration,context,`${blocks} ${blocks===1?'activity':'activities'}`].filter(Boolean).join(' · ');
  }
  const m = entry.metrics || {}; const parts = [];
  if (m.score != null) parts.push(`${m.score} score`);
  if (m.fairways != null) parts.push(`${m.fairways} FW`);
  if (m.gir != null) parts.push(`${m.gir} GIR`);
  if (m.putts != null) parts.push(`${m.putts} putts`);
  if (m.penalties != null) parts.push(`${m.penalties} ${Number(m.penalties)===1?'penalty':'penalties'}`);
  if (m.duration != null) parts.push(`${m.duration} min`);
  if (m.balls != null) parts.push(`${m.balls} balls/reps`);
  return parts.join(' · ');
}
function entryHTML(entry) {
  const note = entry.reflection?.text || '';
  const imported = entry.source === 'v2-import' ? '<span class="source-pill">V2</span>' : '';
  const automatic = entry.source === 'tip7' || entry.source === 'tip9' || entry.source === 'tip-session';
  const metrics = metricLine(entry);
  return `
    <article class="journal-row">
      <div class="journal-row-head">
        <div class="journal-row-type">${esc(entry.type)} ${imported}</div>
        <div class="journal-row-date">${esc(prettyDate(entry.createdAt))}</div>
      </div>
      <div class="journal-row-main">
        <div class="journal-row-content">
          <h3>${esc(entry.title)}</h3>
          ${metrics ? `<p class="journal-row-metrics">${esc(metrics)}</p>` : ''}
          ${note ? `<p class="journal-row-note">${esc(note)}</p>` : ''}
          ${entry.topics?.length ? `<div class="journal-row-tags">${entry.topics.slice(0,3).map(t => `<span>${esc(t.replace(/([A-Z])/g,' $1'))}</span>`).join('')}</div>` : ''}
          ${automatic ? `<div class="journal-row-source">Saved by ${entry.source==='tip-session'?'TIP':esc(entry.source.toUpperCase())}</div>` : ''}
        </div>
        ${automatic ? '' : `
          <details class="journal-more">
            <summary aria-label="Entry actions">•••</summary>
            <div class="journal-more-menu">
              <button type="button" data-action="edit-entry" data-entry-id="${esc(entry.id)}">Edit</button>
              <button type="button" data-action="delete-entry" data-entry-id="${esc(entry.id)}">Delete</button>
            </div>
          </details>`}
      </div>
    </article>`;
}
function quickNoteHTML(){
  return `<details class="journal-quick-note">
    <summary class="journal-add-button">+ ADD NOTE</summary>
    <form id="quickJournalNoteForm" class="entry-form entry-form-inline journal-quick-note-form">
      <div>
        <div class="eyebrow">ADD A NOTE</div>
        <h2>What do you want TIP to remember?</h2>
      </div>
      <label class="field">
        <span class="sr-only">Journal note</span>
        <textarea name="note" required maxlength="2000" placeholder="A thought, feel, result or anything worth remembering…"></textarea>
      </label>
      <div class="journal-quick-note-actions">
        <button class="journal-note-cancel" type="button" data-journal-note-cancel>CANCEL</button>
        <button class="primary-button journal-note-save" type="submit">SAVE NOTE</button>
      </div>
    </form>
  </details>`;
}
export function renderGolfer() {
  const entries = getJournal();
  const countLabel = `${entries.length} ${entries.length===1?'ENTRY':'ENTRIES'}`;
  return `
    <section class="page-header journal-page-header">
      <div class="eyebrow">GOLFER</div>
      <h1 class="page-title">Journal.</h1>
      <p class="page-copy">Everything TIP remembers about your golf.</p>
    </section>
    <section class="journal-toolbar">
      ${quickNoteHTML()}
    </section>
    <section class="journal-section">
      <div class="journal-section-label"><span>YOUR GOLF</span>${entries.length ? `<small>${countLabel}</small>` : ''}</div>
      ${entries.length ? `<div class="journal-preview">${entries.map(entryHTML).join('')}</div>` : `
        <div class="journal-empty">
          <strong>Nothing here yet.</strong>
          <p>Tell TIP about a round or practice, or add a quick note here whenever something is worth remembering.</p>
        </div>`}
    </section>`;
}

// Quick Journal Note intentionally stays local to the Journal view. The canonical
// Journal write triggers the normal TIP Memory rebuild and Golfer re-render.
document.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'quickJournalNoteForm') return;
  event.preventDefault();
  const text = String(new FormData(form).get('note') || '').trim();
  if (!text) return;
  // Release the mobile text control before the Journal re-renders. Combined with
  // a 16px input font this prevents iOS Safari retaining a focused/zoomed viewport.
  form.querySelector('textarea[name="note"]')?.blur();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  addJournalEntry({ type:'note', source:'journal-quick-note', title:'Note', note:text });
  requestAnimationFrame(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  });
});

document.addEventListener('click', event => {
  const cancel = event.target.closest?.('[data-journal-note-cancel]');
  if (!cancel) return;
  cancel.closest('details')?.removeAttribute('open');
});
