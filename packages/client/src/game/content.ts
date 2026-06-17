import type {
  Skill,
  Resistance,
  Enemy,
  Race,
  EvolutionForm,
  FusionRules,
  Dungeon,
  Book,
  SecretRoom,
  RulerDef,
  DifficultyDef,
  ElementChart,
} from '@mri/shared';

// Loaded game content (data-driven — everything comes from /data JSON).
export interface Content {
  skills: Map<string, Skill>;
  resistances: Map<string, Resistance>;
  enemies: Map<string, Enemy>;
  races: Map<string, Race>;
  forms: Map<string, EvolutionForm>;
  fusionRules: FusionRules;
  dungeon: Dungeon;
  books: Map<string, Book>;
  rooms: Map<string, SecretRoom>;
  ruler: RulerDef[];
  difficulties: Map<string, DifficultyDef>;
  elements: ElementChart;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, races, forms, fusionRules, dungeon, books, rooms, ruler, difficulties, elements] =
    await Promise.all([
      fetchJson<Skill[]>(`${base}skills.json`),
      fetchJson<Resistance[]>(`${base}resistances.json`),
      fetchJson<Enemy[]>(`${base}enemies.json`),
      fetchJson<Race[]>(`${base}races.json`),
      fetchJson<EvolutionForm[]>(`${base}evolutions.json`),
      fetchJson<FusionRules>(`${base}fusion_rules.json`),
      fetchJson<Dungeon>(`${base}dungeon.json`),
      fetchJson<Book[]>(`${base}books.json`),
      fetchJson<SecretRoom[]>(`${base}secret_rooms.json`),
      fetchJson<RulerDef[]>(`${base}ruler.json`),
      fetchJson<DifficultyDef[]>(`${base}difficulty.json`),
      fetchJson<ElementChart>(`${base}elements.json`),
    ]);
  return {
    skills: byId(skills),
    resistances: byId(resistances),
    enemies: byId(enemies),
    races: byId(races),
    forms: byId(forms),
    fusionRules,
    dungeon,
    books: byId(books),
    rooms: byId(rooms),
    ruler,
    difficulties: byId(difficulties),
    elements,
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
