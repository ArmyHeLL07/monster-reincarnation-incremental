import type { GameState } from './state';

/**
 * Combat Analytics Module
 * Tracks per-encounter stats for the last N fights — DPS, EP/s, regen efficiency.
 */

export interface CombatEncounterLog {
  /** Enemy id killed */
  enemyId: string;
  /** Total damage dealt by the player in this fight */
  totalDamage: number;
  /** Duration of the fight in ticks */
  durationTicks: number;
  /** EP earned from the kill */
  epGained: number;
  /** HP healed during the fight */
  hpHealed: number;
  /** Food consumed (count) */
  foodConsumed: number;
  /** Timestamp of kill */
  timestamp: number;
}

/** Maximum encounters stored */
export const MAX_ENCOUNTER_LOGS = 10;

export function defaultCombatAnalytics(): CombatEncounterLog[] {
  return [];
}

/**
 * Record a completed encounter. Keeps only the last MAX_ENCOUNTER_LOGS entries.
 */
export function recordEncounter(
  state: GameState,
  encounter: CombatEncounterLog,
): void {
  if (!state.combatAnalytics) state.combatAnalytics = [];
  state.combatAnalytics.push(encounter);
  if (state.combatAnalytics.length > MAX_ENCOUNTER_LOGS) {
    state.combatAnalytics.shift();
  }
}

/**
 * Compute analytics summary from stored encounters.
 */
export function computeAnalyticsSummary(state: GameState): {
  avgDps: number;
  avgEpPerSec: number;
  avgRegenEfficiency: number;
  totalEncounters: number;
} {
  const logs = state.combatAnalytics ?? [];
  if (logs.length === 0) {
    return { avgDps: 0, avgEpPerSec: 0, avgRegenEfficiency: 0, totalEncounters: 0 };
  }

  let totalDps = 0;
  let totalEpRate = 0;
  let totalRegenEff = 0;

  for (const e of logs) {
    const secs = Math.max(e.durationTicks, 1);
    totalDps += e.totalDamage / secs;
    totalEpRate += e.epGained / secs;
    totalRegenEff += e.durationTicks > 0 ? e.hpHealed / secs : 0;
  }

  return {
    avgDps: Math.round((totalDps / logs.length) * 100) / 100,
    avgEpPerSec: Math.round((totalEpRate / logs.length) * 100) / 100,
    avgRegenEfficiency: Math.round((totalRegenEff / logs.length) * 100) / 100,
    totalEncounters: logs.length,
  };
}
