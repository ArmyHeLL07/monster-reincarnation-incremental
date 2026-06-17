import type { StatKey, FusionResult, ComboAttempt, EyeMode, DamageType } from '@mri/shared';

export interface EyeAssignment {
  abilityId: string;
  mode: EyeMode;
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

/** What the player is doing. `idle` freezes the world (no time passes). */
export type ActionMode = 'idle' | 'combat' | 'rest';

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
  /** Where you're currently fighting (any unlocked spot — farm). */
  pos: DungeonPos;
  /** Deepest unlocked room (the frontier). Progress only extends this at the frontier. */
  furthest: DungeonPos;
  /** Attack cooldown counter (ticks until next attack exchange). */
  atkCd: number;
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
    furthest: { layer: 1, floor: 1, room: 1 },
    atkCd: 0,
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
    ],
    resistances: [
      { id: 'fire_res', level: 0, exp: 0, nullified: false },
      { id: 'physical_res', level: 0, exp: 0, nullified: false },
      { id: 'pierce_res', level: 0, exp: 0, nullified: false },
      { id: 'poison_res', level: 0, exp: 0, nullified: false },
    ],
    enemy: null,
    fusionCache: {},
    outbox: [],
    lastSeen: Date.now(),
  };
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  return state;
}
