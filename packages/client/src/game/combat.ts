import type { DamageType, StatKey, Skill, DungeonLayer, ResistanceMerger } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot, ResistSlot, LogEvent } from './state';
import { recomputeMaxes, newGame, MAX_HUNGER, LEVEL_CAP, MAX_INVENTORY, effStat } from './state';
import { generateLoot, lootDisplayName } from './loot';
import { isHumanoidForm, availableEvolutions, canEvolve } from './evolution';
import { appraisalAssigned, appraisalTier, gazeNegateChance, gazeAttack } from './eyes';
import { maxFoodSlots, refrigerated, isRotten } from './inventory';
import { aggregateBonuses, type Bonuses } from './effects';
import { gainSin } from './ruler';
import { rollRoomEvent, outcomesFor, applyOutcome, condMet, roomKeyOf } from './roomevents';
import {
  bossRiddleChance,
  pickBossRiddle,
  checkBossAnswer,
  applyRiddleReward,
  RIDDLE_GUARD_MULT,
  RIDDLE_FAILBOSS_MULT,
  RIDDLE_FIGHT_MULTS,
} from './riddles';
import { meditateTick } from './meditation';
import { forage } from './forage';
import { search } from './discovery';
import { diffDef } from './difficulty';
import { sigRestTick, sigCombatTick, sigOnKill, sigCombatStart, sigOnAttack, sigStoneAbsorb, sigSlimeResist } from './signature';
import { soulLevel } from './soul';

type Log = (e: LogEvent) => void;

const LV_LABEL = 'ui.lv';
const BASE_SP_DRAIN = 1;
const REST_SP_REGEN = 5;
const REST_MP_REGEN = 2;
const DEEP_READ_MP_COST = 5;
const HUNGER_RISE_COMBAT = 0.7;
const HUNGER_RISE_REST = HUNGER_RISE_COMBAT * 0.4; // resting still burns calories, just slower
const DEEP_READ_XP = 5;
const MP_TRANSFER_DISCOVER_CHANCE = 0.03;
const LARDER_DISCOVER_CHANCE = 0.04;
/** Souls (kills) a slime must reap in one life to awaken the hidden Demon Slime / Rimuru path. */
export const SECRET_HARVEST_SOULS = 666;
/** Kills a spider must survive in one life to awaken the hidden Kumoko (Zoa Ele → Arachne) path. */
export const SECRET_LABYRINTH_KILLS = 500;
const EYE_DISCOVER_CHANCE = 0.03;
const EYE_DISCOVER_LEVEL = 5;
const APPRAISAL_DISCOVER_CHANCE = 0.05; // the basic "seeing eye" — found early, then slotted by the player
const ENEMY_ATK_INTERVAL = 2; // ticks between enemy strikes — paces combat in both auto & manual
const FUSION_DISCOVER_CHANCE = 0.04; // the fusion lab is found, not free — once you hold ≥2 attack skills
const DEPTH_HP = 0.05; // enemy HP growth per room of depth
const DEPTH_ATK = 0.045;
const BOSS_HP = 2.5;
const BOSS_ATK = 1.6;
const REST_MULT = 0.7; // rest is deliberately slow (~70% of before)
const COMBAT_MP_REGEN = 1; // MP slowly recovers even mid-combat
const STAT_POINTS_PER_LEVEL = 3;
const XP_PER_EP = 8;
const SIN_PER_KILL = 3; // kin kills feed the dark axis (GDD §C)
const SIN_PER_KILL_BOSS = 15; // boss kin = heinous transgression
const AUTO_POWER_PER_LEVEL = 0.015; // each effective level grants +1.5% outgoing damage (auto power)
const STATUS_CHANCE = 0.3; // base chance an elemental enemy hit also applies a lingering status
const DOT_TYPES: DamageType[] = ['poison', 'fire', 'acid', 'lightning', 'frost']; // types that linger as DoT
const CONTROL_TYPES: DamageType[] = ['petrify', 'stun']; // status conditions that stop the player from acting (Kumo)

/** Effective level = how deep the mastery climb is (tier*10 + level); T2 Lv1 reads as "level 11". */
export function effectiveLevel(state: GameState): number {
  return state.tier * LEVEL_CAP + state.level;
}

/** Automatic outgoing-damage multiplier from levels alone (separate from spent stat points). */
export function levelPower(state: GameState): number {
  return 1 + (effectiveLevel(state) - 1) * AUTO_POWER_PER_LEVEL;
}

function skillExpToNext(level: number): number {
  return 15 + level * 10; // slower early (Lv1→2 = 25, was 10)
}
function resistExpToNext(level: number): number {
  return 8 + level * 22; // cheaper early levels (gains feel bigger at the base), steeper later
}

/** XP required per level for a resistance chain skill at the given tier (1–5).
 *  Total XP to complete a tier: T1=200, T2=400, T3=700, T4=1200.
 *  lvMax=5 per tier → xpPerLevel = totalXP/5. */
function resistChainExpToNext(tier: number): number {
  const totals = [0, 200, 400, 700, 1200, 2000];
  return (totals[Math.min(tier, 4)] ?? 1200) / 5;
}

/** XP required per level for a Nullification skill (group or ultimate).
 *  Lv1→2: 2000, each subsequent level +800. */
function nullExpToNext(level: number): number {
  return 2000 + (level - 1) * 800;
}

export function xpToNext(level: number): number {
  return level * 50;
}
function dmgTypeKey(type?: DamageType): string {
  return `dmgtype.${type ?? 'physical'}`;
}

/** Element type-chart multiplier (Atıl's design): attacker element vs enemy element. */
function elementMultiplier(content: Content, atk: DamageType, enemyType: DamageType): number {
  const c = content.elements;
  if (!c?.strongVs) return 1;
  if (c.strongVs[atk] === enemyType) return c.advantage;
  if (c.strongVs[enemyType] === atk) return c.disadvantage;
  return 1;
}

/** Which attacking element is strong against this enemy type (for the Appraisal weakness hint). */
export function weaknessOf(content: Content, enemyType: DamageType): DamageType | null {
  const sv = content.elements?.strongVs;
  if (!sv) return null;
  for (const atk of Object.keys(sv)) if (sv[atk] === enemyType) return atk as DamageType;
  return null;
}

// ---- hunger / fatigue modifiers --------------------------------------------

function hungerStage(state: GameState): number {
  const h = state.hunger;
  if (h < 50) return 0;
  if (h < 75) return 1;
  if (h < 90) return 2;
  return 3;
}
function regenMult(state: GameState): number {
  return [1, 0.6, 0.3, 0][hungerStage(state)];
}
function damageMult(state: GameState): number {
  const hunger = [1, 1, 0.8, 0.6][hungerStage(state)];
  const fatigue = state.sp <= 0 ? 0.5 : 1;
  return hunger * fatigue;
}
function dodgeChance(state: GameState, b: Bonuses): number {
  return Math.min(state.stats.AGI * 0.004 + b.dodgeBonus, 0.6);
}

// ---- main tick -------------------------------------------------------------

/** One real-time tick. `idle` freezes the world; `meditate` runs the zen path; combat/rest advance. */
export function tick(state: GameState, content: Content, log: Log, isOffline: boolean = false): void {
  if (state.action === 'idle') {
    state.lastSeen = Date.now();
    return; // frozen — no hunger, no regen, nothing happens
  }
  state.totalTicks = (state.totalTicks ?? 0) + 1;

  if (state.action === 'meditate') {
    meditateTick(state, content, log); // hidden zen gauge + virtue
    const b = aggregateBonuses(state, content);
    state.sp = Math.min(state.maxSp, state.sp + Math.round((REST_SP_REGEN + state.spRegenBonus + staminaRegenSum(state, content)) * REST_MULT));
    state.mp = Math.min(state.maxMp, state.mp + Math.max(1, Math.round((REST_MP_REGEN + b.mpRegen) * REST_MULT)));
    const hpRegen = (passiveHpRegen(state, content) * (1 + (b.regenMult - 1)) + 1) * REST_MULT;
    state.hp = Math.min(state.maxHp, state.hp + Math.max(1, Math.round(hpRegen)));
    decayFood(state);
    if (state.autoEat) autoEat(state, content, log);
    state.lastSeen = Date.now();
    return;
  }

  if (state.action === 'combat') {
    const b = aggregateBonuses(state, content);
    state.hunger = Math.min(MAX_HUNGER, state.hunger + HUNGER_RISE_COMBAT * b.hungerMult * (diffDef(state, content).brutal ? 1.5 : 1));
    combatRound(state, content, log, b, isOffline);
    processStatuses(state, content, log); // lingering DoT (poison/fire/…) keeps ticking
    if (state.hp <= 0) onDeath(state, content, log, b);
    decayFood(state);
    if (state.autoEat) autoEat(state, content, log);
    if (hungerStage(state) >= 3) {
      state.hp = Math.max(0, state.hp - 1); // starvation
      if (state.hp <= 0) onDeath(state, content, log, b);
    }
  } else {
    restRound(state, content, log);
  }
  growStaminaRegen(state); // training raises SP regen (more in combat / low HP)
  if (state.forageCD > 0) state.forageCD = Math.max(0, state.forageCD - 1000);
  if ((state.searchCD ?? 0) > 0) state.searchCD = Math.max(0, state.searchCD - 1000);
  state.lastSeen = Date.now();
}

const EAT_THRESHOLD = 50;

/** Auto-eat a stored corpse once hungry — freshest-about-to-spoil first. */
function autoEat(state: GameState, content: Content, log: Log): void {
  if (state.hunger < EAT_THRESHOLD || state.inventory.length === 0) return;
  let idx = -1;
  let mostDecayed = -1;
  for (let i = 0; i < state.inventory.length; i++) {
    const it = state.inventory[i];
    if (!isRotten(it) && it.decay > mostDecayed) {
      mostDecayed = it.decay;
      idx = i;
    }
  }
  if (idx >= 0) {
    const [eaten] = state.inventory.splice(idx, 1);
    const wasFullBefore = state.hunger <= 0;
    state.hunger = Math.max(0, state.hunger - eaten.satiety);
    // Gluttony: feeding feeds the dark axis; eating while full gives more sin.
    const tabooActiveAuto = state.ruler.taboo >= 1;
    const sinGainAuto = wasFullBefore ? (tabooActiveAuto ? 10 : 2) : 0.25;
    gainSin(state, content, sinGainAuto, log);
    if (wasFullBefore && !state.ruler.powers.includes('gluttony')) {
      const gluttonyChanceAuto = tabooActiveAuto ? 0.10 : 0.01;
      if (Math.random() < gluttonyChanceAuto) {
        state.ruler.powers.push('gluttony');
        log({ key: 'log.gluttony_awaken' });
      }
    }

    // Devouring mechanic: chance to learn a skill from the eaten enemy
    const enemyDef = content.enemies.get(eaten.enemyId);
    if (enemyDef && enemyDef.grantSkills && enemyDef.grantSkills.length > 0) {
      const learnable = enemyDef.grantSkills.filter(sid => !state.skills.some(s => s.id === sid));
      if (learnable.length > 0 && Math.random() < 0.20) {
        const chosen = learnable[Math.floor(Math.random() * learnable.length)];
        state.skills.push({ id: chosen, level: 1, exp: 0 });
        log({ key: 'log.devour_skill', params: { enemy: enemyDef.locKey, skill: `skill.${chosen}.name` } });
      }
    }
    return;
  }

  const rotten = state.inventory.shift();
  if (rotten) {
    addResistExp(state, content, 'poison', 3, log);
    log({ key: 'log.ate_rotten' });
  }
}

/** Manually eat one stored corpse (player-driven; Gluttony is discovered by choosing to feed). */
export function eatFood(state: GameState, content: Content, index: number, log: Log): void {
  const it = state.inventory[index];
  if (!it) return;
  state.inventory.splice(index, 1);
  if (isRotten(it)) {
    addResistExp(state, content, 'poison', 3, log); // rotten meat = passive poison resistance
    log({ key: 'log.ate_rotten' });
  } else {
    const wasFullBefore = state.hunger <= 0;
    state.hunger = Math.max(0, state.hunger - it.satiety);
    // Eating while full: greater sin + rare Gluttony awakening
    const tabooActive = state.ruler.taboo >= 1;
    const sinGain = wasFullBefore ? (tabooActive ? 10 : 2) : 0.25;
    gainSin(state, content, sinGain, log);
    if (wasFullBefore && !state.ruler.powers.includes('gluttony')) {
      const gluttonyChance = tabooActive ? 0.10 : 0.01;
      if (Math.random() < gluttonyChance) {
        state.ruler.powers.push('gluttony');
        log({ key: 'log.gluttony_awaken' });
      }
    }
    log({ key: 'log.ate', params: { sat: it.satiety } });

    // Devouring mechanic: chance to learn a skill from the eaten enemy
    const enemyDef = content.enemies.get(it.enemyId);
    if (enemyDef && enemyDef.grantSkills && enemyDef.grantSkills.length > 0) {
      const learnable = enemyDef.grantSkills.filter(sid => !state.skills.some(s => s.id === sid));
      if (learnable.length > 0 && Math.random() < 0.20) {
        const chosen = learnable[Math.floor(Math.random() * learnable.length)];
        state.skills.push({ id: chosen, level: 1, exp: 0 });
        log({ key: 'log.devour_skill', params: { enemy: enemyDef.locKey, skill: `skill.${chosen}.name` } });
      }
    }
  }
}

function decayFood(state: GameState): void {
  if (refrigerated(state)) return;
  for (const item of state.inventory) item.decay += 1;
}

function growStaminaRegen(state: GameState): void {
  state.spRegenBonus += state.action === 'combat' ? 0.05 * (1 + (1 - state.hp / Math.max(1, state.maxHp))) : 0.01;
}

/** Active Appraisal deep-read — spends MP to reveal full enemy info (GDD §5.0.7). */
export function deepRead(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  if (!appraisalAssigned(state)) {
    log({ key: 'log.no_eye' });
    return;
  }
  if (state.mp < DEEP_READ_MP_COST) {
    log({ key: 'log.no_mp' });
    return;
  }
  state.mp -= DEEP_READ_MP_COST;
  // Detail is shown ON the enemy panel (not dumped to the action log): mark this foe as analyzed.
  enemy.analyzed = true;
  const slot = state.skills.find((s) => s.id === 'appraisal' || s.id === 'insight' || s.id === 'all_sight');
  if (slot) addSkillExp(state, content, slot, DEEP_READ_XP, log, 1);
  log({ key: 'log.analyzed', params: { enemy: enemy.locKey } }); // single, concise confirmation
}

/** Spend a stat point (STR power, VIT HP+stamina, INT MP, AGI dodge+stamina, …). */
export function allocStat(state: GameState, stat: StatKey): void {
  if (state.statPoints <= 0) return;
  state.stats[stat] += 1;
  state.allocated[stat] = (state.allocated[stat] ?? 0) + 1; // tracked so respec can refund exactly
  state.statPoints -= 1;
  recomputeMaxes(state);
}

/** EP cost to respec — scales with how many points were allocated this life. */
export function respecCost(state: GameState): number {
  const total = Object.values(state.allocated ?? {}).reduce((s, v) => s + v, 0);
  return total * 3;
}

/** Refund all manually-allocated stat points back to the pool (race base / evolution gains stay). */
export function respecStats(state: GameState): boolean {
  const cost = respecCost(state);
  const total = Object.values(state.allocated).reduce((s, v) => s + v, 0);
  if (total <= 0 || state.ep < cost) return false;
  state.ep -= cost;
  for (const k of Object.keys(state.allocated) as StatKey[]) {
    state.stats[k] -= state.allocated[k];
    state.statPoints += state.allocated[k];
    state.allocated[k] = 0;
  }
  recomputeMaxes(state);
  return true;
}

/**
 * "Push to the Brink" (GDD §6.1) — usable any time, not just in combat.
 * 1st push: HP drops to ~1% (99% gone) but you survive. 2nd push at the brink: instant death.
 */
export function courtDeath(state: GameState, content: Content, log: Log): void {
  if (state.hp <= 0) return;
  const brinkLine = Math.max(1, Math.floor(state.maxHp * 0.1));
  if (state.hp <= brinkLine) {
    log({ key: 'log.court_death_fatal' });
    state.hp = 0;
    onDeath(state, content, log, aggregateBonuses(state, content)); // a second push is fatal
    return;
  }
  state.hp = Math.max(1, Math.floor(state.maxHp * 0.01)); // first push: 99% gone, on the edge
  log({ key: 'log.court_death' });
  tryLearnRegen(state, content, log, true);
}

// ---- rounds ----------------------------------------------------------------

/** Minimum kills required before the Advance button unlocks (non-boss rooms only). */
export const ROOM_KILL_QUOTA = 10;

/** Rebirth scaling: each rebirth adds 10% to enemy power and all rewards. */
export function rebirthMult(state: GameState): number {
  return 1 + (state.rebirthCount ?? 0) * 0.10;
}

/** Effective room kill quota after soul upgrades (minimum 1). */
export function roomQuota(state: GameState): number {
  return Math.max(1, ROOM_KILL_QUOTA - soulLevel(state, 'room_quota_down'));
}

function clearRoom(state: GameState, content: Content, log: Log): void {
  state.enemy = null;
  const layer = currentLayer(state, content);
  const isBossRoom = !!layer && state.pos.room >= roomsOf(state, layer, state.pos.floor);

  if (isBossRoom) {
    // Boss kill: advance or hold for the "Advance" tap. Reset room lock.
    state.roomKillCount = 0;
    state.roomEnemyId = null;
    if (state.autoAdvance) advancePosition(state, content, log);
    else state.roomCleared = true;
    return;
  }

  // Non-boss rooms: track the kill count and unlock the Advance button at quota.
  // Enemies KEEP spawning after quota — player farms freely until they press Advance.
  state.roomKillCount = (state.roomKillCount ?? 0) + 1;
  if (state.roomKillCount >= roomQuota(state) && state.autoAdvance) {
    state.roomKillCount = 0;
    state.roomEnemyId = null;
    advancePosition(state, content, log);
  }
  // No roomCleared = enemies respawn. Advance button appears in UI when quota met.
}

function combatRound(state: GameState, content: Content, log: Log, b: Bonuses, isOffline: boolean = false): void {
  if (state.pendingEvent) return; // an event panel is open — no combat until the player chooses
  if (state.bossRiddle && !state.enemy) return; // boss riddle awaiting an answer (no guard fighting now)
  // An explored (no-combat) room has nothing to farm — it holds until the player taps "Advance".
  if (state.roomCleared) return;
  if (!state.enemy) {
    // Event rooms never replace the entry room or the floor's boss room.
    const evLayer = currentLayer(state, content);
    const atBossRoom = !!evLayer && state.pos.room >= roomsOf(state, evLayer, state.pos.floor);
    if (!atBossRoom && !isOffline) {
      const evId = rollRoomEvent(state, content);
      if (evId) {
        state.pendingEvent = { id: evId, roomKey: roomKeyOf(state) };
        return; // event set up; the UI shows its panel
      }
    }
    // Boss room: a luck-rolled chance to become a riddle challenge instead of a straight fight.
    if (atBossRoom && evLayer && !state.resolvedEvents.includes(roomKeyOf(state)) && !isOffline) {
      const riddle = pickBossRiddle(content, evLayer.boss);
      if (riddle && Math.random() < bossRiddleChance(state)) {
        state.bossRiddle = { roomKey: roomKeyOf(state), riddleId: riddle.id, attempts: 0 };
        recordExplored(state);
        return; // the UI shows the boss-riddle panel
      }
    }
    if (isExplorationRoom(state, content)) {
      resolveExploration(state, content, log); // calm room: small reward
      if (state.autoAdvance) advancePosition(state, content, log);
      else state.roomCleared = true; // nothing to fight here — wait for "Advance"
      return;
    }
    spawnEnemy(state, content, log); // combat room: (re)spawn keeps farming when auto-advance is off
  }
  if (state.roomCleared || !state.enemy) return;
  applyAmbient(state, content, log); // environmental burn (elemental layers only)
  applyRoomModifierTick(state, content, log); // per-room modifier passive drain
  if (state.hp <= 0) {
    onDeath(state, content, log, b);
    return;
  }
  sigCombatTick(state);
  applyCombatRegen(state, content, b);
  state.mp = Math.min(state.maxMp, state.mp + Math.max(1, Math.round(COMBAT_MP_REGEN + b.mpRegen)));
  drainStamina(state, content);
  tryLearnRegen(state, content, log, false);
  // Per-skill cooldowns pace attacks — no more "every skill every tick".
  for (const id of state.equipped) {
    const cd = state.cooldowns[id] ?? 0;
    if (cd > 0) state.cooldowns[id] = cd - 1;
  }
  // Petrify/stun lock the player out: no skills, no gaze this tick — but the enemy still strikes.
  const locked = isControlled(state);
  // AUTO: fire each equipped skill that's off cooldown. (MANUAL: player taps cast buttons instead.)
  if (!locked && state.combatMode === 'auto') {
    for (const id of state.equipped) {
      if (!state.enemy) break;
      if (castSkill(state, content, id, log, b, isOffline) && state.enemy.hp <= 0) {
        onKill(state, content, log, b, isOffline);
        break;
      }
    }
  }
  if (!locked && state.enemy) fireGaze(state, content, log);
  // Parallel Minds (Kumo): each independent mind fires one extra equipped skill this turn, bypassing
  // cooldown — so 3 minds can attack + cast + cast simultaneously. Autonomous in both auto & manual.
  if (!locked && state.enemy) {
    const minds = parallelMinds(state);
    for (let i = 0; i < minds && state.enemy; i++) {
      const id = state.equipped[i % Math.max(1, state.equipped.length)];
      if (!id) break;
      if (castSkill(state, content, id, log, b, isOffline, true) && state.enemy.hp <= 0) {
        onKill(state, content, log, b, isOffline);
        break;
      }
    }
    // Parallel tasking: while one mind fights, another reads the labyrinth — extra regen + rare finds.
    if (state.enemy && minds > 0) {
      state.mp = Math.min(state.maxMp, state.mp + minds);
      state.sp = Math.min(state.maxSp, state.sp + minds);
      if (!isOffline && Math.random() < 0.01 * minds) {
        if (Math.random() < 0.5) state.mapFragments += 1;
        else state.loreFragments += 1;
        log({ key: 'log.parallel_search' });
      }
    }
  }
  if (state.enemy && state.enemy.hp <= 0) onKill(state, content, log, b, isOffline);
  // Enemy strikes on its own cadence (paced in both modes).
  if (state.enemy) {
    state.enemy.atkCd -= 1;
    if (state.enemy.atkCd <= 0) {
      state.enemy.atkCd = ENEMY_ATK_INTERVAL;
      enemyAttack(state, content, log, b);
      if (state.enemy?.behavior?.doubleStrike && state.hp > 0) enemyAttack(state, content, log, b); // strikes twice
      if (state.enemy?.behavior?.regen) {
        const heal = Math.round(state.enemy.maxHp * state.enemy.behavior.regen);
        state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + heal);
      }
    }
  }
  if (state.hp <= 0) onDeath(state, content, log, b);
}

/** Ticks before a skill can fire again. Base scales with skill level (Lv1=10, Lv10=3).
 *  AGI reduces for all skills; INT also reduces for magic skills. */
function skillCooldown(def: Skill, state: GameState, lv: number): number {
  const lvMax = def.lvMax ?? 10;
  const baseCd = 3 + Math.round(7 * (lvMax - lv) / Math.max(1, lvMax - 1));
  const agiReduce = Math.floor(state.stats.AGI / 30);
  const intReduce = def.kind === 'magic' ? Math.floor(state.stats.INT / 30) : 0;
  return Math.max(1, baseCd - agiReduce - intReduce);
}

function restRound(state: GameState, content: Content, log: Log): void {
  state.enemy = null;
  sigRestTick(state);
  const b = aggregateBonuses(state, content);
  state.sp = Math.min(state.maxSp, state.sp + Math.round((REST_SP_REGEN + state.spRegenBonus + staminaRegenSum(state, content)) * REST_MULT));
  state.mp = Math.min(state.maxMp, state.mp + Math.max(1, Math.round((REST_MP_REGEN + b.mpRegen) * REST_MULT)));
  const hp = (passiveHpRegen(state, content) * (1 + (b.regenMult - 1)) + 1) * REST_MULT;
  state.hp = Math.min(state.maxHp, state.hp + Math.max(1, Math.round(hp)));

  // Time still passes while resting — hunger drains at 40% of combat rate.
  state.hunger = Math.min(MAX_HUNGER, state.hunger + HUNGER_RISE_REST * b.hungerMult);
  // Starvation still bites during rest (just not enough food).
  if (hungerStage(state) >= 3) {
    state.hp = Math.max(0, state.hp - 1);
  }

  // Auto-search (forage + explore) — SP yeterliyse tetikle; soul upgrade kapıyı erken açar
  const autoSearchLv = soulLevel(state, 'auto_search');
  if (state.autoSearchUnlocked || autoSearchLv >= 1) {
    if (state.autoSearchFood && state.sp >= 25 && state.forageCD <= 0 && !state.pendingForage) {
      forage(state, content, log);
    }
    if (state.autoSearchExplore && state.sp >= 25 && (state.searchCD ?? 0) <= 0) {
      search(state, content, log);
    }
  }

  // Auto-event kararı
  if (state.autoEventDecision && state.pendingEvent && state.stats.INT >= 50) {
    autoChooseEvent(state, content, log);
  }

  decayFood(state);
  if (state.autoEat) autoEat(state, content, log);
}

/**
 * Learn HP Regen through play (GDD §6.1) — never locked, but easier the closer to death you are,
 * and ~10× easier once you've FOUND the regen lore. Loresiz zor ama imkânsız değil.
 *   no lore  → normal 1%, near-death 10%       (per combat tick)
 *   w/ lore  → normal 10%, near-death 30%
 */
function tryLearnRegen(state: GameState, content: Content, log: Log, forced: boolean): void {
  if (hasSkillLine(state, content, 'hp_regen')) return; // whole regen lineage, not just the base id
  const missing = 1 - state.hp / Math.max(1, state.maxHp);
  const nearDeath = forced || missing >= 0.6; // otherwise it's "normal" play — still possible, just rarer
  const lore = state.booksFound.some((id) => content.books.get(id)?.hints === 'regen');
  const chance = lore ? (nearDeath ? 0.3 : 0.1) : nearDeath ? 0.1 : 0.01;
  if (Math.random() < chance) {
    state.skills.push({ id: 'hp_regen', level: 1, exp: 0 });
    log({ key: 'log.learn_regen' });
  }
}

// ---- stamina ---------------------------------------------------------------

function staminaRegenSum(state: GameState, content: Content): number {
  let sum = 0;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.spRegen) sum += def.spRegen;
  }
  return sum;
}

function drainStamina(state: GameState, content: Content): void {
  const layer = currentLayer(state, content);
  const mult = layer?.spDrainMult ?? 1;
  const net = BASE_SP_DRAIN * mult - (staminaRegenSum(state, content) + state.spRegenBonus);
  if (net <= 0) {
    state.sp = Math.min(state.maxSp, state.sp - net);
    return;
  }
  const after = state.sp - net;
  if (after >= 0) {
    state.sp = after;
    return;
  }
  const deficit = -after;
  state.sp = 0;
  // Stamina exhaustion no longer bleeds HP (that felt like "HP dropping for no reason"). It just
  // weakens you via the fatigue damage penalty; MP cushions it first if the transfer is unlocked.
  if (state.mpTransferUnlocked && state.mp > 0) {
    state.mp = Math.max(0, state.mp - deficit);
  }
}

// ---- combat helpers --------------------------------------------------------

function passiveHpRegen(state: GameState, content: Content): number {
  let sum = 0;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.hpRegen) sum += def.hpRegen;
  }
  return sum;
}

function applyCombatRegen(state: GameState, content: Content, b: Bonuses): void {
  const hp = passiveHpRegen(state, content) * b.regenMult;
  if (hp > 0 && state.hp < state.maxHp) {
    state.hp = Math.min(state.maxHp, state.hp + Math.round(hp * regenMult(state)));
  }
}

function currentLayer(state: GameState, content: Content) {
  return content.dungeon.layers.find((l) => l.id === state.pos.layer);
}

/** Roll (once, then cache) an independent random room count for EVERY floor of this layer. */
function ensureFloorRooms(state: GameState, layer: DungeonLayer): number[] {
  const floors = floorsOf(state, layer);
  let arr = state.layerRooms[layer.id];
  if (!Array.isArray(arr) || arr.length !== floors) {
    const min = layer.minRooms ?? 12;
    const max = Math.max(min, layer.maxRooms ?? 20);
    arr = Array.from({ length: floors }, () => min + Math.floor(Math.random() * (max - min + 1)));
    state.layerRooms[layer.id] = arr;
  }
  return arr;
}

/** Random rooms-per-floor for ONE specific floor of a layer — each floor rolls 12–20 on its own. */
export function roomsOf(state: GameState, layer: DungeonLayer, floor: number): number {
  const arr = ensureFloorRooms(state, layer);
  return arr[floor - 1] ?? arr[arr.length - 1] ?? 12;
}

/** Fixed floors-per-layer (set in dungeon.json, currently 7). Rooms-per-floor stays random (roomsOf). */
export function floorsOf(_state: GameState, layer: { floors: number }): number {
  return layer.floors;
}

/** Roll every layer's per-floor random rooms up-front (called once at game start so the map is stable). */
export function ensureLayerRooms(state: GameState, content: Content): void {
  for (const l of content.dungeon.layers) ensureFloorRooms(state, l);
}

/** Deterministic [0,1) hash of a room coordinate — keeps exploration rooms stable per map. */
function roomHash(a: number, b: number, c: number): number {
  let n = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
  n = (n ^ (n >>> 13)) >>> 0;
  return (n % 100000) / 100000;
}

/** Per-room modifier definition — stat/drain penalties applied while in this room. */
interface RoomModifierDef {
  id: string;
  locKey: string;
  /** Flat dodge penalty (0–1). */
  dodgePenalty?: number;
  /** Additive dmgMult penalty. */
  dmgPenalty?: number;
  /** Additive regenMult penalty. */
  regenPenalty?: number;
  /** Hunger drain multiplier bonus (stacks with others). */
  hungerMult?: number;
  /** HP drain per tick as fraction of maxHP. */
  hpDrainPct?: number;
  /** Enemy ATK multiplier bonus (makes enemies hit harder). */
  enemyAtkBonus?: number;
}

const ROOM_MODIFIERS: RoomModifierDef[] = [
  { id: 'toxin_cloud',    locKey: 'modifier.toxin_cloud',    dodgePenalty: 0.05, hpDrainPct: 0.003 },
  { id: 'root_web',       locKey: 'modifier.root_web',       dodgePenalty: 0.20, dmgPenalty: 0.10 },
  { id: 'ember_rain',     locKey: 'modifier.ember_rain',     hpDrainPct: 0.005, regenPenalty: 0.30 },
  { id: 'scorched_air',   locKey: 'modifier.scorched_air',   hungerMult: 1.40 },
  { id: 'heavy_gravity',  locKey: 'modifier.heavy_gravity',  dodgePenalty: 0.20, dmgPenalty: 0.10 },
  { id: 'echo_chamber',   locKey: 'modifier.echo_chamber',   enemyAtkBonus: 0.20 },
  { id: 'soul_ebb',       locKey: 'modifier.soul_ebb',       regenPenalty: 0.50 },
  { id: 'void_pressure',  locKey: 'modifier.void_pressure',  hpDrainPct: 0.004, regenPenalty: 0.40 },
];

/** Returns the active room modifier for the player's current position, or null if modifier-free. */
export function currentRoomModifier(state: GameState, content: Content): RoomModifierDef | null {
  const layer = currentLayer(state, content);
  const pool = layer?.modifierPool;
  if (!pool || pool.length === 0) return null;
  const { layer: lId, floor, room } = state.pos;
  // Modifier-free room check (different salt from exploration hash to avoid collision)
  if (state.modifierFreeRooms) {
    const freeChance = 0.10 + (state.stats.LUCK * 0.005);
    const freeRoll = roomHash(lId + 999, floor, room);
    if (freeRoll < freeChance) return null;
  }
  const pick = roomHash(lId + 500, floor, room);
  const modId = pool[Math.floor(pick * pool.length)];
  return ROOM_MODIFIERS.find((m) => m.id === modId) ?? null;
}

/** Apply per-tick room modifier drains (HP loss, extra ambient). Called once per tick in combat. */
export function applyRoomModifierTick(state: GameState, content: Content, log: Log): void {
  const mod = currentRoomModifier(state, content);
  if (!mod?.hpDrainPct) return;
  const drain = Math.max(1, Math.round(state.maxHp * mod.hpDrainPct));
  state.hp = Math.max(0, state.hp - drain);
  log({ key: 'log.modifier_drain', params: { name: mod.locKey, dmg: drain } });
}

/** Is the player's current room a calm exploration room (no combat)? Never the entry or boss room. */
function isExplorationRoom(state: GameState, content: Content): boolean {
  const layer = currentLayer(state, content);
  if (!layer) return false;
  const rate = layer.explorationRate ?? 0;
  if (rate <= 0) return false;
  const { floor, room } = state.pos;
  const R = roomsOf(state, layer, floor);
  if (room <= 1 || room >= R) return false; // entry room and boss room are always combat
  return roomHash(layer.id, floor, room) < rate;
}

/** Resolve a calm exploration room: a little EP, a little recovery, a chance at lore/secret rooms. */
function resolveExploration(state: GameState, content: Content, log: Log): void {
  recordExplored(state); // light the room on the map
  const reward = diffDef(state, content).rewardMult ?? 1;
  const ep = Math.max(1, Math.round(3 * reward * rebirthMult(state)));
  state.ep += ep;
  state.hp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.1)); // a calm, safe breather
  state.sp = Math.min(state.maxSp, state.sp + Math.round(state.maxSp * 0.2));
  log({ key: 'log.explore_room', params: { ep } });
  if (Math.random() < 0.2 + state.stats.WIS * 0.005) {
    state.loreFragments += 1;
    log({ key: 'log.explore_lore' });
  }
  trySenseRoom(state, content, log); // luck-driven chance to perceive a gated secret room
}

/** Environmental ambient hazard of an elemental layer — heat/soul drain, eased by matching resistance. */
function applyAmbient(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  if (!layer?.element || !layer.ambient) return;
  const type = layer.element;
  const envMult = diffDef(state, content).envMult ?? 1;
  const reduction = resistReduction(state, content, type); // grows as you build the resistance
  const dmg = Math.round(state.maxHp * layer.ambient.drainPct * (1 - reduction) * envMult);
  if (dmg <= 0) return; // fully tempered against this element — the zone no longer burns you
  state.hp = Math.max(0, state.hp - dmg);
  // The matched zone trains its resistance faster — risk now buys survival later ("knowledge = survival").
  const resMult = diffDef(state, content).resistMult ?? 1;
  const resGain = Math.max(1, Math.round(dmg * layer.ambient.resistBoost * resMult));
  addResistExp(state, content, type, resGain, log);
}

/** Mark the furthest room reached on the CURRENT floor (per-floor fog-of-war reveal). */
function recordExplored(state: GameState): void {
  const arr = (state.exploredMax[state.pos.layer] ??= []);
  const fi = state.pos.floor - 1;
  if ((arr[fi] ?? 0) < state.pos.room) arr[fi] = state.pos.room;
  const { layer, floor, room } = state.pos;
  if (
    layer > (state.deepestLayer ?? 1) ||
    (layer === (state.deepestLayer ?? 1) && floor > (state.deepestFloor ?? 1)) ||
    (layer === (state.deepestLayer ?? 1) && floor === (state.deepestFloor ?? 1) && room > (state.deepestRoom ?? 1))
  ) {
    state.deepestLayer = layer;
    state.deepestFloor = floor;
    state.deepestRoom = room;
  }
}

/** Luck-driven chance to sense a (gated) secret room when a floor is cleared (GDD §8.2). */
function trySenseRoom(state: GameState, content: Content, log: Log): void {
  if (state.pendingRoom) return;
  const tier = appraisalTier(state);
  const room = [...content.rooms.values()].find((r) => tier >= r.appraisalReq && !state.discoveries.includes(r.id));
  if (!room) return;
  const chance = Math.min(0.5, 0.04 + state.stats.LUCK * 0.01); // luck is the driver
  if (Math.random() < chance) {
    state.pendingRoom = room.id;
    log({ key: 'log.search_room', params: { room: room.locKey } });
  }
}

/** Build a depth-scaled enemy instance for the current position (shared by combat, event & riddle spawns). */
function makeEnemy(state: GameState, content: Content, archId: string, isBoss: boolean, mult = 1): GameState['enemy'] {
  const def = content.enemies.get(archId);
  if (!def) return null;
  const diff = diffDef(state, content);
  const depth = (state.pos.layer - 1) * 100 + (state.pos.floor - 1) * 15 + state.pos.room;
  const rbMult = rebirthMult(state);
  const roomMod = currentRoomModifier(state, content);
  const roomAtkBonus = roomMod?.enemyAtkBonus ?? 0;
  const hpMult = (1 + depth * DEPTH_HP) * (isBoss ? BOSS_HP : 1) * diff.enemyMult * mult * rbMult;
  const atkMult = (1 + depth * DEPTH_ATK) * (isBoss ? BOSS_ATK : 1) * diff.enemyMult * mult * rbMult * (1 + roomAtkBonus);
  const hp = Math.round(def.hp * hpMult);
  return {
    id: archId,
    locKey: def.locKey,
    hp,
    maxHp: hp,
    attack: Math.max(1, Math.round(def.attack * atkMult)),
    damageType: def.damageType,
    damageType2: def.damageType2,
    ep: Math.round(def.ep * (isBoss ? 3 : 1) * mult), // reward scales with the chosen/fail difficulty
    satiety: Math.round(def.satiety * (isBoss ? 2 : 1) * mult),
    isBoss,
    atkCd: ENEMY_ATK_INTERVAL,
    race: def.race,
    icon: def.icon,
    image: def.image,
    behavior: def.behavior,
  };
}

function spawnEnemy(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  if (!layer || layer.enemyPool.length === 0) return;
  const R = roomsOf(state, layer, state.pos.floor);
  recordExplored(state); // light the room on the map as we enter it
  const isBoss = state.pos.room >= R;
  // Non-boss rooms lock to one enemy type for the whole kill-quota run.
  let archId: string;
  if (isBoss) {
    archId = layer.boss;
    state.roomEnemyId = null;
  } else {
    if (!state.roomEnemyId) state.roomEnemyId = layer.enemyPool[Math.floor(Math.random() * layer.enemyPool.length)];
    archId = state.roomEnemyId;
  }
  // New enemy hasn't seen any previous attacks — reset adaptation streak.
  state.dmgStreak = 0;
  state.dmgStreakType = undefined;
  const enemy = makeEnemy(state, content, archId, isBoss);
  if (!enemy) return;
  state.enemy = enemy;
  log({ key: isBoss ? 'log.boss_spawn' : 'log.spawn', params: { enemy: enemy.locKey } });
  // Spider web trap: discharge accumulated gauge as opening burst damage.
  const webDmg = sigCombatStart(state);
  if (webDmg > 0) {
    state.enemy.hp = Math.max(1, state.enemy.hp - webDmg);
    log({ key: 'log.sig_web_trap', params: { dmg: webDmg } });
  }
}

/** Event outcome: start a specific (non-boss) enemy in this room. */
export function spawnEventEnemy(state: GameState, content: Content, enemyId: string, log: Log): void {
  const enemy = makeEnemy(state, content, enemyId, false);
  if (!enemy) return;
  state.enemy = enemy;
  log({ key: 'log.ev_spawn', params: { enemy: enemy.locKey } });
}

/**
 * Otomatik event kararı: INT >= 50 gerekir.
 * Boss riddle için puzzleMode'a bakılır.
 * Normal event için kilitsiz ilk seçenek seçilir.
 */
export function autoChooseEvent(state: GameState, content: Content, log: Log): void {
  if (state.stats.INT < 50) return;

  // Boss riddle — ayrı sistem (text-answer tabanlı)
  if (state.bossRiddle) {
    const br = state.bossRiddle;
    const riddle = content.bossRiddles.get(br.riddleId);
    const layer = currentLayer(state, content);
    if (!riddle || !layer) { state.bossRiddle = null; return; }

    if (state.autoEventPuzzleMode === 'solve' && state.stats.INT >= 100) {
      // Auto-solve: bilmece ödülünü ver, boss'u atla (gatekeeper/rebirth tetiklenir)
      applyRiddleReward(state, riddle.reward, log);
      state.resolvedEvents.push(br.roomKey);
      state.bossRiddle = null;
      applyBossClear(state, content, log);
      if (state.autoAdvance) advancePosition(state, content, log);
      else state.roomCleared = true;
      log({ key: 'log.br_skip' });
    } else {
      // Skip: boss'la savaş (riddle'ı çözmeden)
      state.resolvedEvents.push(br.roomKey);
      state.bossRiddle = null;
      state.enemy = makeEnemy(state, content, layer.boss, true, 1);
      log({ key: 'log.br_fight' });
    }
    return;
  }

  // Normal bekleyen event
  const pe = state.pendingEvent;
  if (!pe) return;
  const def = content.events.get(pe.id);
  if (!def) return;

  // Kilitsiz ilk seçeneği bul (genellikle en iyi)
  let bestIdx = -1;
  for (let i = 0; i < def.choices.length; i++) {
    const c = def.choices[i];
    if (condMet(state, c.requires)) {
      bestIdx = i;
      break;
    }
  }
  if (bestIdx === -1) {
    // Tümü kilitli — son seçenek (genellikle geri çekil/güvenli)
    bestIdx = def.choices.length - 1;
  }
  chooseEvent(state, content, bestIdx, log);
}

/**
 * Resolve the player's choice on the pending event. Lives in combat.ts because some outcomes
 * spawn an enemy or kill the player (combat concerns). Returns false if invalid/locked.
 */
export function chooseEvent(state: GameState, content: Content, choiceIndex: number, log: Log, b?: Bonuses): boolean {
  const pe = state.pendingEvent;
  if (!pe) return false;
  const def = content.events.get(pe.id);
  const choice = def?.choices[choiceIndex];
  if (!def || !choice) return false;
  if (!condMet(state, choice.requires)) {
    log({ key: 'log.ev_locked' });
    return false;
  }
  log({ key: choice.locKey });
  const outcomes = outcomesFor(choice);
  let spawned = false;
  for (const o of outcomes) {
    if (o.kind === 'spawn' && typeof o.value === 'string') {
      log({ key: o.locKeyResult }); // event's own flavor text…
      spawnEventEnemy(state, content, o.value, log); // …then the generic "X appears" + the enemy
      spawned = true;
    } else {
      applyOutcome(state, content, o, log);
    }
  }
  recordExplored(state); // an event room counts as explored — light it on the map
  state.resolvedEvents.push(pe.roomKey);
  state.pendingEvent = null;
  if (state.hp <= 0) {
    onDeath(state, content, log, b ?? aggregateBonuses(state, content));
    return true;
  }
  // No spawn → the room is now a resolved calm room: hold for "Advance" (or auto-advance).
  if (!spawned) {
    if (state.autoAdvance) advancePosition(state, content, log);
    else state.roomCleared = true;
  }
  return true;
}

/** Cast one specific equipped skill at the current enemy (shared by auto & manual). True if it fired.
 *  `ignoreCd`: a parallel mind acts independently — it bypasses (and never sets) the cooldown timer. */
function castSkill(state: GameState, content: Content, id: string, log: Log, b: Bonuses, isOffline = false, ignoreCd = false): boolean {
  const enemy = state.enemy;
  if (!enemy) return false;
  const slot = state.skills.find((s) => s.id === id);
  const def = content.skills.get(id);
  if (!slot || !def || def.damage === undefined) return false;
  if (!ignoreCd && (state.cooldowns[id] ?? 0) > 0) return false;

  // Level-scaled MP cost — applies to any skill with mpCost > 0 (magic AND active)
  const mpBase = def.mpCost ?? 0;
  if (mpBase > 0) {
    const lv = slot.level;
    const lvMax = def.lvMax ?? 10;
    const mpFloor = def.mpFloor ?? 5;
    const effectiveMp = mpFloor + Math.round((mpBase - mpFloor) * (lvMax - lv) / Math.max(1, lvMax - 1));
    if (effectiveMp > state.mp) return false;
    state.mp = Math.max(0, state.mp - effectiveMp);
  }

  const diff = diffDef(state, content);

  let raw: number;
  if (def.kind === 'magic') {
    raw = (def.damage ?? 0) + effStat(state, 'INT') * 0.6;
  } else {
    raw = (def.damage ?? 0) + Math.floor(effStat(state, 'STR') / 3);
  }
  raw += b.weaponPower; // equipped weapon power (0 for monsters / unarmed)
  raw += b.overdrawFrac * (state.maxHp - state.hp); // Overdraw: missing HP → power (§6.1)
  raw *= b.dmgMult * diff.playerMult * levelPower(state); // auto power: each level adds a little punch
  raw *= elementMultiplier(content, def.damageType ?? 'physical', enemy.damageType); // element type-chart

  // Adaptive resistance: spamming the same element lets the enemy adapt (GDD "Bilgi = Hayatta Kalma").
  const atkElem = def.damageType ?? 'physical';
  if (state.dmgStreakType === atkElem) {
    state.dmgStreak = (state.dmgStreak ?? 0) + 1;
  } else {
    state.dmgStreakType = atkElem;
    state.dmgStreak = 1;
  }
  const ADAPT_THRESHOLD = 5;
  const streakPenalty = (state.dmgStreak ?? 0) >= ADAPT_THRESHOLD
    ? Math.min(0.6, ((state.dmgStreak ?? 0) - ADAPT_THRESHOLD + 1) * 0.1)
    : 0;
  if (streakPenalty > 0) {
    raw *= (1 - streakPenalty);
    if (state.dmgStreak === ADAPT_THRESHOLD) log({ key: 'log.enemy_adapts', params: { type: dmgTypeKey(atkElem) } });
  }

  let dmg = Math.max(1, Math.round(raw * damageMult(state)) - state.scars);
  if (enemy.behavior?.armorPct) dmg = Math.max(1, Math.round(dmg * (1 - enemy.behavior.armorPct))); // armoured hide
  enemy.hp -= dmg;
  log({ key: 'log.attack', params: { skill: def.locKeyName, dmg, type: dmgTypeKey(def.damageType) } });
  // Wyrmling heat: each attack builds heat; at max the built-up energy releases as a bonus fire burst.
  const breathDmg = sigOnAttack(state);
  if (breathDmg > 0 && enemy.hp > 0) {
    enemy.hp = Math.max(0, enemy.hp - breathDmg);
    log({ key: 'log.sig_heat_breath', params: { dmg: breathDmg } });
  }
  if (!ignoreCd) state.cooldowns[id] = skillCooldown(def, state, slot.level);

  const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.3)) * b.xpMult));
  addSkillExp(state, content, slot, gain, log, b.xpMult, isOffline);
  return true;
}

/** Offensive eye gaze from slotted active eyes — independent of equipped skills. */
function fireGaze(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const gz = gazeAttack(state, content);
  if (gz.damage > 0 && state.mp >= gz.mpCost) {
    state.mp -= gz.mpCost;
    enemy.hp -= gz.damage;
    log({ key: 'log.gaze_hit', params: { dmg: gz.damage } });
  }
}

/** Number of parallel minds (Kumo): 0 normally, 1/2/3 along the Parallel Minds → Will → Existence chain.
 *  Each parallel mind is an independent thought that acts on its own each turn. */
export function parallelMinds(state: GameState): number {
  if (state.skills.some((s) => s.id === 'parallel_existence')) return 3;
  if (state.skills.some((s) => s.id === 'parallel_will')) return 2;
  if (state.skills.some((s) => s.id === 'parallel_minds')) return 1;
  return 0;
}

/** Skill-slot capacity — each parallel mind + each Extra Slot soul upgrade grants one more. */
export function skillSlots(state: GameState): number {
  return 4 + parallelMinds(state) + soulLevel(state, 'extra_slot');
}

/** Keep `equipped` valid: drop removed/non-damage skills and trim to capacity. Does NOT auto-fill
 *  spare slots — the player controls their loadout (auto-fill made the slot counter misleading). */
export function ensureEquipped(state: GameState, content: Content): void {
  state.equipped = state.equipped.filter(
    (id) => state.skills.some((s) => s.id === id) && content.skills.get(id)?.damage !== undefined,
  );
  const slots = skillSlots(state);
  if (state.equipped.length > slots) state.equipped.length = slots;
}

/** Unequip every active skill at once (manual loadout reset). */
export function unequipAll(state: GameState): void {
  state.equipped = [];
}

/** Equip / unequip an active skill (manual loadout, capped by skillSlots). */
export function toggleEquip(state: GameState, content: Content, id: string): void {
  const def = content.skills.get(id);
  if (!def || def.damage === undefined) return; // only active-damage skills go in slots
  const i = state.equipped.indexOf(id);
  if (i >= 0) {
    state.equipped.splice(i, 1);
  } else if (state.equipped.length < skillSlots(state)) {
    state.equipped.push(id);
  }
}

/** Remove a skill entirely — also unequip it and clear any eye slot (incl. hybrid) using it. */
export function removeSkill(state: GameState, content: Content, id: string): void {
  state.skills = state.skills.filter((s) => s.id !== id);
  state.equipped = state.equipped.filter((e) => e !== id);
  for (const slotId of Object.keys(state.eyeAssignments)) {
    const a = state.eyeAssignments[slotId];
    if (!a) continue;
    if (a.abilityId === id) state.eyeAssignments[slotId] = null;
    else if (a.fusedId === id) state.eyeAssignments[slotId] = { abilityId: a.abilityId, mode: a.mode };
  }
  ensureEquipped(state, content);
}

/** Sacrifice a skill (lore-taught) for a permanent reward scaled by how invested it was. */
export function sacrificeSkill(state: GameState, content: Content, id: string, log: Log): boolean {
  const slot = state.skills.find((s) => s.id === id);
  const def = content.skills.get(id);
  if (!slot || !def) return false;
  const eff = ((slot.tier ?? 1) - 1) * LEVEL_CAP + slot.level; // total investment (tier*10 + level)
  const pts = 1 + Math.floor(eff / 6); // permanent stat points
  const ep = eff * 4; // plus EP
  removeSkill(state, content, id);
  state.statPoints += pts;
  state.ep += ep;
  log({ key: 'log.skill_sacrificed', params: { skill: def.locKeyName, pts, ep } });
  return true;
}

/** Manual cast from a tapped skill button (combat only, equipped only, respects cooldown). */
export function useSkillManual(state: GameState, content: Content, id: string, log: Log): void {
  if (state.action !== 'combat' || !state.enemy || !state.equipped.includes(id)) return;
  if (isControlled(state)) { log({ key: 'log.controlled' }); return; } // petrified/stunned — can't act
  const b = aggregateBonuses(state, content);
  if (castSkill(state, content, id, log, b) && state.enemy && state.enemy.hp <= 0) {
    onKill(state, content, log, b);
  }
}

function enemyAttack(state: GameState, content: Content, log: Log, b: Bonuses): void {
  const enemy = state.enemy;
  if (!enemy) return;
  if (Math.random() < gazeNegateChance(state, content)) {
    log({ key: 'log.flee', params: { enemy: enemy.locKey } });
    return;
  }
  if (Math.random() < dodgeChance(state, b)) {
    log({ key: 'log.dodge', params: { enemy: enemy.locKey } });
    return;
  }
  const resMult = diffDef(state, content).resistMult ?? 1; // Easy trains resistances very slowly
  const types = enemy.damageType2 ? [enemy.damageType, enemy.damageType2] : [enemy.damageType];
  let share = enemy.attack / types.length;
  if (enemy.behavior?.enrage && enemy.hp < enemy.maxHp * 0.3) share *= 1 + enemy.behavior.enrage; // cornered → fiercer
  const statusChance = STATUS_CHANCE * (enemy.behavior?.statusBoost ?? 1); // status specialists apply more
  // Group nullification and Ultimate Nullification reductions (computed once, applied per-hit).
  // b already contains physNullReduction / magicNullReduction / statusNullReduction / ultimateNullLv.
  const ULT_PCT = [0, 10, 22, 34, 45, 55, 65, 75, 85, 90, 100];
  const ultLv = b.ultimateNullLv;
  const ultPct = ULT_PCT[Math.min(ultLv, 10)] ?? 0;
  const isNullifier = (enemy.behavior?.nullifier) ?? false;
  const effectiveUltPct = (ultLv >= 10 && isNullifier)
    ? Math.min(ultLv * 6, 60) // capped at 60% for nullifier enemies (can never achieve full immunity)
    : ultPct;

  let totalTaken = 0;
  for (const type of types) {
    const reduction = resistReduction(state, content, type);
    // Control hits (petrify/stun) lock the player out of acting — they deal no direct damage.
    // Resistance shrinks both the chance to be controlled and the lockout duration (Kumo).
    if (CONTROL_TYPES.includes(type)) {
      if (reduction > 0) addResistExp(state, content, type, Math.max(1, Math.round(share * resMult)), log);
      if (Math.random() < statusChance * (1 - reduction)) applyControl(state, type, reduction, log);
      continue;
    }
    const armorCut = b.armor / types.length;
    // Slime elemental absorption: 30% resist vs the currently absorbed element.
    const slimeRes = sigSlimeResist(state, type);
    let taken = Math.max(0, Math.round(share * (1 - reduction - slimeRes) - armorCut));
    // Group Nullification: reduces damage from matching element group (physical/magic/status).
    const groupNullPct = getGroupNullPct(b, type);
    if (groupNullPct > 0) taken = Math.round(taken * (1 - groupNullPct / 100));
    totalTaken += taken;
    const resGain = Math.round(taken * resMult);
    if (resGain > 0) addResistExp(state, content, type, resGain, log);
    // Elemental hits may leave a lingering status (poison/fire/…) — resistance shrinks duration & damage.
    if (taken > 0 && DOT_TYPES.includes(type) && Math.random() < statusChance * (1 - reduction)) {
      applyStatus(state, type, share, reduction, log);
    }
  }
  // Golem stone skin: absorb a burst of flat damage (all full layers consumed at once).
  const stoneAbsorb = sigStoneAbsorb(state);
  totalTaken = Math.max(0, totalTaken - stoneAbsorb);
  if (stoneAbsorb > 0) log({ key: 'log.sig_stone_absorb', params: { absorbed: stoneAbsorb } });
  // Ultimate Nullification: multiplicative reduction after all other defenses (applied to total).
  if (effectiveUltPct > 0) totalTaken = Math.round(totalTaken * (1 - effectiveUltPct / 100));
  // Full immunity at Lv10 (non-nullifier only): block all incoming damage.
  if (ultLv >= 10 && !isNullifier) totalTaken = 0;
  // Pain Nullification (Kumo): below half HP, ignore a fraction of incoming damage (don't feel it).
  if (b.painNull > 0 && state.hp < state.maxHp * 0.5 && totalTaken > 0) {
    totalTaken = Math.max(0, Math.round(totalTaken * (1 - b.painNull)));
  }
  state.hp = Math.max(0, state.hp - totalTaken);
  if (enemy.behavior?.lifesteal && totalTaken > 0) {
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(totalTaken * enemy.behavior.lifesteal)); // drains your blood
  }
  state.lastHit = { enemyKey: enemy.locKey, type: enemy.damageType };
  log({ key: 'log.hit', params: { enemy: enemy.locKey, dmg: totalTaken, type: dmgTypeKey(enemy.damageType) } });
}

type ReactionCombo = { a: DamageType; b: DamageType; key: string; burstMult: number; controlTicks?: number };
const REACTION_COMBOS: ReactionCombo[] = [
  { a: 'fire',  b: 'poison',    key: 'log.reaction_toxic_blaze',    burstMult: 3.0 },
  { a: 'frost', b: 'lightning', key: 'log.reaction_frozen_circuit',  burstMult: 3.5 },
  { a: 'fire',  b: 'frost',     key: 'log.reaction_steam_burst',     burstMult: 0,   controlTicks: 2 },
  { a: 'acid',  b: 'fire',      key: 'log.reaction_corrosive_burn',  burstMult: 2.5 },
];

/** When a new status would be applied, check if it reacts with an existing one. Returns true if consumed. */
function checkStatusReaction(state: GameState, newType: DamageType, newDmg: number, log: Log): boolean {
  for (const combo of REACTION_COMBOS) {
    const isA = newType === combo.a, isB = newType === combo.b;
    if (!isA && !isB) continue;
    const partnerType = isA ? combo.b : combo.a;
    const partner = state.statusEffects.find((s) => s.type === partnerType);
    if (!partner) continue;
    state.statusEffects = state.statusEffects.filter((s) => s.type !== newType && s.type !== partnerType);
    const burst = Math.max(0, Math.round((newDmg + partner.dmgPerTick) * combo.burstMult));
    if (burst > 0) state.hp = Math.max(0, state.hp - burst);
    if (combo.controlTicks) state.statusEffects.push({ type: 'petrify', ticksLeft: combo.controlTicks, dmgPerTick: 0, control: true });
    log({ key: combo.key, params: { dmg: burst } });
    return true;
  }
  return false;
}

/** Apply/refresh a lingering status: duration 1–10s and per-tick damage scale with the hit & resistance. */
function applyStatus(state: GameState, type: DamageType, share: number, reduction: number, log: Log): void {
  const dur = Math.min(10, Math.max(1, Math.round((2 + share / 5) * (1 - reduction))));
  const dmgPerTick = Math.max(1, Math.round(share * 0.25 * (1 - reduction)));
  const existing = state.statusEffects.find((s) => s.type === type);
  if (existing) {
    existing.ticksLeft = Math.max(existing.ticksLeft, dur);
    existing.dmgPerTick = Math.max(existing.dmgPerTick, dmgPerTick);
  } else {
    if (!checkStatusReaction(state, type, dmgPerTick, log)) {
      state.statusEffects.push({ type, ticksLeft: dur, dmgPerTick });
      log({ key: 'log.status_on', params: { type: dmgTypeKey(type), sec: dur } });
    }
  }
}

/** Apply a control condition (petrify/stun): a no-damage lockout that prevents the player from acting.
 *  Petrify locks longer than stun; resistance shrinks the duration. */
function applyControl(state: GameState, type: DamageType, reduction: number, log: Log): void {
  const base = type === 'petrify' ? 4 : 2;
  const dur = Math.max(1, Math.round(base * (1 - reduction)));
  const existing = state.statusEffects.find((s) => s.type === type);
  if (existing) {
    existing.ticksLeft = Math.max(existing.ticksLeft, dur);
  } else {
    state.statusEffects.push({ type, ticksLeft: dur, dmgPerTick: 0, control: true });
    log({ key: 'log.control_on', params: { type: dmgTypeKey(type), sec: dur } });
  }
}

/** True while the player is locked out by a control condition (petrify/stun). */
function isControlled(state: GameState): boolean {
  return state.statusEffects.some((s) => s.control && s.ticksLeft > 0);
}

/** Tick all active statuses: deal DoT, train the matching resistance, expire at 0. Returns damage dealt. */
function processStatuses(state: GameState, content: Content, log: Log): void {
  if (state.statusEffects.length === 0) return;
  const resMult = diffDef(state, content).resistMult ?? 1;
  let total = 0;
  for (const s of state.statusEffects) {
    total += s.dmgPerTick;
    const resGain = Math.round(s.dmgPerTick * resMult);
    if (resGain > 0) addResistExp(state, content, s.type, resGain, log); // suffering it builds resistance
    s.ticksLeft -= 1;
  }
  state.statusEffects = state.statusEffects.filter((s) => s.ticksLeft > 0);
  if (total > 0) state.hp = Math.max(0, state.hp - total);
}

function tryAutoTierAdvance(state: GameState, content: Content, log: Log): boolean {
  const avail = availableEvolutions(state, content);
  if (avail.length === 0) return false; // terminal form reached — truly done
  if (avail.some((f) => canEvolve(state, f))) return false; // evolution already unlocked, player acts
  if (state.tier >= 10) return false; // T10 with tierReq still blocking = design gap, don't spiral
  state.tier = Math.min(10, state.tier + 1);
  state.level = 1;
  state.xp = 0;
  state.statPoints += 1;
  log({ key: 'log.tier_advance', params: { tier: state.tier } });
  recomputeMaxes(state);
  return true;
}

function gainXp(state: GameState, content: Content, amount: number, log: Log): void {
  if (state.level >= LEVEL_CAP) {
    tryAutoTierAdvance(state, content, log);
    return;
  }
  state.xp += amount;
  while (state.level < LEVEL_CAP && state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level += 1;
    state.statPoints += STAT_POINTS_PER_LEVEL;
    log({ key: 'log.levelup', params: { lv: state.level, pts: STAT_POINTS_PER_LEVEL } });
  }
  if (state.level >= LEVEL_CAP) {
    state.xp = 0;
    const advanced = tryAutoTierAdvance(state, content, log);
    if (!advanced) {
      log({ key: 'log.cap', params: { lv: LEVEL_CAP } });
      // Human Path: at T0 LV10 without a chosen path, pause combat and prompt the player.
      if (state.raceId === 'human' && state.tier === 0 && !state.humanPath) {
        state.pendingHumanPath = true;
        state.action = 'idle';
        log({ key: 'log.human_path_choose' });
      }
    }
  }
  recomputeMaxes(state); // levels nudge max HP/MP/SP up a little (auto growth)
}

/** Boss-cleared consequences (gatekeeper → rebirth, Hell-clear reward). Caller ensures it was a boss. */
export function applyBossClear(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  // Only the LAST floor's boss of the gatekeeper layer counts (boss spawns every floor).
  if (layer?.gatekeeper && state.pos.floor >= floorsOf(state, layer)) {
    state.gatekeeperCleared = true;
    log({ key: 'log.gatekeeper_down' });
    const diff = diffDef(state, content);
    if (diff.brutal && state.permadeath && !state.hellClears.includes(state.raceId)) {
      state.hellClears.push(state.raceId);
      state.statPoints += 15; // race-specific permanent reward (§8.5.2)
      log({ key: 'log.hell_clear', params: { race: `race.${state.raceId}.name` } });
    }
  }
}

/** Type the answer to the active boss riddle. Correct → mark solved (UI offers skip/fight). Wrong → escalate. */
export function answerBossRiddle(state: GameState, content: Content, answer: string, log: Log): boolean {
  const br = state.bossRiddle;
  const riddle = br ? content.bossRiddles.get(br.riddleId) : null;
  const layer = currentLayer(state, content);
  if (!br || !riddle || !layer || br.attempts < 0) return false;
  if (checkBossAnswer(riddle, answer)) {
    br.attempts = -1; // solved → UI shows Skip / Fight
    log({ key: 'log.br_solved' });
    return true;
  }
  br.attempts += 1;
  if (br.attempts >= 3) {
    // 3rd wrong → the real boss, strengthened, good reward.
    state.bossRiddle = null;
    state.enemy = makeEnemy(state, content, layer.boss, true, RIDDLE_FAILBOSS_MULT);
    log({ key: 'log.br_fail_boss' });
  } else {
    // 1st/2nd wrong → a slightly strengthened guard; killing it returns to the riddle.
    const archId = layer.enemyPool[Math.floor(Math.random() * layer.enemyPool.length)];
    const guard = makeEnemy(state, content, archId, false, RIDDLE_GUARD_MULT);
    if (guard) {
      guard.riddleGuard = true;
      state.enemy = guard;
    }
    log({ key: 'log.br_wrong', params: { left: 3 - br.attempts } });
  }
  return false;
}

/** After solving a boss riddle: skip the boss (small reward) or fight it at a chosen difficulty. */
export function chooseBossOption(
  state: GameState,
  content: Content,
  mode: 'skip' | 'fight',
  difficulty: string,
  log: Log,
): void {
  const br = state.bossRiddle;
  const riddle = br ? content.bossRiddles.get(br.riddleId) : null;
  const layer = currentLayer(state, content);
  if (!br || br.attempts !== -1 || !riddle || !layer) return; // only on a solved riddle
  if (mode === 'skip') {
    applyRiddleReward(state, riddle.reward, log); // small guaranteed reward
    state.resolvedEvents.push(br.roomKey);
    state.bossRiddle = null;
    applyBossClear(state, content, log); // bypassing counts as clearing it (gatekeeper → rebirth)
    log({ key: 'log.br_skip' });
    if (state.autoAdvance) advancePosition(state, content, log);
    else state.roomCleared = true;
  } else {
    const mult = RIDDLE_FIGHT_MULTS[difficulty] ?? 1;
    state.resolvedEvents.push(br.roomKey);
    state.bossRiddle = null;
    state.enemy = makeEnemy(state, content, layer.boss, true, mult); // beat it → normal onKill → applyBossClear
    log({ key: 'log.br_fight' });
  }
}

const RARITY_RANK: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

/** Roll loot on kill — humanoid races only; monsters never receive gear. Bag-full melts to EP. */
function maybeDropLoot(
  state: GameState,
  content: Content,
  enemy: NonNullable<GameState['enemy']>,
  b: Bonuses,
  log: Log,
): void {
  if (!isHumanoidForm(state, content)) return; // monsters can't wear gear (unless a humanoid form, e.g. Rimuru)
  const chance = 0.08 * b.lootMult;
  if (!enemy.isBoss && Math.random() > chance) return;
  const ilvl = state.tier * LEVEL_CAP + state.level + state.pos.layer * 2;
  const luck = effStat(state, 'LUCK');
  // Bosses always drop, biased rarer (best of two rolls at higher item level).
  let item = generateLoot(enemy.isBoss ? ilvl + 5 : ilvl, luck);
  if (enemy.isBoss) {
    const alt = generateLoot(ilvl + 5, luck);
    if (RARITY_RANK[alt.rarity] > RARITY_RANK[item.rarity]) item = alt;
  }
  if (state.inventoryItems.length >= MAX_INVENTORY) {
    state.ep += item.value; // bag full → melt to EP
    log({ key: 'log.loot_full', params: { item: lootDisplayName(item), ep: item.value } });
    return;
  }
  state.inventoryItems.push(item);
  log({ key: 'log.loot_drop', params: { item: lootDisplayName(item), rarity: `rarity.${item.rarity}` } });
}

function onKill(state: GameState, content: Content, log: Log, b: Bonuses, isOffline = false): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const reward = diffDef(state, content).rewardMult ?? 1; // Hell pays more, Easy less
  const ep = Math.max(1, Math.round(enemy.ep * b.lootMult * reward * rebirthMult(state)));
  state.ep += ep;
  state.kills += 1;
  state.killedEnemies = state.killedEnemies ?? {};
  state.killedEnemies[enemy.id] = (state.killedEnemies[enemy.id] ?? 0) + 1;
  sigOnKill(state, enemy.damageType);
  // Harvest Festival (easter egg): a slime that has reaped enough souls awakens a hidden path.
  if (state.kills === SECRET_HARVEST_SOULS && state.raceId === 'slime') log({ key: 'log.harvest_festival' });
  // The Labyrinth (easter egg): a spider that survives enough kills awakens the hidden Kumoko path.
  if (state.kills === SECRET_LABYRINTH_KILLS && state.raceId === 'spider') log({ key: 'log.labyrinth_awakening' });
  gainXp(state, content, ep * XP_PER_EP, log);
  // Passive, util, and eye skills gain XP upon defeating enemies (since they cannot be actively cast).
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def && (def.kind === 'passive' || def.kind === 'util' || def.kind === 'eye')) {
      const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.15)) * b.xpMult * 0.5));
      addSkillExp(state, content, slot, gain, log, b.xpMult, isOffline);
    }
  }
  // Sin grows ONLY from killing your OWN kin (surviving the dungeon isn't a sin — it's instinct, §C).
  if (enemy.race && enemy.race === state.raceId) {
    gainSin(state, content, enemy.isBoss ? SIN_PER_KILL_BOSS : SIN_PER_KILL, log);
    log({ key: 'log.sin_kill', params: { enemy: enemy.locKey } }); // a clear "you sinned" beat
  }

  const satiety = Math.round(enemy.satiety * b.lootMult);
  if (state.inventory.length < maxFoodSlots(state)) {
    state.inventory.push({ enemyId: enemy.id, satiety, decay: 0 });
    state.larderFullNotified = false;
  } else {
    const hungerBefore = state.hunger;
    state.hunger = Math.max(0, state.hunger - satiety);
    // Satiety that couldn't reduce hunger (already full) converts to EP at 50% rate.
    const overflow = satiety - (hungerBefore - state.hunger);
    if (overflow > 0) state.ep += Math.round(overflow * 0.5);
    if (!state.larderFullNotified) {
      log({ key: 'log.larder_full' });
      state.larderFullNotified = true;
    }
  }
  log({ key: enemy.isBoss ? 'log.boss_kill' : 'log.kill', params: { enemy: enemy.locKey, ep } });
  maybeDropLoot(state, content, enemy, b, log);

  const wasBoss = enemy.isBoss;
  const wasRiddleGuard = enemy.riddleGuard;
  state.enemy = null;

  // A guard from a wrong boss-riddle guess: rewards above stand, but it does NOT advance —
  // the riddle panel returns for the next attempt.
  if (wasRiddleGuard && state.bossRiddle) return;

  if (wasBoss) {
    applyBossClear(state, content, log); // gatekeeper → rebirth (last gatekeeper floor only)
    // Prevent the riddle from re-triggering on the next tick (enemy is null again in the boss room).
    if (!state.resolvedEvents.includes(roomKeyOf(state))) state.resolvedEvents.push(roomKeyOf(state));
  }

  clearRoom(state, content, log); // auto-advance, or hold for the manual "Advance" tap

  if (!state.mpTransferUnlocked && Math.random() < MP_TRANSFER_DISCOVER_CHANCE) {
    state.mpTransferUnlocked = true;
    log({ key: 'log.discover_mp_transfer' });
  }
  if (!hasSkillLine(state, content, 'larder') && Math.random() < LARDER_DISCOVER_CHANCE) {
    state.skills.push({ id: 'larder', level: 1, exp: 0 });
    log({ key: 'log.discover_larder' });
  }
  // The basic Appraisal eye is now a discovery (no longer free) — slot it in Body to use it.
  if (!hasSkillLine(state, content, 'appraisal') && Math.random() < APPRAISAL_DISCOVER_CHANCE) {
    state.skills.push({ id: 'appraisal', level: 1, exp: 0 });
    log({ key: 'log.discover_appraisal' });
  }
  // Fusion lab is discovered (not free) — once you carry at least two attack skills.
  if (
    !state.fusionUnlocked &&
    state.skills.filter((s) => content.skills.get(s.id)?.damage !== undefined).length >= 2 &&
    Math.random() < FUSION_DISCOVER_CHANCE
  ) {
    state.fusionUnlocked = true;
    log({ key: 'log.discover_fusion' });
  }
  if (
    state.level >= EYE_DISCOVER_LEVEL &&
    !hasSkillLine(state, content, 'dread_gaze') &&
    Math.random() < EYE_DISCOVER_CHANCE
  ) {
    state.skills.push({ id: 'dread_gaze', level: 1, exp: 0 });
    log({ key: 'log.discover_dread' });
  }
}

// ---- EP Shop ---------------------------------------------------------------

const EP_STAT_BASE_COST = 100;

/** Cost of the next EP-purchased stat point (doubles with each purchase this life). */
export function epStatCost(state: GameState): number {
  return EP_STAT_BASE_COST * Math.pow(2, state.epStatsBought ?? 0);
}

/** Buy one stat point with EP. Returns true on success. */
export function buyStatPointEp(state: GameState): boolean {
  const cost = epStatCost(state);
  if (state.ep < cost) return false;
  state.ep -= cost;
  state.statPoints += 1;
  state.epStatsBought = (state.epStatsBought ?? 0) + 1;
  return true;
}

/** Temporary buff definitions: id → { cost in EP, duration in ms }. */
export const EP_BUFF_DEFS: Record<string, { cost: number; durationMs: number }> = {
  slow_hunger: { cost: 100, durationMs: 3_600_000 },  // 1 saat — yarı açlık hızı
  xp_rush:     { cost: 150, durationMs: 1_800_000 },  // 30 dk — +%50 XP
  regen_surge: { cost: 80,  durationMs: 1_800_000 },  // 30 dk — +%100 HP rejenerasyon
};

/** Buy a temporary buff with EP. Stacks duration if already active. */
export function buyTempBuff(state: GameState, buffId: string): boolean {
  const def = EP_BUFF_DEFS[buffId];
  if (!def || state.ep < def.cost) return false;
  state.ep -= def.cost;
  state.tempBuffs = state.tempBuffs ?? {};
  const existing = state.tempBuffs[buffId] ?? 0;
  state.tempBuffs[buffId] = Math.max(existing, Date.now()) + def.durationMs;
  return true;
}

/** Rank-based EP cost multiplier for skill XP injection. */
const INJECT_RANK_MULT: Record<string, number> = {
  F: 0.5, E: 1, D: 1.5, C: 2, B: 3, A: 5, S: 8, SS: 12,
};

/** EP cost to inject one level's worth of XP into a skill at its current level. */
export function injectSkillXpCost(state: GameState, content: Content, skillId: string): number {
  const slot = state.skills.find((s) => s.id === skillId);
  const def = content.skills.get(skillId);
  if (!slot || !def || slot.level >= (def.lvMax ?? 10)) return Infinity;
  const rankMult = INJECT_RANK_MULT[def.rank ?? 'E'] ?? 1;
  return Math.max(30, Math.round((15 + slot.level * 10) * rankMult));
}

/** Inject one level's worth of XP into a skill, paying EP. Returns true on success. */
export function injectSkillXp(state: GameState, content: Content, skillId: string, log: Log): boolean {
  const slot = state.skills.find((s) => s.id === skillId);
  const def = content.skills.get(skillId);
  if (!slot || !def) return false;
  const lvMax = def.lvMax ?? 10;
  if (slot.level >= lvMax) return false;
  const cost = injectSkillXpCost(state, content, skillId);
  if (!Number.isFinite(cost) || state.ep < cost) return false;
  state.ep -= cost;
  const xpChunk = 15 + slot.level * 10;
  slot.exp += xpChunk;
  while (slot.level < lvMax && slot.exp >= (15 + slot.level * 10)) {
    slot.exp -= 15 + slot.level * 10;
    slot.level += 1;
    log({ key: 'log.skill_up', params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
  }
  return true;
}

/** Player tapped "Advance" (manual progression) — move one room forward, abandoning the current foe. */
export function advanceRoom(state: GameState, content: Content, log: Log): void {
  if (state.action !== 'combat') return;
  if (state.pendingEvent) return; // can't advance past an unresolved event
  state.roomCleared = false;
  state.roomKillCount = 0;
  state.roomEnemyId = null;
  state.enemy = null; // leave the current room (whether mid-fight or after clearing)
  advancePosition(state, content, log);
}

function advancePosition(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  if (!layer) return;
  const R = roomsOf(state, layer, state.pos.floor);
  const wasBoss = state.pos.room >= R; // the floor's last room is its boss
  if (!wasBoss) {
    state.pos.room += 1;
    return;
  }
  if (state.pos.floor < floorsOf(state, layer)) {
    state.pos.floor += 1;
    state.pos.room = 1;
    log({ key: 'log.floor_cleared', params: { pos: `${state.pos.layer}.${state.pos.floor}` } });
    trySenseRoom(state, content, log); // luck-based secret room on a fresh floor
    return;
  }
  const next = content.dungeon.layers.find((l) => l.id === state.pos.layer + 1);
  if (next && state.tier >= next.tierReq) {
    state.pos = { layer: next.id, floor: 1, room: 1 };
    log({ key: 'log.layer_cleared', params: { layer: next.id } });
  } else if (next) {
    state.pos.room = 1;
    log({ key: 'log.layer_locked', params: { tier: next.tierReq } });
  } else {
    state.pos.room = 1;
    log({ key: 'log.dungeon_end' });
  }
}

function onDeath(state: GameState, content: Content, log: Log, b: Bonuses): void {
  // Undying Husk / Undying Will — a chance to cling to life at 1 HP (§A2).
  if (b.surviveChance > 0 && Math.random() < b.surviveChance) {
    state.hp = 1;
    // Threshold Endurance: each near-death earns permanent VIT (SS rank path).
    state.nearDeathCount = (state.nearDeathCount ?? 0) + 1;
    const vitSlot = state.skills.find((s) => s.id === 'threshold_endurance');
    const vitGain = vitSlot ? vitSlot.level * 3 : 3;
    state.vitEnduranceXP = (state.vitEnduranceXP ?? 0) + vitGain;
    const permCap = (state.tier + 1) * 2;
    if ((state.vitEndurancePerm ?? 0) < permCap) {
      const add = Math.min(1, permCap - (state.vitEndurancePerm ?? 0));
      state.vitEndurancePerm = (state.vitEndurancePerm ?? 0) + add;
      state.stats.VIT += add;
      recomputeMaxes(state);
    }
    log({ key: 'log.survive' });
    return;
  }
  const diff = diffDef(state, content);

  // Permadeath in Hell = a true wipe (§8.5.2) — only permanent meta survives.
  if (state.permadeath && diff.brutal) {
    const keepHell = [...state.hellClears];
    const keepUnlocks = [...state.unlocks];
    const keepBoon = state.rebirthBoon;
    const fresh = newGame();
    Object.assign(state, fresh);
    state.hellClears = keepHell;
    state.unlocks = keepUnlocks;
    state.rebirthBoon = keepBoon;
    log({ key: 'log.permadeath' });
    return;
  }

  log({ key: 'log.death' });
  // Death analysis: what killed you and what resistance would help (GDD "Bilgi = Hayatta Kalma").
  if (state.lastHit) {
    log({ key: 'log.death_analysis', params: { enemy: state.lastHit.enemyKey, type: dmgTypeKey(state.lastHit.type) } });
    const killerType = state.lastHit.type;
    const hasRes = state.resistances.some((r) => {
      const def = content.resistances.get(r.id);
      return def?.damageType === killerType;
    });
    if (!hasRes) log({ key: 'log.death_resist_hint', params: { type: dmgTypeKey(killerType) } });
  }
  // Difficulty death penalty: lose dungeon progress (GDD §8.5).
  if (diff.deathPenalty >= 0.5) {
    state.pos.floor = 1;
  }
  state.pos.room = 1;
  state.roomCleared = false;
  state.pendingEvent = null; // death clears any open event
  state.bossRiddle = null; // …and any open boss riddle
  state.statusEffects = []; // death clears all lingering statuses
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.sp = state.maxSp;
  state.enemy = null;
}

const RANK_XP_MULT: Record<string, number> = {
  F: 0.8, E: 1.0, D: 1.2, C: 1.5, B: 2.0, A: 3.0, S: 5.0, SS: 10.0,
};

function parseDeriveToken(token: string): { skillId: string; minLevel: number } {
  const [skillId, lvStr] = token.split(':');
  return { skillId: skillId ?? token, minLevel: parseInt(lvStr ?? '1', 10) };
}

function checkDerivations(state: GameState, content: Content, log: Log): void {
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def?.derivesTo || !def.deriveCondition) continue;
    const targetId = def.derivesTo;
    if (state.skills.some((s) => s.id === targetId)) continue;
    const allMet = def.deriveCondition.requiresAll
      .map(parseDeriveToken)
      .every((c) => {
        const s = state.skills.find((sk) => sk.id === c.skillId);
        return s !== undefined && s.level >= c.minLevel;
      });
    if (!allMet) continue;
    const derivedDef = content.skills.get(targetId);
    if (!derivedDef) continue;
    state.skills.push({ id: targetId, level: 1, exp: 0 });
    log({ key: 'log.skill_derived', params: { skill: derivedDef.locKeyName } });
  }
}

/** Level-up loop for a skill slot — used both by addSkillExp and the resistance chain XP path. */
function skillLevelUp(slot: SkillSlot, state: GameState, content: Content, log: Log, isOffline: boolean): void {
  const def = content.skills.get(slot.id);
  if (!def) return;
  // Resistance chain skills and nullification skills use their own XP formula.
  const isResChain = def.kind === 'resistance' && !!def.resistType;
  const isNullSkill = def.kind === 'resistance' && !def.resistType;
  const xpFn = isResChain
    ? () => resistChainExpToNext(slot.tier ?? 1)
    : isNullSkill
      ? () => nullExpToNext(slot.level)
      : () => skillExpToNext(slot.level);
  while (slot.level < def.lvMax && slot.exp >= xpFn()) {
    slot.exp -= xpFn();
    slot.level += 1;
    log({ key: 'log.skill_up', params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
  }
  if (isOffline) {
    if (slot.level >= def.lvMax) slot.exp = Math.min(slot.exp, xpFn());
    return;
  }
  if (slot.level >= def.lvMax && def.evolvesTo.length > 0) {
    const nextId = def.evolvesTo[0];
    const next = content.skills.get(nextId);
    if (next) {
      log({ key: 'log.evolve', params: { from: def.locKeyName, to: next.locKeyName } });
      const eIdx = state.equipped.indexOf(def.id);
      if (eIdx >= 0) state.equipped[eIdx] = nextId;
      slot.id = nextId;
      slot.tier = (slot.tier ?? 1) + 1;
      slot.level = 1;
      slot.exp = 0;
    }
  }
  // After any evolution, check if a resistance merger condition is now met.
  if (def.kind === 'resistance') {
    checkMergerConditions(state, content, log);
  }
  checkDerivations(state, content, log);
}

function addSkillExp(state: GameState, content: Content, slot: SkillSlot, amount: number, log: Log, xpMult: number, isOffline = false): void {
  const def = content.skills.get(slot.id);
  if (!def) return;
  const rankMult = RANK_XP_MULT[def.rank ?? 'E'] ?? 1.0;
  slot.exp += slot.id === 'larder'
    ? amount
    : Math.max(1, Math.round(amount * xpMult / rankMult));
  skillLevelUp(slot, state, content, log, isOffline);
}

// ---- skill lineage (evolution-chain aware ownership) -----------------------
// A skill levels up in-place: at max level its slot.id becomes its evolvesTo[0] (a new id).
// So a discovery guard that checks only the BASE id (e.g. 'dread_gaze') stops matching once
// the skill has evolved away ('terror_gaze'), and re-grants the base every tick → duplicate
// slots pile up (badly during offline catch-up). These helpers check the WHOLE lineage instead.

/** All ids reachable forward from a base id via evolvesTo (inclusive). */
function skillForwardLine(content: Content, baseId: string): Set<string> {
  const out = new Set<string>();
  const stack = [baseId];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const n of content.skills.get(id)?.evolvesTo ?? []) stack.push(n);
  }
  return out;
}

/** True if the player owns the base skill OR any of its evolved forms (its whole mastery line). */
export function hasSkillLine(state: GameState, content: Content, baseId: string): boolean {
  const line = skillForwardLine(content, baseId);
  return state.skills.some((s) => line.has(s.id));
}

/** Walk back to the root of a skill's evolution lineage (the id no other skill evolves into). */
function skillRootId(content: Content, id: string): string {
  let cur = id;
  const guard = new Set<string>();
  for (;;) {
    if (guard.has(cur)) return cur; // cycle safety
    guard.add(cur);
    let parent: string | undefined;
    for (const def of content.skills.values()) {
      if (def.evolvesTo.includes(cur)) { parent = def.id; break; }
    }
    if (!parent) return cur;
    cur = parent;
  }
}

/**
 * One-time save repair: collapse duplicate skill slots that share an evolution lineage into one.
 * The most-advanced slot (higher tier, then level, then exp) survives; equipped ids are re-pointed
 * onto the surviving slot. Returns how many slots were removed.
 */
export function dedupeSkills(state: GameState, content: Content): number {
  const byRoot = new Map<string, SkillSlot[]>();
  const unknown: SkillSlot[] = []; // ids not in the content graph — never touch them
  for (const s of state.skills) {
    if (!content.skills.get(s.id)) { unknown.push(s); continue; }
    const r = skillRootId(content, s.id);
    const arr = byRoot.get(r);
    if (arr) arr.push(s); else byRoot.set(r, [s]);
  }
  const score = (s: SkillSlot) => (s.tier ?? 1) * 1e6 + s.level * 1e3 + s.exp;
  const keepByRoot = new Map<string, SkillSlot>();
  let removed = 0;
  for (const [r, arr] of byRoot) {
    arr.sort((a, b) => score(b) - score(a));
    keepByRoot.set(r, arr[0]);
    removed += arr.length - 1;
  }
  if (removed === 0) return 0;
  state.skills = [...keepByRoot.values(), ...unknown];
  const survives = new Set(state.skills.map((s) => s.id));
  const seen = new Set<string>();
  state.equipped = state.equipped
    .map((id) => (content.skills.get(id) ? keepByRoot.get(skillRootId(content, id))?.id ?? id : id))
    .filter((id) => survives.has(id) && !seen.has(id) && (seen.add(id), true));
  return removed;
}

/** Ensure the player has a resistance slot for a damage type — auto-grants on first exposure. */
function ensureResistSlot(state: GameState, content: Content, type: DamageType): ResistSlot | null {
  for (const slot of state.resistances) {
    const def = content.resistances.get(slot.id);
    if (def?.damageType === type) return slot;
  }
  for (const def of content.resistances.values()) {
    if (def.damageType === type) {
      const slot: ResistSlot = { id: def.id, level: 0, exp: 0, nullified: false };
      state.resistances.push(slot);
      return slot;
    }
  }
  return null;
}

/** Extra resistance % from the active resistance chain skill for this damage type.
 *  Returns a fraction (0–0.40) added on top of the stat-based reduction. */
function chainResistBonus(state: GameState, content: Content, type: DamageType): number {
  const chainResistType = type === 'petrify' ? 'stun_res' : `${type}_res`;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def || def.kind !== 'resistance' || def.resistType !== chainResistType) continue;
    const bonus = (def.tierStatBonus ?? 0) / 100; // e.g. 40 → 0.40
    const s = Math.min(1, slot.level / Math.max(1, def.lvMax));
    return bonus * s;
  }
  return 0;
}

function resistReduction(state: GameState, content: Content, type: DamageType): number {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return 0;
  if (slot.nullified) return 0.95;
  const statReduction = Math.min(slot.level * 0.05, 0.9);
  const chainBonus = chainResistBonus(state, content, type);
  // Combined cap at 0.95 to reserve 5% floor until Ultimate Nullification
  return Math.min(statReduction + chainBonus, 0.95);
}

/** Returns the applicable group nullification percentage (0–85) for a damage type. */
function getGroupNullPct(bonuses: Bonuses, type: DamageType): number {
  const MAGIC: DamageType[] = ['fire', 'frost', 'lightning', 'wind', 'earth', 'dark', 'light', 'acid', 'magic'];
  const PHYSICAL: DamageType[] = ['physical', 'pierce'];
  const STATUS: DamageType[] = ['poison', 'stun', 'petrify', 'fear'];
  if (MAGIC.includes(type))    return bonuses.magicNullReduction * 100;
  if (PHYSICAL.includes(type)) return bonuses.physNullReduction * 100;
  if (STATUS.includes(type))   return bonuses.statusNullReduction * 100;
  if (type === 'soul')         return 0; // Soul has no group null, goes directly to Ultimate
  return 0;
}

/** Returns true if a nullification skill should receive XP from this damage type. */
function isRelevantForNull(nullSkillId: string, type: DamageType): boolean {
  const MAGIC_TYPES: DamageType[] = ['fire', 'frost', 'lightning', 'wind', 'earth', 'dark', 'light', 'acid', 'magic'];
  const PHYSICAL_TYPES: DamageType[] = ['physical', 'pierce'];
  const STATUS_TYPES: DamageType[] = ['poison', 'stun', 'petrify', 'fear'];
  if (nullSkillId === 'magic_nullification')    return MAGIC_TYPES.includes(type);
  if (nullSkillId === 'physical_nullification') return PHYSICAL_TYPES.includes(type);
  if (nullSkillId === 'status_nullification')   return STATUS_TYPES.includes(type);
  if (nullSkillId === 'ultimate_nullification') return true; // all damage types (including soul)
  return false;
}

/** Grants the T1 chain skill for a damage type if not already owned (any tier). */
function autoUnlockChainSkill(state: GameState, content: Content, type: DamageType, log: Log): void {
  const T1_MAP: Partial<Record<DamageType, string>> = {
    fire: 'fire_resistance',       frost: 'ice_resistance',       lightning: 'lightning_resistance',
    wind: 'wind_resistance',       earth: 'earth_resistance',     dark: 'dark_resistance',
    light: 'light_resistance',     acid: 'acid_resistance',       physical: 'impact_resistance',
    pierce: 'pierce_resistance',   poison: 'poison_resistance',   stun: 'stun_resistance',
    petrify: 'stun_resistance',    fear: 'fear_resistance',       soul: 'soul_resistance',
  };
  const t1Id = T1_MAP[type];
  if (!t1Id) return;
  const def = content.skills.get(t1Id);
  if (!def) return;
  // Check if any skill in this lineage is already owned.
  const lineage = skillForwardLine(content, t1Id);
  const owned = state.skills.some((s) => lineage.has(s.id));
  if (owned) return;
  state.skills.push({ id: t1Id, level: 1, exp: 0, tier: 1 });
  log({ key: 'log.chain_unlock', params: { skill: def.locKeyName } });
}

/** Checks all merger definitions; fires applyMerger for any newly satisfied mergers. */
function checkMergerConditions(state: GameState, content: Content, log: Log): void {
  for (const merger of content.resistanceMergers.values()) {
    // Skip if merger result already owned.
    if (state.skills.some((s) => s.id === merger.id)) continue;
    // Check all requirements.
    const satisfied = merger.requires.every((req) => {
      const slot = state.skills.find((s) => s.id === req.skillId);
      if (!slot) return false;
      if (req.minLevel !== undefined && slot.level < req.minLevel) return false;
      return true;
    });
    if (satisfied) applyMerger(state, content, merger, log);
  }
}

/** Removes component skills and spawns the merger skill at Lv1. */
function applyMerger(state: GameState, content: Content, merger: ResistanceMerger, log: Log): void {
  // Guard first: if the merger skill definition is missing, abort before touching state.
  const mergerDef = content.skills.get(merger.id);
  if (!mergerDef) return;
  // Remove all component skills.
  const toRemove = new Set(merger.requires.map((r) => r.skillId));
  state.skills = state.skills.filter((s) => !toRemove.has(s.id));
  // Add merger skill at Lv1.
  state.skills.push({ id: merger.id, level: 1, exp: 0 });
  log({ key: 'log.merger_unlocked', params: { merger: merger.locKey } });
}

function addResistExp(state: GameState, content: Content, type: DamageType, amount: number, log: Log): void {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return;
  const def = content.resistances.get(slot.id);
  if (!def || slot.nullified) return;
  // Auto-unlock T1 chain skill on first exposure to this damage type.
  autoUnlockChainSkill(state, content, type, log);
  slot.exp += amount;
  while (slot.level < def.lvMax && slot.exp >= resistExpToNext(slot.level)) {
    slot.exp -= resistExpToNext(slot.level);
    slot.level += 1;
    log({ key: 'log.resist_up', params: { res: def.locKey, lvLabel: LV_LABEL, lv: slot.level } });
  }
  if (slot.level >= def.lvMax) {
    slot.nullified = true;
    log({ key: 'log.nullity', params: { res: def.locKey, nullity: def.nullityKey } });
  }
  // Distribute XP to resistance chain skills and active nullification skills.
  // Chain skills (have resistType) receive amount/2 (depth=2: group null + ultimate).
  // Nullification skills (no resistType) receive amount (depth=1).
  // Petrify damage also feeds the stun_res chain (shared paralysis chain).
  const chainResistType = type === 'petrify' ? 'stun_res' : `${type}_res`;

  for (const skillSlot of state.skills) {
    const skillDef = content.skills.get(skillSlot.id);
    if (!skillDef || skillDef.kind !== 'resistance') continue;

    if (skillDef.resistType) {
      // Chain skill: only feeds if resistType matches
      if (skillDef.resistType !== chainResistType) continue;
      const chainXp = Math.max(1, Math.floor(amount / 2));
      skillSlot.exp += chainXp;
      skillLevelUp(skillSlot, state, content, log, false);
    } else {
      // Nullification skill: determine if this damage type is relevant
      const relevant = isRelevantForNull(skillSlot.id, type);
      if (!relevant) continue;
      skillSlot.exp += amount;
      skillLevelUp(skillSlot, state, content, log, false);
    }
  }
}

// ---- Human Path (Faz 3) -------------------------------------------------------

/** Path bonus applied once when the player chooses (permanent bonuses to stats and unlock). */
const HUMAN_PATH_BONUS: Record<string, { stat: string; amount: number; skills: string[] }> = {
  tank:     { stat: 'VIT', amount: 3, skills: ['iron_will', 'battle_cry'] },
  mage:     { stat: 'INT', amount: 3, skills: ['mana_control', 'mana_shield'] },
  assassin: { stat: 'AGI', amount: 3, skills: ['stealth', 'ambush_strike'] },
  healer:   { stat: 'WIS', amount: 3, skills: ['divine_recovery', 'regeneration'] },
};

/** Player chooses their Human Path at T0 LV10. Grants stat bonus + path skills. */
export function chooseHumanPath(state: GameState, content: Content, pathId: string, log: Log): boolean {
  if (state.raceId !== 'human') return false;
  if (!state.pendingHumanPath) return false;
  const bonus = HUMAN_PATH_BONUS[pathId];
  if (!bonus) return false;
  state.humanPath = pathId;
  state.pendingHumanPath = false;
  state.action = 'combat';
  // Apply stat bonus
  (state.stats as Record<string, number>)[bonus.stat] = ((state.stats as Record<string, number>)[bonus.stat] ?? 5) + bonus.amount;
  recomputeMaxes(state);
  // Grant path-specific skills (if not already owned)
  for (const sid of bonus.skills) {
    if (!state.skills.some((s) => s.id === sid) && content.skills.has(sid)) {
      state.skills.push({ id: sid, level: 1, exp: 0 });
    }
  }
  log({ key: 'log.human_path_chosen', params: { path: `human.path.${pathId}` } });
  return true;
}
