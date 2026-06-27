import type { GameState, LogEvent } from './state';
import type { Content } from './content';

type Log = (e: LogEvent) => void;

/**
 * Grant a race's hidden "lore-mastery" passive once the player has found AND read every one of
 * that race's lore books. `booksFound` persists across rebirth (skills do not), so the passive
 * auto-regrants each life; `loreMasteries` records the first-ever earn so the celebration/log
 * fires only once. Race-scoped: only the currently-played race's passive is ever granted.
 * Cheap — runs each tick alongside checkAchievements/checkQuests.
 */
export function checkLoreMastery(state: GameState, content: Content, log: Log): void {
  state.loreMasteries ??= [];
  for (const def of content.skills.values()) {
    if (!def.reqLore || !def.loreRace) continue;            // only lore-mastery passives
    if (def.loreRace !== state.raceId) continue;            // racial: current race only
    if (state.skills.some((s) => s.id === def.id)) continue; // already owned this life
    if (!def.reqLore.every((id) => state.booksFound.includes(id))) continue;
    state.skills.push({ id: def.id, level: 1, exp: 0 });
    if (!state.loreMasteries.includes(def.id)) {
      state.loreMasteries.push(def.id);                     // first-ever earn → permanent record + celebrate
      log({ key: 'log.lore_mastery', params: { skill: def.locKeyName } });
    }
  }
}
