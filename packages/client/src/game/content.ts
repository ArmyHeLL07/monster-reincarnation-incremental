import type { Skill, Resistance, Enemy, Zone, Race, EvolutionForm, FusionRules } from '@mri/shared';

// Loaded game content (data-driven — everything comes from /data JSON).
export interface Content {
  skills: Map<string, Skill>;
  resistances: Map<string, Resistance>;
  enemies: Map<string, Enemy>;
  zones: Map<string, Zone>;
  races: Map<string, Race>;
  forms: Map<string, EvolutionForm>;
  fusionRules: FusionRules;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, zones, races, forms, fusionRules] = await Promise.all([
    fetchJson<Skill[]>(`${base}skills.json`),
    fetchJson<Resistance[]>(`${base}resistances.json`),
    fetchJson<Enemy[]>(`${base}enemies.json`),
    fetchJson<Zone[]>(`${base}zones.json`),
    fetchJson<Race[]>(`${base}races.json`),
    fetchJson<EvolutionForm[]>(`${base}evolutions.json`),
    fetchJson<FusionRules>(`${base}fusion_rules.json`),
  ]);
  return {
    skills: byId(skills),
    resistances: byId(resistances),
    enemies: byId(enemies),
    zones: byId(zones),
    races: byId(races),
    forms: byId(forms),
    fusionRules,
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
