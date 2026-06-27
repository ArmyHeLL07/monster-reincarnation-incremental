import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { LEVEL_CAP, MAX_INVENTORY } from './state';
import { appraisalTier } from './eyes';
import { aggregateBonuses } from './effects';
import { generateLoot, lootDisplayName } from './loot';
import { isHumanoidForm } from './evolution';
import { normalizeAnswer, isRiddleLocked, recordRiddleWrong, applyRiddleReward } from './riddles';
import { allLore, loreById } from './langContent';

type Log = (e: LogEvent) => void;

/** Cost in EP to mend one point of fusion scar (GDD §5.0.4 — repairable but real). */
const SCAR_REPAIR_EP = 20;

export const SEARCH_SP_COST = 25;
export const SEARCH_CD_MS = 5000;
const AUTO_SEARCH_UNLOCK = 100;

/** Knowledge-based exploration (GDD §8.2): roll for fragments, books, or perceiving a room. */
export function search(state: GameState, content: Content, log: Log): void {
  if ((state.searchCD ?? 0) > 0) return;
  if (state.sp < SEARCH_SP_COST) { log({ key: 'auto.sp_low' }); return; }
  // One search per room in combat — but while RESTING you may comb the room repeatedly (you have time).
  const posKey = `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
  if (state.action !== 'rest') {
    if (state.lastSearchPos === posKey) {
      log({ key: 'log.search_done' });
      return;
    }
    state.lastSearchPos = posKey;
  }
  state.sp = Math.max(0, state.sp - SEARCH_SP_COST);
  state.searchCD = SEARCH_CD_MS;
  state.totalSearchCount += 1;
  if (!state.autoSearchUnlocked && state.totalSearchCount >= AUTO_SEARCH_UNLOCK) {
    state.autoSearchUnlocked = true;
    log({ key: 'auto.unlocked_toast' });
  }

  const tier = appraisalTier(state);
  const luck = state.stats.LUCK;
  const b = aggregateBonuses(state, content);
  // Tied to LUCK + the seeing eye (Appraisal/Insight) — low base so nothing is found easily.
  const roll = Math.random() * Math.max(0, b.lootMult - 1);
  const baseFind = 0.08 + luck * 0.01 + tier * 0.02 + roll;

  // 1) Perceive a secret room — the chance scales with the "seeing eye" level (GDD §5.0.7):
  // ~0% when you first meet the Appraisal/Insight requirement, rising gradually each level.
  const room = [...content.rooms.values()].find(
    (r) => tier >= r.appraisalReq && state.pendingRoom !== r.id && !state.discoveries.includes(r.id),
  );
  if (room) {
    const over = tier - room.appraisalReq; // ≥ 0 (the find() gates it)
    const perceiveChance = Math.min(0.45, 0.01 + over * 0.025 + luck * 0.003);
    if (Math.random() < perceiveChance) {
      state.pendingRoom = room.id;
      log({ key: 'log.search_room', params: { room: room.locKey } });
      return;
    }
  }

  // 2) Find a lore tome (native, chronological series).
  const book = [...allLore()]
    .sort((x, y) => x.order - y.order)
    .find((bk) => !state.booksFound.includes(bk.id));
  if (book && Math.random() < 0.16 + luck * 0.005 + tier * 0.01) {
    state.booksFound.push(book.id);
    log({ key: 'log.search_book', params: { title: book.title } });
    return;
  }

  // 2.5) Treasure chest — gear, but only for humanoid races/forms (a non-combat loot source).
  if (isHumanoidForm(state, content) && Math.random() < 0.1 + luck * 0.004) {
    const ilvl = state.tier * LEVEL_CAP + state.level + state.pos.layer * 2;
    const item = generateLoot(ilvl, luck + tier * 2); // a careful search finds rarer gear
    if (state.inventoryItems.length >= MAX_INVENTORY) {
      state.ep += item.value;
      log({ key: 'log.loot_full', params: { item: lootDisplayName(item), ep: item.value } });
    } else {
      state.inventoryItems.push(item);
      log({ key: 'log.search_chest', params: { item: lootDisplayName(item), rarity: `rarity.${item.rarity}` } });
    }
    return;
  }

  // 3) Fragments (map = points to a place, lore = riddle hints).
  if (Math.random() < baseFind) {
    if (Math.random() < 0.5) {
      state.mapFragments += 1;
      log({ key: 'log.search_map' });
    } else {
      state.loreFragments += 1;
      log({ key: 'log.search_lore' });
    }
    return;
  }
  log({ key: 'log.search_empty' });
}

/** Read a found book: surface lore always; the deep layer only at/above its INT gate (§7.8.1). */
export function readBook(state: GameState, _content: Content, bookId: string, log: Log): void {
  const book = loreById(bookId); // native lore (text is raw, not a loc key)
  if (!book || !state.booksFound.includes(bookId)) return;
  log({ key: 'log.book_lore', params: { title: book.title, lore: book.lore } });
  // Surface read always grants a small EP reward — knowledge has tangible value.
  state.ep += 5;
  log({ key: 'log.book_ep', params: { ep: 5 } });
  if (state.stats.INT >= book.intReq) {
    log({ key: 'log.book_deep', params: { deep: book.deep } });
    const firstTime = !state.discoveries.includes(bookId);
    if (firstTime) {
      state.discoveries.push(bookId);
      state.ep += book.intReq; // deep insight EP scales with how hard the knowledge is to unlock
      log({ key: 'log.book_insight', params: { ep: book.intReq } });
    }
  } else {
    log({ key: 'log.book_too_deep', params: { int: book.intReq } });
  }
}

/** Answer the pending room's riddle (forgiving match). Correct → reward; wrong → it stays (3-try limit). */
export function answerRoom(state: GameState, content: Content, answer: string, log: Log): boolean {
  const id = state.pendingRoom;
  if (!id) return false;
  const room = content.rooms.get(id);
  if (!room) return false;
  if (isRiddleLocked(state, id)) {
    log({ key: 'log.riddle_locked' }); // too many wrong tries — wait out the cooldown
    return false;
  }
  // Forgiving match: case-insensitive, Turkish letters folded, punctuation/space ignored —
  // so "sessizlik", "Sessızlık", "SESSİZLİK" all pass.
  const norm = normalizeAnswer(answer);
  const all = [...(room.answers.tr ?? []), ...(room.answers.en ?? [])];
  const ok = norm.length > 0 && all.some((a) => normalizeAnswer(a) === norm);
  if (!ok) {
    const locked = recordRiddleWrong(state, id);
    log({ key: locked ? 'log.riddle_locked_now' : 'log.room_wrong' });
    return false;
  }
  // Correct — apply the reward (shared helper) and clear this room's attempt limit.
  applyRiddleReward(state, room.reward, log);
  delete state.riddleLimits[id];
  state.discoveries.push(id);
  state.pendingRoom = null;
  log({ key: 'log.room_solved', params: { room: room.locKey } });
  return true;
}

/** Mend fusion scars by spending EP (the "repair the old mistakes" endgame motivation, §5.0.4). */
export function repairScar(state: GameState, log: Log): void {
  if (state.scars <= 0) return;
  if (state.ep < SCAR_REPAIR_EP) {
    log({ key: 'log.no_ep' });
    return;
  }
  state.ep -= SCAR_REPAIR_EP;
  state.scars = Math.max(0, state.scars - 1);
  log({ key: 'log.scar_repaired', params: { scars: state.scars } });
}
