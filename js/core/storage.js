import { STORAGE_KEY, createDefaultState, normalizeState, validateSnapshot } from './state.js';

class LocalStorageProvider {
  constructor(key = STORAGE_KEY) { this.key = key; }
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
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
      return state;
    } catch (error) {
      console.error('TIP storage write failed', error);
      throw new Error('TIP could not save on this device. Check available browser storage and try again.');
    }
  }
  clear() { localStorage.removeItem(this.key); }
}

export class TIPStateStore extends EventTarget {
  constructor(provider = new LocalStorageProvider()) {
    super();
    this.provider = provider;
    this.state = normalizeState(provider.read() || createDefaultState());
    try { this.provider.write(this.state); } catch (error) { console.warn(error.message); }
  }
  get() { return structuredClone(this.state); }
  update(mutator, reason = 'state:update') {
    const draft = this.get();
    const result = mutator(draft) || draft;
    result.meta = result.meta || {};
    result.meta.updatedAt = new Date().toISOString();
    const next = normalizeState(result);
    this.provider.write(next);
    this.state = next;
    this.emit(reason);
    return this.get();
  }
  replace(incoming, reason = 'state:replace') {
    validateSnapshot(incoming);
    const next = normalizeState(incoming);
    this.provider.write(next);
    this.state = next;
    this.emit(reason);
    return this.get();
  }
  reset() {
    const next = createDefaultState();
    this.provider.write(next);
    this.state = next;
    this.emit('state:reset');
    return this.get();
  }
  exportSnapshot() {
    const backedUpAt = new Date().toISOString();
    const next = this.get();
    next.meta.lastBackup = backedUpAt;
    next.meta.updatedAt = backedUpAt;
    this.provider.write(next);
    this.state = next;
    return JSON.stringify(this.get(), null, 2);
  }
  restoreSnapshot(text) {
    let parsed;
    try { parsed = typeof text === 'string' ? JSON.parse(text) : text; }
    catch { throw new Error('That file is not valid JSON.'); }
    validateSnapshot(parsed);
    const restored = normalizeState(parsed);
    restored.meta.lastRestore = new Date().toISOString();
    return this.replace(restored, 'state:restore');
  }
  emit(reason) {
    this.dispatchEvent(new CustomEvent('change', { detail: { reason, state: this.get() } }));
  }
}

export const TIPState = new TIPStateStore();
