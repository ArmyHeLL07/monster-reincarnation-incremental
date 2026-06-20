import type { EvolutionForm, StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';

type Log = (e: LogEvent) => void;

export function currentForm(state: GameState, content: Content): EvolutionForm | undefined {
  return content.forms.get(state.formId);
}

/** The branches reachable from the current form (data-driven tree). */
export function availableEvolutions(state: GameState, content: Content): EvolutionForm[] {
  const cur = content.forms.get(state.formId);
  if (!cur) return [];
  return cur.evolvesTo
    .map((id) => content.forms.get(id))
    .filter((f): f is EvolutionForm => f !== undefined);
}

export function canEvolve(state: GameState, form: EvolutionForm): boolean {
  if (form.requireEat && !(state.eatenEnemies ?? []).includes(form.requireEat)) return false;
  return state.level >= form.levelReq;
}

/** True when the player is at/over the level for any next form (show the "evolve?" prompt). */
export function evolutionReady(state: GameState, content: Content): boolean {
  return availableEvolutions(state, content).some((f) => canEvolve(state, f));
}

/** Evolve into a branch: gated by character level; applies stat bonus, grants skills, heals. */
export function evolve(state: GameState, content: Content, formId: string, log: Log): boolean {
  const cur = content.forms.get(state.formId);
  if (!cur || !cur.evolvesTo.includes(formId)) return false;
  const form = content.forms.get(formId);
  if (!form || state.level < form.levelReq) return false;

  if (form.statBonus) {
    for (const [k, v] of Object.entries(form.statBonus)) {
      state.stats[k as StatKey] += v ?? 0;
    }
  }
  if (form.grantSkills) {
    for (const id of form.grantSkills) {
      if (!state.skills.some((s) => s.id === id)) state.skills.push({ id, level: 1, exp: 0 });
    }
  }
  state.formId = formId;
  state.tier += 1; // advance evolution tier; level resets (effective level keeps climbing)
  state.level = 1;
  state.xp = 0;
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  log({ key: 'log.evolve_form', params: { form: form.locKey } });
  // Evolution leaves you raw and vulnerable — a chance (lower with high LUCK) to be ambushed mid-change.
  const ambushChance = Math.max(0.05, 0.35 - state.stats.LUCK * 0.015);
  if (Math.random() < ambushChance) {
    const dmg = Math.round(state.maxHp * 0.45);
    state.hp = Math.max(1, state.hp - dmg); // a real bite, but never lethal during the change
    log({ key: 'log.evolve_ambush', params: { dmg } });
  }
  return true;
}
