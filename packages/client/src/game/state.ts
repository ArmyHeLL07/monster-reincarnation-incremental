import type { StatKey, FusionResult, ComboAttempt, EyeMode, DamageType, Difficulty } from '@mri/shared';

export interface EyeAssignment {
  abilityId: string;
  mode: EyeMode;
}

/** Sin↔Virtue ruler axis + Taboo (GDD §C). Sin/virtue/taboo persist across rebirth. */
export interface RulerState {
  /** Dark axis — grows from kills, risk and Gluttony feeding. */
  sin: number;
  /** Light axis — grows from meditation and patient rest. */
  virtue: number;
  /** The dark-path key; unlocks ruler authority, never reset (top of the persistence hierarchy). */
  taboo: number;
  /** Ruler skill ids already granted (so we grant each once). */
  powers: string[];
}

/** A stored corpse in the larder. `decay` rises each tick (unless refrigerated). */
export interface FoodItem {
  enemyId: string;
  satiety: number;
  decay: number;
}

export interface SkillSlot {
  id: string;
  level: number;
  exp: number;
  /** Evolution tier (1 = base). T2 Lv1 reads as the "11th level" of mastery, and so on. */
  tier?: number;
}

export interface ResistSlot {
  id: string;
  level: number;
  exp: number;
  nullified: boolean;
}

export interface DungeonPos {
  layer: number;
  floor: number;
  room: number;
}

/** A spawned enemy — stats are snapshot here (scaled by dungeon depth) so combat is data-free. */
export interface EnemyInstance {
  id: string;
  locKey: string;
  hp: number;
  maxHp: number;
  attack: number;
  damageType: DamageType;
  damageType2?: DamageType;
  ep: number;
  satiety: number;
  isBoss: boolean;
}

export const MAX_HUNGER = 100;
/** Character level cap per evolution tier — reach it, then evolve to advance to the next tier. */
export const LEVEL_CAP = 10;
/** Meditation gauge needed to unlock the hidden zen skill (GDD §7.6). */
export const MEDITATION_MAX = 600;

/** What the player is doing. `idle` freezes the world; `meditate` is the hidden zen state. */
export type ActionMode = 'idle' | 'combat' | 'rest' | 'meditate';

export interface GameState {
  stats: Record<StatKey, number>;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  /** Passive growth from sustained play — raises SP *regen*, not max SP. */
  spRegenBonus: number;
  level: number;
  /** Evolution tier; starts at 0 (hidden) and shows from T1 after the first evolution. */
  tier: number;
  xp: number;
  statPoints: number;
  /** Autosave interval in minutes (player choice). */
  autosaveMin: number;
  /** Chosen language ('tr' | 'en'); undefined = auto-detect. */
  lang?: 'tr' | 'en';
  /** 0 = full, MAX_HUNGER = starving. */
  hunger: number;
  /** Stored corpses (from kills) — auto-eaten when hunger crosses the threshold; they decay. */
  inventory: FoodItem[];
  ep: number;
  pos: DungeonPos;
  raceId: string;
  formId: string;
  /** slotId → assigned eye ability + mode (or null/absent = empty). */
  eyeAssignments: Record<string, EyeAssignment | null>;
  /** Current action: idle = time frozen (nothing progresses); combat / rest run the clock. */
  action: ActionMode;
  /** true when combat auto-paused at low HP — auto-resumes when HP recovers (AFK loop). */
  autoResume: boolean;
  /** Discovered ability: when SP is empty, burn MP before HP. */
  mpTransferUnlocked: boolean;
  skills: SkillSlot[];
  resistances: ResistSlot[];
  enemy: EnemyInstance | null;
  /** Global discovery pool skeleton — a combo is produced once (local for now). */
  fusionCache: Record<string, FusionResult>;
  /** Local telemetry outbox — session combo attempts, ready to send. */
  outbox: ComboAttempt[];
  lastSeen: number;

  // --- difficulty (GDD §8.5) -------------------------------------------------
  difficulty: Difficulty;
  /** Hell-only: death is a true wipe. */
  permadeath: boolean;
  /** Race ids that have cleared Hell with permadeath — permanent, race-specific reward. */
  hellClears: string[];

  // --- rebirth / prestige (GDD §7.5) ----------------------------------------
  rebirthCount: number;
  /** Content unlocked by rebirths/secret rooms (skill ids, layer keys…) — persists. */
  unlocks: string[];
  /** Total kills this life — feeds Sin and gatekeeper pacing. */
  kills: number;
  /** Set when the Gatekeeper boss falls — Rebirth becomes available (cleared on rebirth). */
  gatekeeperCleared: boolean;
  /** Permanent starting-stat boon accumulated across rebirths (the small kindness, §7.5.4). */
  rebirthBoon: number;

  // --- ruler axis + taboo (GDD §C) ------------------------------------------
  ruler: RulerState;

  // --- meditation (GDD §7.6) -------------------------------------------------
  /** Hidden gauge; fills only while meditating. */
  meditation: number;
  meditationUnlocked: boolean;

  // --- discovery: books, secret rooms, fragments, scars (GDD §7.7/§8.2/§5.0.4)
  /** Sacrifice-book ids found (carried, may be unread). */
  booksFound: string[];
  /** Book/room ids whose lore or reward has been consumed. */
  discoveries: string[];
  mapFragments: number;
  loreFragments: number;
  /** A perceived-but-unsolved secret room awaiting its riddle answer. */
  pendingRoom: string | null;
  /** Accumulated fusion "scar" penalty (GDD §5.0.4) — flat stat drain until repaired. */
  scars: number;
  /** Furthest linear room index reached per layer id → drives the map's fog-of-war reveal. */
  exploredMax: Record<number, number>;
}

/** lvLabel localization key reused across log lines. */
export interface LogEvent {
  key: string;
  params?: Record<string, string | number>;
}

export interface GameEvents extends Record<string, unknown> {
  log: LogEvent;
  changed: undefined;
}

/** Recompute max HP/MP/SP from stats (+ stamina training) and clamp current values. */
export function recomputeMaxes(state: GameState): void {
  state.maxHp = 20 + state.stats.VIT * 4; // VIT → HP
  state.maxMp = 10 + state.stats.INT * 3; // INT → MP (and magic power, later)
  state.maxSp = 10 + state.stats.VIT * 2 + state.stats.AGI * 2; // small base, grows with VIT/AGI
  state.hp = Math.min(state.hp, state.maxHp);
  state.mp = Math.min(state.mp, state.maxMp);
  state.sp = Math.min(state.sp, state.maxSp);
}

export function newGame(): GameState {
  const stats: Record<StatKey, number> = { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 };
  const state: GameState = {
    stats,
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    sp: 0,
    maxSp: 0,
    spRegenBonus: 0,
    level: 1,
    tier: 0,
    xp: 0,
    statPoints: 0,
    autosaveMin: 5,
    hunger: 0,
    inventory: [],
    ep: 0,
    pos: { layer: 1, floor: 1, room: 1 },
    raceId: 'spider',
    formId: 'hatchling_spider',
    eyeAssignments: { e1: { abilityId: 'appraisal', mode: 'passive' } },
    action: 'idle',
    autoResume: false,
    mpTransferUnlocked: false,
    skills: [
      { id: 'venom_bite', level: 1, exp: 0 },
      { id: 'sharp_claw', level: 1, exp: 0 },
      { id: 'silk_thread', level: 1, exp: 0 },
      { id: 'hp_regen', level: 1, exp: 0 },
      { id: 'appraisal', level: 1, exp: 0 },
      { id: 'quick_thought', level: 1, exp: 0 },
      { id: 'chitin_hide', level: 1, exp: 0 },
      { id: 'many_legged_gait', level: 1, exp: 0 },
    ],
    resistances: [
      { id: 'physical_res', level: 0, exp: 0, nullified: false },
      { id: 'pierce_res', level: 0, exp: 0, nullified: false },
      { id: 'poison_res', level: 0, exp: 0, nullified: false },
      { id: 'fire_res', level: 0, exp: 0, nullified: false },
    ],
    enemy: null,
    fusionCache: {},
    outbox: [],
    lastSeen: Date.now(),
    difficulty: 'normal',
    permadeath: false,
    hellClears: [],
    rebirthCount: 0,
    unlocks: [],
    kills: 0,
    gatekeeperCleared: false,
    rebirthBoon: 0,
    ruler: { sin: 0, virtue: 0, taboo: 0, powers: [] },
    meditation: 0,
    meditationUnlocked: false,
    booksFound: [],
    discoveries: [],
    mapFragments: 0,
    loreFragments: 0,
    pendingRoom: null,
    scars: 0,
    exploredMax: {},
  };
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  return state;
}
