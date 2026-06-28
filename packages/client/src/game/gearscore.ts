import type { GameState } from './state';
import type { LootItem, EquipSlot, StatKey } from '@mri/shared';

/**
 * Gear Score & Auto-Equip Module
 * Calculates power scores for items and provides one-click "Equip Best" functionality.
 */

const STAT_WEIGHTS: Record<StatKey, number> = {
  STR: 1.2,
  VIT: 1.0,
  AGI: 1.1,
  INT: 1.0,
  WIS: 0.8,
  LUCK: 0.7,
};

/**
 * Calculate a single power score for a loot item.
 * Weighs stats, armor, and rarity.
 */
export function itemPowerScore(item: LootItem): number {
  let score = 0;
  for (const k of Object.keys(item.statBonus) as StatKey[]) {
    score += (item.statBonus[k] ?? 0) * (STAT_WEIGHTS[k] ?? 1);
  }
  score += (item.armor ?? 0) * 1.5;

  // Rarity multiplier
  const rarityMult: Record<string, number> = {
    common: 1,
    uncommon: 1.1,
    rare: 1.25,
    epic: 1.4,
    legendary: 1.6,
  };
  score *= rarityMult[item.rarity] ?? 1;
  return Math.round(score * 10) / 10;
}

/**
 * Compare an item to the currently equipped item in the same slot.
 * Returns the percentage difference in power score.
 * Positive = the new item is better.
 */
export function comparePowerScore(
  state: GameState,
  item: LootItem,
): { currentScore: number; newScore: number; diffPercent: number } {
  const slot = item.type as EquipSlot;
  const current = state.equipment?.[slot] ?? null;
  const currentScore = current ? itemPowerScore(current) : 0;
  const newScore = itemPowerScore(item);
  const diffPercent = currentScore > 0
    ? Math.round(((newScore - currentScore) / currentScore) * 100)
    : newScore > 0 ? 100 : 0;

  return { currentScore, newScore, diffPercent };
}

/**
 * Find the best item in the backpack for each equip slot.
 * Returns a map of slot → inventory index of the best item.
 */
export function findBestItems(state: GameState): Record<string, number> {
  const best: Record<string, { idx: number; score: number }> = {};

  for (let i = 0; i < state.inventoryItems.length; i++) {
    const item = state.inventoryItems[i];
    const slot = item.type as string;
    const score = itemPowerScore(item);

    // Compare to currently equipped
    const equipped = state.equipment?.[slot as EquipSlot] ?? null;
    const equippedScore = equipped ? itemPowerScore(equipped) : 0;

    // Only consider if better than equipped
    if (score > equippedScore) {
      if (!best[slot] || score > best[slot].score) {
        best[slot] = { idx: i, score };
      }
    }
  }

  const result: Record<string, number> = {};
  for (const [slot, entry] of Object.entries(best)) {
    result[slot] = entry.idx;
  }
  return result;
}

/**
 * Auto-equip the best items from the backpack.
 * Returns count of items equipped.
 */
export function autoEquipBest(
  state: GameState,
  log: (key: string, params?: Record<string, string | number>) => void,
): number {
  // Only humanoid races can equip items
  const humanoidRaces = ['human', 'skeleton', 'golem', 'demon', 'beastkin'];
  if (!humanoidRaces.includes(state.raceId)) return 0;

  let equipped = 0;
  // Re-find best each iteration since indices shift on swap
  for (let pass = 0; pass < 9; pass++) { // max 9 slots
    const bestMap = findBestItems(state);
    const slots = Object.keys(bestMap);
    if (slots.length === 0) break;

    const slot = slots[0] as EquipSlot;
    const idx = bestMap[slot];
    const newItem = state.inventoryItems[idx];

    // Swap: put current equipped item into backpack, equip the new one
    const oldItem = state.equipment[slot];
    state.equipment[slot] = newItem;
    state.inventoryItems.splice(idx, 1);
    if (oldItem) state.inventoryItems.push(oldItem);

    log('log.auto_equip', { item: newItem.baseKey });
    equipped++;
  }

  return equipped;
}
