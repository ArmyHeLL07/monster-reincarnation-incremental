// Procedural loot generator (humanoid races only). Self-contained: base tables, affix pools and
// rarity formulas live here, and every generated LootItem is a fully-formed instance — no external
// items.json / content table needed. Equip/unequip/discard helpers operate on GameState.
import type { LootItem, LootType, LootRarity, EquipSlot, StatKey } from '@mri/shared';
import type { GameState } from './state';
import { t } from '../i18n';

/** Composed display name: "[prefix] base [suffix]" — fully localised. */
export function lootDisplayName(it: LootItem): string {
  const parts = [it.prefixKey && t(it.prefixKey), t(it.baseKey), it.suffixKey && t(it.suffixKey)];
  return parts.filter(Boolean).join(' ');
}

export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'offhand', 'head', 'body', 'hands', 'legs', 'feet', 'acc1', 'acc2'];

const RARITIES: LootRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
/** Stat-budget multiplier and number of rolled affixes per rarity. */
const RARITY_MULT: Record<LootRarity, number> = { common: 1, uncommon: 1.25, rare: 1.6, epic: 2.1, legendary: 2.8 };
const RARITY_AFFIXES: Record<LootRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const RARITY_VALUE: Record<LootRarity, number> = { common: 1, uncommon: 2.5, rare: 6, epic: 14, legendary: 40 };

/** Base item templates — type drives slot + which primary stat the base carries. */
interface BaseDef { type: LootType; baseKey: string; icon: string; }
const BASES: BaseDef[] = [
  { type: 'weapon', baseKey: 'loot.base.sword', icon: '🗡️' },
  { type: 'weapon', baseKey: 'loot.base.axe', icon: '🪓' },
  { type: 'weapon', baseKey: 'loot.base.mace', icon: '🔨' },
  { type: 'weapon', baseKey: 'loot.base.dagger', icon: '🔪' },
  { type: 'weapon', baseKey: 'loot.base.staff', icon: '🪄' },
  { type: 'weapon', baseKey: 'loot.base.bow', icon: '🏹' },
  { type: 'offhand', baseKey: 'loot.base.shield', icon: '🛡️' },
  { type: 'offhand', baseKey: 'loot.base.orb', icon: '🔮' },
  { type: 'head', baseKey: 'loot.base.helm', icon: '⛑️' },
  { type: 'body', baseKey: 'loot.base.armor', icon: '🥋' },
  { type: 'hands', baseKey: 'loot.base.gloves', icon: '🧤' },
  { type: 'legs', baseKey: 'loot.base.greaves', icon: '👖' },
  { type: 'feet', baseKey: 'loot.base.boots', icon: '🥾' },
  { type: 'accessory', baseKey: 'loot.base.ring', icon: '💍' },
  { type: 'accessory', baseKey: 'loot.base.amulet', icon: '📿' },
];

/** Prefix affixes — combat-flavoured numeric bonuses; the first one names the item. */
type NumField = 'weaponPower' | 'armor' | 'dmgMult' | 'dodgeBonus' | 'mpRegen' | 'regenMult';
const PREFIXES: { key: string; field: NumField; per: number }[] = [
  { key: 'loot.prefix.sharp', field: 'weaponPower', per: 0.45 },
  { key: 'loot.prefix.heavy', field: 'weaponPower', per: 0.55 },
  { key: 'loot.prefix.sturdy', field: 'armor', per: 0.5 },
  { key: 'loot.prefix.guardian', field: 'armor', per: 0.65 },
  { key: 'loot.prefix.deadly', field: 'dmgMult', per: 0.03 },
  { key: 'loot.prefix.swift', field: 'dodgeBonus', per: 0.02 },
  { key: 'loot.prefix.arcane', field: 'mpRegen', per: 0.5 },
  { key: 'loot.prefix.vital', field: 'regenMult', per: 0.1 },
];
/** Suffix affixes — "of X" flat stat bonuses; the first one names the item. */
const SUFFIXES: { key: string; stat: StatKey }[] = [
  { key: 'loot.suffix.might', stat: 'STR' },
  { key: 'loot.suffix.bear', stat: 'VIT' },
  { key: 'loot.suffix.fox', stat: 'AGI' },
  { key: 'loot.suffix.owl', stat: 'INT' },
  { key: 'loot.suffix.sage', stat: 'WIS' },
  { key: 'loot.suffix.fortune', stat: 'LUCK' },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Base primary value for a type at a given item level (before rarity multiplier). */
function basePrimary(type: LootType, ilvl: number): { armor?: number; weaponPower?: number; dmgMult?: number; mpRegen?: number } {
  switch (type) {
    case 'weapon': return { weaponPower: 2 + ilvl * 0.8 };
    case 'body': return { armor: 2 + ilvl * 0.5 };
    case 'offhand':
    case 'legs': return { armor: 1 + ilvl * 0.4 };
    case 'head':
    case 'hands':
    case 'feet': return { armor: 1 + ilvl * 0.3 };
    case 'accessory': return { dmgMult: 0.02 + ilvl * 0.004, mpRegen: 0.5 };
  }
}

/** Roll a rarity, biased upward by item level and LUCK. */
function rollRarity(ilvl: number, luck: number): LootRarity {
  const lift = ilvl * 0.4 + luck * 0.6; // higher depth / luck → rarer
  const w: Record<LootRarity, number> = {
    common: 60,
    uncommon: 25 + lift * 0.5,
    rare: 10 + lift * 0.4,
    epic: 4 + lift * 0.2,
    legendary: 1 + lift * 0.06,
  };
  const total = RARITIES.reduce((s, r) => s + w[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) {
    roll -= w[r];
    if (roll <= 0) return r;
  }
  return 'common';
}

function addField(it: LootItem, field: NumField, amount: number): void {
  it[field] = Math.round(((it[field] ?? 0) + amount) * 1000) / 1000;
}

/** Generate one fully-formed loot instance for the given item level and LUCK. */
export function generateLoot(ilvl: number, luck: number, forceRarity?: LootRarity): LootItem {
  const lvl = Math.max(1, Math.round(ilvl));
  const rarity = forceRarity ?? rollRarity(lvl, luck);
  const mult = RARITY_MULT[rarity];
  const base = pick(BASES);
  const it: LootItem = {
    uid: uid(),
    type: base.type,
    rarity,
    icon: base.icon,
    ilvl: lvl,
    baseKey: base.baseKey,
    statBonus: {},
    value: 0,
  };
  // base primary (scaled by rarity)
  const prim = basePrimary(base.type, lvl);
  if (prim.weaponPower) it.weaponPower = Math.max(1, Math.round(prim.weaponPower * mult));
  if (prim.armor) it.armor = Math.max(1, Math.round(prim.armor * mult));
  if (prim.dmgMult) it.dmgMult = Math.round(prim.dmgMult * mult * 1000) / 1000;
  if (prim.mpRegen && base.type === 'accessory') it.mpRegen = prim.mpRegen;

  // rolled affixes — alternate suffix/prefix; first of each names the item
  const affixes = RARITY_AFFIXES[rarity];
  const statMag = Math.max(1, Math.round((1 + lvl * 0.25) * mult));
  for (let i = 0; i < affixes; i++) {
    if (i % 2 === 0) {
      const s = pick(SUFFIXES);
      it.statBonus[s.stat] = (it.statBonus[s.stat] ?? 0) + statMag;
      if (!it.suffixKey) it.suffixKey = s.key;
    } else {
      const p = pick(PREFIXES);
      const mag = p.field === 'dmgMult' || p.field === 'dodgeBonus' || p.field === 'regenMult'
        ? p.per * mult
        : Math.max(1, Math.round((1 + lvl * 0.4) * p.per * mult));
      addField(it, p.field, mag);
      if (!it.prefixKey) it.prefixKey = p.key;
    }
  }
  it.value = Math.max(1, Math.round((lvl + 5) * RARITY_VALUE[rarity]));
  return it;
}

// ---- equip / unequip / discard --------------------------------------------

/** Which equip slot a generated type goes into (accessory fills the first free acc slot). */
export function slotForItem(it: LootItem, equipment: GameState['equipment']): EquipSlot {
  if (it.type !== 'accessory') return it.type;
  if (!equipment.acc1) return 'acc1';
  if (!equipment.acc2) return 'acc2';
  return 'acc1'; // both full → replace acc1
}

/** Move an inventory item into its slot; any displaced item returns to the bag. True on success. */
export function equipItem(state: GameState, itemUid: string): boolean {
  const idx = state.inventoryItems.findIndex((i) => i.uid === itemUid);
  if (idx < 0) return false;
  const it = state.inventoryItems[idx];
  const slot = slotForItem(it, state.equipment);
  state.inventoryItems.splice(idx, 1);
  const prev = state.equipment[slot];
  if (prev) state.inventoryItems.push(prev);
  state.equipment[slot] = it;
  return true;
}

/** Unequip the item in a slot back to the bag. True on success. */
export function unequipItem(state: GameState, slot: EquipSlot): boolean {
  const it = state.equipment[slot];
  if (!it) return false;
  state.equipment[slot] = null;
  state.inventoryItems.push(it);
  return true;
}

/** Permanently remove a bag item (returns its EP value). */
export function discardItem(state: GameState, itemUid: string): number {
  const idx = state.inventoryItems.findIndex((i) => i.uid === itemUid);
  if (idx < 0) return 0;
  const [it] = state.inventoryItems.splice(idx, 1);
  return it.value;
}
