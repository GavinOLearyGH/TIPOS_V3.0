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
    this.dispatchEvent(new CustomEvent('change', { detail: { reason, state: this.get() } }));
    return this.get();
  }

  reset() {
    this.state = createDefaultState();
    this.provider.write(this.state);
    this.dispatchEvent(new CustomEvent('change', { detail: { reason: 'state:reset', state: this.get() } }));
    return this.get();
  }

  exportSnapshot() {
    const snapshot = this.get();
    snapshot.meta.lastBackup = new Date().toISOString();
    this.state.meta.lastBackup = snapshot.meta.lastBackup;
    this.provider.write(this.state);
    return JSON.stringify(snapshot, null, 2);
  }
}

export const TIPState = new TIPStateStore();
