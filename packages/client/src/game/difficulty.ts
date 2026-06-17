import type { Difficulty, DifficultyDef } from '@mri/shared';
import type { Content } from './content';
import type { GameState } from './state';

const FALLBACK: DifficultyDef = {
  id: 'normal',
  locKey: 'diff.normal.name',
  startLayer: 1,
  enemyMult: 1,
  playerMult: 1,
  deathPenalty: 0.3,
};

export function diffDef(state: GameState, content: Content): DifficultyDef {
  return content.difficulties.get(state.difficulty) ?? FALLBACK;
}

/** Move the player to a difficulty's starting layer (GDD §8.5 — Hell starts at the bottom). */
export function applyDifficultyStart(state: GameState, content: Content, id: Difficulty): void {
  state.difficulty = id;
  const def = content.difficulties.get(id) ?? FALLBACK;
  const layer = content.dungeon.layers.find((l) => l.id === def.startLayer);
  state.pos = { layer: def.startLayer, floor: 1, room: 1 };
  state.enemy = null;
  // Hell drops you below your tier gate on purpose — the layer is reachable but brutal.
  if (layer && state.tier < layer.tierReq) {
    // leave tierReq as a soft wall elsewhere; difficulty intentionally overrides the start.
  }
}
