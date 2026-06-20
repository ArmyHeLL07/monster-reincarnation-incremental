import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { appraisalTier } from './eyes';
import { aggregateBonuses } from './effects';
import { normalizeAnswer, isRiddleLocked, recordRiddleWrong, applyRiddleReward } from './riddles';

type Log = (e: LogEvent) => void;

/** Cost in EP to mend one point of fusion scar (GDD §5.0.4 — repairable but real). */
const SCAR_REPAIR_EP = 20;

/** Knowledge-based exploration (GDD §8.2): roll for fragments, books, or perceiving a room. */
export function search(state: GameState, content: Content, log: Log): void {
  // One search per room in combat — but while RESTING you may comb the room repeatedly (you have time).
  const posKey = `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
  if (state.action !== 'rest') {
    if (state.lastSearchPos === posKey) {
      log({ key: 'log.search_done' });
      return;
    }
    state.lastSearchPos = posKey;
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

  // 2) Find a sacrifice book (chronological series).
  const book = [...content.books.values()]
    .sort((x, y) => x.order - y.order)
    .find((bk) => !state.booksFound.includes(bk.id));
  if (book && Math.random() < 0.16 + luck * 0.005 + tier * 0.01) {
    state.booksFound.push(book.id);
    log({ key: 'log.search_book' });
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
export function readBook(state: GameState, content: Content, bookId: string, log: Log): void {
  const book = content.books.get(bookId);
  if (!book || !state.booksFound.includes(bookId)) return;
  log({ key: 'log.book_lore', params: { lore: book.locKeyLore } });
  if (state.stats.INT >= book.intReq) {
    log({ key: 'log.book_deep', params: { deep: book.locKeyDeep } });
    if (!state.discoveries.includes(bookId)) state.discoveries.push(bookId);
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
