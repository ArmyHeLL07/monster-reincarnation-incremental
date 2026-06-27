import type { GameState, LogEvent } from './state';
import type { Content } from './content';
import { achievementMetric } from './achievements';

type Log = (e: LogEvent) => void;
const QUEST_SLOTS = 3;

/** A random quest template id not already active (null if the pool is exhausted). */
function rollQuestId(state: GameState, content: Content): string | null {
  const active = new Set(state.activeQuests.map((q) => q.id));
  const pool = [...content.quests.keys()].filter((id) => !active.has(id));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

/** Fill empty quest slots, then complete + reward + reroll any finished quest. Cheap — runs each tick. */
export function checkQuests(state: GameState, content: Content, log: Log): void {
  if (!state.activeQuests) state.activeQuests = [];
  while (state.activeQuests.length < QUEST_SLOTS) {
    const id = rollQuestId(state, content);
    if (!id) break;
    state.activeQuests.push({ id, base: achievementMetric(state, content.quests.get(id)!.metric) });
  }
  for (let i = 0; i < state.activeQuests.length; i++) {
    const q = state.activeQuests[i];
    const def = content.quests.get(q.id);
    if (!def) { state.activeQuests.splice(i, 1); i--; continue; } // template gone → drop
    if (achievementMetric(state, def.metric) - q.base < def.target) continue;
    if (def.reward.ep) state.ep += def.reward.ep;
    if (def.reward.statPoints) state.statPoints += def.reward.statPoints;
    state.questsDone = (state.questsDone ?? 0) + 1;
    const parts: string[] = [];
    if (def.reward.ep) parts.push(`+${def.reward.ep} EP`);
    if (def.reward.statPoints) parts.push(`+${def.reward.statPoints} SP`);
    log({ key: 'log.quest_done', params: { name: `${def.locKey}.name`, reward: parts.join(' ') } });
    const next = rollQuestId(state, content);
    if (next) state.activeQuests[i] = { id: next, base: achievementMetric(state, content.quests.get(next)!.metric) };
    else { state.activeQuests.splice(i, 1); i--; }
  }
}

/** Current progress vs target for an active quest (for the UI). */
export function questProgress(state: GameState, content: Content, q: { id: string; base: number }): { cur: number; target: number } {
  const def = content.quests.get(q.id);
  if (!def) return { cur: 0, target: 1 };
  return { cur: Math.min(def.target, Math.max(0, achievementMetric(state, def.metric) - q.base)), target: def.target };
}
