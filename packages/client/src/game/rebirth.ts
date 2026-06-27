import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { newGame, recomputeMaxes, emptyEquipment, emptyAllocated } from './state';
import type { LootItem } from '@mri/shared';
import { applyDifficultyStart } from './difficulty';
import { applyRace } from './race';
import { computeSoulGain } from './soul';
import { rollRebirthPerks } from './teachings';

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

  // --- Soul prestige: award Souls for how far this run reached (BEFORE the reset wipes depth) ---
  const earnedSouls = computeSoulGain(state);
  state.souls = (state.souls ?? 0) + earnedSouls;

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
  // Loot: lower hierarchy resets, BUT legendary items persist (prestige reward, locked decision).
  const keepLegendary: LootItem[] = [
    ...(state.inventoryItems ?? []).filter((i) => i.rarity === 'legendary'),
    ...Object.values(state.equipment ?? {}).filter((i): i is LootItem => !!i && i.rarity === 'legendary'),
  ];
  state.inventoryItems = keepLegendary;
  state.equipment = emptyEquipment();
  state.allocated = emptyAllocated(); // a fresh life re-allocates from scratch
  state.enemy = null;
  state.eyeAssignments = { ...fresh.eyeAssignments };
  state.kills = 0;
  state.scars = 0;
  state.pendingRoom = null;
  state.statusEffects = []; // a fresh life carries no lingering poison/burn…
  state.minions = {
    dps: 0,
    tank: 0,
    utility: 0,
    tankHp: 0,
    tankMaxHp: 0,
  };
  state.roomCleared = false; // …nor a stuck "cleared room" flag…
  state.cooldowns = {}; // …nor old skill cooldowns.
  state.pendingEvent = null; // …nor an open map event…
  state.resolvedEvents = []; // …and the fresh map's events re-trigger.
  state.bossRiddle = null; // …nor an open boss riddle…
  state.riddleLimits = {}; // …and riddle attempt-locks reset for the fresh run.
  state.epStatsBought = 0;  // EP stat purchases reset — fresh life, fresh economy.
  state.tempBuffs = {};     // Temporary buffs don't survive death.
  state.webRoom = null;
  state.webTicks = 0;
  state.webAccEp = 0;
  state.webAccFood = [];
  state.webAccLoot = [];
  state.mutations = [];
  // formHistory is reset AFTER applyRace below, using the race's real starting form.

  // --- base stats reset (race-specific base applied by applyRace below) -----
  state.stats = { ...fresh.stats }; // default; applyRace overrides for races with startStats

  // --- upper hierarchy: PRESERVED -------------------------------------------
  // raceId, ruler (sin/virtue/taboo/powers), meditationUnlocked, hellClears,
  // unlocks, discoveries, booksFound, difficulty — all untouched.
  state.rebirthCount += 1;
  state.rebirthBoon = boon;
  state.gatekeeperCleared = false;
  state.unlocks.push(`rebirth_${state.rebirthCount}`);

  applyDifficultyStart(state, content, state.difficulty);
  // Re-apply race-specific starting config so rebirths start with the correct race skills/form/stats.
  applyRace(state, savedRaceId, content);
  // The permanent boon is added AFTER the race base stats so it's never wiped by applyRace.
  for (const k of Object.keys(state.stats) as (keyof typeof state.stats)[]) {
    state.stats[k] += boon; // +1 per rebirth to every stat, permanently
  }
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  state.formHistory = [state.formId]; // lineage starts at THIS race's start form (set by applyRace; seenForms = knowledge, preserved)

  log({ key: 'log.rebirth_msg' });
  log({ key: 'log.rebirth_done', params: { n: state.rebirthCount } });
  log({ key: 'log.soul_gain', params: { souls: earnedSouls, total: state.souls } });
  
  state.pendingRebirthPerk = true;
  state.rebirthPerkChoices = rollRebirthPerks(state);
  return true;
}
