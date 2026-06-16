import type { StatKey } from '@mri/shared';

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

export interface GameState {
  stats: Record<StatKey, number>;
  hp: number;
  maxHp: number;
  ep: number;
  zoneId: string;
  skills: SkillSlot[];
  resistances: ResistSlot[];
  enemy: EnemyInstance | null;
  lastSeen: number;
}

/** A log line carries localization keys, not text — the UI localizes (multilanguage). */
export interface LogEvent {
  key: string;
  params?: Record<string, string | number>;
}

export interface GameEvents extends Record<string, unknown> {
  log: LogEvent;
  changed: undefined;
}

export function deriveMaxHp(stats: Record<StatKey, number>): number {
  return 20 + stats.VIT * 4;
}

export function newGame(): GameState {
  const stats: Record<StatKey, number> = { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 };
  const maxHp = deriveMaxHp(stats);
  return {
    stats,
    hp: maxHp,
    maxHp,
    ep: 0,
    zoneId: 'lower_stratum',
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
    lastSeen: Date.now(),
  };
}
