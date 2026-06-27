import type {
  Skill,
  Resistance,
  ResistanceMerger,
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
  EventDef,
  BossRiddle,
  ForageableFood,
  Achievement,
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
  events: Map<string, EventDef>;
  /** Boss riddles keyed by the boss enemy id they gate. */
  bossRiddles: Map<string, BossRiddle>;
  /** Forageable food items keyed by id (Yemek Ara mechanic). */
  forageableFoods: Map<string, ForageableFood>;
  resistanceMergers: Map<string, ResistanceMerger>;
  /** Milestone achievements keyed by id. */
  achievements: Map<string, Achievement>;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, races, forms, fusionRules, dungeon, books, rooms, ruler, difficulties, elements, events, bossRiddles, forageableFoods, resistanceMergerList, achievements] =
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
      fetchJson<EventDef[]>(`${base}events.json`),
      fetchJson<BossRiddle[]>(`${base}boss_riddles.json`),
      fetchJson<ForageableFood[]>(`${base}forageable_foods.json`),
      fetchJson<ResistanceMerger[]>(`${base}resistance_mergers.json`),
      fetchJson<Achievement[]>(`${base}achievements.json`),
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
    events: byId(events),
    // Keyed by riddle id (state.bossRiddle.riddleId looks up by id); pickBossRiddle maps boss→riddle.
    bossRiddles: new Map(bossRiddles.map((r) => [r.id, r])),
    forageableFoods: byId(forageableFoods),
    resistanceMergers: new Map(resistanceMergerList.map((m) => [m.id, m])),
    achievements: byId(achievements),
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
