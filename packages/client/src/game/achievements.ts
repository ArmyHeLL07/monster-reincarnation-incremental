import type { GameState, LogEvent } from './state';
import type { Content } from './content';

type Log = (e: LogEvent) => void;

/** Current value of a named achievement metric. `param` carries metric arguments (e.g. a raceId). */
export function achievementMetric(state: GameState, metric: string, param?: string): number {
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
    // Per-race (param = raceId) — 1 when that race has hit the milestone, else 0.
    case 'racePlayed':     return (state.racesPlayed ?? []).includes(param ?? '') ? 1 : 0;
    case 'raceGatekeeper': return (state.gatekeepersByRace ?? []).includes(param ?? '') ? 1 : 0;
    case 'raceTreeDone':   return (state.treesCompleted ?? []).includes(param ?? '') ? 1 : 0;
    default:               return 0;
  }
}

/** Keep the lifetime per-race trackers current (centralised so no event hooks are needed). */
function updateRaceTrackers(state: GameState, content: Content): void {
  state.racesPlayed ??= [];
  state.gatekeepersByRace ??= [];
  state.treesCompleted ??= [];
  const race = state.raceId;
  if (race && !state.racesPlayed.includes(race)) state.racesPlayed.push(race);
  if (race && state.gatekeeperCleared && !state.gatekeepersByRace.includes(race)) state.gatekeepersByRace.push(race);
  // Tree "completed" = reached a terminal form (no further evolutions) of this race.
  const cur = content.forms.get(state.formId);
  if (race && cur && cur.evolvesTo.length === 0 && (state.formHistory?.length ?? 0) > 1 && !state.treesCompleted.includes(race)) {
    state.treesCompleted.push(race);
  }
}

/** Unlock any newly-earned achievements, grant their reward, and pop a toast. Cheap — runs each tick. */
export function checkAchievements(state: GameState, content: Content, log: Log): void {
  if (!state.achievements) state.achievements = [];
  updateRaceTrackers(state, content);
  for (const a of content.achievements.values()) {
    if (state.achievements.includes(a.id)) continue;
    if (achievementMetric(state, a.metric, a.param) < a.threshold) continue;
    state.achievements.push(a.id);
    if (a.reward.ep)         state.ep += a.reward.ep;
    if (a.reward.statPoints) state.statPoints += a.reward.statPoints;
    if (a.reward.souls)      state.souls = (state.souls ?? 0) + a.reward.souls;
    const parts: string[] = [];
    if (a.reward.ep)         parts.push(`+${a.reward.ep} EP`);
    if (a.reward.statPoints) parts.push(`+${a.reward.statPoints} SP`);
    if (a.reward.souls)      parts.push(`+${a.reward.souls} ✦`);
    const params: Record<string, string> = { name: `${a.locKey}.name`, reward: parts.join(' ') };
    if (a.param) params.race = `race.${a.param}.name`; // tmsg resolves this; t() then fills {race} in the name
    log({ key: 'log.achievement', params });
  }
}
