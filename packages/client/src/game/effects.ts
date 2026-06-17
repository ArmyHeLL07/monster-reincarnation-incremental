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
