import { STORAGE_KEY, createDefaultState, normalizeState } from './state.js';

class LocalStorageProvider {
  constructor(key = STORAGE_KEY) {
    this.key = key;
  }

  read() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('TIP storage read failed', error);
      return null;
    }
  }

  write(state) {
    localStorage.setItem(this.key, JSON.stringify(state));
    return state;
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

export class TIPStateStore extends EventTarget {
  constructor(provider = new LocalStorageProvider()) {
    super();
    this.provider = provider;
    this.state = normalizeState(provider.read() || createDefaultState());
    this.provider.write(this.state);
  }

  get() {
    return structuredClone(this.state);
  }

  update(mutator, reason = 'state:update') {
    const draft = this.get();
    const result = mutator(draft) || draft;
    result.meta = result.meta || {};
    result.meta.updatedAt = new Date().toISOString();
    this.state = normalizeState(result);
    this.provider.write(this.state);
    this.emit(reason);
    return this.get();
  }

  replace(incoming, reason = 'state:replace') {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      throw new Error('Invalid golfer file.');
    }
    this.state = normalizeState(incoming);
    this.provider.write(this.state);
    this.emit(reason);
    return this.get();
  }

  reset() {
    this.state = createDefaultState();
    this.provider.write(this.state);
    this.emit('state:reset');
    return this.get();
  }

  exportSnapshot() {
    const backedUpAt = new Date().toISOString();
    this.state.meta.lastBackup = backedUpAt;
    this.state.meta.updatedAt = backedUpAt;
    this.provider.write(this.state);
    return JSON.stringify(this.get(), null, 2);
  }

  restoreSnapshot(text) {
    let parsed;
    try {
      parsed = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      throw new Error('That file is not valid JSON.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('That file does not contain a valid golfer.');
    }
    if (!Array.isArray(parsed.journal) && parsed.version === '3.0') {
      throw new Error('The V3 golfer file is missing its Journal.');
    }
    const restored = normalizeState(parsed);
    restored.meta.lastRestore = new Date().toISOString();
    return this.replace(restored, 'state:restore');
  }

  emit(reason) {
    this.dispatchEvent(new CustomEvent('change', { detail: { reason, state: this.get() } }));
  }
}

export const TIPState = new TIPStateStore();
