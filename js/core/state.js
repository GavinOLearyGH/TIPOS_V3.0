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
      topics: {},
      updatedAt: null
    },
    tip7: {
      level: 1,
      day: 1,
      completed: [],
      currentStreak: 0,
      bestStreak: 0,
      lifetime: 0
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
      lastBackup: null
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
  state.tip9.recent = Array.isArray(state.tip9.recent) ? state.tip9.recent : [];
  state.tip9.practices = isObject(state.tip9.practices) ? state.tip9.practices : {};
  state.memory.topics = isObject(state.memory.topics) ? state.memory.topics : {};
  state.meta.updatedAt = new Date().toISOString();
  return state;
}
