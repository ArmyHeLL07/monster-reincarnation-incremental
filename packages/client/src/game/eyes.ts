import type { EyeMode, Skill } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot, LogEvent } from './state';

const BLIND_MULT = 0.6; // same-mode hybrid: effects dimmed by the "blindness" penalty
const BLIND_APPRAISAL_PENALTY = 2; // a blind hybrid loses Appraisal tiers (partial blindness)

/** Eye abilities the player owns (skills of kind 'eye'). */
export function ownedEyeAbilities(state: GameState, content: Content): SkillSlot[] {
  return state.skills.filter((s) => content.skills.get(s.id)?.kind === 'eye');
}

export function isAbilityAssigned(state: GameState, abilityId: string): boolean {
  return Object.values(state.eyeAssignments).some((a) => a?.abilityId === abilityId || a?.fusedId === abilityId);
}

/** An eye's mode class: 'flex' if it can be both, otherwise its single allowed mode. */
function exclusiveMode(def: Skill): EyeMode | 'flex' {
  const m = def.eyeModes ?? ['passive'];
  return m.length >= 2 ? 'flex' : m[0];
}

/** Two eyes "share a mode" (→ blindness penalty) when both are locked to the SAME single mode. */
function sameExclusiveMode(a: Skill, b: Skill): boolean {
  const ea = exclusiveMode(a);
  const eb = exclusiveMode(b);
  return ea !== 'flex' && eb !== 'flex' && ea === eb;
}

/**
 * Eye Fusion (GDD §5.0.7) — merge two slotted eyes into a hybrid in ONE slot (the other frees up).
 * The hybrid runs as BOTH passive aura and active gaze. Two same-mode eyes incur a blindness penalty.
 */
export function fuseEyes(
  state: GameState,
  content: Content,
  slotA: string,
  slotB: string,
  log: (e: LogEvent) => void,
): boolean {
  if (slotA === slotB) return false;
  const a = state.eyeAssignments[slotA];
  const b = state.eyeAssignments[slotB];
  if (!a || !b || a.fusedId || b.fusedId) return false; // need two plain (non-hybrid) eyes
  const defA = content.skills.get(a.abilityId);
  const defB = content.skills.get(b.abilityId);
  if (!defA || !defB) return false;
  const blind = sameExclusiveMode(defA, defB);
  state.eyeAssignments[slotA] = { abilityId: a.abilityId, mode: 'active', fusedId: b.abilityId, blind };
  state.eyeAssignments[slotB] = null; // the second eye's socket opens up — that's the power
  log({ key: blind ? 'log.eyefuse_blind' : 'log.eyefuse', params: { a: defA.locKeyName, b: defB.locKeyName } });
  return true;
}

/** Assign an eye ability to a slot (default mode), removing it from any other slot (incl. hybrids). */
export function assignEye(state: GameState, content: Content, slotId: string, abilityId: string): void {
  const def = content.skills.get(abilityId);
  if (!def || def.kind !== 'eye') return;
  const mode: EyeMode = def.eyeModes?.[0] ?? 'passive';
  for (const id of Object.keys(state.eyeAssignments)) {
    const cur = state.eyeAssignments[id];
    if (!cur) continue;
    if (cur.abilityId === abilityId) state.eyeAssignments[id] = null;
    else if (cur.fusedId === abilityId) {
      // reusing a fused component elsewhere demotes the hybrid back to its primary eye
      state.eyeAssignments[id] = { abilityId: cur.abilityId, mode: cur.mode };
    }
  }
  state.eyeAssignments[slotId] = { abilityId, mode };
}

/** Cycle an assigned eye's mode among the ability's allowed modes (one mode per eye). */
export function cycleEyeMode(state: GameState, content: Content, slotId: string): void {
  const a = state.eyeAssignments[slotId];
  if (!a) return;
  const modes = content.skills.get(a.abilityId)?.eyeModes ?? ['passive'];
  a.mode = modes[(modes.indexOf(a.mode) + 1) % modes.length];
}

export function clearEye(state: GameState, slotId: string): void {
  state.eyeAssignments[slotId] = null;
}

/** Appraisal "knowledge" tier — Appraisal(lv) → Insight(lv+10) → All-Sight(lv+20) (GDD §5.0.7). */
export function appraisalTier(state: GameState): number {
  let best = 0;
  for (const a of Object.values(state.eyeAssignments)) {
    if (!a) continue;
    for (const id of [a.abilityId, a.fusedId]) {
      if (id !== 'appraisal' && id !== 'insight' && id !== 'all_sight') continue;
      const sk = state.skills.find((s) => s.id === id);
      const lvl = sk ? sk.level : 1;
      const offset = id === 'all_sight' ? 20 : id === 'insight' ? 10 : 0;
      let tier = lvl + offset;
      if (a.blind) tier = Math.max(0, tier - BLIND_APPRAISAL_PENALTY); // hybrid blindness dims sight
      if (tier > best) best = tier;
    }
  }
  return best;
}

export function appraisalAssigned(state: GameState): boolean {
  return appraisalTier(state) > 0;
}

/**
 * Chance to negate an incoming enemy attack — from any slotted gaze eye (fear/charm/petrify)
 * plus owned fear-aura passives (Apex Predator). Data-driven via Skill.gaze.negateChance.
 */
export function gazeNegateChance(state: GameState, content: Content): number {
  let chance = 0;
  for (const a of Object.values(state.eyeAssignments)) {
    if (!a) continue;
    let sub = 0;
    for (const id of [a.abilityId, a.fusedId]) {
      const g = id ? content.skills.get(id)?.gaze : undefined;
      if (g?.negateChance) sub += g.negateChance;
    }
    chance += a.blind ? sub * BLIND_MULT : sub;
  }
  // Passive fear auras don't need an eye slot (they ARE the form's presence).
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.kind === 'passive' && def.gaze?.negateChance) chance += def.gaze.negateChance;
  }
  return Math.min(chance, 0.6);
}

/** Aggregate offensive gaze from slotted ACTIVE eyes (Piercing/Soul gaze). Costs 1 MP each. */
export function gazeAttack(state: GameState, content: Content): { damage: number; trueDamage: boolean; mpCost: number } {
  let damage = 0;
  let trueDamage = false;
  let mpCost = 0;
  for (const a of Object.values(state.eyeAssignments)) {
    if (!a) continue;
    // A hybrid fires both its eyes (it runs in both modes); a plain eye only when set to active.
    const ids = a.fusedId ? [a.abilityId, a.fusedId] : a.mode === 'active' ? [a.abilityId] : [];
    let sub = 0;
    for (const id of ids) {
      const g = content.skills.get(id)?.gaze;
      if (g?.damage) {
        sub += g.damage;
        mpCost += 1;
        if (g.trueDamage) trueDamage = true;
      }
    }
    damage += a.blind ? sub * BLIND_MULT : sub;
  }
  return { damage: Math.round(damage), trueDamage, mpCost };
}

/** Back-compat alias — total incoming-attack negate chance from gaze/fear sources. */
export function dreadChance(state: GameState, content: Content): number {
  return gazeNegateChance(state, content);
}
