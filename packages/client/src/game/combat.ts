import type { DamageType } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot, ResistSlot, LogEvent } from './state';
import { recomputeMaxes, MAX_HUNGER } from './state';
import { appraisalAssigned, dreadChance } from './eyes';

type Log = (e: LogEvent) => void;

const LV_LABEL = 'ui.lv';
const BASE_SP_DRAIN = 1;
const REST_SP_REGEN = 5;
const REST_MP_REGEN = 2;
const DEEP_READ_MP_COST = 5;
const HUNGER_RISE_COMBAT = 0.7;
const HUNGER_RISE_REST = 0.3;
const MP_TRANSFER_DISCOVER_CHANCE = 0.03;
const STAMINA_TRAIN_GAIN = 3;

function skillExpToNext(level: number): number {
  return level * 10;
}
function resistExpToNext(level: number): number {
  return 20 + level * 20;
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

// ---- main tick -------------------------------------------------------------

/** One real-time tick — combat round when engaged, otherwise a rest round. */
export function tick(state: GameState, content: Content, log: Log): void {
  if (state.combatActive) {
    state.hunger = Math.min(MAX_HUNGER, state.hunger + HUNGER_RISE_COMBAT);
    combatRound(state, content, log);
  } else {
    state.hunger = Math.min(MAX_HUNGER, state.hunger + HUNGER_RISE_REST);
    restRound(state, content);
  }
  if (hungerStage(state) >= 3) {
    state.hp = Math.max(0, state.hp - 1); // starvation erodes HP
    if (state.hp <= 0) onDeath(state, log);
  }
  state.lastSeen = Date.now();
}

/** A single manual strike — engages combat and hits once (no enemy retaliation). */
export function manualAttack(state: GameState, content: Content, log: Log): void {
  state.combatActive = true;
  if (!state.enemy) spawnEnemy(state, content, log);
  if (!state.enemy) return;
  drainStamina(state, content);
  playerAttack(state, content, log);
  if (state.enemy.hp <= 0) onKill(state, content, log);
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
  const def = content.enemies.get(enemy.id);
  if (def) {
    log({
      key: 'log.appraise',
      params: {
        enemy: def.locKey,
        type: dmgTypeKey(def.damageType),
        atk: def.attack,
        hp: enemy.hp,
        maxhp: enemy.maxHp,
      },
    });
  }
  const slot = state.skills.find((s) => s.id === 'appraisal' || s.id === 'insight');
  if (slot) addSkillExp(content, slot, 5, log);
}

/** EP cost of the next stamina training (rises as you train — no free infinite growth). */
export function staminaTrainCost(state: GameState): number {
  return 10 + Math.floor(state.spTrainingBonus / STAMINA_TRAIN_GAIN) * 5;
}

/** Stamina training — spend EP to raise max SP (player action). */
export function trainStamina(state: GameState, log: Log): void {
  const cost = staminaTrainCost(state);
  if (state.ep < cost) {
    log({ key: 'log.no_ep' });
    return;
  }
  state.ep -= cost;
  state.spTrainingBonus += STAMINA_TRAIN_GAIN;
  recomputeMaxes(state);
  state.sp = state.maxSp;
  log({ key: 'log.train_stamina', params: { max: state.maxSp } });
}

// ---- rounds ----------------------------------------------------------------

function combatRound(state: GameState, content: Content, log: Log): void {
  if (!state.enemy) spawnEnemy(state, content, log);
  if (!state.enemy) return;
  applyCombatRegen(state, content);
  drainStamina(state, content);
  playerAttack(state, content, log);
  if (state.enemy.hp <= 0) {
    onKill(state, content, log);
  } else {
    enemyAttack(state, content, log);
  }
  if (state.hp <= 0) onDeath(state, log);
}

function restRound(state: GameState, content: Content): void {
  state.enemy = null;
  const mult = regenMult(state);
  state.sp = Math.min(state.maxSp, state.sp + Math.round((REST_SP_REGEN + staminaRegenSum(state, content)) * mult));
  state.mp = Math.min(state.maxMp, state.mp + Math.round(REST_MP_REGEN * mult));
  const hp = passiveHpRegen(state, content);
  if (hp > 0) state.hp = Math.min(state.maxHp, state.hp + Math.round(hp * mult));
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
  const zone = content.zones.get(state.zoneId);
  const mult = zone?.spDrainMult ?? 1;
  const drain = Math.max(0, Math.round(BASE_SP_DRAIN * mult) - staminaRegenSum(state, content));
  if (drain <= 0) return;
  const after = state.sp - drain;
  if (after >= 0) {
    state.sp = after;
    return;
  }
  // SP empty → cascade: MP (if transfer unlocked) then HP.
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

function applyCombatRegen(state: GameState, content: Content): void {
  const hp = passiveHpRegen(state, content);
  if (hp > 0 && state.hp < state.maxHp) {
    state.hp = Math.min(state.maxHp, state.hp + Math.round(hp * regenMult(state)));
  }
}

function spawnEnemy(state: GameState, content: Content, log: Log): void {
  const zone = content.zones.get(state.zoneId);
  if (!zone || zone.enemyPool.length === 0) return;
  const id = zone.enemyPool[Math.floor(Math.random() * zone.enemyPool.length)];
  const def = content.enemies.get(id);
  if (!def) return;
  state.enemy = { id, hp: def.hp, maxHp: def.hp };
  log({ key: 'log.spawn', params: { enemy: def.locKey } });
}

function bestAttackSkill(state: GameState, content: Content): SkillSlot | null {
  let best: SkillSlot | null = null;
  let bestDmg = -1;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.damage !== undefined && def.damage > bestDmg) {
      best = slot;
      bestDmg = def.damage;
    }
  }
  return best;
}

function playerAttack(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const slot = bestAttackSkill(state, content);
  if (!slot) return;
  const def = content.skills.get(slot.id);
  if (!def) return;

  const raw = (def.damage ?? 0) + Math.floor(state.stats.STR / 5);
  const dmg = Math.max(1, Math.round(raw * damageMult(state)));
  enemy.hp -= dmg;
  log({ key: 'log.attack', params: { skill: def.locKeyName, dmg, type: dmgTypeKey(def.damageType) } });
  addSkillExp(content, slot, 2, log);

  // Every other carried skill also trains slowly each round, so lower-damage and
  // passive/eye skills still level and evolve (no dead skills).
  for (const s of state.skills) {
    if (s !== slot) addSkillExp(content, s, 1, log);
  }
}

function enemyAttack(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const def = content.enemies.get(enemy.id);
  if (!def) return;
  if (Math.random() < dreadChance(state)) {
    log({ key: 'log.flee', params: { enemy: def.locKey } });
    return;
  }
  const reduction = resistReduction(state, content, def.damageType);
  const taken = Math.max(0, Math.round(def.attack * (1 - reduction)));
  state.hp = Math.max(0, state.hp - taken);
  log({ key: 'log.hit', params: { enemy: def.locKey, dmg: taken, type: dmgTypeKey(def.damageType) } });
  if (taken > 0) addResistExp(state, content, def.damageType, taken, log);
}

function onKill(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const def = content.enemies.get(enemy.id);
  if (def) {
    state.ep += def.ep;
    state.hunger = Math.max(0, state.hunger - def.satiety); // auto-eat
    log({ key: 'log.kill', params: { enemy: def.locKey, ep: def.ep } });
  }
  state.enemy = null;

  if (!state.mpTransferUnlocked && Math.random() < MP_TRANSFER_DISCOVER_CHANCE) {
    state.mpTransferUnlocked = true;
    log({ key: 'log.discover_mp_transfer' });
  }
}

function onDeath(state: GameState, log: Log): void {
  log({ key: 'log.death' });
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.sp = state.maxSp;
  state.enemy = null;
}

function addSkillExp(content: Content, slot: SkillSlot, amount: number, log: Log): void {
  const def = content.skills.get(slot.id);
  if (!def) return;
  slot.exp += amount;
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
      slot.level = 1;
      slot.exp = 0;
    }
  }
}

function resistSlotFor(state: GameState, content: Content, type: DamageType): ResistSlot | null {
  for (const slot of state.resistances) {
    const def = content.resistances.get(slot.id);
    if (def?.damageType === type) return slot;
  }
  return null;
}

function resistReduction(state: GameState, content: Content, type: DamageType): number {
  const slot = resistSlotFor(state, content, type);
  if (!slot) return 0;
  if (slot.nullified) return 0.95;
  return Math.min(slot.level * 0.05, 0.9);
}

function addResistExp(
  state: GameState,
  content: Content,
  type: DamageType,
  amount: number,
  log: Log,
): void {
  const slot = resistSlotFor(state, content, type);
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
