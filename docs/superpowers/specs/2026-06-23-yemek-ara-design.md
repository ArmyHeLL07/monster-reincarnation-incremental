# Yemek Ara — Design Spec

**Goal:** Add a "Yemek Ara" (Forage Food) button that lets the player manually search for food every 5 seconds, solving the AFK starvation lockup where hunger at 100% freezes combat.

**Architecture:** New `forage.ts` game module + `forageable_foods.json` data file + two state fields + a found-food panel in the UI. Follows existing patterns: data-driven food definitions, appraisal-tier reveal, DoT via existing status-effect system.

**Tech Stack:** TypeScript/Vite web client; same patterns as `discovery.ts` (search), `combat.ts` (hunger/eat), `eyes.ts` (appraisalTier).

## Global Constraints

- No permanent changes without Atıl approval (KURAL 0 — already approved via this spec).
- All player-visible text in i18n keys only — no hardcoded Turkish/English strings in code.
- Data-driven: food definitions in `data/forageable_foods.json`, not in code.
- Do NOT touch `evolutions.json`, `races.json`, `evolution.ts`.
- Multilanguage: `data/i18n/tr.json` and `data/i18n/en.json` must both be updated.
- Follow existing cooldown pattern (ms-based, decremented in clock tick).
- Follow existing appraisal-tier pattern from `eyes.ts` → `appraisalTier(state)`.
- Follow existing DoT pattern from `combat.ts` statusEffects for toxic danger.

---

## Data Layer

### `data/forageable_foods.json`

Array of `ForageableFood` objects. Pool for a forage attempt = neutral entries + entries matching the current layer's `element`. `very_rare` entries require `minDepth >= 2`.

```typescript
interface ForageableFood {
  id: string;           // unique key
  locKey: string;       // i18n key for name
  element: string;      // 'neutral' | layer element (poison/fire/physical/acid/frost/lightning/pierce/magic/soul)
  satiety: number;      // hunger reduction on eat
  dangerLevel: 'safe' | 'risky' | 'toxic' | 'lethal';
  dangerEffect?: {      // only for risky/toxic/lethal
    type: string;       // 'damage' | 'poison' (maps to existing StatusEffect types)
    dmg?: number;       // flat damage (risky/lethal)
    duration?: number;  // DoT tick count (toxic)
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
  minDepth?: number;    // default 1; very_rare entries set to 2
}
```

**24 food entries (8 elements + neutral):**

| id | element | rarity | satiety | dangerLevel |
|----|---------|--------|---------|-------------|
| cave_moss | neutral | common | 4 | safe |
| rock_grub | neutral | common | 6 | safe |
| toxic_beetle | poison | common | 7 | risky |
| poison_shroom | poison | uncommon | 12 | toxic |
| death_cap | poison | very_rare | 18 | lethal |
| ember_berry | fire | common | 8 | safe |
| scorched_vine | fire | uncommon | 10 | risky |
| magma_truffle | fire | rare | 20 | toxic |
| stone_lichen | physical | common | 5 | safe |
| iron_worm | physical | uncommon | 9 | safe |
| crystal_spore | physical | rare | 15 | risky |
| acid_moss | acid | common | 6 | risky |
| caustic_fungi | acid | uncommon | 14 | toxic |
| frost_berry | frost | common | 7 | safe |
| ice_worm | frost | uncommon | 10 | risky |
| shock_shroom | lightning | common | 5 | risky |
| static_lichen | lightning | uncommon | 8 | safe |
| thorn_berry | pierce | common | 7 | risky |
| razor_weed | pierce | uncommon | 9 | safe |
| arcane_spore | magic | uncommon | 10 | safe |
| mana_crystal | magic | rare | 18 | risky |
| pale_spore | soul | uncommon | 12 | risky |
| spirit_fruit | soul | rare | 20 | safe |
| corruption_flesh | soul | very_rare | 30 | lethal |

**Rarity weights (base):** common=60, uncommon=25, rare=12, very_rare=3.
**LUCK scaling:** each +1 LUCK adds +0.3 to rare weight and +0.1 to very_rare weight.

---

## State

### New fields in `GameState` (`packages/shared/src/types.ts` or `state.ts`)

```typescript
forageCD: number;                        // ms remaining until forage is available (0 = ready)
pendingForage: { foodId: string } | null; // found food waiting for player decision
```

**Defaults in `newGame()`:** `forageCD: 0, pendingForage: null`

**Migration in `migrate()`:** `state.forageCD ??= 0; state.pendingForage ??= null;`

**Reset in `applyRace()`:** both set to 0 / null on race change and rebirth.

---

## Game Logic — `packages/client/src/game/forage.ts`

New file. Exports: `forage`, `eatFoundFood`, `discardFoundFood`.

### `forage(state, content, log)`

1. If `state.forageCD > 0` → return (still on cooldown).
2. Set `state.forageCD = 5000`.
3. Find current layer: `content.dungeon.layers.find(l => l.id === state.pos.layer)`.
4. Build pool: `forageableFoods` where `element === 'neutral' || element === layer.element`, and if `rarity === 'very_rare'` then `state.pos.layer >= 2`.
5. If pool empty → `log({ key: 'log.forage_nothing' })` → return.
6. Pick one entry via weighted random (rarity weights + LUCK scaling).
7. `state.pendingForage = { foodId: food.id }`.
8. `log({ key: 'log.forage_found' })` — generic "found something" message; details in UI panel.

### `eatFoundFood(state, content, log)`

1. Look up `content.forageableFoods.get(state.pendingForage.foodId)`.
2. `state.pendingForage = null`.
3. `state.hunger = Math.max(0, state.hunger - food.satiety)`.
4. Apply danger:
   - `safe`: nothing.
   - `risky`: 40% chance → `state.hp -= Math.round(state.maxHp * 0.08)` (min 1).
   - `toxic`: push a poison StatusEffect (3–5 ticks, using `food.dangerEffect.dmg`).
   - `lethal`: `state.hp -= Math.round(state.maxHp * 0.7)` (min 1) → triggers `onDeath` if hp ≤ 0.
5. `log({ key: 'log.forage_eaten', params: { sat: food.satiety } })`.

### `discardFoundFood(state, log)`

1. `state.pendingForage = null`.
2. `log({ key: 'log.forage_discarded' })`.

---

## Cooldown Tick

In `packages/client/src/game/clock.ts` (wherever per-skill cooldowns are decremented):

```typescript
if (state.forageCD > 0) state.forageCD = Math.max(0, state.forageCD - elapsed);
```

---

## Content Loading

In `packages/client/src/game/content.ts`:
- Fetch `forageable_foods.json`.
- Store as `Map<string, ForageableFood>` on the `Content` object (key = food.id).

---

## UI — `packages/client/src/ui.ts`

### "Yemek Ara" button

Placed in the combat tab, near the existing search button.

- Ready: `<button id="forage-btn">🍃 Yemek Ara</button>`
- On cooldown: `<button id="forage-btn" disabled>🍃 {N.N}sn</button>` — shows countdown in seconds.
- Hidden when `pendingForage !== null` (already found something; decide first).

### "Bulunan Yiyecek" panel

Appears when `pendingForage !== null`. Shows Appraisal-tier-filtered info:

```
┌─ Bulunan Yiyecek ──────────────┐
│  🍄 [name or ???]               │
│  Besin: X    Tehlike: 🔴        │  ← only if tier ≥ 3 / tier ≥ 5
│  [Ye]              [Bırak]      │
└─────────────────────────────────┘
```

**Appraisal reveal tiers** (uses existing `appraisalTier(state)`):

| tier | Shown |
|------|-------|
| 0 | `❓ ???` — no name, no properties |
| 1–2 | name only |
| 3–4 | name + satiety value |
| 5+ | name + satiety + danger icon (🟢 safe / 🟡 risky / 🔴 toxic / 💀 lethal) |

### Event wiring in `wireUi()` / `mount()`

```typescript
document.getElementById('forage-btn')?.addEventListener('click', ACTIONS.onForage);
document.getElementById('forage-eat')?.addEventListener('click', ACTIONS.onForageEat);
document.getElementById('forage-discard')?.addEventListener('click', ACTIONS.onForageDiscard);
```

### Actions in `main.ts`

```typescript
onForage: () => { forage(state, content, logFn); save(state); render(state); },
onForageEat: () => { eatFoundFood(state, content, logFn); save(state); render(state); },
onForageDiscard: () => { discardFoundFood(state, logFn); save(state); render(state); },
```

---

## i18n Keys

Both `data/i18n/tr.json` and `data/i18n/en.json`:

```json
"ui.forage_btn": "Yemek Ara",
"ui.forage_panel_title": "Bulunan Yiyecek",
"ui.forage_unknown": "???",
"ui.forage_eat": "Ye",
"ui.forage_discard": "Bırak",
"ui.forage_satiety": "Besin: {sat}",
"log.forage_found": "Bir şey buldun. İncelemek ister misin?",
"log.forage_nothing": "Bu bölgede yenecek bir şey bulamadın.",
"log.forage_eaten": "Yiyeceği yedin. (+{sat} tokluk)",
"log.forage_discarded": "Yiyeceği bıraktın.",
"log.forage_risky_hit": "Yemek sana zarar verdi!",
"log.forage_poison": "Yemek seni zehirledi!",
"log.forage_lethal": "Bu yemek ölümcüldü!",

// Food names (24 entries, TR + EN both)
"food.cave_moss": "Mağara Yosunu",
"food.rock_grub": "Taş Larva",
"food.toxic_beetle": "Zehirli Böcek",
"food.poison_shroom": "Zehir Mantarı",
"food.death_cap": "Ölüm Başlığı",
"food.ember_berry": "Kor Böğürtleni",
"food.scorched_vine": "Yanık Asma",
"food.magma_truffle": "Magma Mantarı",
"food.stone_lichen": "Taş Likeni",
"food.iron_worm": "Demir Kurdu",
"food.crystal_spore": "Kristal Sporu",
"food.acid_moss": "Asit Yosunu",
"food.caustic_fungi": "Aşındırıcı Mantar",
"food.frost_berry": "Buz Böğürtleni",
"food.ice_worm": "Buz Solucanı",
"food.shock_shroom": "Şok Mantarı",
"food.static_lichen": "Statik Liken",
"food.thorn_berry": "Diken Meyvesi",
"food.razor_weed": "Jilet Otu",
"food.arcane_spore": "Mistik Spor",
"food.mana_crystal": "Mana Kristali",
"food.pale_spore": "Soluk Spor",
"food.spirit_fruit": "Ruh Meyvesi",
"food.corruption_flesh": "Yozlaşmış Et"
```

---

## Files Changed

| Durum | Dosya |
|-------|-------|
| Yeni | `data/forageable_foods.json` |
| Yeni | `packages/client/src/game/forage.ts` |
| Değişti | `packages/shared/src/types.ts` (ForageableFood arayüzü) |
| Değişti | `packages/client/src/game/state.ts` (2 yeni alan + defaults + migration + race reset) |
| Değişti | `packages/client/src/game/content.ts` (forageable_foods yükleme) |
| Değişti | `packages/client/src/game/clock.ts` (forageCD tick) |
| Değişti | `packages/client/src/ui.ts` (buton + panel + render) |
| Değişti | `packages/client/src/main.ts` (3 yeni action handler) |
| Değişti | `packages/client/index.html` (CSS) |
| Değişti | `data/i18n/tr.json` + `data/i18n/en.json` |
