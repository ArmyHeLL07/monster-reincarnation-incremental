import type { StatKey, FusionResult, ComboAttempt } from '@mri/shared';

export interface SkillSlot {
  id: string;
  level: number;
  exp: number;
}

export interface ResistSlot {
  id: string;
  level: number;
  exp: number;
  nullified: boolean;
}

export interface EnemyInstance {
  id: string;
  hp: number;
  maxHp: number;
}

export const MAX_HUNGER = 100;

export interface GameState {
  stats: Record<StatKey, number>;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  spTrainingBonus: number;
  /** 0 = full, MAX_HUNGER = starving. */
  hunger: number;
  ep: number;
  zoneId: string;
  /** true = fighting (drains SP), false = resting (regenerates). */
  combatActive: boolean;
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
  state.maxHp = 20 + state.stats.VIT * 4;
  state.maxMp = 10 + state.stats.INT * 3;
  state.maxSp = 30 + state.stats.VIT * 3 + state.spTrainingBonus;
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
    spTrainingBonus: 0,
    hunger: 0,
    ep: 0,
    zoneId: 'lower_stratum',
    combatActive: false,
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
