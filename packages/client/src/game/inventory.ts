import type { GameState, FoodItem } from './state';

// Corpse storage ("larder"). Slots grow with the Larder skill; refrigeration stops decay.
export const SPOIL_THRESHOLD = 120; // ticks until a stored corpse rots
const FRIDGE_LEVEL = 7; // Larder level that unlocks refrigeration (no decay)
const BASE_SLOTS = 2;

export function larderLevel(state: GameState): number {
  const slot = state.skills.find((s) => s.id === 'larder');
  return slot ? slot.level : 0;
}

export function maxFoodSlots(state: GameState): number {
  const lvl = larderLevel(state);
  return lvl > 0 ? BASE_SLOTS + Math.floor(lvl / 2) : 0;
}

export function refrigerated(state: GameState): boolean {
  return larderLevel(state) >= FRIDGE_LEVEL;
}

export function isRotten(item: FoodItem): boolean {
  return item.decay >= SPOIL_THRESHOLD;
}
