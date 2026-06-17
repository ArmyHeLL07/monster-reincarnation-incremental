import type { EyeMode } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot } from './state';

/** Eye abilities the player owns (skills of kind 'eye'). */
export function ownedEyeAbilities(state: GameState, content: Content): SkillSlot[] {
  return state.skills.filter((s) => content.skills.get(s.id)?.kind === 'eye');
}

export function isAbilityAssigned(state: GameState, abilityId: string): boolean {
  return Object.values(state.eyeAssignments).some((a) => a?.abilityId === abilityId);
}

/** Assign an eye ability to a slot (default mode), removing it from any other slot. */
export function assignEye(state: GameState, content: Content, slotId: string, abilityId: string): void {
  const def = content.skills.get(abilityId);
  if (!def || def.kind !== 'eye') return;
  const mode: EyeMode = def.eyeModes?.[0] ?? 'passive';
  for (const id of Object.keys(state.eyeAssignments)) {
    if (state.eyeAssignments[id]?.abilityId === abilityId) state.eyeAssignments[id] = null;
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
  for (const a of Object.values(state.eyeAssignments)) {
    if (a?.abilityId === 'appraisal' || a?.abilityId === 'insight' || a?.abilityId === 'all_sight') {
      const sk = state.skills.find((s) => s.id === a.abilityId);
      const lvl = sk ? sk.level : 1;
      const offset = a.abilityId === 'all_sight' ? 20 : a.abilityId === 'insight' ? 10 : 0;
      return lvl + offset;
    }
  }
  return 0;
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
    const g = a ? content.skills.get(a.abilityId)?.gaze : undefined;
    if (g?.negateChance) chance += g.negateChance;
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
    if (a?.mode !== 'active') continue;
    const g = content.skills.get(a.abilityId)?.gaze;
    if (g?.damage) {
      damage += g.damage;
      mpCost += 1;
      if (g.trueDamage) trueDamage = true;
    }
  }
  return { damage, trueDamage, mpCost };
}

/** Back-compat alias — total incoming-attack negate chance from gaze/fear sources. */
export function dreadChance(state: GameState, content: Content): number {
  return gazeNegateChance(state, content);
}
