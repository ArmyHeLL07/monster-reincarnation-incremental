import type { StatKey } from '@mri/shared';

export interface MutationDef {
  id: string;
  locKey: string;
  statMods?: Partial<Record<StatKey, number>>;
  armor?: number;
  dmgMult?: number;
  regenMult?: number;
  hungerMult?: number;
  xpMult?: number;
  positive: boolean;
}

export const MUTATION_POOL: MutationDef[] = [
  // Positive
  { id: 'mut_venomous', locKey: 'mutation.venomous', dmgMult: 0.15, positive: true },
  { id: 'mut_thick_hide', locKey: 'mutation.thick_hide', statMods: { VIT: 3 }, armor: 5, positive: true },
  { id: 'mut_quick_reflexes', locKey: 'mutation.quick_reflexes', statMods: { AGI: 3 }, positive: true },
  { id: 'mut_sharp_mind', locKey: 'mutation.sharp_mind', statMods: { INT: 3 }, xpMult: 0.1, positive: true },
  { id: 'mut_lucky_star', locKey: 'mutation.lucky_star', statMods: { LUCK: 5 }, positive: true },
  { id: 'mut_iron_stomach', locKey: 'mutation.iron_stomach', hungerMult: 0.8, positive: true },
  // Negative
  { id: 'mut_fragile', locKey: 'mutation.fragile', statMods: { VIT: -2 }, positive: false },
  { id: 'mut_sluggish', locKey: 'mutation.sluggish', statMods: { AGI: -2 }, positive: false },
  { id: 'mut_dim', locKey: 'mutation.dim', statMods: { INT: -2 }, positive: false },
  { id: 'mut_ravenous', locKey: 'mutation.ravenous', hungerMult: 1.3, positive: false },
  { id: 'mut_glass_bones', locKey: 'mutation.glass_bones', armor: -3, positive: false },
  { id: 'mut_cursed', locKey: 'mutation.cursed', statMods: { LUCK: -3 }, positive: false },
];
