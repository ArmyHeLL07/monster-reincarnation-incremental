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
  if (!state.formHistory.includes(formId)) state.formHistory.push(formId);
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

// ---- Evolution tree view (Statlar sekmesi görseli) -------------------------

export type EvoNodeStatus = 'past' | 'current' | 'available' | 'locked' | 'missed' | 'hidden';

export interface EvoNode {
  id: string;
  tier: number; // kökten derinlik (root = 0)
  status: EvoNodeStatus;
  name: string | null; // null → UI '???' gösterir
  levelReq: number;
  statBonus?: EvolutionForm['statBonus'];
  grantSkills?: string[];
  parents: string[];
  children: string[];
}

/** Bu ırkın formları (mevcut formun raceId'sine göre). */
function raceForms(state: GameState, content: Content): EvolutionForm[] {
  const cur = content.forms.get(state.formId);
  const raceId = cur?.raceId;
  return [...content.forms.values()].filter((f) => f.raceId === raceId);
}

/** evolvesTo grafiğinde her forma giden ebeveynler. */
function parentMap(forms: EvolutionForm[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const f of forms) {
    for (const c of f.evolvesTo) {
      const list = m.get(c) ?? [];
      list.push(f.id);
      m.set(c, list);
    }
  }
  return m;
}

/** Kökten (ebeveynsiz form) BFS ile bir formun ağaç derinliği. */
export function formTier(content: Content, formId: string): number {
  const f0 = content.forms.get(formId);
  if (!f0) return 0;
  const forms = [...content.forms.values()].filter((f) => f.raceId === f0.raceId);
  const parents = parentMap(forms);
  const roots = forms.filter((f) => !(parents.get(f.id)?.length)).map((f) => f.id);
  const depth = new Map<string, number>();
  const q: string[] = [];
  for (const r of roots) {
    depth.set(r, 0);
    q.push(r);
  }
  while (q.length) {
    const id = q.shift()!;
    const d = depth.get(id)!;
    for (const c of content.forms.get(id)?.evolvesTo ?? []) {
      if (!depth.has(c) || d + 1 < depth.get(c)!) {
        depth.set(c, d + 1);
        q.push(c);
      }
    }
  }
  return depth.get(formId) ?? 0;
}

/** Render öncesi: mevcut form + soyun + bir-adım komşular + soyun seçilmeyen kardeşleri görülür. */
export function markSeen(state: GameState, content: Content): void {
  const add = (id: string) => {
    if (!state.seenForms.includes(id)) state.seenForms.push(id);
  };
  add(state.formId);
  for (const id of state.formHistory) {
    add(id);
    for (const c of content.forms.get(id)?.evolvesTo ?? []) add(c); // soyun kardeşleri (missed dahil)
  }
  for (const c of content.forms.get(state.formId)?.evolvesTo ?? []) add(c); // bir-adım komşular
}

/** Tüm ırk formları için ağaç düğümü durumlarını hesapla (tier'a göre sıralı). */
export function evolutionTreeView(state: GameState, content: Content): EvoNode[] {
  markSeen(state, content);
  const forms = raceForms(state, content);
  const parents = parentMap(forms);
  const cur = content.forms.get(state.formId);
  const nextIds = new Set(cur?.evolvesTo ?? []);
  const past = new Set(state.formHistory.filter((id) => id !== state.formId));

  return forms
    .map((f): EvoNode => {
      let status: EvoNodeStatus;
      if (f.id === state.formId) status = 'current';
      else if (past.has(f.id)) status = 'past';
      else if (nextIds.has(f.id)) status = canEvolve(state, f) ? 'available' : 'locked';
      else if ((parents.get(f.id) ?? []).some((p) => past.has(p))) status = 'missed';
      else status = 'hidden';
      const seen = state.seenForms.includes(f.id);
      return {
        id: f.id,
        tier: formTier(content, f.id),
        status,
        name: seen ? f.locKey : null,
        levelReq: f.levelReq,
        statBonus: f.statBonus,
        grantSkills: f.grantSkills,
        parents: parents.get(f.id) ?? [],
        children: f.evolvesTo,
      };
    })
    .sort((a, b) => a.tier - b.tier);
}
