import type { GameState } from './state';

const KEY = 'mri.save.v1';

export function save(state: GameState): void {
  state.lastSeen = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable / quota — ignore for the prototype
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
