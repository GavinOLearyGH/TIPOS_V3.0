import { addJournalEntry, getJournalEntry, updateJournalEntry } from '../core/journal.js';

const TYPE_META = {
  round: { label:'Round', title:'Course or round name' },
  practice: { label:'Practice', title:'What did you practice?' },
  lesson: { label:'Lesson', title:'Lesson or coach' },
  equipment: { label:'Equipment', title:'What changed?' },
  note: { label:'Note', title:'Title' }
};

const TOPICS = {
  round:['teeControl','approachPlay','puttingPace','shortGame','routine'],
  practice:['contact','tempo','teeControl','approachPlay','wedgeDistance','puttingStartLine','puttingPace','shortGame'],
  lesson:['contact','tempo','startDirection','lowPoint','routine'],
  equipment:['equipment'],
  note:[]
};

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
}

function localInputDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0,16);
}

function numberField(name, label, value = '', min = 0) {
  return `<label class="field"><span>${label}</span><input name="${name}" type="number" inputmode="numeric" min="${min}" value="${value ?? ''}"></label>`;
}

function typeFields(type, entry = null, inline = false) {
  const m = entry?.metrics || {};
  if (type === 'round') {
    const stats = `<div class="metric-grid compact-metrics round-evidence-metrics">
      ${numberField('fairways','Fairways',m.fairways)}
      ${numberField('gir','GIR',m.gir)}
      ${numberField('putts','Putts',m.putts)}
      ${numberField('upDowns','Up & Downs',m.upDowns)}
      ${numberField('penalties','Penalties',m.penalties)}
    </div>`;
    return `${numberField('score','Score',m.score)}${stats}`;
  }
  if (type === 'practice') return `<div class="metric-grid compact-metrics">${numberField('duration','Minutes',m.duration)}${numberField('balls','Balls / reps',m.balls)}</div>`;
  if (type === 'lesson') return `${numberField('duration','Minutes',m.duration)}`;
  return '';
}

function topicChips(type, selected = [], inline = false) {
  const topics = TOPICS[type] || [];
  if (!topics.length) return '';
  const chips = `<fieldset class="field"><legend>Focus <small>optional</small></legend><div class="chip-grid">${topics.map(topic => `
    <label class="check-chip"><input type="checkbox" name="topics" value="${topic}" ${selected.includes(topic)?'checked':''}><span>${esc(topic.replace(/([A-Z])/g,' $1'))}</span></label>`).join('')}</div></fieldset>`;
  return inline ? `<details class="entry-details"><summary>Focus <span>optional</span></summary>${chips}</details>` : chips;
}

export function renderEntryForm(entryId = null, forcedType = null, options = {}) {
  const entry = entryId ? getJournalEntry(entryId) : null;
  const type = forcedType || entry?.type || 'round';
  const meta = TYPE_META[type] || TYPE_META.note;
  const inline = options.inline === true && !entry;
  return `
    <form id="journalEntryForm" class="entry-form ${inline ? 'entry-form-inline' : ''}" data-entry-id="${esc(entryId || '')}" data-entry-type="${esc(type)}">
      <div class="entry-form-head">
        <div><div class="eyebrow">${entry ? 'EDIT' : 'TELL TIP'}</div><h2>${esc(meta.label)}</h2></div>
        ${inline ? `<button type="button" class="text-button" data-action="tip-entry-change">← Change type</button>` : `<button type="button" class="icon-button" data-entry-close aria-label="Close">×</button>`}
      </div>
      ${!entry && !inline ? `<div class="type-tabs">${Object.entries(TYPE_META).map(([key,value]) => `<button type="button" data-entry-type-choice="${key}" class="${key===type?'active':''}">${value.label}</button>`).join('')}</div>` : ''}
      <label class="field"><span>${esc(meta.title)}</span><input name="title" required maxlength="80" value="${esc(entry?.title || '')}" placeholder="${esc(meta.title)}"></label>
      <label class="field field-date"><span>Date & time</span><input name="createdAt" type="datetime-local" value="${localInputDate(entry?.createdAt)}"></label>
      ${typeFields(type, entry, inline)}
      <label class="field"><span>${type==='round' ? 'What happened?' : 'What should TIP remember?'}</span><textarea name="note" rows="${inline ? 3 : 5}" maxlength="1200" placeholder="A short note is enough.">${esc(entry?.reflection?.text || '')}</textarea></label>
      ${topicChips(type, entry?.topics || [], inline)}
      <button class="primary-button" type="submit">${entry ? 'SAVE CHANGES' : 'SAVE TO JOURNAL'}</button>
    </form>`;
}

export function formToEntry(form) {
  const data = new FormData(form);
  const type = form.dataset.entryType || 'note';
  const topics = data.getAll('topics');
  const metrics = {};
  ['score','fairways','gir','putts','upDowns','penalties','duration','balls'].forEach(key => {
    const value = data.get(key);
    if (value !== null && value !== '') metrics[key] = value;
  });
  const dimensions = type === 'equipment' ? [] : type === 'round' || type === 'practice' ? ['skill'] : [];
  return {
    type,
    source:'manual',
    title:data.get('title'),
    createdAt:data.get('createdAt') ? new Date(data.get('createdAt')).toISOString() : new Date().toISOString(),
    dimensions,
    topics,
    metrics,
    reflection:{ text:data.get('note') || '' }
  };
}

export function saveEntryForm(form) {
  const payload = formToEntry(form);
  const id = form.dataset.entryId;
  return id ? updateJournalEntry(id, payload) : addJournalEntry(payload);
}
