import type { StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';
import { appraisalTier } from './eyes';
import { aggregateBonuses } from './effects';

type Log = (e: LogEvent) => void;

/** Cost in EP to mend one point of fusion scar (GDD §5.0.4 — repairable but real). */
const SCAR_REPAIR_EP = 20;

/** Knowledge-based exploration (GDD §8.2): roll for fragments, books, or perceiving a room. */
export function search(state: GameState, content: Content, log: Log): void {
  const tier = appraisalTier(state);
  const luck = state.stats.LUCK;
  const b = aggregateBonuses(state, content);
  const roll = Math.random() * (1 + b.lootMult - 1);
  const baseFind = 0.25 + luck * 0.01 + roll;

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
  if (book && Math.random() < 0.3 + luck * 0.005) {
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

/** Answer the pending room's riddle (language-aware). Correct → reward; wrong → it stays. */
export function answerRoom(state: GameState, content: Content, answer: string, log: Log): boolean {
  const id = state.pendingRoom;
  if (!id) return false;
  const room = content.rooms.get(id);
  if (!room) return false;
  const lang = state.lang === 'tr' ? 'tr' : 'en';
  const norm = answer.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
  const ok = room.answers[lang].some((a) => a.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US') === norm);
  if (!ok) {
    log({ key: 'log.room_wrong' });
    return false;
  }
  // Correct — apply the reward.
  const r = room.reward;
  if (r.kind === 'skill' && typeof r.value === 'string') {
    if (!state.skills.some((s) => s.id === r.value)) state.skills.push({ id: r.value, level: 1, exp: 0 });
  } else if (r.kind === 'stat' && typeof r.value === 'string') {
    state.stats[r.value as StatKey] += 3;
    recomputeMaxes(state);
  } else if (r.kind === 'ep' && typeof r.value === 'number') {
    state.ep += r.value;
  } else if (r.kind === 'unlock' && typeof r.value === 'string') {
    if (!state.unlocks.includes(r.value)) state.unlocks.push(r.value);
  }
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
