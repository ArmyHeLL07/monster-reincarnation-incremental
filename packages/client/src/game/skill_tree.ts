import type { GameState } from './state';
import type { Content } from './content';
import type { Skill } from '@mri/shared';

export type SkillNodeStatus = 'owned' | 'available' | 'locked' | 'seen' | 'hidden';

export interface DerivedSkillEntry {
  id: string;
  conditionText: string;
}

function skillCategory(def: Skill): string {
  if (def.part) return def.part;
  if (def.kind === 'eye') return 'eye';
  if (def.kind === 'active') return 'arm';
  return 'body';
}

/** Update seenSkillIds: owned skills + their 1-hop evolvesTo/derivesTo targets become visible. */
export function markSeenSkills(state: GameState, content: Content): void {
  const seen = new Set(state.seenSkillIds);
  for (const slot of state.skills) {
    seen.add(slot.id);
    const def = content.skills.get(slot.id);
    if (!def) continue;
    for (const nextId of def.evolvesTo) seen.add(nextId);
    if (def.derivesTo) seen.add(def.derivesTo);
  }
  state.seenSkillIds = [...seen];
}

/** Status of a skill node in the tree panel. */
export function skillNodeStatus(state: GameState, content: Content, skillId: string): SkillNodeStatus {
  if (state.skills.some((s) => s.id === skillId)) return 'owned';
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def?.evolvesTo.includes(skillId)) continue;
    return slot.level >= def.lvMax ? 'available' : 'locked';
  }
  if (state.seenSkillIds.includes(skillId)) return 'seen';
  return 'hidden';
}

/** Build ordered linear chains (evolvesTo sequences) for the given category filter. */
export function buildSkillChains(content: Content, categoryFilter: string): string[][] {
  const filtered: Skill[] = [];
  for (const def of content.skills.values()) {
    if (categoryFilter === 'all' || skillCategory(def) === categoryFilter) filtered.push(def);
  }
  const filteredIds = new Set(filtered.map((s) => s.id));

  const targeted = new Set<string>();
  for (const def of filtered) {
    for (const nextId of def.evolvesTo) {
      if (filteredIds.has(nextId)) targeted.add(nextId);
    }
  }

  const roots = filtered.filter((s) => !targeted.has(s.id));
  const chains: string[][] = [];

  for (const root of roots) {
    const chain: string[] = [];
    let curId: string | undefined = root.id;
    const visited = new Set<string>();
    while (curId && filteredIds.has(curId) && !visited.has(curId)) {
      chain.push(curId);
      visited.add(curId);
      const def = content.skills.get(curId);
      curId = def?.evolvesTo.find((id) => filteredIds.has(id));
    }
    if (chain.length > 0) chains.push(chain);
  }

  return chains;
}

/** Returns derived (integration) skills visible in the given category. */
export function derivedSkillsView(content: Content, categoryFilter: string): DerivedSkillEntry[] {
  const result: DerivedSkillEntry[] = [];
  const seen = new Set<string>();

  for (const def of content.skills.values()) {
    if (!def.derivesTo || !def.deriveCondition) continue;
    if (seen.has(def.derivesTo)) continue;
    const targetDef = content.skills.get(def.derivesTo);
    if (!targetDef) continue;
    if (categoryFilter !== 'all' && skillCategory(targetDef) !== categoryFilter) continue;
    seen.add(def.derivesTo);
    const condText = def.deriveCondition.requiresAll
      .map((token) => {
        const [sid, lv] = token.split(':');
        return `${sid} LV${lv}`;
      })
      .join(' + ');
    result.push({ id: def.derivesTo, conditionText: condText });
  }

  return result;
}
