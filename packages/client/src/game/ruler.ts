import type { StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';

type Log = (e: LogEvent) => void;

/** Taboo rises one rank per this much accumulated Sin (GDD §C — the dark-path key). */
const TABOO_PER_SIN = 200;

/** One-time effects unlocked at each Taboo rank. */
const TABOO_RANK_EFFECTS: Record<number, (state: GameState, log: Log) => void> = {
  1: (state, log) => {
    // Dark Whispers: raw power from forbidden insight
    state.stats.INT += 5;
    recomputeMaxes(state);
    log({ key: 'log.taboo_rank1' });
  },
  2: (state, log) => {
    // Forbidden Knowledge: the System's secrets become readable
    if (!state.skills.some((s) => s.id === 'forbidden_knowledge')) {
      state.skills.push({ id: 'forbidden_knowledge', level: 1, exp: 0 });
    }
    log({ key: 'log.taboo_authority' });
  },
  3: (state, log) => {
    // Predation Drive: the taste of kin's blood refines instinct
    state.stats.STR += 5;
    state.stats.AGI += 5;
    recomputeMaxes(state);
    log({ key: 'log.taboo_rank3' });
  },
  4: (state, log) => {
    // Soul Sight: can peer into enemies' essence — auto-appraise
    state.autoAppraise = true;
    log({ key: 'log.taboo_rank4' });
  },
  5: (state, log) => {
    // Taboo Authority: the System acknowledges the transgressor
    for (const r of state.resistances) {
      r.level = Math.min(r.level + 5, 18);
    }
    state.stats.INT += 10;
    state.stats.WIS += 10;
    recomputeMaxes(state);
    log({ key: 'log.taboo_rank5' });
  },
};

const MAX_TABOO_RANK = Object.keys(TABOO_RANK_EFFECTS).length;

/** Grant any ruler powers whose threshold the given pole has now crossed. */
function grantCrossed(state: GameState, content: Content, log: Log): void {
  for (const def of content.ruler) {
    if (state.ruler.powers.includes(def.id)) continue;
    const axis = def.pole === 'sin' ? state.ruler.sin : state.ruler.virtue;
    if (axis < def.threshold) continue;
    state.ruler.powers.push(def.id);
    if (def.statBonus) {
      for (const [k, v] of Object.entries(def.statBonus)) state.stats[k as StatKey] += v ?? 0;
      recomputeMaxes(state);
    }
    log({ key: 'log.ruler_unlock', params: { name: def.locKeyName } });
  }
}

/** Sin grows from kills, risk and gluttony. Crossing thresholds grants sin ruler powers + Taboo. */
export function gainSin(state: GameState, content: Content, amount: number, log: Log): void {
  if (amount <= 0) return;
  state.ruler.sin += amount;
  grantCrossed(state, content, log);
  const rank = Math.min(Math.floor(state.ruler.sin / TABOO_PER_SIN), MAX_TABOO_RANK);
  if (rank > state.ruler.taboo) {
    state.ruler.taboo = rank;
    log({ key: 'log.taboo_rise', params: { rank } });
    TABOO_RANK_EFFECTS[rank]?.(state, log);
  }
}

/** Virtue grows from meditation and patient rest. Crossing thresholds grants virtue ruler powers. */
export function gainVirtue(state: GameState, content: Content, amount: number, log: Log): void {
  if (amount <= 0) return;
  state.ruler.virtue += amount;
  grantCrossed(state, content, log);
}

/** The dominant pole, for UI flavor. */
export function dominantPole(state: GameState): 'sin' | 'virtue' | 'balanced' {
  if (state.ruler.sin > state.ruler.virtue * 1.2) return 'sin';
  if (state.ruler.virtue > state.ruler.sin * 1.2) return 'virtue';
  return 'balanced';
}
