// Shared domain types — used by both the client and the Cloudflare worker.
// Keep this the single source of truth for the client↔server contract.

export type StatKey = 'STR' | 'VIT' | 'AGI' | 'INT' | 'WIS' | 'LUCK';

export type SkillKind = 'active' | 'passive' | 'resistance' | 'eye' | 'util';

export type DamageType =
  | 'physical'
  | 'pierce'
  | 'fire'
  | 'poison'
  | 'acid'
  | 'lightning'
  | 'frost'
  | 'magic';

/** A data-driven skill. Player-facing text is referenced by localization key, never inlined. */
export interface Skill {
  id: string;
  locKeyName: string;
  locKeyDesc: string;
  kind: SkillKind;
  stats: StatKey[];
  lvMax: number;
  evolvesTo: string[];
  /** Active damage skills: base damage per use. */
  damage?: number;
  damageType?: DamageType;
  /** Passive regen contributions. */
  hpRegen?: number;
  spRegen?: number;
}

/** Damage-based resistance line — evolves to a Nullity (immunity) at lvMax. */
export interface Resistance {
  id: string;
  locKey: string;
  damageType: DamageType;
  lvMax: number;
  nullityKey: string;
}

/** A data-driven enemy. */
export interface Enemy {
  id: string;
  locKey: string;
  hp: number;
  attack: number;
  damageType: DamageType;
  /** Hunger value when eaten (used by the feeding system). */
  satiety: number;
  /** Evolution points granted on kill. */
  ep: number;
}

/** A content zone — a pool of enemies plus a stamina-drain multiplier. */
export interface Zone {
  id: string;
  locKey: string;
  enemyPool: string[];
  spDrainMult: number;
}

/** Fusion outcome class — see GDD §5.0.3. */
export type FusionClass = 'synergy' | 'quirk' | 'backfire';

/** Deterministic fusion result. Numbers come from data pools, never from an LLM. */
export interface FusionResult {
  id: string;
  aId: string;
  bId: string;
  locKeyName: string;
  cls: FusionClass;
  effectType: string;
  magnitude: number;
}

/** One fusion attempt — the core creativity signal for telemetry. */
export interface ComboAttempt {
  aId: string;
  bId: string;
  resultId: string;
  cls: FusionClass;
  ts: number;
}

/** Session summary the client extracts locally (~5KB). No personal data — behavior only. */
export interface TelemetrySessionSummary {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  comboAttempts: ComboAttempt[];
  /** Combos newly added to the global pool this session. */
  discoveries: string[];
}
