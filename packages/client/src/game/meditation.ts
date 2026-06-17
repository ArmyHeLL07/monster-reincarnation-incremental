import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { MEDITATION_MAX } from './state';
import { gainVirtue } from './ruler';

type Log = (e: LogEvent) => void;

/** Virtue gained per meditation tick (the light/zen axis — GDD §7.6). */
const MEDITATION_VIRTUE = 0.5;
/** WIS feeds meditation speed (the "inner stillness" stat). */
function fillRate(state: GameState): number {
  return 1 + state.stats.WIS * 0.05;
}

/**
 * One meditation tick. The world is otherwise frozen (no hunger, no combat) — the player simply
 * waits. The hidden gauge fills; at full it unlocks the zen skill (Stillness). Never announced
 * in the UI ahead of time — discovered by waiting (or by a sacrifice-book hint).
 */
export function meditateTick(state: GameState, content: Content, log: Log): void {
  state.meditation = Math.min(MEDITATION_MAX, state.meditation + fillRate(state));
  gainVirtue(state, content, MEDITATION_VIRTUE, log);
  if (!state.meditationUnlocked && state.meditation >= MEDITATION_MAX) {
    state.meditationUnlocked = true;
    if (!state.skills.some((s) => s.id === 'stillness')) {
      state.skills.push({ id: 'stillness', level: 1, exp: 0 });
    }
    log({ key: 'log.meditation_unlock' });
  }
}
