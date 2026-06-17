import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { newGame, recomputeMaxes } from './state';
import { applyDifficultyStart } from './difficulty';

type Log = (e: LogEvent) => void;

/** Rebirth is available once the Gatekeeper boss has fallen (GDD §7.5.1). */
export function canRebirth(state: GameState): boolean {
  return state.gatekeeperCleared;
}

/**
 * Rebirth / prestige reset (GDD §7.5.3). Resets the lower hierarchy (skills, evolution, zone,
 * level/tier) but PRESERVES the upper hierarchy: race identity, Ruler axis + Taboo, Hell clears,
 * discoveries and unlocks. Each rebirth grants a small permanent boon and opens new content.
 */
export function rebirth(state: GameState, content: Content, log: Log): boolean {
  if (!canRebirth(state)) return false;

  const fresh = newGame();
  const boon = state.rebirthBoon + 1;

  // --- lower hierarchy: reset to a fresh weak start --------------------------
  state.skills = fresh.skills.map((s) => ({ ...s }));
  state.resistances = fresh.resistances.map((r) => ({ ...r }));
  state.formId = fresh.formId;
  state.tier = 0;
  state.level = 1;
  state.xp = 0;
  state.statPoints = boon * 3; // the small permanent kindness (§7.5.4)
  state.ep = 0;
  state.hunger = 0;
  state.inventory = [];
  state.enemy = null;
  state.eyeAssignments = { ...fresh.eyeAssignments };
  state.kills = 0;
  state.scars = 0;
  state.pendingRoom = null;

  // --- base stats reset, then keep the permanent boon -----------------------
  state.stats = { ...fresh.stats };
  for (const k of Object.keys(state.stats) as (keyof typeof state.stats)[]) {
    state.stats[k] += boon; // +1 per rebirth to every stat, permanently
  }

  // --- upper hierarchy: PRESERVED -------------------------------------------
  // raceId, ruler (sin/virtue/taboo/powers), meditationUnlocked, hellClears,
  // unlocks, discoveries, booksFound, difficulty — all untouched.
  state.rebirthCount += 1;
  state.rebirthBoon = boon;
  state.gatekeeperCleared = false;
  state.unlocks.push(`rebirth_${state.rebirthCount}`);

  applyDifficultyStart(state, content, state.difficulty);
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;

  log({ key: 'log.rebirth_msg' });
  log({ key: 'log.rebirth_done', params: { n: state.rebirthCount } });
  return true;
}
