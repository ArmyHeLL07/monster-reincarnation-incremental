import type { GameState } from './state';
import { newGame } from './state';

const KEY = 'mri.save.v1';
const STORY_KEY = 'mri.story.v1';
export const CURRENT_SAVE_VERSION = 1;

type Mode = GameState['mode'];
/** Story mode lives in its own slot so the normal/sandbox save is never touched. */
function keyFor(mode: Mode | undefined): string {
  return mode === 'story' ? STORY_KEY : KEY;
}

/**
 * Merge a raw parsed save with newGame() defaults so that:
 * - New fields added after a save was created get their correct defaults.
 * - Type changes in nested objects don't crash (outer spread wins on conflict).
 * The save keys stay fixed forever; version bumps happen inside the payload.
 */
function migrate(raw: Record<string, unknown>): GameState {
  const base = newGame();
  // Shallow merge: raw fields override base, missing fields fall back to base defaults.
  const merged = { ...base, ...raw, saveVersion: CURRENT_SAVE_VERSION } as GameState;
  // Old saves pre-date raceConfirmed — if a raceId is already set, the player
  // already picked and played their race, so treat it as confirmed.
  if (merged.raceId && !raw['raceConfirmed']) {
    merged.raceConfirmed = true;
  }
  return merged;
}

export function save(state: GameState): void {
  state.lastSeen = Date.now();
  try {
    localStorage.setItem(keyFor(state.mode), JSON.stringify(state));
  } catch {
    // storage unavailable / quota — ignore for the prototype
  }
}

export function load(mode: Mode = 'normal'): GameState | null {
  try {
    const raw = localStorage.getItem(keyFor(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const state = migrate(parsed);
    state.mode = mode; // make sure the loaded state knows which slot it lives in
    return state;
  } catch {
    return null;
  }
}

export function clear(mode: Mode = 'normal'): void {
  try {
    localStorage.removeItem(keyFor(mode));
  } catch {
    // ignore
  }
}

/** True if a save exists in the given slot (drives the menu's "Continue" buttons). */
export function hasSave(mode: Mode = 'normal'): boolean {
  try {
    return localStorage.getItem(keyFor(mode)) !== null;
  } catch {
    return false;
  }
}
