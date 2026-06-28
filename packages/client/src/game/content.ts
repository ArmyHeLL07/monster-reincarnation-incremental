import type {
  Skill,
  Resistance,
  ResistanceMerger,
  Enemy,
  Race,
  EvolutionForm,
  FusionRules,
  Dungeon,
  SecretRoom,
  RulerDef,
  DifficultyDef,
  ElementChart,
  EventDef,
  ForageableFood,
  Achievement,
  Quest,
  StoryConfig,
  SupportersData,
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
  rooms: Map<string, SecretRoom>;
  ruler: RulerDef[];
  difficulties: Map<string, DifficultyDef>;
  elements: ElementChart;
  events: Map<string, EventDef>;
  /** Forageable food items keyed by id (Yemek Ara mechanic). */
  forageableFoods: Map<string, ForageableFood>;
  resistanceMergers: Map<string, ResistanceMerger>;
  /** Milestone achievements keyed by id. */
  achievements: Map<string, Achievement>;
  /** Repeatable quest templates keyed by id. */
  quests: Map<string, Quest>;
  /** Story-Mode config (chapters + opening "last thought" choices). */
  story: StoryConfig;
  /** Patreon supporters by tier (manually maintained; auto via Worker later). */
  supporters: SupportersData;
}

export async function loadContent(base: string): Promise<Content> {
  const [skills, resistances, enemies, races, forms, fusionRules, dungeon, rooms, ruler, difficulties, elements, events, forageableFoods, resistanceMergerList, achievements, quests, lorePassives, story, supporters] =
    await Promise.all([
      fetchJson<Skill[]>(`${base}skills.json`),
      fetchJson<Resistance[]>(`${base}resistances.json`),
      fetchJson<Enemy[]>(`${base}enemies.json`),
      fetchJson<Race[]>(`${base}races.json`),
      fetchJson<EvolutionForm[]>(`${base}evolutions.json`),
      fetchJson<FusionRules>(`${base}fusion_rules.json`),
      fetchJson<Dungeon>(`${base}dungeon.json`),
      fetchJson<SecretRoom[]>(`${base}secret_rooms.json`),
      fetchJson<RulerDef[]>(`${base}ruler.json`),
      fetchJson<DifficultyDef[]>(`${base}difficulty.json`),
      fetchJson<ElementChart>(`${base}elements.json`),
      fetchJson<EventDef[]>(`${base}events.json`),
      fetchJson<ForageableFood[]>(`${base}forageable_foods.json`),
      fetchJson<ResistanceMerger[]>(`${base}resistance_mergers.json`),
      fetchJson<Achievement[]>(`${base}achievements.json`),
      fetchJson<Quest[]>(`${base}quests.json`),
      fetchJson<Skill[]>(`${base}lore_passives.json`),
      fetchJson<StoryConfig>(`${base}story/story.json`),
      fetchJson<SupportersData>(`${base}supporters.json`),
    ]);
  return {
    skills: byId([...skills, ...lorePassives]),
    resistances: byId(resistances),
    enemies: byId(enemies),
    races: byId(races),
    forms: byId(forms),
    fusionRules,
    dungeon,
    rooms: byId(rooms),
    ruler,
    difficulties: byId(difficulties),
    elements,
    events: byId(events),
    forageableFoods: byId(forageableFoods),
    resistanceMergers: new Map(resistanceMergerList.map((m) => [m.id, m])),
    achievements: byId(achievements),
    quests: byId(quests),
    story,
    supporters,
  };
}

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json() as Promise<T>);
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}
