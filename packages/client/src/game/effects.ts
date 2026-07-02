import type { StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState } from './state';
import { MAX_HUNGER, minionEffMult } from './state';
import { sigBoneArmor } from './signature';
import { soulLevel } from './soul';
import { currentRoomModifier } from './combat';
import { MUTATION_POOL } from './mutations';
import { currentRoomHazard } from './hazards';
import { REBIRTH_PERKS } from './teachings';

/**
 * Returns the single stat where the player has allocated ≥100 points,
 * or null if zero or multiple stats have reached that threshold.
 * Two stats at 100 = the specialization fields cancel each other out.
 */
export function specStat(state: GameState): StatKey | null {
  const alloc = state.allocated ?? {};
  const over = (Object.keys(alloc) as StatKey[]).filter((k) => (alloc[k] ?? 0) >= 100);
  return over.length === 1 ? over[0] : null;
}

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
  /** Hunger-rate multiplier: >1 drains faster (debuff), <1 drains slower (buff). */
  hungerMult: number;
  /** Best chance to survive a lethal hit at 1 HP. */
  surviveChance: number;
  /** Extra MP regen per round. */
  mpRegen: number;
  /** Flat attack power from an equipped weapon (added to raw damage). */
  weaponPower: number;
  /** Pain Nullification: fraction of incoming damage ignored below half HP (Kumo). */
  painNull: number;
  /** Physical Nullification reduction fraction (0–0.85). */
  physNullReduction: number;
  /** Magic/Elemental Nullification reduction fraction (0–0.85). */
  magicNullReduction: number;
  /** Status Nullification reduction fraction (0–0.85). */
  statusNullReduction: number;
  /** Ultimate Nullification current level (0–10; 10 = full immunity). */
  ultimateNullLv: number;
  /** Vampire lifesteal: fraction of outgoing damage restored as HP each hit. */
  lifesteal: number;
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
    painNull: 0,
    physNullReduction: 0,
    magicNullReduction: 0,
    statusNullReduction: 0,
    ultimateNullLv: 0,
    lifesteal: 0,
  };

  let statMultSum = 0; // Σ skill statMult — cached on state for effStat (applied to all six stats).
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def) continue;
    const s = scale(slot.level, def.lvMax);
    if (def.statMult) statMultSum += def.statMult * s;
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
    if (def.painNull) b.painNull = Math.min(0.8, b.painNull + def.painNull * s); // cap at 80% ignored
    if (def.lifesteal) b.lifesteal += def.lifesteal * s;
    if (def.kind === 'resistance') {
      // Group nullification skills have no resistType — they contribute to merger reductions.
      if (slot.id === 'physical_nullification') {
        b.physNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === 'magic_nullification') {
        b.magicNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === 'status_nullification') {
        b.statusNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === 'ultimate_nullification') {
        b.ultimateNullLv = slot.level;
      }
    }
  }
  state.statMultCache = statMultSum; // effStat reads this on its next call

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

  // Race signature: skeleton bone stacks add flat armor.
  b.armor += sigBoneArmor(state);

  // Race signature: beastkin fury stacks boost damage (each of 10 stacks = +5% dmg).
  if (state.raceId === 'beastkin') {
    const fury = Number.isFinite(state.sig) ? Math.floor(state.sig) : 0;
    if (fury > 0) b.dmgMult += fury * 0.05;
  }

  // Beastkin Primal Rage: +25% dodge chance below 35% HP
  if (state.raceId === 'beastkin' && state.hp < state.maxHp * 0.35) {
    b.dodgeBonus += 0.25;
  }

  // Soul prestige tree (permanent, bought with rebirth Souls).
  b.xpMult += soulLevel(state, 'predator_soul') * 0.08;   // Predator Soul: faster XP
  b.armor += soulLevel(state, 'ancient_armor') * 3;       // Ancient Armor: flat defense
  b.regenMult += soulLevel(state, 'ancient_armor') * 0.06; // …and a little regen
  b.lootMult += soulLevel(state, 'greed_soul') * 0.10;    // Greed: more loot/EP
  b.idleMult += soulLevel(state, 'sleepless') * 0.12;     // Sleepless: better offline/idle yield

  // Temporary EP-bought buffs — check expiry in real time.
  if (state.tempBuffs) {
    const now = Date.now();
    if ((state.tempBuffs['slow_hunger'] ?? 0) > now) b.hungerMult *= 0.5;
    if ((state.tempBuffs['xp_rush'] ?? 0) > now) b.xpMult += 0.5;
    if ((state.tempBuffs['regen_surge'] ?? 0) > now) b.regenMult += 1.0;
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

  // Room modifier: apply stat penalties for the player's current room.
  const roomMod = currentRoomModifier(state, content);
  if (roomMod) {
    if (roomMod.dodgePenalty) b.dodgeBonus -= roomMod.dodgePenalty;
    if (roomMod.dmgPenalty)   b.dmgMult    -= roomMod.dmgPenalty;
    if (roomMod.regenPenalty) b.regenMult  -= roomMod.regenPenalty;
    if (roomMod.hungerMult)   b.hungerMult *= roomMod.hungerMult;
  }

  // Room hazard: apply environmental hazard penalties
  const hazard = currentRoomHazard(state);
  if (hazard) {
    if (hazard.dodgePenalty) b.dodgeBonus -= hazard.dodgePenalty;
    if (hazard.dmgPenalty)   b.dmgMult    -= hazard.dmgPenalty;
    if (hazard.hungerMult)   b.hungerMult *= hazard.hungerMult;
  }

  // Mutations: apply active roguelite mutations
  if (state.mutations) {
    for (const mutId of state.mutations) {
      const def = MUTATION_POOL.find((m) => m.id === mutId);
      if (!def) continue;
      if (def.dmgMult) b.dmgMult += def.dmgMult;
      if (def.xpMult) b.xpMult += def.xpMult;
      if (def.regenMult) b.regenMult += def.regenMult;
      if (def.armor) b.armor += def.armor;
      if (def.hungerMult) b.hungerMult *= def.hungerMult;
    }
  }

  // Rebirth perks: apply permanent prestige perks
  if (state.rebirthPerks) {
    for (const perkId of state.rebirthPerks) {
      const def = REBIRTH_PERKS.find((p) => p.id === perkId);
      if (!def) continue;
      if (def.dmgMult) b.dmgMult += def.dmgMult;
      if (def.xpMult) b.xpMult += def.xpMult;
      if (def.regenMult) b.regenMult += def.regenMult;
      if (def.dodgeBonus) b.dodgeBonus += def.dodgeBonus;
      if (def.armor) b.armor += def.armor;
      if (def.hungerMult) b.hungerMult *= def.hungerMult;
      if (def.mpRegen) b.mpRegen += def.mpRegen;
      if (def.lootMult) b.lootMult += def.lootMult;
    }
  }

  // Gluttony ruler power: hunger-based buff when sated, debuff when starving.
  // Theme: "black hole in the stomach — calming when full, frantic when empty."
  if (state.ruler.powers.includes('gluttony')) {
    const ratio = state.hunger / MAX_HUNGER;
    if (ratio <= 0.20) {
      // Sated — the black hole is calm and content
      b.dmgMult    += 0.15;
      b.regenMult  += 0.20;
      b.lootMult   += 0.15;
    } else if (ratio >= 0.75) {
      // Hungry — the void inside becomes desperate and erratic
      b.dmgMult    -= 0.20;
      b.dodgeBonus -= 0.15;
    }
  }

  if (state.minions && state.minions.utility > 0) {
    const effMult = minionEffMult(state);
    b.lootMult *= (1 + state.minions.utility * 0.05 * effMult);
    b.hungerMult *= Math.max(0.5, 1 - state.minions.utility * 0.03 * effMult);
  }

  // Stat specialization: exactly ONE stat at ≥100 allocated → a major class-defining buff.
  // Two or more stats at 100 = mutual cancellation (you can't be a jack-of-all-mastery).
  const spec = specStat(state);
  if (spec === 'STR')  b.dmgMult    += 0.5;   // Berserk: all damage +50%
  if (spec === 'VIT')  b.regenMult  += 0.5;   // Iron Body: regen +50%
  if (spec === 'AGI')  b.dodgeBonus += 0.25;  // Ghost Step: dodge +25%
  if (spec === 'WIS')  b.xpMult     += 0.5;   // Sage's Path: XP +50%
  if (spec === 'LUCK') b.lootMult   += 1.0;   // Fortune's Child: loot ×2

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
