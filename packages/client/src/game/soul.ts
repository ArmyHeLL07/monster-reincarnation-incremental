import type { GameState } from './state';

/**
 * Soul prestige tree (Clicker Heroes "Outsiders" model). Rebirth grants Souls based on how deep
 * that run reached; Souls are spent on permanent, strategy-shaping upgrades. Each upgrade scales
 * its cost exponentially so investment is a real choice (diminishing returns per level).
 */
export interface SoulUpgrade {
  id: string;
  locKey: string;
  locKeyDesc: string;
  icon: string;
  /** Cost of level 1; level n costs baseCost · costMult^(n-1). */
  baseCost: number;
  costMult: number;
  /** Hard cap on levels (0 = uncapped). */
  maxLevel: number;
  /** Effect magnitude per level (interpretation depends on the upgrade — see effects.ts/combat.ts). */
  per: number;
}

export const SOUL_UPGRADES: SoulUpgrade[] = [
  { id: 'predator_soul', locKey: 'soul.predator_soul.name', locKeyDesc: 'soul.predator_soul.desc', icon: '🩸', baseCost: 2, costMult: 1.55, maxLevel: 20, per: 0.08 },
  { id: 'ancient_armor', locKey: 'soul.ancient_armor.name', locKeyDesc: 'soul.ancient_armor.desc', icon: '🛡️', baseCost: 2, costMult: 1.55, maxLevel: 20, per: 0.06 },
  { id: 'greed_soul',    locKey: 'soul.greed_soul.name',    locKeyDesc: 'soul.greed_soul.desc',    icon: '💰', baseCost: 3, costMult: 1.6,  maxLevel: 20, per: 0.10 },
  { id: 'sleepless',     locKey: 'soul.sleepless.name',     locKeyDesc: 'soul.sleepless.desc',     icon: '🌙', baseCost: 3, costMult: 1.6,  maxLevel: 15, per: 0.12 },
  { id: 'wisdom_soul',   locKey: 'soul.wisdom_soul.name',   locKeyDesc: 'soul.wisdom_soul.desc',   icon: '🧠', baseCost: 4, costMult: 1.7,  maxLevel: 12, per: 0.05 },
  { id: 'soul_luck',     locKey: 'soul.soul_luck.name',     locKeyDesc: 'soul.soul_luck.desc',     icon: '🍀', baseCost: 5, costMult: 1.8,  maxLevel: 15, per: 0.06 },
  { id: 'extra_slot',    locKey: 'soul.extra_slot.name',    locKeyDesc: 'soul.extra_slot.desc',    icon: '⚔️', baseCost: 25, costMult: 4.0, maxLevel: 2,  per: 1 },
];

const byId = new Map(SOUL_UPGRADES.map((u) => [u.id, u]));

/** Current level of a soul upgrade (0 if never bought). */
export function soulLevel(state: GameState, id: string): number {
  return state.soulUpgrades?.[id] ?? 0;
}

/** Cost of the NEXT level of an upgrade (Infinity if at max). */
export function soulUpgradeCost(state: GameState, id: string): number {
  const u = byId.get(id);
  if (!u) return Infinity;
  const lvl = soulLevel(state, id);
  if (u.maxLevel > 0 && lvl >= u.maxLevel) return Infinity;
  return Math.ceil(u.baseCost * Math.pow(u.costMult, lvl));
}

/** Buy one level of a soul upgrade if affordable and not maxed. Returns true on success. */
export function buySoulUpgrade(state: GameState, id: string): boolean {
  const u = byId.get(id);
  if (!u) return false;
  const cost = soulUpgradeCost(state, id);
  if (!Number.isFinite(cost) || (state.souls ?? 0) < cost) return false;
  state.souls -= cost;
  state.soulUpgrades = state.soulUpgrades ?? {};
  state.soulUpgrades[id] = soulLevel(state, id) + 1;
  return true;
}

/**
 * Souls earned by ending a run at rebirth — rewards reaching deeper/killing more (performance-based),
 * with a square-root curve so repeatedly resetting at the same spot yields diminishing returns.
 * Soul Luck multiplies the haul.
 */
export function computeSoulGain(state: GameState): number {
  const kills = Math.max(0, state.kills);
  const tier = Math.max(0, state.tier);
  const layer = Math.max(1, state.pos?.layer ?? 1);
  const base = Math.sqrt(kills / 8) + tier * 2 + layer * 3;
  const luck = 1 + soulLevel(state, 'soul_luck') * (byId.get('soul_luck')!.per);
  return Math.max(1, Math.floor(base * luck));
}
