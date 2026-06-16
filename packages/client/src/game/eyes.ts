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

/** Appraisal "knowledge" tier — only counts if Appraisal/Insight is slotted (GDD §5.0.7). */
export function appraisalTier(state: GameState): number {
  for (const a of Object.values(state.eyeAssignments)) {
    if (a?.abilityId === 'appraisal' || a?.abilityId === 'insight') {
      const sk = state.skills.find((s) => s.id === a.abilityId);
      const lvl = sk ? sk.level : 1;
      return a.abilityId === 'insight' ? lvl + 10 : lvl;
    }
  }
  return 0;
}

export function appraisalAssigned(state: GameState): boolean {
  return appraisalTier(state) > 0;
}

/** A slotted Dread Gaze gives a chance to negate an incoming enemy attack (fear). */
export function dreadChance(state: GameState): number {
  return isAbilityAssigned(state, 'dread_gaze') ? 0.15 : 0;
}
