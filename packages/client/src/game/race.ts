import type { Content } from './content';
import type { GameState } from './state';
import { recomputeMaxes } from './state';

/**
 * Playable races. All 11 races now have full branching evolution trees (T0→T10 + secret apex).
 * Any race not listed is shown but locked in the picker.
 */
export const OFFICIAL_RACES = new Set([
  'spider', 'human', 'slime', 'skeleton', 'wyrmling', 'golem',
  'beastkin', 'demon', 'vampire', 'lycan', 'celestial',
]);

/**
 * Apply race-specific starting configuration to an existing state (for race selection and rebirth).
 * Sets raceId, formId, starting skills, resistances, and eye assignment slots.
 */
export function applyRace(state: GameState, raceId: string, content: Content): void {
  const race = content.races.get(raceId);
  if (!race) return;

  state.raceId = raceId;

  // Race-defined starting stats (overrides the default 5/5/5/5/5/5); spider keeps the default.
  if (race.startStats) {
    state.stats = { ...race.startStats };
  }

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

  // Reset race-life-scoped counters (Faz 3/4)
  state.humanPath        = undefined;
  state.pendingHumanPath = false;
  state.evolveAckCount   = 0;
  state.roomKillCount    = 0;
  state.roomEnemyId      = null;
  state.seenSkillIds     = [];
  state.nearDeathCount   = 0;
  state.vitEnduranceXP   = 0;
  state.vitEndurancePerm = 0;
  state.absorbVit        = 0;
  state.forageCD         = 0;
  state.pendingForage    = null;

  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
}
