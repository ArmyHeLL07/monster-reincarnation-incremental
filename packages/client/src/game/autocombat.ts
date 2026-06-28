import type { GameState } from './state';

/**
 * Auto-Combat Macros Module
 * Provides smart automation: auto-cast skills on cooldown, auto-heal below threshold.
 */

/** Auto-combat configuration stored in GameState */
export interface AutoCombatConfig {
  /** Auto-cast equipped active skills when their cooldown expires */
  autoCastSkills: boolean;
  /** Auto-use healing (eat food or regen) when HP drops below this fraction (0.35 = 35%) */
  autoHealEnabled: boolean;
  /** HP fraction threshold for auto-heal trigger */
  autoHealThreshold: number;
}

export function defaultAutoCombatConfig(): AutoCombatConfig {
  return {
    autoCastSkills: false,
    autoHealEnabled: false,
    autoHealThreshold: 0.35,
  };
}

/**
 * Check and trigger auto-heal if HP is below threshold.
 * Tries to eat the highest-satiety food from inventory first.
 * Returns true if healing was triggered.
 */
export function tickAutoHeal(
  state: GameState,
  log: (key: string, params?: Record<string, string | number>) => void,
): boolean {
  const cfg = state.autoCombatConfig;
  if (!cfg || !cfg.autoHealEnabled) return false;
  if (state.hp >= state.maxHp * cfg.autoHealThreshold) return false;
  if (state.inventory.length === 0) return false;

  // Find highest-satiety food
  let bestIdx = 0;
  for (let i = 1; i < state.inventory.length; i++) {
    if (state.inventory[i].satiety > state.inventory[bestIdx].satiety) bestIdx = i;
  }

  const food = state.inventory[bestIdx];
  const healAmount = Math.min(food.satiety * 2, state.maxHp - state.hp);
  state.hp += healAmount;
  state.hunger = Math.max(0, state.hunger - food.satiety);
  state.inventory.splice(bestIdx, 1);
  log('log.auto_heal', { amount: healAmount, food: food.enemyId });
  
  if (healAmount > 0) {
    if (!state.floatingTexts) state.floatingTexts = [];
    state.floatingTexts.push({ text: `+${healAmount}`, color: 'green', target: 'player', ts: Date.now() });
  }
  if (state.combatTracker) {
    state.combatTracker.healed += healAmount;
    state.combatTracker.foodEaten += 1;
  }
  return true;
}

/**
 * Check which equipped skills have their cooldown at 0 and should auto-fire.
 * Returns array of skill ids ready to auto-cast.
 */
export function getAutocastReadySkills(state: GameState): string[] {
  const cfg = state.autoCombatConfig;
  if (!cfg || !cfg.autoCastSkills) return [];
  if (state.combatMode !== 'auto') return [];

  const ready: string[] = [];
  for (const skillId of state.equipped) {
    const cd = state.cooldowns[skillId] ?? 0;
    if (cd <= 0) ready.push(skillId);
  }
  return ready;
}
