import type { EventDef, EventChoice, EventOutcome, EventCond, StatKey, DamageType } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';
import { appraisalTier } from './eyes';
import { gainSin, gainVirtue } from './ruler';

type Log = (e: LogEvent) => void;

/** Fraction of (non-entry) rooms that are choice-event rooms. Per-event balance lives in events.json. */
const EVENT_RATE = 0.12;

export function roomKeyOf(state: GameState): string {
  return `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
}

/** Stable [0,1) hash for a room coordinate — its own channel, independent of exploration rooms. */
function eventHash(layer: number, floor: number, room: number): number {
  let n = (Math.imul(layer * 31 + 7, 2654435761) ^ Math.imul(floor + 101, 40503) ^ Math.imul(room + 17, 2246822519)) >>> 0;
  n = (n ^ (n >>> 15)) >>> 0;
  return (n % 100000) / 100000;
}

/** Is a knowledge condition satisfied? (gates a choice). */
export function condMet(state: GameState, cond?: EventCond): boolean {
  if (!cond) return true;
  if (cond.appraisalTier != null && appraisalTier(state) < cond.appraisalTier) return false;
  if (cond.int != null && state.stats.INT < cond.int) return false;
  if (cond.stat) {
    for (const [k, v] of Object.entries(cond.stat)) {
      if (state.stats[k as StatKey] < (v ?? 0)) return false;
    }
  }
  if (cond.skill && !state.skills.some((s) => s.id === cond.skill!.id && s.level >= cond.skill!.level)) return false;
  if (cond.unlock && !state.unlocks.includes(cond.unlock)) return false;
  return true;
}

/** Short, language-neutral summary of a choice's requirement (stat tokens are universal). */
export function reqText(cond?: EventCond): string {
  if (!cond) return '';
  const parts: string[] = [];
  if (cond.appraisalTier != null) parts.push(`Appraisal ${cond.appraisalTier}`);
  if (cond.int != null) parts.push(`INT ${cond.int}`);
  if (cond.stat) for (const [k, v] of Object.entries(cond.stat)) parts.push(`${k} ${v}`);
  if (cond.skill) parts.push(cond.skill.id);
  if (cond.unlock) parts.push(cond.unlock);
  return parts.join(' · ');
}

/** Foresight: are this event's choice outcomes previewed for the player? */
export function foresee(state: GameState, def: EventDef): boolean {
  const r = def.revealReq;
  if (!r) return false;
  if (r.appraisalTier != null && appraisalTier(state) >= r.appraisalTier) return true;
  if (r.int != null && state.stats.INT >= r.int) return true;
  return false;
}

/** Pick the (stable) event def for the current room, weighted; null if none eligible. */
export function pickEventDef(state: GameState, content: Content): EventDef | null {
  const layer = state.pos.layer;
  const eligible = [...content.events.values()].filter((e) => !e.layers || e.layers.includes(layer));
  if (!eligible.length) return null;
  const totalW = eligible.reduce((s, e) => s + (e.weight ?? 1), 0);
  let r = eventHash(layer + 999, state.pos.floor, state.pos.room) * totalW;
  for (const e of eligible) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

/** If this (unresolved, non-entry) room is an event room, return its event id — else null. Stable. */
export function rollRoomEvent(state: GameState, content: Content): string | null {
  const { layer, floor, room } = state.pos;
  if (room <= 1) return null; // entry room is always safe
  if (state.resolvedEvents.includes(roomKeyOf(state))) return null;
  if (eventHash(layer, floor, room) >= EVENT_RATE) return null;
  return pickEventDef(state, content)?.id ?? null;
}

/** Resolve a choice's outcome list (rolls the weighted random branch if present). */
export function outcomesFor(choice: EventChoice): EventOutcome[] {
  if (!choice.random) return choice.outcomes ?? [];
  const total = choice.random.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const b of choice.random) {
    r -= b.weight;
    if (r <= 0) return b.outcomes;
  }
  return choice.random[choice.random.length - 1].outcomes;
}

/**
 * Apply one outcome. Handles every kind EXCEPT 'spawn' (a combat concern — caller handles it,
 * keeping this module free of any combat.ts import → no circular dependency).
 */
export function applyOutcome(state: GameState, content: Content, o: EventOutcome, log: Log): void {
  const amt = o.amount ?? (typeof o.value === 'number' ? o.value : 0);
  switch (o.kind) {
    case 'ep':
      state.ep = Math.max(0, state.ep + amt);
      break;
    case 'stat':
      if (typeof o.value === 'string') {
        state.stats[o.value as StatKey] += amt || 1;
        recomputeMaxes(state);
      }
      break;
    case 'skill':
      if (typeof o.value === 'string' && !state.skills.some((s) => s.id === o.value)) {
        state.skills.push({ id: o.value, level: 1, exp: 0 });
      }
      break;
    case 'unlock':
      if (typeof o.value === 'string' && !state.unlocks.includes(o.value)) state.unlocks.push(o.value);
      break;
    case 'fragment':
      if (o.value === 'map') state.mapFragments += amt || 1;
      else state.loreFragments += amt || 1;
      break;
    case 'hp':
      state.hp = Math.max(0, Math.min(state.maxHp, state.hp + amt)); // amt<0 = damage; 0 → death handled by caller
      break;
    case 'status':
      if (typeof o.value === 'string') {
        state.statusEffects.push({
          type: o.value as DamageType,
          ticksLeft: amt || 5,
          dmgPerTick: Math.max(1, Math.round(state.maxHp * 0.01)),
        });
      }
      break;
    case 'scar':
      state.scars += amt || 1;
      break;
    case 'hunger':
      state.hunger = Math.max(0, Math.min(100, state.hunger + amt));
      break;
    case 'food':
      state.inventory.push({ enemyId: typeof o.value === 'string' ? o.value : 'cave_pest', satiety: amt || 30, decay: 0 });
      break;
    case 'sin':
      gainSin(state, content, amt || 1, log);
      break;
    case 'virtue':
      gainVirtue(state, content, amt || 1, log);
      break;
    case 'spawn':
      break; // caller (combat.ts) performs the spawn
    case 'none':
      break;
  }
  log({ key: o.locKeyResult });
}
