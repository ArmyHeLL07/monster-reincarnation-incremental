import type { GameState, LogEvent } from './state';
import type { Content } from './content';

type Log = (e: LogEvent) => void;

/** Current value of a named achievement metric (resolved against live game state). */
export function achievementMetric(state: GameState, metric: string): number {
  switch (metric) {
    case 'evolutions':     return Math.max(0, (state.formHistory?.length ?? 1) - 1);
    case 'kills':          return state.kills ?? 0;
    case 'fusions':        return state.fusionCount ?? 0;
    case 'branchSwitches': return state.branchSwitchCount ?? 0;
    case 'gatekeeper':     return state.gatekeeperCleared ? 1 : 0;
    case 'hellClears':     return state.hellClears?.length ?? 0;
    case 'rebirths':       return state.rebirthCount ?? 0;
    case 'tier':           return state.tier ?? 0;
    case 'enemyTypes':     return Object.keys(state.killedEnemies ?? {}).length;
    case 'deepestLayer':   return state.deepestLayer ?? 1;
    case 'playtime':       return state.totalTicks ?? 0;
    case 'deaths':         return state.deaths ?? 0;
    default:               return 0;
  }
}

/** Unlock any newly-earned achievements, grant their reward, and pop a toast. Cheap — runs each tick. */
export function checkAchievements(state: GameState, content: Content, log: Log): void {
  if (!state.achievements) state.achievements = [];
  for (const a of content.achievements.values()) {
    if (state.achievements.includes(a.id)) continue;
    if (achievementMetric(state, a.metric) < a.threshold) continue;
    state.achievements.push(a.id);
    if (a.reward.ep)         state.ep += a.reward.ep;
    if (a.reward.statPoints) state.statPoints += a.reward.statPoints;
    if (a.reward.souls)      state.souls = (state.souls ?? 0) + a.reward.souls;
    const parts: string[] = [];
    if (a.reward.ep)         parts.push(`+${a.reward.ep} EP`);
    if (a.reward.statPoints) parts.push(`+${a.reward.statPoints} SP`);
    if (a.reward.souls)      parts.push(`+${a.reward.souls} ✦`);
    log({ key: 'log.achievement', params: { name: `${a.locKey}.name`, reward: parts.join(' ') } });
  }
}
