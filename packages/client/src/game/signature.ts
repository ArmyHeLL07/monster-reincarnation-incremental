import type { DamageType } from '@mri/shared';
import type { GameState } from './state';

/** Maximum of the numeric signature gauge per race. 0 = race uses sigAbsorb or no gauge. */
export const SIG_MAX: Record<string, number> = {
  spider: 100,   // web gauge: fills at rest, discharges at combat start as a trap
  wyrmling: 10,  // heat stacks: build on each attack, burst at max into bonus fire damage
  skeleton: 20,  // bone stacks: +1 per kill, each gives +1 flat armor, decay slowly
  golem: 5,      // stone layers (float 0–5): build at rest, ALL layers absorb the next hit then reset
  slime: 0,      // uses sigAbsorb: absorbs the element of the last killed enemy (temp resistance)
  human: 0,      // no gauge — humanoid equipment access is their signature advantage
};

const GOLEM_BUILD_RATE = 1 / 60; // one full stone layer per 60 rest ticks (~1 min)

/** Current signature gauge, hardened against undefined/NaN from old saves (NaN ?? 0 is still NaN). */
function sigCur(state: GameState): number {
  return Number.isFinite(state.sig) ? state.sig : 0;
}

/** Called each REST tick — build passive resources. */
export function sigRestTick(state: GameState): void {
  switch (state.raceId) {
    case 'spider':
      state.sig = Math.min(SIG_MAX.spider, sigCur(state) + 2);
      break;
    case 'golem':
      state.sig = Math.min(SIG_MAX.golem, sigCur(state) + GOLEM_BUILD_RATE);
      break;
    case 'slime':
      if (state.sigAbsorb) {
        state.sigAbsorb.ticks -= 1;
        if (state.sigAbsorb.ticks <= 0) state.sigAbsorb = null;
      }
      break;
  }
}

/** Called each COMBAT tick — passive decay / absorb countdown. */
export function sigCombatTick(state: GameState): void {
  switch (state.raceId) {
    case 'skeleton':
      // Bones slowly crumble in the heat of battle (~1 bone per 200 ticks)
      if (sigCur(state) > 0 && Math.random() < 0.005) state.sig = Math.max(0, sigCur(state) - 1);
      break;
    case 'slime':
      if (state.sigAbsorb) {
        state.sigAbsorb.ticks -= 1;
        if (state.sigAbsorb.ticks <= 0) state.sigAbsorb = null;
      }
      break;
  }
}

/** Called on each KILL — race-specific rewards. */
export function sigOnKill(state: GameState, enemyDmgType: DamageType): void {
  switch (state.raceId) {
    case 'skeleton':
      state.sig = Math.min(SIG_MAX.skeleton, sigCur(state) + 1);
      break;
    case 'slime':
      // Absorb the element of whoever was just defeated (physical is everywhere — skip it)
      if (enemyDmgType !== 'physical') {
        state.sigAbsorb = { type: enemyDmgType, ticks: 120 };
      }
      break;
    case 'golem':
      // Pulverising an enemy rewards a sliver of stone
      state.sig = Math.min(SIG_MAX.golem, sigCur(state) + 0.1);
      break;
  }
}

/**
 * Called at COMBAT START (each enemy spawn) — spider discharges web gauge.
 * Returns bonus trap damage to apply to the freshly spawned enemy.
 */
export function sigCombatStart(state: GameState): number {
  if (state.raceId !== 'spider' || sigCur(state) <= 0) return 0;
  const dmg = Math.round((sigCur(state) / 100) * (state.stats.STR * 2 + state.level));
  state.sig = 0; // web discharged
  return dmg;
}

/**
 * Called after each SUCCESSFUL SKILL CAST (wyrmling only).
 * Builds heat; returns bonus fire damage when the gauge maxes out and resets.
 */
export function sigOnAttack(state: GameState): number {
  if (state.raceId !== 'wyrmling') return 0;
  state.sig = Math.min(SIG_MAX.wyrmling, sigCur(state) + 1);
  if (state.sig >= SIG_MAX.wyrmling) {
    state.sig = 0;
    return Math.round(state.stats.INT * 3 + state.level * 2);
  }
  return 0;
}

/** Flat armor bonus from skeleton bone stacks — fed into aggregateBonuses. */
export function sigBoneArmor(state: GameState): number {
  return state.raceId === 'skeleton' ? Math.floor(sigCur(state)) : 0;
}

/**
 * Flat damage absorbed by golem stone layers — consumes ALL full layers at once.
 * Returns total absorption (0 if no full layers).
 */
export function sigStoneAbsorb(state: GameState): number {
  if (state.raceId !== 'golem') return 0;
  const layers = Math.floor(sigCur(state));
  if (layers <= 0) return 0;
  state.sig = sigCur(state) - layers; // keep fractional build progress
  return layers * 3;
}

/** Resistance multiplier from slime's absorbed element (0 = no bonus, 0.3 = 30% resist). */
export function sigSlimeResist(state: GameState, incomingType: DamageType): number {
  if (state.raceId !== 'slime' || !state.sigAbsorb) return 0;
  return state.sigAbsorb.type === incomingType ? 0.3 : 0;
}
