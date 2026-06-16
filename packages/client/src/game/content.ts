import type { Skill, Resistance, Enemy, Zone } from '@mri/shared';

// Loaded game content (data-driven — everything comes from /data JSON).
export interface Content {
  skills: Map<string, Skill>;
  resistances: Map<string, Resistance>;
  enemies: Map<string, Enemy>;
  zones: Map<string, Zone>;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, zones] = await Promise.all([
    fetchJson<Skill[]>(`${base}skills.json`),
    fetchJson<Resistance[]>(`${base}resistances.json`),
    fetchJson<Enemy[]>(`${base}enemies.json`),
    fetchJson<Zone[]>(`${base}zones.json`),
  ]);
  return {
    skills: byId(skills),
    resistances: byId(resistances),
    enemies: byId(enemies),
    zones: byId(zones),
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
