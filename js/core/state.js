export const STATE_VERSION = '3.0';
export const STORAGE_KEY = 'TIP_V3_STATE';

export function createDefaultState() {
  const now = new Date().toISOString();
  return {
    version: STATE_VERSION,
    golfer: {
      createdAt: now,
      goal: '',
      handicap: null
    },
    journal: [],
    memory: {
      version: null,
      topics: {},
      summary: {
        known: 0,
        totalEvidence: 0,
        priority: null,
        strength: null,
        recentSignals: []
      },
      updatedAt: null
    },
    tip7: {
      level: 1,
      day: 1,
      completed: [],
      dates: {},
      feel: {},
      currentStreak: 0,
      bestStreak: 0,
      lifetime: 0,
      lastCompletedAt: null
    },
    tip9: {
      practices: {},
      lifetime: 0,
      recent: []
    },
    preferences: {
      sound: true,
      vibration: true
    },
    meta: {
      createdAt: now,
      updatedAt: now,
      lastBackup: null,
      lastRestore: null,
      importedV2At: null
    }
  };
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

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

export function normalizeState(input) {
  const state = mergeDefaults(createDefaultState(), input || {});
  state.version = STATE_VERSION;
  state.journal = Array.isArray(state.journal) ? state.journal : [];
  state.tip7.completed = Array.isArray(state.tip7.completed) ? state.tip7.completed : [];
  state.tip7.dates = isObject(state.tip7.dates) ? state.tip7.dates : {};
  state.tip7.feel = isObject(state.tip7.feel) ? state.tip7.feel : {};
  state.tip9.recent = Array.isArray(state.tip9.recent) ? state.tip9.recent : [];
  state.tip9.practices = isObject(state.tip9.practices) ? state.tip9.practices : {};
  state.memory = isObject(state.memory) ? state.memory : createDefaultState().memory;
  state.memory.topics = isObject(state.memory.topics) ? state.memory.topics : {};
  state.memory.summary = isObject(state.memory.summary) ? state.memory.summary : createDefaultState().memory.summary;
  state.memory.summary.recentSignals = Array.isArray(state.memory.summary.recentSignals) ? state.memory.summary.recentSignals : [];
  state.meta.updatedAt = new Date().toISOString();
  return state;
}
