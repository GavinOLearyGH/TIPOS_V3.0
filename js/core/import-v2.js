import { TIPState } from './storage.js';
import { createJournalEntry } from './journal.js';

const KEYS = {
  player:'tip_genesis_player',
  rounds:'tip_genesis_rounds',
  notebook:'tip_os_notebook',
  sessions:'tip_os_sessions',
  memory:'tip_os_living_memory'
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function iso(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function uniqueKey(entry) {
  return `${entry.source}|${entry.type}|${entry.createdAt}|${entry.title}`;
}

function importRounds(rounds) {
  return (Array.isArray(rounds) ? rounds : []).map(round => createJournalEntry({
    id: round.id ? `v2_${round.id}` : undefined,
    createdAt: iso(round.createdAt || round.at || round.date),
    type:'round', source:'v2-import',
    title: round.course || round.courseName || round.title || 'Round',
    dimensions:['skill'],
    metrics:{ score:round.score, fairways:round.fairways ?? round.fw, gir:round.gir, putts:round.putts, penalties:round.penalties },
    reflection:{ text: round.note || round.reflection || '' }
  }));
}

function importSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : []).map(session => createJournalEntry({
    id: session.id ? `v2_${session.id}` : undefined,
    createdAt: iso(session.createdAt || session.at || session.date || session.completedAt),
    type:'practice', source:'v2-import',
    title: session.focus || session.title || session.type || 'Practice',
    dimensions: [],
    metrics:{ duration:session.duration || session.minutes },
    reflection:{ text: session.note || session.detail || session.feeling || session.reflection || '' }
  }));
}

function importNotebook(notes) {
  return (Array.isArray(notes) ? notes : [])
    .filter(note => String(note.text || note.reflection || '').trim())
    .filter(note => !/migration|identity earned/i.test(`${note.type || ''} ${note.title || ''}`))
    .map(note => createJournalEntry({
      id: note.id ? `v2_${note.id}` : undefined,
      createdAt: iso(note.at || note.createdAt || note.date),
      type:/equipment|builder|club|shaft|grip/i.test(`${note.type || ''} ${note.title || ''}`) ? 'equipment' : 'note',
      source:'v2-import',
      title: note.title || note.type || 'Golf Note',
      dimensions: note.foundation ? [String(note.foundation).toLowerCase()] : [],
      reflection:{ text:note.text || note.reflection || '' }
    }));
}

export function detectV2Data() {
  const counts = {
    rounds: read(KEYS.rounds, []).length || 0,
    sessions: read(KEYS.sessions, []).length || 0,
    notes: read(KEYS.notebook, []).length || 0
  };
  const player = read(KEYS.player, null);
  return { available:!!player || counts.rounds + counts.sessions + counts.notes > 0, counts, player };
}

export function importV2FromThisDevice() {
  const found = detectV2Data();
  if (!found.available) throw new Error('No TIP OS V2 golfer data was found on this device.');

  const imported = [
    ...importRounds(read(KEYS.rounds, [])),
    ...importSessions(read(KEYS.sessions, [])),
    ...importNotebook(read(KEYS.notebook, []))
  ];
  const player = read(KEYS.player, {});
  const legacyMemory = read(KEYS.memory, null);

  TIPState.update(state => {
    const existing = new Set(state.journal.map(uniqueKey));
    imported.forEach(entry => {
      if (!existing.has(uniqueKey(entry))) state.journal.push(entry);
    });
    state.journal.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!state.golfer.goal && player?.goal) state.golfer.goal = player.goal;
    if ((state.golfer.handicap === null || state.golfer.handicap === '') && player?.handicap !== undefined) state.golfer.handicap = player.handicap;
    state.meta.v2ImportedAt = new Date().toISOString();
    state.meta.v2ImportCount = imported.length;
    if (legacyMemory && !Object.keys(state.memory.topics || {}).length) state.meta.hasLegacyMemoryForFutureMigration = true;
    return state;
  }, 'state:import-v2');

  return { imported:imported.length, counts:found.counts };
}
