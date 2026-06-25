import type { GameState } from './state';
import { newGame } from './state';

const KEY = 'mri.save.v1';
export const CURRENT_SAVE_VERSION = 1;

/**
 * Merge a raw parsed save with newGame() defaults so that:
 * - New fields added after a save was created get their correct defaults.
 * - Type changes in nested objects don't crash (outer spread wins on conflict).
 * The save key stays 'mri.save.v1' forever; version bumps happen inside the payload.
 */
function migrate(raw: Record<string, unknown>): GameState {
  const base = newGame();
  // Shallow merge: raw fields override base, missing fields fall back to base defaults.
  return { ...base, ...raw, saveVersion: CURRENT_SAVE_VERSION } as GameState;
}

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
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrate(parsed);
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
