import type { StatKey } from '@mri/shared';
import type { GameState } from './state';
import { recomputeMaxes } from './state';

export interface RebirthPerk {
  id: string;
  locKey: string;
  locKeyDesc: string;
  icon: string;
  xpMult?: number;
  dmgMult?: number;
  regenMult?: number;
  armor?: number;
  dodgeBonus?: number;
  hungerMult?: number;
  mpRegen?: number;
  lootMult?: number;
  statBonus?: Partial<Record<StatKey, number>>;
}

export const REBIRTH_PERKS: RebirthPerk[] = [
  { id: 'ancient_wisdom', locKey: 'perk.ancient_wisdom.name', locKeyDesc: 'perk.ancient_wisdom.desc', icon: '🧠', xpMult: 0.05 },
  { id: 'iron_will', locKey: 'perk.iron_will.name', locKeyDesc: 'perk.iron_will.desc', icon: '🛡️', armor: 2 },
  { id: 'swift_soul', locKey: 'perk.swift_soul.name', locKeyDesc: 'perk.swift_soul.desc', icon: '⚡', dodgeBonus: 0.02 },
  { id: 'predators_instinct', locKey: 'perk.predators_instinct.name', locKeyDesc: 'perk.predators_instinct.desc', icon: '🐾', dmgMult: 0.03 },
  { id: 'healing_light', locKey: 'perk.healing_light.name', locKeyDesc: 'perk.healing_light.desc', icon: '💚', regenMult: 0.1 },
  { id: 'bottomless_stomach', locKey: 'perk.bottomless_stomach.name', locKeyDesc: 'perk.bottomless_stomach.desc', icon: '🍖', hungerMult: 0.95 },
  { id: 'scholars_eye', locKey: 'perk.scholars_eye.name', locKeyDesc: 'perk.scholars_eye.desc', icon: '👁️', lootMult: 0.05 },
  { id: 'vital_force', locKey: 'perk.vital_force.name', locKeyDesc: 'perk.vital_force.desc', icon: '❤️' }, // Flat +5 Max HP handled in recomputeMaxes
  { id: 'mana_flow', locKey: 'perk.mana_flow.name', locKeyDesc: 'perk.mana_flow.desc', icon: '💧', mpRegen: 0.5 },
  { id: 'lucky_charm', locKey: 'perk.lucky_charm.name', locKeyDesc: 'perk.lucky_charm.desc', icon: '🍀', statBonus: { LUCK: 1 } },
  { id: 'brute_strength', locKey: 'perk.brute_strength.name', locKeyDesc: 'perk.brute_strength.desc', icon: '💪', statBonus: { STR: 1 } },
  { id: 'inner_peace', locKey: 'perk.inner_peace.name', locKeyDesc: 'perk.inner_peace.desc', icon: '🧘', statBonus: { WIS: 1 } },
  { id: 'quick_feet', locKey: 'perk.quick_feet.name', locKeyDesc: 'perk.quick_feet.desc', icon: '👟', statBonus: { AGI: 1 } },
  { id: 'sharp_mind', locKey: 'perk.sharp_mind.name', locKeyDesc: 'perk.sharp_mind.desc', icon: '🔮', statBonus: { INT: 1 } },
  { id: 'queens_blessing', locKey: 'perk.queens_blessing.name', locKeyDesc: 'perk.queens_blessing.desc', icon: '🕷️' }, // +1 Max Minions handled in spawnMinion
];

export function rollRebirthPerks(_state: GameState): string[] {
  const choices: string[] = [];
  const pool = [...REBIRTH_PERKS];
  
  // Pick 3 unique random perks for this selection
  for (let i = 0; i < 3; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    const perk = pool.splice(idx, 1)[0];
    if (perk) {
      choices.push(perk.id);
    }
  }
  return choices;
}

export function chooseRebirthPerk(state: GameState, perkId: string): void {
  state.rebirthPerks = state.rebirthPerks ?? [];
  state.rebirthPerks.push(perkId);
  state.pendingRebirthPerk = false;
  state.rebirthPerkChoices = [];
  
  recomputeMaxes(state);
  // Full heal on selecting rebirth teaching
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
}
