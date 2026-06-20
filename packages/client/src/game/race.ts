import type { Content } from './content';
import type { GameState } from './state';
import { recomputeMaxes } from './state';

/**
 * Apply race-specific starting configuration to an existing state (for race selection and rebirth).
 * Sets raceId, formId, starting skills, resistances, and eye assignment slots.
 */
export function applyRace(state: GameState, raceId: string, content: Content): void {
  const race = content.races.get(raceId);
  if (!race) return;

  state.raceId = raceId;

  // First evolution form for this race (levelReq 1 = starting form)
  const startForm = [...content.forms.values()].find((f) => f.raceId === raceId && f.levelReq === 1);
  if (startForm) state.formId = startForm.id;

  // Race-defined starting skills; fall back to spider defaults if unset
  if (race.startSkills?.length) {
    state.skills = race.startSkills.map((id) => ({ id, level: 1, exp: 0 }));
    state.equipped = race.startSkills
      .filter((id) => content.skills.get(id)?.damage !== undefined)
      .slice(0, 3);
  }

  // Race-defined starting resistances
  if (race.startResistances?.length) {
    state.resistances = race.startResistances.map((id) => ({ id, level: 0, exp: 0, nullified: false }));
  }

  // Reset eye assignments to match this race's eye socket layout
  state.eyeAssignments = {};
  for (const eye of race.head.eyes) state.eyeAssignments[eye.id] = null;

  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
}
