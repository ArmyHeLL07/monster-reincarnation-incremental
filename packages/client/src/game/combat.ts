import type { DamageType, StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot, ResistSlot, LogEvent } from './state';
import { recomputeMaxes, newGame, MAX_HUNGER, LEVEL_CAP } from './state';
import { appraisalAssigned, appraisalTier, gazeNegateChance, gazeAttack } from './eyes';
import { maxFoodSlots, refrigerated, isRotten } from './inventory';
import { aggregateBonuses, type Bonuses } from './effects';
import { gainSin } from './ruler';
import { meditateTick } from './meditation';
import { diffDef } from './difficulty';

type Log = (e: LogEvent) => void;

const LV_LABEL = 'ui.lv';
const BASE_SP_DRAIN = 1;
const REST_SP_REGEN = 5;
const REST_MP_REGEN = 2;
const DEEP_READ_MP_COST = 5;
const HUNGER_RISE_COMBAT = 0.7;
const DEEP_READ_XP = 5;
const MP_TRANSFER_DISCOVER_CHANCE = 0.03;
const LARDER_DISCOVER_CHANCE = 0.04;
const EYE_DISCOVER_CHANCE = 0.03;
const EYE_DISCOVER_LEVEL = 5;
const DEPTH_HP = 0.05; // enemy HP growth per room of depth
const DEPTH_ATK = 0.045;
const BOSS_HP = 2.5;
const BOSS_ATK = 1.6;
const REST_MULT = 0.7; // rest is deliberately slow (~70% of before)
const COMBAT_MP_REGEN = 1; // MP slowly recovers even mid-combat
const STAT_POINTS_PER_LEVEL = 3;
const XP_PER_EP = 8;
const SIN_PER_KILL = 1; // dark axis grows by killing (GDD §C)
const BRINK_MAX_CHANCE = 0.1; // regen-learning chance at death's door (GDD §6.1)

function skillExpToNext(level: number): number {
  return 15 + level * 10; // slower early (Lv1→2 = 25, was 10)
}
function resistExpToNext(level: number): number {
  return 20 + level * 20;
}
export function xpToNext(level: number): number {
  return level * 50;
}
function dmgTypeKey(type?: DamageType): string {
  return `dmgtype.${type ?? 'physical'}`;
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
export function tick(state: GameState, content: Content, log: Log): void {
  if (state.action === 'idle') {
    state.lastSeen = Date.now();
    return; // frozen — no hunger, no regen, nothing happens
  }

  if (state.action === 'meditate') {
    meditateTick(state, content, log); // hidden zen gauge + virtue; world otherwise frozen
    state.lastSeen = Date.now();
    return;
  }

  if (state.action === 'combat') {
    const b = aggregateBonuses(state, content);
    state.hunger = Math.min(MAX_HUNGER, state.hunger + HUNGER_RISE_COMBAT * b.hungerMult * (diffDef(state, content).brutal ? 1.5 : 1));
    combatRound(state, content, log, b);
    decayFood(state);
    autoEat(state, content, log);
    if (hungerStage(state) >= 3) {
      state.hp = Math.max(0, state.hp - 1); // starvation
      if (state.hp <= 0) onDeath(state, content, log, b);
    }
  } else {
    restRound(state, content);
  }
  growStaminaRegen(state); // training raises SP regen (more in combat / low HP)
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
    state.hunger = Math.max(0, state.hunger - eaten.satiety);
    // Gluttony: feeding feeds the dark axis (GDD §7.4.5).
    gainSin(state, content, 0.25, log);
    return;
  }
  const rotten = state.inventory.shift();
  if (rotten) {
    addResistExp(state, content, 'poison', 3, log);
    log({ key: 'log.ate_rotten' });
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
  const tier = appraisalTier(state);
  log({ key: 'log.appraise_name', params: { enemy: enemy.locKey } });
  if (tier >= 2) log({ key: 'log.appraise_type', params: { type: dmgTypeKey(enemy.damageType) } });
  if (tier >= 3) log({ key: 'log.appraise_atk', params: { atk: enemy.attack } });
  if (tier >= 4) log({ key: 'log.appraise_hp', params: { hp: Math.round(enemy.hp), maxhp: enemy.maxHp } });
  const slot = state.skills.find((s) => s.id === 'appraisal' || s.id === 'insight' || s.id === 'all_sight');
  if (slot) addSkillExp(content, slot, DEEP_READ_XP, log, 1);
}

/** Spend a stat point (STR power, VIT HP+stamina, INT MP, AGI dodge+stamina, …). */
export function allocStat(state: GameState, stat: StatKey): void {
  if (state.statPoints <= 0) return;
  state.stats[stat] += 1;
  state.statPoints -= 1;
  recomputeMaxes(state);
}

/** Deliberate risk action — "Push to the Brink" (GDD §6.1): drop HP to open the regen window. */
export function courtDeath(state: GameState, log: Log): void {
  if (state.action !== 'combat') return;
  state.hp = Math.max(1, Math.floor(state.maxHp * 0.1));
  log({ key: 'log.court_death' });
  tryLearnRegen(state, log, true);
}

// ---- rounds ----------------------------------------------------------------

function combatRound(state: GameState, content: Content, log: Log, b: Bonuses): void {
  if (!state.enemy) spawnEnemy(state, content, log);
  if (!state.enemy) return;
  applyCombatRegen(state, content, b);
  state.mp = Math.min(state.maxMp, state.mp + COMBAT_MP_REGEN + b.mpRegen);
  drainStamina(state, content);
  tryLearnRegen(state, log, false);
  playerAttack(state, content, log, b);
  if (state.enemy.hp <= 0) {
    onKill(state, content, log, b);
  } else {
    enemyAttack(state, content, log, b);
  }
  if (state.hp <= 0) onDeath(state, content, log, b);
}

function restRound(state: GameState, content: Content): void {
  state.enemy = null;
  const b = aggregateBonuses(state, content);
  state.sp = Math.min(state.maxSp, state.sp + Math.round((REST_SP_REGEN + state.spRegenBonus + staminaRegenSum(state, content)) * REST_MULT));
  state.mp = Math.min(state.maxMp, state.mp + Math.max(1, Math.round((REST_MP_REGEN + b.mpRegen) * REST_MULT)));
  const hp = (passiveHpRegen(state, content) * (1 + (b.regenMult - 1)) + 1) * REST_MULT;
  state.hp = Math.min(state.maxHp, state.hp + Math.max(1, Math.round(hp)));
}

/** Low-HP regeneration learning (GDD §6.1) — chance rises as HP falls, peaks at the brink. */
function tryLearnRegen(state: GameState, log: Log, forced: boolean): void {
  if (state.skills.some((s) => s.id === 'hp_regen' || s.id === 'auto_heal' || s.id === 'regeneration')) return;
  const missing = 1 - state.hp / Math.max(1, state.maxHp);
  if (!forced && missing < 0.5) return;
  const chance = Math.min(BRINK_MAX_CHANCE, 0.001 + missing * missing * BRINK_MAX_CHANCE);
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
  if (state.mpTransferUnlocked && state.mp > 0) {
    const fromMp = Math.min(state.mp, deficit);
    state.mp -= fromMp;
    const rem = deficit - fromMp;
    if (rem > 0) state.hp = Math.max(0, state.hp - rem);
  } else {
    state.hp = Math.max(0, state.hp - deficit);
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

function recordExplored(state: GameState, roomsPerFloor: number): void {
  const idx = (state.pos.floor - 1) * roomsPerFloor + state.pos.room;
  const prev = state.exploredMax[state.pos.layer] ?? 0;
  if (idx > prev) state.exploredMax[state.pos.layer] = idx;
}

function spawnEnemy(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  if (!layer || layer.enemyPool.length === 0) return;
  recordExplored(state, layer.roomsPerFloor); // light the room on the map as we enter it
  const isBoss = state.pos.room >= layer.roomsPerFloor;
  const archId = isBoss ? layer.boss : layer.enemyPool[Math.floor(Math.random() * layer.enemyPool.length)];
  const def = content.enemies.get(archId);
  if (!def) return;
  const diff = diffDef(state, content);
  const depth = (state.pos.layer - 1) * 100 + (state.pos.floor - 1) * 15 + state.pos.room;
  const hpMult = (1 + depth * DEPTH_HP) * (isBoss ? BOSS_HP : 1) * diff.enemyMult;
  const atkMult = (1 + depth * DEPTH_ATK) * (isBoss ? BOSS_ATK : 1) * diff.enemyMult;
  const hp = Math.round(def.hp * hpMult);
  state.enemy = {
    id: archId,
    locKey: def.locKey,
    hp,
    maxHp: hp,
    attack: Math.max(1, Math.round(def.attack * atkMult)),
    damageType: def.damageType,
    damageType2: def.damageType2,
    ep: Math.round(def.ep * (isBoss ? 3 : 1)),
    satiety: Math.round(def.satiety * (isBoss ? 2 : 1)),
    isBoss,
  };
  log({ key: isBoss ? 'log.boss_spawn' : 'log.spawn', params: { enemy: def.locKey } });
}

/** Pick the strongest usable attack — magic scales with INT but needs affordable MP. */
function chooseAttack(state: GameState, content: Content): SkillSlot | null {
  let best: SkillSlot | null = null;
  let bestScore = -1;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.damage === undefined) continue;
    if (def.kind === 'magic' && (def.mpCost ?? 0) > state.mp) continue; // can't afford the spell
    const score = def.kind === 'magic' ? def.damage + state.stats.INT * 0.6 : def.damage + state.stats.STR / 3;
    if (score > bestScore) {
      best = slot;
      bestScore = score;
    }
  }
  return best;
}

function playerAttack(state: GameState, content: Content, log: Log, b: Bonuses): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const slot = chooseAttack(state, content);
  if (!slot) return;
  const def = content.skills.get(slot.id);
  if (!def) return;
  const diff = diffDef(state, content);

  let raw: number;
  if (def.kind === 'magic') {
    state.mp = Math.max(0, state.mp - (def.mpCost ?? 0));
    raw = (def.damage ?? 0) + state.stats.INT * 0.6;
  } else {
    raw = (def.damage ?? 0) + Math.floor(state.stats.STR / 3);
  }
  raw += b.overdrawFrac * (state.maxHp - state.hp); // Overdraw: missing HP → power (§6.1)
  raw *= b.dmgMult * diff.playerMult;
  const dmg = Math.max(1, Math.round(raw * damageMult(state)) - state.scars);
  enemy.hp -= dmg;
  log({ key: 'log.attack', params: { skill: def.locKeyName, dmg, type: dmgTypeKey(def.damageType) } });

  // Offensive gaze from slotted active eyes (Soul gaze ignores resistance).
  const gz = gazeAttack(state, content);
  if (gz.damage > 0 && state.mp >= gz.mpCost) {
    state.mp -= gz.mpCost;
    enemy.hp -= gz.damage;
    log({ key: 'log.gaze_hit', params: { dmg: gz.damage } });
  }

  const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.3)) * b.xpMult));
  addSkillExp(content, slot, gain, log, b.xpMult);
  for (const s of state.skills) {
    if (s !== slot) addSkillExp(content, s, 1, log, b.xpMult);
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
  const types = enemy.damageType2 ? [enemy.damageType, enemy.damageType2] : [enemy.damageType];
  const share = enemy.attack / types.length;
  let totalTaken = 0;
  for (const type of types) {
    const reduction = resistReduction(state, content, type);
    const armorCut = b.armor / types.length;
    const taken = Math.max(0, Math.round(share * (1 - reduction) - armorCut));
    totalTaken += taken;
    if (taken > 0) addResistExp(state, content, type, taken, log);
  }
  state.hp = Math.max(0, state.hp - totalTaken);
  log({ key: 'log.hit', params: { enemy: enemy.locKey, dmg: totalTaken, type: dmgTypeKey(enemy.damageType) } });
}

function gainXp(state: GameState, amount: number, log: Log): void {
  if (state.level >= LEVEL_CAP) return;
  state.xp += amount;
  while (state.level < LEVEL_CAP && state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level += 1;
    state.statPoints += STAT_POINTS_PER_LEVEL;
    log({ key: 'log.levelup', params: { lv: state.level, pts: STAT_POINTS_PER_LEVEL } });
  }
  if (state.level >= LEVEL_CAP) {
    state.xp = 0;
    log({ key: 'log.cap', params: { lv: LEVEL_CAP } });
  }
}

function onKill(state: GameState, content: Content, log: Log, b: Bonuses): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const ep = Math.round(enemy.ep * b.lootMult);
  state.ep += ep;
  state.kills += 1;
  gainXp(state, ep * XP_PER_EP, log);
  gainSin(state, content, SIN_PER_KILL * (enemy.isBoss ? 5 : 1), log); // killing feeds the dark axis

  const satiety = Math.round(enemy.satiety * b.lootMult);
  if (state.inventory.length < maxFoodSlots(state)) {
    state.inventory.push({ enemyId: enemy.id, satiety, decay: 0 });
  } else {
    state.hunger = Math.max(0, state.hunger - satiety);
    log({ key: 'log.larder_full' });
  }
  log({ key: enemy.isBoss ? 'log.boss_kill' : 'log.kill', params: { enemy: enemy.locKey, ep } });

  const wasBoss = enemy.isBoss;
  const layer = currentLayer(state, content);
  state.enemy = null;

  // Gatekeeper down → Rebirth becomes available (and Hell-clear reward if applicable).
  if (wasBoss && layer?.gatekeeper) {
    state.gatekeeperCleared = true;
    log({ key: 'log.gatekeeper_down' });
    const diff = diffDef(state, content);
    if (diff.brutal && state.permadeath && !state.hellClears.includes(state.raceId)) {
      state.hellClears.push(state.raceId);
      state.statPoints += 15; // race-specific permanent reward (§8.5.2)
      log({ key: 'log.hell_clear', params: { race: `race.${state.raceId}.name` } });
    }
  }

  advancePosition(state, content, log, wasBoss);

  if (!state.mpTransferUnlocked && Math.random() < MP_TRANSFER_DISCOVER_CHANCE) {
    state.mpTransferUnlocked = true;
    log({ key: 'log.discover_mp_transfer' });
  }
  if (!state.skills.some((s) => s.id === 'larder') && Math.random() < LARDER_DISCOVER_CHANCE) {
    state.skills.push({ id: 'larder', level: 1, exp: 0 });
    log({ key: 'log.discover_larder' });
  }
  if (
    state.level >= EYE_DISCOVER_LEVEL &&
    !state.skills.some((s) => s.id === 'dread_gaze') &&
    Math.random() < EYE_DISCOVER_CHANCE
  ) {
    state.skills.push({ id: 'dread_gaze', level: 1, exp: 0 });
    log({ key: 'log.discover_dread' });
  }
}

function advancePosition(state: GameState, content: Content, log: Log, wasBoss: boolean): void {
  const layer = currentLayer(state, content);
  if (!layer) return;
  if (!wasBoss) {
    state.pos.room += 1;
    return;
  }
  if (state.pos.floor < layer.floors) {
    state.pos.floor += 1;
    state.pos.room = 1;
    log({ key: 'log.floor_cleared', params: { pos: `${state.pos.layer}.${state.pos.floor}` } });
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
  // Difficulty death penalty: lose dungeon progress (GDD §8.5).
  if (diff.deathPenalty >= 0.5) {
    state.pos.floor = 1;
  }
  state.pos.room = 1;
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.sp = state.maxSp;
  state.enemy = null;
}

function addSkillExp(content: Content, slot: SkillSlot, amount: number, log: Log, xpMult: number): void {
  const def = content.skills.get(slot.id);
  if (!def) return;
  slot.exp += Math.max(1, Math.round(amount * (slot.id === 'larder' ? 1 : xpMult)));
  while (slot.level < def.lvMax && slot.exp >= skillExpToNext(slot.level)) {
    slot.exp -= skillExpToNext(slot.level);
    slot.level += 1;
    log({ key: 'log.skill_up', params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
  }
  if (slot.level >= def.lvMax && def.evolvesTo.length > 0) {
    const nextId = def.evolvesTo[0];
    const next = content.skills.get(nextId);
    if (next) {
      log({ key: 'log.evolve', params: { from: def.locKeyName, to: next.locKeyName } });
      slot.id = nextId;
      slot.tier = (slot.tier ?? 1) + 1;
      slot.level = 1;
      slot.exp = 0;
    }
  }
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

function resistReduction(state: GameState, content: Content, type: DamageType): number {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return 0;
  if (slot.nullified) return 0.95;
  return Math.min(slot.level * 0.05, 0.9);
}

function addResistExp(state: GameState, content: Content, type: DamageType, amount: number, log: Log): void {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return;
  const def = content.resistances.get(slot.id);
  if (!def || slot.nullified) return;
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
}
