import type { NativeRiddle, StatKey } from '@mri/shared';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';
import { allRiddles } from './langContent';

type Log = (e: LogEvent) => void;
/** A reward payload shared by secret rooms and boss riddles. */
export type RiddleReward = { kind: string; value: string | number; amount?: number };

export const RIDDLE_CHANCE_BASE = 0.1;
export const RIDDLE_CHANCE_LUCK = 0.005;
export const RIDDLE_CHANCE_CAP = 0.4;
export const RIDDLE_GUARD_MULT = 1.3;
export const RIDDLE_FAILBOSS_MULT = 1.5;
/** "Fight" difficulty multipliers (Normal / Strong / Brutal). */
export const RIDDLE_FIGHT_MULTS: Record<string, number> = { normal: 1, hard: 1.5, brutal: 2 };
/** Lock durations after 3 wrong normal-riddle guesses: 30 min, then 60 min (capped). */
const LOCK_MS = [30 * 60_000, 60 * 60_000];

/**
 * Fold a riddle answer for forgiving comparison: lowercase, Turkish→ASCII, strip non-alphanumerics.
 * Lives here (not discovery.ts) so both the secret-room and boss-riddle paths share it without a cycle.
 */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/[ıî]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[üû]/g, 'u')
    .replace(/[öô]/g, 'o')
    .replace(/â/g, 'a')
    .replace(/[^a-z0-9]/g, '');
}

/** Apply a riddle/room reward (shared by secret rooms and boss-riddle "skip"). */
export function applyRiddleReward(state: GameState, reward: RiddleReward, _log: Log): void {
  const amt = reward.amount ?? (typeof reward.value === 'number' ? reward.value : 0);
  switch (reward.kind) {
    case 'skill':
      if (typeof reward.value === 'string' && !state.skills.some((s) => s.id === reward.value)) {
        state.skills.push({ id: reward.value, level: 1, exp: 0 });
      }
      break;
    case 'stat':
      if (typeof reward.value === 'string') {
        state.stats[reward.value as StatKey] += amt || 3;
        recomputeMaxes(state);
      }
      break;
    case 'ep':
      state.ep += amt;
      break;
    case 'unlock':
      if (typeof reward.value === 'string' && !state.unlocks.includes(reward.value)) state.unlocks.push(reward.value);
      break;
    case 'fragment':
      if (reward.value === 'map') state.mapFragments += amt || 1;
      else state.loreFragments += amt || 1;
      break;
  }
}

/** A boss room's chance to become a riddle challenge — base + LUCK, capped. */
export function bossRiddleChance(state: GameState): number {
  return Math.min(RIDDLE_CHANCE_CAP, RIDDLE_CHANCE_BASE + state.stats.LUCK * RIDDLE_CHANCE_LUCK);
}

/** A random NATIVE riddle for a boss gate (language-specific pool); null if none loaded. */
export function pickBossRiddle(): NativeRiddle | null {
  const pool = allRiddles();
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

/** Is the typed answer correct (Turkish-folded tolerance)? */
export function checkBossAnswer(riddle: NativeRiddle, answer: string): boolean {
  const norm = normalizeAnswer(answer);
  return norm.length > 0 && riddle.answers.some((a) => normalizeAnswer(a) === norm);
}

// ---- normal secret-room riddle attempt limit -------------------------------

export function isRiddleLocked(state: GameState, roomId: string): boolean {
  const r = state.riddleLimits[roomId];
  return !!r && r.lockUntil > Date.now();
}

export function lockRemainingMin(state: GameState, roomId: string): number {
  const r = state.riddleLimits[roomId];
  if (!r) return 0;
  return Math.max(0, Math.ceil((r.lockUntil - Date.now()) / 60_000));
}

/** Record a wrong guess: bump attempts, lock on the 3rd (escalating duration). Returns true if now locked. */
export function recordRiddleWrong(state: GameState, roomId: string): boolean {
  const r = (state.riddleLimits[roomId] ??= { attempts: 0, lockUntil: 0, lockTier: 0 });
  if (r.lockUntil > Date.now()) return true; // already locked
  r.attempts += 1;
  if (r.attempts >= 3) {
    r.lockUntil = Date.now() + LOCK_MS[Math.min(r.lockTier, LOCK_MS.length - 1)];
    r.lockTier += 1;
    r.attempts = 0; // attempts refresh once the lock expires
    return true;
  }
  return false;
}
