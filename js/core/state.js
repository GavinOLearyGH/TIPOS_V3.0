export const STATE_VERSION = '3.0';
export const STORAGE_KEY = 'TIP_V3_STATE';

export function createDefaultState() {
  const now = new Date().toISOString();
  return {
    version: STATE_VERSION,
    golfer: { createdAt: now, goal: '', handicap: null },
    journal: [],
    memory: {
      version: null,
      topics: {},
      summary: { known:0,totalEvidence:0,priority:null,strength:null,recentSignals:[] },
      updatedAt: null
    },
    tip7: {
      level:1, day:1, completed:[], dates:{}, feel:{}, currentStreak:0, bestStreak:0, lifetime:0, lastCompletedAt:null
    },
    tip9: { practices:{}, lifetime:0, recent:[] },
    preferences: { sound:true, vibration:true, welcomeSeen:false },
    meta: {
      createdAt:now, updatedAt:now, lastBackup:null, lastRestore:null, v2ImportedAt:null, v2ImportCount:0
    }
  };
}

function isObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }

function mergeDefaults(defaults, incoming) {
  if (!isObject(defaults)) return incoming ?? defaults;
  const result = { ...defaults };
  if (!isObject(incoming)) return result;
  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) result[key] = value;
    else if (isObject(value) && isObject(defaults[key])) result[key] = mergeDefaults(defaults[key], value);
    else result[key] = value;
  }
  return result;
}

function validIso(value, fallback) {
  const time = new Date(value || '').getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : fallback;
}

export function normalizeState(input) {
  const defaults = createDefaultState();
  const state = mergeDefaults(defaults, input || {});
  state.version = STATE_VERSION;
  state.golfer = isObject(state.golfer) ? state.golfer : defaults.golfer;
  state.golfer.createdAt = validIso(state.golfer.createdAt, defaults.golfer.createdAt);
  state.journal = Array.isArray(state.journal) ? state.journal.filter(x=>isObject(x)) : [];
  state.tip7 = isObject(state.tip7) ? state.tip7 : defaults.tip7;
  state.tip7.completed = Array.isArray(state.tip7.completed) ? [...new Set(state.tip7.completed.map(Number).filter(Number.isFinite))] : [];
  state.tip7.dates = isObject(state.tip7.dates) ? state.tip7.dates : {};
  state.tip7.feel = isObject(state.tip7.feel) ? state.tip7.feel : {};
  state.tip9 = isObject(state.tip9) ? state.tip9 : defaults.tip9;
  state.tip9.recent = Array.isArray(state.tip9.recent) ? state.tip9.recent : [];
  state.tip9.practices = isObject(state.tip9.practices) ? state.tip9.practices : {};
  state.memory = isObject(state.memory) ? state.memory : defaults.memory;
  state.memory.topics = isObject(state.memory.topics) ? state.memory.topics : {};
  state.memory.summary = isObject(state.memory.summary) ? state.memory.summary : defaults.memory.summary;
  state.memory.summary.recentSignals = Array.isArray(state.memory.summary.recentSignals) ? state.memory.summary.recentSignals : [];
  state.preferences = isObject(state.preferences) ? state.preferences : defaults.preferences;
  state.preferences.sound = state.preferences.sound !== false;
  state.preferences.vibration = state.preferences.vibration !== false;
  state.preferences.welcomeSeen = state.preferences.welcomeSeen === true;
  state.meta = isObject(state.meta) ? state.meta : defaults.meta;
  state.meta.createdAt = validIso(state.meta.createdAt, defaults.meta.createdAt);
  state.meta.updatedAt = new Date().toISOString();
  return state;
}

export function validateSnapshot(input) {
  if (!isObject(input)) throw new Error('That file does not contain a valid golfer.');
  if (input.version && String(input.version) !== STATE_VERSION) throw new Error(`This golfer file uses version ${input.version}. V3.0 can only restore V3.0 snapshots.`);
  if (!Array.isArray(input.journal)) throw new Error('The golfer file is missing its Journal.');
  if (input.tip7 !== undefined && !isObject(input.tip7)) throw new Error('The golfer file has invalid TIP7 progress.');
  if (input.tip9 !== undefined && !isObject(input.tip9)) throw new Error('The golfer file has invalid TIP9 progress.');
  return true;
}
