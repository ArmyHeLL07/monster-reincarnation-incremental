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
  return state.ep >= form.epCost;
}

/** Evolve into a branch: spend EP, apply stat bonus, grant skills, heal. Permanent choice. */
export function evolve(state: GameState, content: Content, formId: string, log: Log): boolean {
  const cur = content.forms.get(state.formId);
  if (!cur || !cur.evolvesTo.includes(formId)) return false;
  const form = content.forms.get(formId);
  if (!form || state.ep < form.epCost) return false;

  state.ep -= form.epCost;
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
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  log({ key: 'log.evolve_form', params: { form: form.locKey } });
  return true;
}
