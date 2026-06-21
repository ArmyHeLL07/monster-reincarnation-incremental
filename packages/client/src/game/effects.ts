import type { Content } from './content';
import type { GameState } from './state';

/** Aggregated passive/ruler modifiers, summed live each time they're needed. */
export interface Bonuses {
  /** Multiplicative bonus to outgoing damage (1 + Σ). */
  dmgMult: number;
  /** Multiplicative bonus to XP/skill-exp gain. */
  xpMult: number;
  /** Multiplicative bonus to EP/loot/satiety. */
  lootMult: number;
  /** Multiplicative bonus to passive HP regen. */
  regenMult: number;
  /** Multiplicative bonus to idle/offline yield. */
  idleMult: number;
  /** Flat dodge chance added (capped by caller). */
  dodgeBonus: number;
  /** Flat damage reduction added like resistance. */
  armor: number;
  /** Bonus damage = Σ overdrawFrac × missing HP. */
  overdrawFrac: number;
  /** Hunger-rate multiplier (product of all hungerMult, ≤ 1). */
  hungerMult: number;
  /** Best chance to survive a lethal hit at 1 HP. */
  surviveChance: number;
  /** Extra MP regen per round. */
  mpRegen: number;
  /** Flat attack power from an equipped weapon (added to raw damage). */
  weaponPower: number;
}

/** A skill's effect scales with its level (full value at lvMax); ruler powers are full value. */
function scale(level: number, lvMax: number): number {
  return Math.min(1, level / Math.max(1, lvMax));
}

export function aggregateBonuses(state: GameState, content: Content): Bonuses {
  const b: Bonuses = {
    dmgMult: 1,
    xpMult: 1,
    lootMult: 1,
    regenMult: 1,
    idleMult: 1,
    dodgeBonus: 0,
    armor: 0,
    overdrawFrac: 0,
    hungerMult: 1,
    surviveChance: 0,
    mpRegen: 0,
    weaponPower: 0,
  };

  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def) continue;
    const s = scale(slot.level, def.lvMax);
    if (def.dmgMult) b.dmgMult += def.dmgMult * s;
    if (def.xpMult) b.xpMult += def.xpMult * s;
    if (def.lootMult) b.lootMult += def.lootMult * s;
    if (def.regenMult) b.regenMult += def.regenMult * s;
    if (def.idleMult) b.idleMult += def.idleMult * s;
    if (def.dodgeBonus) b.dodgeBonus += def.dodgeBonus * s;
    if (def.armor) b.armor += def.armor * s;
    if (def.overdrawFrac) b.overdrawFrac += def.overdrawFrac * s;
    if (def.mpRegen) b.mpRegen += def.mpRegen * s;
    if (def.hungerMult) b.hungerMult *= def.hungerMult;
    if (def.surviveChance) b.surviveChance = Math.max(b.surviveChance, def.surviveChance * s);
  }

  // Equipped loot (humanoid races) — flat sums; statBonus is handled separately via effStat.
  if (state.equipment) {
    for (const it of Object.values(state.equipment)) {
      if (!it) continue;
      if (it.armor) b.armor += it.armor;
      if (it.dmgMult) b.dmgMult += it.dmgMult;
      if (it.dodgeBonus) b.dodgeBonus += it.dodgeBonus;
      if (it.mpRegen) b.mpRegen += it.mpRegen;
      if (it.regenMult) b.regenMult += it.regenMult;
      if (it.weaponPower) b.weaponPower += it.weaponPower;
    }
    // Set bonus: rewards committing to high-rarity gear (3/6/9 "fine" pieces, rarity ≥ rare).
    const tier = equipSetTier(state);
    if (tier >= 3) { b.dmgMult += 0.25; b.armor += 10; b.dodgeBonus += 0.08; b.regenMult += 0.2; }
    else if (tier >= 2) { b.dmgMult += 0.12; b.armor += 5; b.dodgeBonus += 0.03; }
    else if (tier >= 1) { b.dmgMult += 0.05; b.armor += 2; }
  }

  // Ruler powers (sins/virtues already granted) — full value, no level.
  for (const def of content.ruler) {
    if (!state.ruler.powers.includes(def.id)) continue;
    if (def.dmgMult) b.dmgMult += def.dmgMult;
    if (def.xpMult) b.xpMult += def.xpMult;
    if (def.lootMult) b.lootMult += def.lootMult;
    if (def.regenMult) b.regenMult += def.regenMult;
    if (def.idleMult) b.idleMult += def.idleMult;
  }

  return b;
}

/** Set-bonus tier from equipped gear: counts "fine" pieces (rarity ≥ rare) → 0/1/2/3 at 3/6/9. */
export function equipSetTier(state: GameState): number {
  if (!state.equipment) return 0;
  let fine = 0;
  for (const it of Object.values(state.equipment)) {
    if (it && (it.rarity === 'rare' || it.rarity === 'epic' || it.rarity === 'legendary')) fine++;
  }
  return fine >= 9 ? 3 : fine >= 6 ? 2 : fine >= 3 ? 1 : 0;
}
