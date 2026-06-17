import type { Skill, Resistance, Enemy, Race, EvolutionForm, FusionRules, Dungeon, ElementRules, RulerRules, BrinkRules, MeditationRules } from '@mri/shared';

// Loaded game content (data-driven — everything comes from /data JSON).
export interface Content {
  skills: Map<string, Skill>;
  resistances: Map<string, Resistance>;
  enemies: Map<string, Enemy>;
  races: Map<string, Race>;
  forms: Map<string, EvolutionForm>;
  fusionRules: FusionRules;
  dungeon: Dungeon;
  elements: ElementRules;
  rulers: RulerRules;
  brink: BrinkRules;
  meditation: MeditationRules;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, races, forms, fusionRules, dungeon, elements, rulers, brink, meditation] = await Promise.all([
    fetchJson<Skill[]>(`${base}skills.json`),
    fetchJson<Resistance[]>(`${base}resistances.json`),
    fetchJson<Enemy[]>(`${base}enemies.json`),
    fetchJson<Race[]>(`${base}races.json`),
    fetchJson<EvolutionForm[]>(`${base}evolutions.json`),
    fetchJson<FusionRules>(`${base}fusion_rules.json`),
    fetchJson<Dungeon>(`${base}dungeon.json`),
    fetchJson<ElementRules>(`${base}elements.json`),
    fetchJson<RulerRules>(`${base}rulers.json`),
    fetchJson<BrinkRules>(`${base}brink.json`),
    fetchJson<MeditationRules>(`${base}meditation.json`),
  ]);
  return {
    skills: byId(skills),
    resistances: byId(resistances),
    enemies: byId(enemies),
    races: byId(races),
    forms: byId(forms),
    fusionRules,
    dungeon,
    elements,
    rulers,
    brink,
    meditation,
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
