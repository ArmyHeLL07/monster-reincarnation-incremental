import type { DamageType } from '@mri/shared';
import type { Content } from './content';
import type { GameState, SkillSlot, ResistSlot, LogEvent } from './state';
import { deriveMaxHp } from './state';

type Log = (e: LogEvent) => void;

const LV_LABEL = 'ui.lv';

function skillExpToNext(level: number): number {
  return level * 10;
}
function resistExpToNext(level: number): number {
  return 20 + level * 20;
}
function dmgTypeKey(type?: DamageType): string {
  return `dmgtype.${type ?? 'physical'}`;
}

/** One combat round: passives → ensure enemy → player hits → enemy retaliates → resolve. */
export function tick(state: GameState, content: Content, log: Log): void {
  applyPassives(state, content);
  if (!state.enemy) spawnEnemy(state, content, log);
  if (!state.enemy) return;

  playerAttack(state, content, log);

  if (state.enemy.hp <= 0) {
    onKill(state, content, log);
  } else {
    enemyAttack(state, content, log);
  }

  if (state.hp <= 0) onDeath(state, log);

  state.lastSeen = Date.now();
}

/** A single manual strike (no enemy retaliation) — the active-play complement to auto-battle. */
export function manualAttack(state: GameState, content: Content, log: Log): void {
  if (!state.enemy) spawnEnemy(state, content, log);
  if (!state.enemy) return;
  playerAttack(state, content, log);
  if (state.enemy.hp <= 0) onKill(state, content, log);
}

function applyPassives(state: GameState, content: Content): void {
  let regen = 0;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (def?.hpRegen) regen += def.hpRegen;
  }
  if (regen > 0 && state.hp < state.maxHp) {
    state.hp = Math.min(state.maxHp, state.hp + regen);
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

  const dmg = (def.damage ?? 0) + Math.floor(state.stats.STR / 5);
  enemy.hp -= dmg;
  log({ key: 'log.attack', params: { skill: def.locKeyName, dmg, type: dmgTypeKey(def.damageType) } });
  addSkillExp(content, slot, 2, log);

  // Always-on skills (passive/eye/util) train slowly each round.
  for (const s of state.skills) {
    const d = content.skills.get(s.id);
    if (d && d.kind !== 'active') addSkillExp(content, s, 1, log);
  }
}

function enemyAttack(state: GameState, content: Content, log: Log): void {
  const enemy = state.enemy;
  if (!enemy) return;
  const def = content.enemies.get(enemy.id);
  if (!def) return;
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
    log({ key: 'log.kill', params: { enemy: def.locKey, ep: def.ep } });
  }
  state.enemy = null;
}

function onDeath(state: GameState, log: Log): void {
  log({ key: 'log.death' });
  state.maxHp = deriveMaxHp(state.stats);
  state.hp = state.maxHp;
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
