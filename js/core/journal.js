import { TIPState } from './storage.js';

export const JOURNAL_TYPES = ['round','practice','lesson','equipment','note','tip7','tip9','session'];
const ALLOWED_TYPES = new Set(JOURNAL_TYPES);

function makeId(prefix = 'jrn') {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function cleanNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function createJournalEntry(input = {}) {
  const now = new Date().toISOString();
  const type = ALLOWED_TYPES.has(input.type) ? input.type : 'note';
  const metrics = {};
  for (const [key, value] of Object.entries(input.metrics || {})) {
    const n = cleanNumber(value);
    if (n !== null) metrics[key] = n;
  }
  return {
    id: input.id || makeId(),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    type,
    source: input.source || 'manual',
    title: String(input.title || '').trim() || type.toUpperCase(),
    dimensions: Array.isArray(input.dimensions) ? [...new Set(input.dimensions.filter(Boolean))] : [],
    topics: Array.isArray(input.topics) ? [...new Set(input.topics.filter(Boolean))] : [],
    context: input.context && typeof input.context === 'object' ? input.context : {},
    metrics,
    result: input.result && typeof input.result === 'object' ? input.result : {},
    reflection: { text: String(input.reflection?.text || input.note || '').trim() },
    activity: input.activity || null
  };
}

export function addJournalEntry(input) {
  const entry = createJournalEntry(input);
  TIPState.update(state => {
    state.journal.unshift(entry);
    return state;
  }, 'journal:add');
  return entry;
}

export function updateJournalEntry(entryId, input) {
  let updated = null;
  TIPState.update(state => {
    const index = state.journal.findIndex(entry => entry.id === entryId);
    if (index < 0) return state;
    updated = createJournalEntry({ ...state.journal[index], ...input, id: entryId, updatedAt: new Date().toISOString() });
    state.journal[index] = updated;
    return state;
  }, 'journal:update');
  return updated;
}

export function deleteJournalEntry(entryId) {
  let removed = null;
  TIPState.update(state => {
    const index = state.journal.findIndex(entry => entry.id === entryId);
    if (index < 0) return state;
    [removed] = state.journal.splice(index, 1);
    return state;
  }, 'journal:delete');
  return removed;
}

export function getJournal() {
  return TIPState.get().journal
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getJournalEntry(entryId) {
  return getJournal().find(entry => entry.id === entryId) || null;
}

export function getRecentJournal(limit = 10) {
  return getJournal().slice(0, Math.max(0, limit));
}
