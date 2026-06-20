import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { newGame } from './state';
import { applyDifficultyStart } from './difficulty';
import { applyRace } from './race';

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
  const savedRaceId = state.raceId; // race persists through rebirth (upper hierarchy)

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
  state.statusEffects = []; // a fresh life carries no lingering poison/burn…
  state.roomCleared = false; // …nor a stuck "cleared room" flag…
  state.cooldowns = {}; // …nor old skill cooldowns.
  state.pendingEvent = null; // …nor an open map event…
  state.resolvedEvents = []; // …and the fresh map's events re-trigger.
  state.bossRiddle = null; // …nor an open boss riddle…
  state.riddleLimits = {}; // …and riddle attempt-locks reset for the fresh run.
  // formHistory is reset AFTER applyRace below, using the race's real starting form.

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
  // Re-apply race-specific starting config so rebirths start with the correct race skills/form.
  applyRace(state, savedRaceId, content);
  state.formHistory = [state.formId]; // lineage starts at THIS race's start form (set by applyRace; seenForms = knowledge, preserved)

  log({ key: 'log.rebirth_msg' });
  log({ key: 'log.rebirth_done', params: { n: state.rebirthCount } });
  return true;
}
