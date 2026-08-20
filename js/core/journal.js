import { TIPState } from './storage.js';

const ALLOWED_TYPES = new Set(['round','practice','tip7','tip9','lesson','equipment','note','session']);

function id(prefix = 'jrn') {
  if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export function createJournalEntry(input = {}) {
  const now = new Date().toISOString();
  const type = ALLOWED_TYPES.has(input.type) ? input.type : 'note';
  return {
    id: input.id || id(),
    createdAt: input.createdAt || now,
    type,
    source: input.source || 'manual',
    title: String(input.title || '').trim() || type.toUpperCase(),
    dimensions: Array.isArray(input.dimensions) ? input.dimensions.filter(Boolean) : [],
    topics: Array.isArray(input.topics) ? input.topics.filter(Boolean) : [],
    context: input.context && typeof input.context === 'object' ? input.context : {},
    metrics: input.metrics && typeof input.metrics === 'object' ? input.metrics : {},
    result: input.result && typeof input.result === 'object' ? input.result : {},
    reflection: {
      text: String(input.reflection?.text || input.note || '').trim()
    },
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

export function getJournal() {
  return TIPState.get().journal;
}

export function getRecentJournal(limit = 5) {
  return getJournal().slice(0, Math.max(0, limit));
}
