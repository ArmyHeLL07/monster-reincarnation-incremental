import type { GameState } from './state';

export interface RoomHazard {
  id: string;
  locKey: string;
  icon: string;
  hpDrainPct?: number; // percent of max HP lost per tick (like room modifier)
  spDrain?: number; // flat SP lost per tick
  appraisalPenalty?: number; // reduce appraisal tier
  dmgPenalty?: number; // damage multiplier reduction
  dodgePenalty?: number; // dodge penalty
  hungerMult?: number; // hunger drain multiplier
}

export const HAZARDS: RoomHazard[] = [
  { id: 'toxic_mist', locKey: 'hazard.toxic_mist', icon: '🌫️', hpDrainPct: 0.02, hungerMult: 1.5 },
  { id: 'darkness', locKey: 'hazard.darkness', icon: '🌑', appraisalPenalty: 2, dodgePenalty: 0.1 },
  { id: 'thin_air', locKey: 'hazard.thin_air', icon: '💨', spDrain: 2 },
  { id: 'scorching', locKey: 'hazard.scorching', icon: '🔥', hpDrainPct: 0.03, dmgPenalty: 0.1 },
  { id: 'quagmire', locKey: 'hazard.quagmire', icon: '🫧', dodgePenalty: 0.15, hungerMult: 1.3 },
  { id: 'cursed_ground', locKey: 'hazard.cursed_ground', icon: '💀', dmgPenalty: 0.15 },
];

function roomHash(a: number, b: number, c: number): number {
  let n = (Math.imul(a * 31 + 7, 2654435761) ^ Math.imul(b + 101, 40503) ^ Math.imul(c + 17, 2246822519)) >>> 0;
  n = (n ^ (n >>> 15)) >>> 0;
  return (n % 100000) / 100000;
}

export function currentRoomHazard(state: GameState): RoomHazard | null {
  const { layer, floor, room } = state.pos;
  if (room <= 1) return null; // entry room is safe
  // Hash for hazard presence
  const presenceRoll = roomHash(layer + 1500, floor, room);
  const chance = Math.min(0.25, 0.05 + layer * 0.02);
  if (presenceRoll >= chance) return null;
  // Deterministically select hazard from pool
  const selectRoll = roomHash(layer + 2500, floor, room);
  const idx = Math.floor(selectRoll * HAZARDS.length);
  return HAZARDS[idx] ?? null;
}
