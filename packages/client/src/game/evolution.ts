import type { EvolutionForm, StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';
import { MUTATION_POOL } from './mutations';

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

/** A secret (easter-egg) form is only reachable once ALL of its hidden conditions are met. */
export function secretMet(state: GameState, form: EvolutionForm): boolean {
  const s = form.secret;
  if (!s) return true;
  if (s.kills    && state.kills              < s.kills)    return false;
  if (s.sin      && state.ruler.sin          < s.sin)      return false;
  if (s.virtue   && state.ruler.virtue       < s.virtue)   return false;
  if (s.taboo    && state.ruler.taboo        < s.taboo)    return false;
  if (s.rebirths && state.rebirthCount       < s.rebirths) return false;
  if (s.hasSkill && !state.skills.some((sk) => sk.id === s.hasSkill)) return false;
  return true;
}

export function canEvolve(state: GameState, form: EvolutionForm): boolean {
  return secretMet(state, form) && state.level >= form.levelReq && state.tier >= (form.tierReq ?? 0);
}

/** True when the player can carry/equip gear — humanoid race OR a humanoid form (e.g. a slime's Rimuru). */
export function isHumanoidForm(state: GameState, content: Content): boolean {
  return content.races.get(state.raceId)?.humanoid === true || content.forms.get(state.formId)?.humanoid === true;
}

/** True when the player is at/over the level for any next form (show the "evolve?" prompt). */
export function evolutionReady(state: GameState, content: Content): boolean {
  return availableEvolutions(state, content).some((f) => canEvolve(state, f));
}

/** The full lineage of a skill — its ancestors AND descendants. Walks UP to the root first (so
 *  `raphael` resolves back to `great_sage`), then DOWN over the whole evolvesTo tree. */
function skillLineSet(content: Content, baseId: string): Set<string> {
  // 1) climb to the lineage root (the skill nothing evolves into baseId from).
  let root = baseId;
  const climbed = new Set<string>();
  for (;;) {
    if (climbed.has(root)) break; // cycle safety
    climbed.add(root);
    let parent: string | undefined;
    for (const def of content.skills.values()) {
      if (def.evolvesTo.includes(root)) { parent = def.id; break; }
    }
    if (!parent) break;
    root = parent;
  }
  // 2) collect the whole lineage forward from the root.
  const line = new Set<string>();
  const stack = [root];
  while (stack.length) {
    const id = stack.pop()!;
    if (line.has(id)) continue;
    line.add(id);
    for (const n of content.skills.get(id)?.evolvesTo ?? []) stack.push(n);
  }
  return line;
}

/** True if the player owns ANY skill in baseId's whole lineage — its ancestors OR descendants.
 *  Prevents granting a skill the player already holds in a different (evolved) form. */
export function ownsSkillLine(state: GameState, content: Content, baseId: string): boolean {
  const line = skillLineSet(content, baseId);
  return state.skills.some((s) => line.has(s.id));
}

/** Remove any owned skill that belongs to baseId's lineage (used when a branch is abandoned). */
function removeOwnedSkillInLine(state: GameState, content: Content, baseId: string): void {
  const line = skillLineSet(content, baseId);
  state.skills = state.skills.filter((s) => !line.has(s.id));
}

/** Evolve into a branch: gated by character level; applies stat bonus, grants skills, heals. */
export function evolve(state: GameState, content: Content, formId: string, log: Log): boolean {
  const cur = content.forms.get(state.formId);
  if (!cur || !cur.evolvesTo.includes(formId)) return false;
  const form = content.forms.get(formId);
  if (!form || state.level < form.levelReq || !secretMet(state, form)) return false;

  if (form.statBonus) {
    for (const [k, v] of Object.entries(form.statBonus)) {
      state.stats[k as StatKey] += v ?? 0;
    }
  }
  if (form.grantSkills) {
    for (const id of form.grantSkills) {
      // Lineage-aware: don't re-grant a base skill the player already owns in an evolved form
      // (skills level up in-place to a new id), which would otherwise pile up duplicate slots.
      if (!ownsSkillLine(state, content, id)) state.skills.push({ id, level: 1, exp: 0 });
    }
  }
  state.formId = formId;
  if (!state.formHistory.includes(formId)) state.formHistory.push(formId);
  state.tier = Math.min(10, state.tier + 1); // advance evolution tier; level resets (caps at T10)
  state.level = 1;
  state.xp = 0;
  state.evolveAckCount = 0; // new node → fresh "keep growing" acknowledgement
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  log({ key: 'log.evolve_form', params: { form: form.locKey } });

  // 15% chance to roll a random mutation upon evolution
  if (Math.random() < 0.15) {
    const positivePool = MUTATION_POOL.filter(m => m.positive);
    const negativePool = MUTATION_POOL.filter(m => !m.positive);
    // 60% positive, 40% negative
    const pool = Math.random() < 0.60 ? positivePool : negativePool;
    const mut = pool[Math.floor(Math.random() * pool.length)];
    if (mut && !state.mutations.includes(mut.id)) {
      state.mutations.push(mut.id);
      if (mut.statMods) {
        for (const [k, v] of Object.entries(mut.statMods)) {
          state.stats[k as StatKey] = Math.max(1, state.stats[k as StatKey] + (v ?? 0));
        }
      }
      log({ key: 'log.mutation_gain', params: { name: mut.locKey } });
    }
  }

  // Evolution leaves you raw and vulnerable — a chance (lower with high LUCK) to be ambushed mid-change.
  // Wisdom Soul (prestige) calms the change, shrinking the ambush chance permanently.
  const wisdom = (state.soulUpgrades?.['wisdom_soul'] ?? 0) * 0.05;
  const ambushChance = Math.max(0.02, 0.35 - state.stats.LUCK * 0.015 - wisdom);
  if (Math.random() < ambushChance) {
    const dmg = Math.round(state.maxHp * 0.45);
    state.hp = Math.max(1, state.hp - dmg); // a real bite, but never lethal during the change
    log({ key: 'log.evolve_ambush', params: { dmg } });
  }
  return true;
}

// ---- Branch switch (high-EP re-route) --------------------------------------
// Rebirth changes branches by resetting everything; this is the premium shortcut: pay a steep EP fee
// to re-route into an unchosen sibling branch you've already earned the tier for, keeping your tier,
// allocated stats, fusions and meta. You lose only the abandoned branch's evolution stats + skills.

/** EP cost to switch branches — scales with how far you've progressed (2500 × tier). */
export function switchBranchCost(state: GameState): number {
  return 2500 * Math.max(1, state.tier);
}

/** Sum of evolution statBonus across a lineage (root→…→form). */
function lineageStatBonus(content: Content, history: string[]): Partial<Record<StatKey, number>> {
  const acc: Partial<Record<StatKey, number>> = {};
  for (const id of history) {
    const f = content.forms.get(id);
    if (!f?.statBonus) continue;
    for (const [k, v] of Object.entries(f.statBonus)) acc[k as StatKey] = (acc[k as StatKey] ?? 0) + (v ?? 0);
  }
  return acc;
}

/** Forms the player may switch into: unchosen siblings of their ancestry, tier-earned and (if secret) unlocked. */
export function switchableTargets(state: GameState, content: Content): EvolutionForm[] {
  const cur = content.forms.get(state.formId);
  if (!cur) return [];
  const visited = new Set(state.formHistory);
  // Sibling check excludes the CURRENT form, so its own children (normal forward evolutions, reached
  // for free via evolve) are not offered as paid switches — only unchosen siblings of past forms are.
  const pastNoCur = new Set(state.formHistory.filter((id) => id !== state.formId));
  const out: EvolutionForm[] = [];
  for (const f of content.forms.values()) {
    if (f.raceId !== cur.raceId) continue;
    if (f.id === state.formId || visited.has(f.id)) continue; // already current / already taken
    if (!secretMet(state, f)) continue;
    if (state.tier < (f.tierReq ?? 0)) continue; // tier not yet earned
    // an unchosen sibling: at least one of its parents is a PAST form (not the current one)
    const isSibling = [...content.forms.values()].some((p) => p.evolvesTo.includes(f.id) && pastNoCur.has(p.id));
    if (isSibling) out.push(f);
  }
  return out;
}

/** Pay the EP fee and re-route into a sibling branch. Keeps tier/allocations/fusions; swaps the
 *  abandoned branch's evolution stats + skills for the new lineage's. Level resets to 1. */
export function switchBranch(state: GameState, content: Content, targetFormId: string, log: Log): boolean {
  const target = content.forms.get(targetFormId);
  const cur = content.forms.get(state.formId);
  if (!target || !cur || target.raceId !== cur.raceId) return false;
  if (!switchableTargets(state, content).some((f) => f.id === targetFormId)) return false;
  const cost = switchBranchCost(state);
  if ((state.ep ?? 0) < cost) return false;
  state.ep -= cost;
  state.branchSwitchCount = (state.branchSwitchCount ?? 0) + 1; // lifetime — feeds the branch-switch achievement

  const oldHistory = state.formHistory.slice();
  const newHistory = ancestryOf(content, targetFormId);

  // Stats: swap evolution lineage bonuses (race base + allocated stay untouched).
  const oldB = lineageStatBonus(content, oldHistory);
  const newB = lineageStatBonus(content, newHistory);
  for (const k of new Set([...Object.keys(oldB), ...Object.keys(newB)]) as Set<StatKey>) {
    state.stats[k] += (newB[k] ?? 0) - (oldB[k] ?? 0);
  }

  // Skills: drop the abandoned branch's granted skill lines, grant the new branch's (lineage-aware).
  const oldGrants = new Set(oldHistory.flatMap((id) => content.forms.get(id)?.grantSkills ?? []));
  const newGrants = new Set(newHistory.flatMap((id) => content.forms.get(id)?.grantSkills ?? []));
  for (const id of oldGrants) if (!newGrants.has(id)) removeOwnedSkillInLine(state, content, id);
  for (const id of newGrants) if (!oldGrants.has(id) && !ownsSkillLine(state, content, id)) state.skills.push({ id, level: 1, exp: 0 });
  // Drop equips pointing at skills that no longer exist.
  state.equipped = state.equipped.filter((id) => state.skills.some((s) => s.id === id));

  state.formId = targetFormId;
  state.formHistory = newHistory;
  state.level = 1;
  state.xp = 0;
  state.evolveAckCount = 0; // tier is kept; new node → fresh "keep growing" acknowledgement
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  log({ key: 'log.branch_switch', params: { form: target.locKey } });
  return true;
}

// ---- save migration: forms removed in the binary-tree rework ---------------
// The old linear human chain (29 forms) was replaced by a binary branching tree. Saves that
// stopped on a removed form (e.g. `warlord`) would point formId at a non-existent form → the
// evolution tree can't resolve raceId and the player can't evolve. Map each removed id onto the
// nearest surviving form (by theme/tier), then rebuild the lineage so the tree renders cleanly.
const REMOVED_HUMAN_FORM_MAP: Record<string, string> = {
  swordmaster: 'champion_human', battle_mage: 'elemental_mage', guardian: 'paladin',
  arcane_knight: 'paladin', stalwart: 'paladin', warlord: 'blood_warlord',
  conqueror: 'war_deity', war_incarnate: 'war_deity', divine_warrior: 'divine_champion',
  sovereign_knight: 'blade_sovereign', human_sovereign: 'grand_champion', arcane_lord: 'chaos_archmage',
  spell_binder: 'void_seeker', arcane_warlord: 'flame_sovereign', war_mage: 'volcano_lord',
  divine_mage: 'death_ascendant', arcane_sage: 'frost_archmage', arcane_sovereign: 'chaos_archmage',
  iron_guardian: 'paladin', fortress_knight: 'paladin', bulwark: 'divine_champion',
  eternal_guardian: 'holy_crusader', divine_shield: 'holy_crusader', guardian_sovereign: 'divine_champion',
  iron_sovereign: 'grand_champion',
};

/** Root→…→formId lineage (the actual ancestry path in the current form graph). */
function ancestryOf(content: Content, formId: string): string[] {
  const parentOf = (id: string): string | undefined => {
    for (const f of content.forms.values()) if (f.evolvesTo.includes(id)) return f.id;
    return undefined;
  };
  const chain: string[] = [];
  let cur: string | undefined = formId;
  const guard = new Set<string>();
  while (cur && !guard.has(cur)) { guard.add(cur); chain.push(cur); cur = parentOf(cur); }
  return chain.reverse();
}

/** One-time repair: remap a removed formId/history onto the surviving tree. Returns true if changed. */
export function remapRemovedForms(state: GameState, content: Content): boolean {
  const fix = (id: string): string | undefined => {
    if (content.forms.get(id)) return id; // still a valid form
    const mapped = REMOVED_HUMAN_FORM_MAP[id];
    return mapped && content.forms.get(mapped) ? mapped : undefined;
  };
  const before = state.formId;
  let next = fix(state.formId);
  if (!next) {
    // Unmappable: fall back to the deepest still-valid form in history, else this race's root.
    const validHist = state.formHistory.map(fix).filter((x): x is string => !!x);
    const raceRoot = [...content.forms.values()].find(
      (f) => f.raceId === state.raceId && ![...content.forms.values()].some((p) => p.evolvesTo.includes(f.id)),
    );
    next = validHist[validHist.length - 1] ?? raceRoot?.id ?? state.formId;
  }
  const historyDirty = state.formHistory.some((id) => !content.forms.get(id));
  if (next === before && !historyDirty) return false;
  state.formId = next;
  state.formHistory = ancestryOf(content, next); // clean lineage for the tree
  state.seenForms = [...new Set(state.seenForms.map(fix).filter((x): x is string => !!x))];
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
  tierReq: number; // minimum state.tier to unlock this form
  statBonus?: EvolutionForm['statBonus'];
  grantSkills?: string[];
  parents: string[];
  children: string[];
}

/** Bu ırkın formları (mevcut formun raceId'sine göre). Gizli (secret) formlar koşul sağlanana
 *  kadar AĞAÇTAN TAMAMEN GİZLİDİR — easter egg ancak ruh hasadı tamamlanınca beliriverir.
 *  (İstisna: o forma zaten evrimleştiysen kendi formun her zaman görünür.) */
function raceForms(state: GameState, content: Content): EvolutionForm[] {
  const cur = content.forms.get(state.formId);
  const raceId = cur?.raceId;
  return [...content.forms.values()].filter(
    (f) => f.raceId === raceId && (!f.secret || secretMet(state, f) || f.id === state.formId),
  );
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
        tierReq: f.tierReq ?? 0,
        statBonus: f.statBonus,
        grantSkills: f.grantSkills,
        parents: parents.get(f.id) ?? [],
        children: f.evolvesTo,
      };
    })
    .sort((a, b) => a.tier - b.tier);
}
