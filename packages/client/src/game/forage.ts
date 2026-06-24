import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { appraisalTier } from './eyes';

type Log = (e: LogEvent) => void;

export const FORAGE_CD_MS = 5000;
export const SEARCH_SP_COST = 25;
const AUTO_SEARCH_UNLOCK = 100;

/** Base rarity weights; LUCK nudges rare/very_rare upward. */
const RARITY_BASE: Record<string, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  very_rare: 3,
};

function weightedPick<T extends { rarity: string; id: string }>(pool: T[], luck: number): T | null {
  if (pool.length === 0) return null;
  const weights = pool.map((f) => {
    let w = RARITY_BASE[f.rarity] ?? 10;
    if (f.rarity === 'rare') w += luck * 0.3;
    if (f.rarity === 'very_rare') w += luck * 0.1;
    return Math.max(1, w);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Player clicks "Yemek Ara" — rolls for a found item and sets pendingForage. */
export function forage(state: GameState, content: Content, log: Log): void {
  if (state.forageCD > 0) return;
  if (state.sp < SEARCH_SP_COST) { log({ key: 'auto.sp_low' }); return; }
  state.sp = Math.max(0, state.sp - SEARCH_SP_COST);
  state.forageCD = FORAGE_CD_MS;
  state.totalSearchCount += 1;
  if (!state.autoSearchUnlocked && state.totalSearchCount >= AUTO_SEARCH_UNLOCK) {
    state.autoSearchUnlocked = true;
    log({ key: 'auto.unlocked_toast' });
  }

  const layer = content.dungeon.layers.find((l) => l.id === state.pos.layer);
  const element = layer?.element ?? 'neutral';
  const depth = state.pos.layer;

  const pool = Array.from(content.forageableFoods.values()).filter(
    (f) =>
      (f.element === 'neutral' || f.element === element) &&
      depth >= (f.minDepth ?? 1),
  );

  const food = weightedPick(pool, state.stats.LUCK);
  if (!food) {
    log({ key: 'log.forage_nothing' });
    return;
  }

  state.pendingForage = { foodId: food.id };
  log({ key: 'log.forage_found' });
}

/** Player clicks "Ye" — consume pendingForage item. */
export function eatFoundFood(state: GameState, content: Content, log: Log): void {
  if (!state.pendingForage) return;
  const food = content.forageableFoods.get(state.pendingForage.foodId);
  state.pendingForage = null;
  if (!food) return;

  state.hunger = Math.max(0, state.hunger - food.satiety);
  log({ key: 'log.forage_eaten', params: { sat: food.satiety } });

  if (food.dangerLevel === 'safe') return;

  const effect = food.dangerEffect;
  if (food.dangerLevel === 'risky') {
    if (Math.random() < 0.4 && effect?.dmg) {
      state.hp = Math.max(0, state.hp - Math.max(1, effect.dmg));
      log({ key: 'log.forage_risky_hit' });
    }
  } else if (food.dangerLevel === 'toxic' && effect) {
    // Reuse existing statusEffects push pattern (same shape as combat DoT)
    const existing = state.statusEffects.find((s) => s.type === effect.type);
    const dur = effect.duration ?? 4;
    const dmg = effect.dmg ?? 3;
    if (existing) {
      existing.ticksLeft = Math.max(existing.ticksLeft, dur);
      existing.dmgPerTick = Math.max(existing.dmgPerTick, dmg);
    } else {
      state.statusEffects.push({ type: effect.type as never, ticksLeft: dur, dmgPerTick: dmg });
    }
    log({ key: 'log.forage_poison' });
  } else if (food.dangerLevel === 'lethal' && effect?.dmg) {
    state.hp = Math.max(0, state.hp - Math.round(state.maxHp * 0.7));
    log({ key: 'log.forage_lethal' });
  }
}

/** Player clicks "Bırak" — discard pendingForage item. */
export function discardFoundFood(state: GameState, log: Log): void {
  state.pendingForage = null;
  log({ key: 'log.forage_discarded' });
}

/** Returns Appraisal-filtered display info for the pending food item. */
export function forageReveal(
  state: GameState,
  content: Content,
): { name: string; satiety: number | null; dangerIcon: string | null } | null {
  if (!state.pendingForage) return null;
  const food = content.forageableFoods.get(state.pendingForage.foodId);
  if (!food) return null;

  const tier = appraisalTier(state);
  const DANGER_ICON: Record<string, string> = {
    safe: '🟢',
    risky: '🟡',
    toxic: '🔴',
    lethal: '💀',
  };

  return {
    name: tier >= 1 ? food.locKey : 'ui.forage_unknown',
    satiety: tier >= 3 ? food.satiety : null,
    dangerIcon: tier >= 5 ? (DANGER_ICON[food.dangerLevel] ?? null) : null,
  };
}
