# Resistance Nullification Sistemi — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 14 resistance zinciri (T1→T5), 3 grup nullification merger'ı, Ultimate Nullification (Lv10=%100 bağışıklık), ve 7 wiki pasif skill zincirini uygulamak.

**Architecture:** Üç katmanlı sistem: (1) resistance chain skill'leri damage XP'den beslenir ve T5'te merger bekler; (2) grup merger'ları tüm T5'ler tamamlanınca chain'leri silerek Nullification spawnar; (3) Ultimate Nullification tüm grup null'lar Lv10 + soul T5 ile açılır ve Lv10'da %100 hasar bağışıklığı verir (nullifier enemy istisnası dışında).

**Tech Stack:** TypeScript, Vite, data/skills.json, data/resistances.json, packages/shared/src/types.ts, packages/client/src/game/combat.ts, packages/client/src/game/effects.ts

## Global Constraints

- Tüm oyuncu-görünen metinler i18n key — koda Türkçe/İngilizce metin gömülmez.
- Data-driven: tüm skill tanımları JSON'da, koda gömülü değer yok.
- `evolvesTo` dizisi camelCase (JSON'da da `evolvesTo`).
- Resistance chain skill'leri `kind: 'resistance'` kullanır.
- `ensureResistSlot` zaten auto-create yapar — ayrıca migration gerekmez.
- `resistReduction` formülü değişmez; chain bonus additive olarak üstüne bindirilir.
- CLAUDE.md Kural 0: her commit Atıl onayı almış plana uygun olmalı.

---

### Task 1: Type Foundation

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/client/src/game/effects.ts`
- Create: `data/resistance_mergers.json` (schema doğrulaması için type gerekli)

**Interfaces:**
- Produces: `DamageType` genişler; `Skill.resistType`, `Skill.chainGroup`, `Skill.tierStatBonus`; `EnemyBehavior.nullifier`; `ResistanceMerger` tipi; `Bonuses.physNullReduction`, `Bonuses.magicNullReduction`, `Bonuses.statusNullReduction`, `Bonuses.ultimateNullLv`

- [ ] **Step 1: types.ts — DamageType'a yeni değerler ekle**

`packages/shared/src/types.ts` içindeki mevcut `DamageType` union'ına ekle:

```typescript
export type DamageType =
  | 'physical'
  | 'pierce'
  | 'fire'
  | 'poison'
  | 'acid'
  | 'lightning'
  | 'frost'
  | 'magic'
  | 'fear'
  | 'soul'
  | 'petrify'
  | 'stun'
  | 'wind'    // yeni
  | 'earth'   // yeni
  | 'dark'    // yeni
  | 'light';  // yeni
```

- [ ] **Step 2: types.ts — Skill interface'ine resistance chain alanları ekle**

Mevcut `Skill` interface'inin sonuna (closing `}` öncesi) ekle:

```typescript
  // --- Resistance chain fields (kind: 'resistance') ---
  /** Which resistance stat this chain skill boosts (e.g. 'fire_res'). */
  resistType?: string;
  /** Nullification merger group this chain belongs to. */
  chainGroup?: 'physical' | 'magic' | 'status' | 'soul';
  /** Max flat % bonus this tier adds to resistance reduction at full level (e.g. 5 = +5%). */
  tierStatBonus?: number;
```

- [ ] **Step 3: types.ts — EnemyBehavior'a nullifier ekle**

`EnemyBehavior` interface'ine ekle:

```typescript
  /** If true, bypasses Ultimate Nullification Lv10 full immunity — capped at 60% instead. */
  nullifier?: boolean;
```

- [ ] **Step 4: types.ts — ResistanceMerger interface'i ekle**

`Resistance` interface'inden sonra yeni ekle:

```typescript
/** Data-driven merger definition — when all required skill IDs appear in state.skills,
 *  the merger fires: components are deleted and the merger skill is added at Lv1. */
export interface ResistanceMerger {
  id: string;
  locKey: string;
  group: 'physical' | 'magic' | 'status' | 'ultimate';
  lvMax: number;
  /** Each entry: { skillId: T5 chain or group null id, minLevel?: required level (default any) } */
  requires: Array<{ skillId: string; minLevel?: number }>;
}
```

- [ ] **Step 5: effects.ts — Bonuses interface'ine nullification alanları ekle**

`packages/client/src/game/effects.ts` içindeki `Bonuses` interface'ine ekle:

```typescript
  /** Physical Nullification reduction fraction (0–0.85). */
  physNullReduction: number;
  /** Magic/Elemental Nullification reduction fraction (0–0.85). */
  magicNullReduction: number;
  /** Status Nullification reduction fraction (0–0.85). */
  statusNullReduction: number;
  /** Ultimate Nullification current level (0–10; 10 = full immunity). */
  ultimateNullLv: number;
```

- [ ] **Step 6: effects.ts — aggregateBonuses'a default değerler ekle**

`aggregateBonuses` içindeki `const b: Bonuses = {` bloğuna ekle:

```typescript
    physNullReduction: 0,
    magicNullReduction: 0,
    statusNullReduction: 0,
    ultimateNullLv: 0,
```

- [ ] **Step 7: effects.ts — aggregateBonuses'ta nullification skill'lerini işle**

`aggregateBonuses` for döngüsü içinde (diğer `if (def.xxx)` satırlarından sonra) ekle:

```typescript
    if (def.kind === 'resistance') {
      // Group nullification skills have no resistType — they contribute to merger reductions.
      if (s.id === 'physical_nullification') {
        b.physNullReduction = Math.min(0.85, (s.level / 10) * 0.85);
      } else if (s.id === 'magic_nullification') {
        b.magicNullReduction = Math.min(0.85, (s.level / 10) * 0.85);
      } else if (s.id === 'status_nullification') {
        b.statusNullReduction = Math.min(0.85, (s.level / 10) * 0.85);
      } else if (s.id === 'ultimate_nullification') {
        b.ultimateNullLv = s.level;
      }
    }
```

- [ ] **Step 8: Commit**

```bash
git add packages/shared/src/types.ts packages/client/src/game/effects.ts
git commit -m "feat(types): resistance chain + nullification fields (Task 1)"
```

---

### Task 2: Resistance Data + Content Loader

**Files:**
- Modify: `data/resistances.json`
- Create: `data/resistance_mergers.json`
- Modify: `packages/client/src/game/content.ts`

**Interfaces:**
- Consumes: `ResistanceMerger` (Task 1)
- Produces: `Content.resistanceMergers: Map<string, ResistanceMerger>`; wind/earth/dark/light resistance stat entries

- [ ] **Step 1: resistances.json — 4 yeni stat ekle**

Mevcut 12 entry'den sonra (array kapanmadan önce) ekle:

```json
  ,{
    "id": "wind_res",
    "locKey": "res.wind_res.name",
    "damageType": "wind",
    "lvMax": 10,
    "nullityKey": "res.wind_immunity.name"
  },
  {
    "id": "earth_res",
    "locKey": "res.earth_res.name",
    "damageType": "earth",
    "lvMax": 10,
    "nullityKey": "res.earth_immunity.name"
  },
  {
    "id": "dark_res",
    "locKey": "res.dark_res.name",
    "damageType": "dark",
    "lvMax": 10,
    "nullityKey": "res.dark_immunity.name"
  },
  {
    "id": "light_res",
    "locKey": "res.light_res.name",
    "damageType": "light",
    "lvMax": 10,
    "nullityKey": "res.light_immunity.name"
  }
```

- [ ] **Step 2: resistance_mergers.json dosyasını oluştur**

`data/resistance_mergers.json`:

```json
[
  {
    "id": "physical_nullification",
    "locKey": "skill.physical_null.name",
    "group": "physical",
    "lvMax": 10,
    "requires": [
      { "skillId": "devastation_resistance" },
      { "skillId": "annihilation_resistance" }
    ]
  },
  {
    "id": "magic_nullification",
    "locKey": "skill.magic_null.name",
    "group": "magic",
    "lvMax": 10,
    "requires": [
      { "skillId": "volcanic_resistance" },
      { "skillId": "blizzard_resistance" },
      { "skillId": "tempest_resistance" },
      { "skillId": "tornado_resistance" },
      { "skillId": "tectonic_resistance" },
      { "skillId": "abyss_resistance" },
      { "skillId": "sacred_resistance" },
      { "skillId": "melting_resistance" }
    ]
  },
  {
    "id": "status_nullification",
    "locKey": "skill.status_null.name",
    "group": "status",
    "lvMax": 10,
    "requires": [
      { "skillId": "death_venom_resistance" },
      { "skillId": "immobilize_resistance" },
      { "skillId": "abyss_fear_resistance" }
    ]
  },
  {
    "id": "ultimate_nullification",
    "locKey": "skill.ultimate_null.name",
    "group": "ultimate",
    "lvMax": 10,
    "requires": [
      { "skillId": "physical_nullification", "minLevel": 10 },
      { "skillId": "magic_nullification", "minLevel": 10 },
      { "skillId": "status_nullification", "minLevel": 10 },
      { "skillId": "transcendent_resistance" }
    ]
  }
]
```

- [ ] **Step 3: content.ts — ResistanceMerger import ve Content type'a alan ekle**

`packages/client/src/game/content.ts` içinde `Content` interface'ine ekle:

```typescript
  resistanceMergers: Map<string, ResistanceMerger>;
```

Import satırına `ResistanceMerger` ekle (diğer type import'larıyla birlikte).

- [ ] **Step 4: content.ts — fetchJson çağrısı ekle**

Mevcut Promise.all içindeki son `fetchJson` çağrısından sonra `resistance_mergers.json` fetch'ini ekle. Mevcut yapı:

```typescript
const [skills, resistances, enemies, races, forms, fusionRules, dungeon, books, rooms, ruler, difficulties, elements, events, bossRiddles, forageableFoods] =
  await Promise.all([
    fetchJson<Skill[]>(`${base}skills.json`),
    fetchJson<Resistance[]>(`${base}resistances.json`),
    // ... diğerleri ...
    fetchJson<ForageableFood[]>(`${base}forageableFoods.json`),
  ]);
```

Değiştir — destructuring'e `resistanceMergers` ekle, Promise.all'a yeni fetch ekle:

```typescript
const [skills, resistances, enemies, races, forms, fusionRules, dungeon, books, rooms, ruler, difficulties, elements, events, bossRiddles, forageableFoods, resistanceMergerList] =
  await Promise.all([
    // ... mevcut fetchler aynı sırayla ...
    fetchJson<ForageableFood[]>(`${base}forageableFoods.json`),
    fetchJson<ResistanceMerger[]>(`${base}resistance_mergers.json`),
  ]);
```

Return bloğuna ekle:

```typescript
    resistanceMergers: new Map(resistanceMergerList.map((m) => [m.id, m])),
```

- [ ] **Step 5: Commit**

```bash
git add data/resistances.json data/resistance_mergers.json packages/client/src/game/content.ts
git commit -m "feat(data): 4 yeni resistance stat + resistance_mergers.json + content loader (Task 2)"
```

---

### Task 3: Elemental Chain Skills A — Fire, Frost, Lightning, Wind, Earth

**Files:**
- Modify: `data/skills.json` (25 yeni skill eklenir)
- Modify: `data/i18n/tr.json`, `data/i18n/en.json`, `data/i18n/ru.json`

**Interfaces:**
- Consumes: `Skill.resistType`, `Skill.chainGroup`, `Skill.tierStatBonus` (Task 1)
- Produces: 25 resistance chain skill tanımı + i18n key'leri

**Skill JSON template (bir chain için tam örnek):**

```json
{ "id": "fire_resistance",     "locKeyName": "skill.fire_resistance.name",     "locKeyDesc": "skill.fire_resistance.desc",     "kind": "resistance", "stats": ["VIT"], "lvMax": 5, "evolvesTo": ["flame_resistance"],    "resistType": "fire_res", "chainGroup": "magic", "tierStatBonus": 5  },
{ "id": "flame_resistance",    "locKeyName": "skill.flame_resistance.name",    "locKeyDesc": "skill.flame_resistance.desc",    "kind": "resistance", "stats": ["VIT"], "lvMax": 5, "evolvesTo": ["magma_resistance"],    "resistType": "fire_res", "chainGroup": "magic", "tierStatBonus": 10 },
{ "id": "magma_resistance",    "locKeyName": "skill.magma_resistance.name",    "locKeyDesc": "skill.magma_resistance.desc",    "kind": "resistance", "stats": ["VIT"], "lvMax": 5, "evolvesTo": ["heat_resistance"],    "resistType": "fire_res", "chainGroup": "magic", "tierStatBonus": 18 },
{ "id": "heat_resistance",     "locKeyName": "skill.heat_resistance.name",     "locKeyDesc": "skill.heat_resistance.desc",     "kind": "resistance", "stats": ["VIT"], "lvMax": 5, "evolvesTo": ["volcanic_resistance"], "resistType": "fire_res", "chainGroup": "magic", "tierStatBonus": 28 },
{ "id": "volcanic_resistance", "locKeyName": "skill.volcanic_resistance.name", "locKeyDesc": "skill.volcanic_resistance.desc", "kind": "resistance", "stats": ["VIT"], "lvMax": 5, "evolvesTo": [],                     "resistType": "fire_res", "chainGroup": "magic", "tierStatBonus": 40 }
```

**Kural:** Her chain aynı şablonu izler. Değişen sadece: id, locKeyName/Desc, evolvesTo (sonraki id), resistType, chainGroup. tierStatBonus her chain için T1:5, T2:10, T3:18, T4:28, T5:40 sabittir.

- [ ] **Step 1: skills.json — Ateş zinciri (Fire) ekle (5 skill)**

Yukarıdaki tam örneği `data/skills.json` dizisinin sonuna (kapanan `]` öncesi) ekle.

- [ ] **Step 2: skills.json — Buz zinciri (Frost) ekle (5 skill)**

```
ice_resistance     → frost_res, magic, T1  evolvesTo: ["frost_resistance"]
frost_resistance   → frost_res, magic, T2  evolvesTo: ["freeze_resistance"]
freeze_resistance  → frost_res, magic, T3  evolvesTo: ["glacial_resistance"]
glacial_resistance → frost_res, magic, T4  evolvesTo: ["blizzard_resistance"]
blizzard_resistance → frost_res, magic, T5 evolvesTo: []
```

Şablonu uygula (locKeyName = `skill.<id>.name`, locKeyDesc = `skill.<id>.desc`).

- [ ] **Step 3: skills.json — Yıldırım zinciri (Lightning) ekle (5 skill)**

```
lightning_resistance → lightning_res, magic, T1  evolvesTo: ["bolt_resistance"]
bolt_resistance      → lightning_res, magic, T2  evolvesTo: ["storm_resistance"]
storm_resistance     → lightning_res, magic, T3  evolvesTo: ["thunder_resistance"]
thunder_resistance   → lightning_res, magic, T4  evolvesTo: ["tempest_resistance"]
tempest_resistance   → lightning_res, magic, T5  evolvesTo: []
```

- [ ] **Step 4: skills.json — Rüzgar zinciri (Wind) ekle (5 skill)**

```
wind_resistance      → wind_res, magic, T1  evolvesTo: ["gale_resistance"]
gale_resistance      → wind_res, magic, T2  evolvesTo: ["whirlwind_resistance"]
whirlwind_resistance → wind_res, magic, T3  evolvesTo: ["cyclone_resistance"]
cyclone_resistance   → wind_res, magic, T4  evolvesTo: ["tornado_resistance"]
tornado_resistance   → wind_res, magic, T5  evolvesTo: []
```

- [ ] **Step 5: skills.json — Toprak zinciri (Earth) ekle (5 skill)**

```
earth_resistance   → earth_res, magic, T1  evolvesTo: ["stone_resistance"]
stone_resistance   → earth_res, magic, T2  evolvesTo: ["boulder_resistance"]
boulder_resistance → earth_res, magic, T3  evolvesTo: ["terrain_resistance"]
terrain_resistance → earth_res, magic, T4  evolvesTo: ["tectonic_resistance"]
tectonic_resistance → earth_res, magic, T5 evolvesTo: []
```

- [ ] **Step 6: i18n — tr.json'a 50 key ekle (5 chain × 5 tier × name+desc)**

Her skill için iki key: `skill.<id>.name` ve `skill.<id>.desc`.

**Fire chain (Türkçe — name):**
```json
"skill.fire_resistance.name": "Ateş Direnci",
"skill.flame_resistance.name": "Alev Direnci",
"skill.magma_resistance.name": "Magma Direnci",
"skill.heat_resistance.name": "Sıcaklık Direnci",
"skill.volcanic_resistance.name": "Volkanik Direnç",
```

**Fire chain (Türkçe — desc, kısa tek cümle her biri):**
```json
"skill.fire_resistance.desc": "Ateş hasarına karşı vücudun ilk savunma katmanı.",
"skill.flame_resistance.desc": "Alevlere uzun süre maruz kalan deri sertleşir.",
"skill.magma_resistance.desc": "Magmanın aşırı ısısını özümseyerek dönüştürür.",
"skill.heat_resistance.desc": "Yoğun sıcaklık altında doku bütünlüğü korunur.",
"skill.volcanic_resistance.desc": "Volkanlara yakın yaşayan varlıkların kazandığı tam ateş koruması.",
```

**Frost chain:**
```json
"skill.ice_resistance.name": "Buz Direnci",
"skill.frost_resistance.name": "Don Direnci",
"skill.freeze_resistance.name": "Donma Direnci",
"skill.glacial_resistance.name": "Buzul Direnci",
"skill.blizzard_resistance.name": "Tipi Direnci",
"skill.ice_resistance.desc": "Soğuk hasara karşı ilk korunma tabakası.",
"skill.frost_resistance.desc": "Donmuş havada bile sıcaklık kaybını yavaşlatır.",
"skill.freeze_resistance.desc": "Donma eşiğini önemli ölçüde yükseltir.",
"skill.glacial_resistance.desc": "Buzulların derinliklerinde yaşayanlarda görülür.",
"skill.blizzard_resistance.desc": "En şiddetli don fırtınalarına tam dayanıklılık.",
```

**Lightning chain:**
```json
"skill.lightning_resistance.name": "Yıldırım Direnci",
"skill.bolt_resistance.name": "Cıvata Direnci",
"skill.storm_resistance.name": "Fırtına Direnci",
"skill.thunder_resistance.name": "Gök Gürültüsü Direnci",
"skill.tempest_resistance.name": "Kasırga Direnci",
"skill.lightning_resistance.desc": "Elektrik şoklarını absorbe eden ilk tabaka.",
"skill.bolt_resistance.desc": "Daha güçlü elektrik darbelerini iletmeden söndürür.",
"skill.storm_resistance.desc": "Süregelen elektrik fırtınasına dayanma kapasitesi.",
"skill.thunder_resistance.desc": "Yıldırımın titreşim ve basınç dalgasını da sönümler.",
"skill.tempest_resistance.desc": "Elektrik kasırgasına karşı tam koruma.",
```

**Wind chain:**
```json
"skill.wind_resistance.name": "Rüzgar Direnci",
"skill.gale_resistance.name": "Lodosta Direnci",
"skill.whirlwind_resistance.name": "Anafor Direnci",
"skill.cyclone_resistance.name": "Siklon Direnci",
"skill.tornado_resistance.name": "Hortum Direnci",
"skill.wind_resistance.desc": "Rüzgar hasarını azaltan ilk savunma katmanı.",
"skill.gale_resistance.desc": "Güçlü rüzgar darbelerine karşı denge kazanır.",
"skill.whirlwind_resistance.desc": "Anaforun kesme kuvvetine direnç geliştirir.",
"skill.cyclone_resistance.desc": "Yüksek basınçlı rüzgar girdabını sönümler.",
"skill.tornado_resistance.desc": "En şiddetli rüzgar hasarına tam dayanıklılık.",
```

**Earth chain:**
```json
"skill.earth_resistance.name": "Toprak Direnci",
"skill.stone_resistance.name": "Taş Direnci",
"skill.boulder_resistance.name": "Kaya Direnci",
"skill.terrain_resistance.name": "Arazi Direnci",
"skill.tectonic_resistance.name": "Tektonik Direnç",
"skill.earth_resistance.desc": "Toprak ve taş hasarına karşı ilk savunma.",
"skill.stone_resistance.desc": "Taş darbelerini emen güçlenmiş doku.",
"skill.boulder_resistance.desc": "Dev kaya bloklarının ezici kuvvetine direnç.",
"skill.terrain_resistance.desc": "Her türlü arazi tehlikesini hafifletir.",
"skill.tectonic_resistance.desc": "Deprem ve yer sarsıntısına tam dayanıklılık.",
```

**Res stat i18n (tr.json):**
```json
"res.wind_res.name": "Rüzgar Direnci",
"res.earth_res.name": "Toprak Direnci",
"res.dark_res.name": "Karanlık Direnci",
"res.light_res.name": "Işık Direnci",
"res.wind_immunity.name": "Rüzgar Bağışıklığı",
"res.earth_immunity.name": "Toprak Bağışıklığı",
"res.dark_immunity.name": "Karanlık Bağışıklığı",
"res.light_immunity.name": "Işık Bağışıklığı",
```

- [ ] **Step 7: i18n — en.json'a aynı 50 key (İngilizce)**

Fire chain names: Fire Resistance, Flame Resistance, Magma Resistance, Heat Resistance, Volcanic Resistance
Fire chain descs (one-liner each — just translate or write equivalent)
Frost: Ice Resistance, Frost Resistance, Freeze Resistance, Glacial Resistance, Blizzard Resistance
Lightning: Lightning Resistance, Bolt Resistance, Storm Resistance, Thunder Resistance, Tempest Resistance
Wind: Wind Resistance, Gale Resistance, Whirlwind Resistance, Cyclone Resistance, Tornado Resistance
Earth: Earth Resistance, Stone Resistance, Boulder Resistance, Terrain Resistance, Tectonic Resistance

Descs (English, one sentence each — match Turkish meaning):
```json
"skill.fire_resistance.desc": "First layer of defense against fire damage.",
"skill.flame_resistance.desc": "Skin hardened by prolonged flame exposure.",
"skill.magma_resistance.desc": "Body converts extreme heat into stored resilience.",
"skill.heat_resistance.desc": "Tissue integrity maintained under intense thermal stress.",
"skill.volcanic_resistance.desc": "Full fire protection earned by living near volcanoes.",
"skill.ice_resistance.desc": "First cold-resistance layer against icy damage.",
"skill.frost_resistance.desc": "Slows heat loss even in frozen air.",
"skill.freeze_resistance.desc": "Raises the freeze threshold significantly.",
"skill.glacial_resistance.desc": "Seen in creatures that live deep in glaciers.",
"skill.blizzard_resistance.desc": "Full resistance to the harshest blizzard damage.",
"skill.lightning_resistance.desc": "First layer that absorbs electric shocks.",
"skill.bolt_resistance.desc": "Disperses stronger electrical strikes before conduction.",
"skill.storm_resistance.desc": "Endures sustained electrical storm exposure.",
"skill.thunder_resistance.desc": "Dampens thunderbolt vibration and pressure waves.",
"skill.tempest_resistance.desc": "Full protection against electric tempests.",
"skill.wind_resistance.desc": "First layer reducing wind damage.",
"skill.gale_resistance.desc": "Maintains balance against powerful wind strikes.",
"skill.whirlwind_resistance.desc": "Resists the shearing force of vortex winds.",
"skill.cyclone_resistance.desc": "Absorbs high-pressure cyclone impact.",
"skill.tornado_resistance.desc": "Full resistance to the most violent wind damage.",
"skill.earth_resistance.desc": "First defense against earth and stone damage.",
"skill.stone_resistance.desc": "Reinforced tissue absorbs stone impacts.",
"skill.boulder_resistance.desc": "Resists crushing force of massive boulders.",
"skill.terrain_resistance.desc": "Mitigates all terrain-based hazards.",
"skill.tectonic_resistance.desc": "Full resistance to earthquakes and tremors.",
```

Res stat English names:
```json
"res.wind_res.name": "Wind Resistance",
"res.earth_res.name": "Earth Resistance",
"res.dark_res.name": "Dark Resistance",
"res.light_res.name": "Light Resistance",
"res.wind_immunity.name": "Wind Immunity",
"res.earth_immunity.name": "Earth Immunity",
"res.dark_immunity.name": "Dark Immunity",
"res.light_immunity.name": "Light Immunity",
```

- [ ] **Step 8: i18n — ru.json'a aynı key'ler (Rusça — İngilizce'yi kopyala, çeviri sonra yapılır)**

Şimdilik en.json değerleriyle aynı. Gerçek çeviri ayrı task.

- [ ] **Step 9: Commit**

```bash
git add data/skills.json data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(data): elemental chain skills A — fire/frost/lightning/wind/earth (Task 3)"
```

---

### Task 4: Elemental Chain Skills B — Dark, Light, Acid, Physical, Pierce

**Files:**
- Modify: `data/skills.json` (25 yeni skill)
- Modify: `data/i18n/tr.json`, `data/i18n/en.json`, `data/i18n/ru.json`

**Interfaces:**
- Consumes: Task 1 Skill fields, Task 3 pattern
- Produces: 25 resistance chain skill + i18n

- [ ] **Step 1: skills.json — Karanlık zinciri (Dark) ekle**

```
dark_resistance   → dark_res, magic, T1  evolvesTo: ["shadow_resistance"]
shadow_resistance → dark_res, magic, T2  evolvesTo: ["black_resistance"]
black_resistance  → dark_res, magic, T3  evolvesTo: ["void_resistance"]
void_resistance   → dark_res, magic, T4  evolvesTo: ["abyss_resistance"]
abyss_resistance  → dark_res, magic, T5  evolvesTo: []
```

- [ ] **Step 2: skills.json — Işık zinciri (Light) ekle**

```
light_resistance   → light_res, magic, T1  evolvesTo: ["holy_resistance"]
holy_resistance    → light_res, magic, T2  evolvesTo: ["radiant_resistance"]
radiant_resistance → light_res, magic, T3  evolvesTo: ["divine_resistance"]
divine_resistance  → light_res, magic, T4  evolvesTo: ["sacred_resistance"]
sacred_resistance  → light_res, magic, T5  evolvesTo: []
```

- [ ] **Step 3: skills.json — Asit zinciri (Acid) ekle**

```
acid_resistance      → acid_res, magic, T1  evolvesTo: ["caustic_resistance"]
caustic_resistance   → acid_res, magic, T2  evolvesTo: ["corrosive_resistance"]
corrosive_resistance → acid_res, magic, T3  evolvesTo: ["dissolving_resistance"]
dissolving_resistance → acid_res, magic, T4  evolvesTo: ["melting_resistance"]
melting_resistance   → acid_res, magic, T5  evolvesTo: []
```

- [ ] **Step 4: skills.json — Fiziksel zinciri (Physical) ekle**

```
impact_resistance      → physical_res, physical, T1  evolvesTo: ["bludgeon_resistance"]
bludgeon_resistance    → physical_res, physical, T2  evolvesTo: ["crush_resistance"]
crush_resistance       → physical_res, physical, T3  evolvesTo: ["shatter_resistance"]
shatter_resistance     → physical_res, physical, T4  evolvesTo: ["devastation_resistance"]
devastation_resistance → physical_res, physical, T5  evolvesTo: []
```

- [ ] **Step 5: skills.json — Delici zinciri (Pierce) ekle**

```
pierce_resistance       → pierce_res, physical, T1  evolvesTo: ["stab_resistance"]
stab_resistance         → pierce_res, physical, T2  evolvesTo: ["impale_resistance"]
impale_resistance       → pierce_res, physical, T3  evolvesTo: ["perforate_resistance"]
perforate_resistance    → pierce_res, physical, T4  evolvesTo: ["annihilation_resistance"]
annihilation_resistance → pierce_res, physical, T5  evolvesTo: []
```

- [ ] **Step 6: i18n — tr.json (25 skill × 2 key)**

**Dark chain:**
```json
"skill.dark_resistance.name": "Karanlık Direnci",
"skill.shadow_resistance.name": "Gölge Direnci",
"skill.black_resistance.name": "Siyah Direnç",
"skill.void_resistance.name": "Boşluk Direnci",
"skill.abyss_resistance.name": "Uçurum Direnci",
"skill.dark_resistance.desc": "Karanlık enerjiye karşı ilk savunma tabakası.",
"skill.shadow_resistance.desc": "Gölge saldırılarının ısırmasını azaltır.",
"skill.black_resistance.desc": "Tam siyah enerjiye dayanma kapasitesi gelişir.",
"skill.void_resistance.desc": "Varoluşu tehdit eden boşluk hasarını sönümler.",
"skill.abyss_resistance.desc": "Uçurumun en derin karanlığına karşı tam koruma.",
```

**Light chain:**
```json
"skill.light_resistance.name": "Işık Direnci",
"skill.holy_resistance.name": "Kutsal Direnç",
"skill.radiant_resistance.name": "Parlak Direnç",
"skill.divine_resistance.name": "İlahi Direnç",
"skill.sacred_resistance.name": "Kutsal Bağışıklık",
"skill.light_resistance.desc": "Yoğun ışık hasarına karşı ilk tabaka.",
"skill.holy_resistance.desc": "Kutsal ışınları kırarak zararını azaltır.",
"skill.radiant_resistance.desc": "Parlak enerji dalgalarını soğurur.",
"skill.divine_resistance.desc": "İlahi ışığın yakıcı gücüne dayanır.",
"skill.sacred_resistance.desc": "En saf kutsal hasara karşı tam koruma.",
```

**Acid chain:**
```json
"skill.acid_resistance.name": "Asit Direnci",
"skill.caustic_resistance.name": "Kostik Direnç",
"skill.corrosive_resistance.name": "Korozif Direnç",
"skill.dissolving_resistance.name": "Çözücü Direnç",
"skill.melting_resistance.name": "Erime Direnci",
"skill.acid_resistance.desc": "Asit saldırılarına karşı ilk koruyucu katman.",
"skill.caustic_resistance.desc": "Kostik maddelerin doku tahribatını sınırlar.",
"skill.corrosive_resistance.desc": "Korozif maddelere karşı uzun süreli direnç.",
"skill.dissolving_resistance.desc": "Güçlü çözücülerin etkisini büyük ölçüde engeller.",
"skill.melting_resistance.desc": "En yoğun asit saldırılarına tam dayanıklılık.",
```

**Physical chain:**
```json
"skill.impact_resistance.name": "Darbe Direnci",
"skill.bludgeon_resistance.name": "Künt Silah Direnci",
"skill.crush_resistance.name": "Ezilme Direnci",
"skill.shatter_resistance.name": "Kırılma Direnci",
"skill.devastation_resistance.name": "Yıkım Direnci",
"skill.impact_resistance.desc": "Fiziksel darbeler için ilk sertleşme tabakası.",
"skill.bludgeon_resistance.desc": "Künt kuvvetlerin ezici etkisini sönümler.",
"skill.crush_resistance.desc": "Sıkışma kuvvetine karşı yapısal dayanıklılık.",
"skill.shatter_resistance.desc": "Yüksek darbe enerjisine karşı doku bütünlüğü.",
"skill.devastation_resistance.desc": "En yıkıcı fiziksel saldırılara tam direnç.",
```

**Pierce chain:**
```json
"skill.pierce_resistance.name": "Delici Direnç",
"skill.stab_resistance.name": "Saplama Direnci",
"skill.impale_resistance.name": "İzleme Direnci",
"skill.perforate_resistance.name": "Delik Açma Direnci",
"skill.annihilation_resistance.name": "Yok Etme Direnci",
"skill.pierce_resistance.desc": "Delici saldırılara karşı ilk savunma katmanı.",
"skill.stab_resistance.desc": "Sivri uçlu darbeler dokuyu daha az deler.",
"skill.impale_resistance.desc": "İzleme hasarını büyük ölçüde azaltır.",
"skill.perforate_resistance.desc": "Keskin geçici saldırılara yüksek dayanıklılık.",
"skill.annihilation_resistance.desc": "En derin delici saldırılara tam direnç.",
```

- [ ] **Step 7: i18n — en.json (25 skill, İngilizce)**

```json
"skill.dark_resistance.name": "Dark Resistance", "skill.shadow_resistance.name": "Shadow Resistance", "skill.black_resistance.name": "Black Resistance", "skill.void_resistance.name": "Void Resistance", "skill.abyss_resistance.name": "Abyss Resistance",
"skill.dark_resistance.desc": "First layer against dark energy.", "skill.shadow_resistance.desc": "Blunts the bite of shadow attacks.", "skill.black_resistance.desc": "Develops capacity to withstand pure dark energy.", "skill.void_resistance.desc": "Absorbs existence-threatening void damage.", "skill.abyss_resistance.desc": "Full protection against the deepest abyss damage.",
"skill.light_resistance.name": "Light Resistance", "skill.holy_resistance.name": "Holy Resistance", "skill.radiant_resistance.name": "Radiant Resistance", "skill.divine_resistance.name": "Divine Resistance", "skill.sacred_resistance.name": "Sacred Immunity",
"skill.light_resistance.desc": "First layer against intense light damage.", "skill.holy_resistance.desc": "Refracts holy rays to reduce harm.", "skill.radiant_resistance.desc": "Absorbs radiant energy waves.", "skill.divine_resistance.desc": "Endures the burning might of divine light.", "skill.sacred_resistance.desc": "Full protection against purest sacred damage.",
"skill.acid_resistance.name": "Acid Resistance", "skill.caustic_resistance.name": "Caustic Resistance", "skill.corrosive_resistance.name": "Corrosive Resistance", "skill.dissolving_resistance.name": "Dissolving Resistance", "skill.melting_resistance.name": "Melting Resistance",
"skill.acid_resistance.desc": "First protective layer against acid attacks.", "skill.caustic_resistance.desc": "Limits tissue damage from caustic substances.", "skill.corrosive_resistance.desc": "Sustained resistance to corrosive materials.", "skill.dissolving_resistance.desc": "Greatly hinders powerful solvents.", "skill.melting_resistance.desc": "Full resistance to the most concentrated acids.",
"skill.impact_resistance.name": "Impact Resistance", "skill.bludgeon_resistance.name": "Bludgeon Resistance", "skill.crush_resistance.name": "Crush Resistance", "skill.shatter_resistance.name": "Shatter Resistance", "skill.devastation_resistance.name": "Devastation Resistance",
"skill.impact_resistance.desc": "First hardening layer for physical impacts.", "skill.bludgeon_resistance.desc": "Dampens the crushing effect of blunt force.", "skill.crush_resistance.desc": "Structural resilience against compressive force.", "skill.shatter_resistance.desc": "Tissue integrity against high-impact energy.", "skill.devastation_resistance.desc": "Full resistance to the most destructive physical attacks.",
"skill.pierce_resistance.name": "Pierce Resistance", "skill.stab_resistance.name": "Stab Resistance", "skill.impale_resistance.name": "Impale Resistance", "skill.perforate_resistance.name": "Perforate Resistance", "skill.annihilation_resistance.name": "Annihilation Resistance",
"skill.pierce_resistance.desc": "First defensive layer against piercing attacks.", "skill.stab_resistance.desc": "Sharp strikes penetrate tissue less deeply.", "skill.impale_resistance.desc": "Greatly reduces impaling damage.", "skill.perforate_resistance.desc": "High endurance against sharp penetrating attacks.", "skill.annihilation_resistance.desc": "Full resistance to the deepest piercing damage.",
```

- [ ] **Step 8: ru.json — en.json değerleriyle doldur (geçici)**

- [ ] **Step 9: Commit**

```bash
git add data/skills.json data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(data): elemental chain skills B — dark/light/acid/physical/pierce (Task 4)"
```

---

### Task 5: Status + Soul Chains + Nullification Skills

**Files:**
- Modify: `data/skills.json` (24 yeni skill)
- Modify: `data/i18n/tr.json`, `data/i18n/en.json`, `data/i18n/ru.json`

**Önemli not:** Paralysis chain `resistType: 'stun_res'` kullanır ama hem `stun` hem `petrify` hasar tiplerinden XP alır (Task 6'da combat.ts'de hardcoded mapping).

Nullification skill'leri `kind: 'resistance'` ile tanımlanır ama `resistType` **yoktur** — bunlar merger skill'leridir ve sadece aggregateBonuses'ta tanınır.

- [ ] **Step 1: skills.json — Zehir zinciri (Poison) ekle**

```
poison_resistance      → poison_res, status, T1  evolvesTo: ["venom_resistance"]
venom_resistance       → poison_res, status, T2  evolvesTo: ["toxin_resistance"]
toxin_resistance       → poison_res, status, T3  evolvesTo: ["plague_resistance"]
plague_resistance      → poison_res, status, T4  evolvesTo: ["death_venom_resistance"]
death_venom_resistance → poison_res, status, T5  evolvesTo: []
```

- [ ] **Step 2: skills.json — Felç zinciri (Paralysis) ekle**

```
stun_resistance       → stun_res, status, T1  evolvesTo: ["shock_resistance"]
shock_resistance      → stun_res, status, T2  evolvesTo: ["bind_resistance"]
bind_resistance       → stun_res, status, T3  evolvesTo: ["petrify_resistance"]
petrify_resistance    → stun_res, status, T4  evolvesTo: ["immobilize_resistance"]
immobilize_resistance → stun_res, status, T5  evolvesTo: []
```

- [ ] **Step 3: skills.json — Korku zinciri (Fear) ekle**

```
fear_resistance      → fear_res, status, T1  evolvesTo: ["dread_resistance"]
dread_resistance     → fear_res, status, T2  evolvesTo: ["terror_resistance"]
terror_resistance    → fear_res, status, T3  evolvesTo: ["horror_resistance"]
horror_resistance    → fear_res, status, T4  evolvesTo: ["abyss_fear_resistance"]
abyss_fear_resistance → fear_res, status, T5 evolvesTo: []
```

- [ ] **Step 4: skills.json — Ruh zinciri (Soul) ekle**

```
soul_resistance         → soul_res, soul, T1  evolvesTo: ["spirit_resistance"]
spirit_resistance       → soul_res, soul, T2  evolvesTo: ["ethereal_resistance"]
ethereal_resistance     → soul_res, soul, T3  evolvesTo: ["phantom_resistance"]
phantom_resistance      → soul_res, soul, T4  evolvesTo: ["transcendent_resistance"]
transcendent_resistance → soul_res, soul, T5  evolvesTo: []
```

- [ ] **Step 5: skills.json — 4 Nullification skill'i ekle**

```json
{
  "id": "physical_nullification",
  "locKeyName": "skill.physical_null.name",
  "locKeyDesc": "skill.physical_null.desc",
  "kind": "resistance",
  "stats": ["VIT"],
  "lvMax": 10,
  "evolvesTo": []
},
{
  "id": "magic_nullification",
  "locKeyName": "skill.magic_null.name",
  "locKeyDesc": "skill.magic_null.desc",
  "kind": "resistance",
  "stats": ["VIT", "INT"],
  "lvMax": 10,
  "evolvesTo": []
},
{
  "id": "status_nullification",
  "locKeyName": "skill.status_null.name",
  "locKeyDesc": "skill.status_null.desc",
  "kind": "resistance",
  "stats": ["VIT", "WIS"],
  "lvMax": 10,
  "evolvesTo": []
},
{
  "id": "ultimate_nullification",
  "locKeyName": "skill.ultimate_null.name",
  "locKeyDesc": "skill.ultimate_null.desc",
  "kind": "resistance",
  "stats": ["VIT", "INT", "WIS"],
  "lvMax": 10,
  "evolvesTo": []
}
```

- [ ] **Step 6: i18n — tr.json (20 chain + 4 null × 2 key)**

**Poison chain:**
```json
"skill.poison_resistance.name": "Zehir Direnci",
"skill.venom_resistance.name": "Ağı Direnci",
"skill.toxin_resistance.name": "Toksin Direnci",
"skill.plague_resistance.name": "Veba Direnci",
"skill.death_venom_resistance.name": "Ölümcül Zehir Direnci",
"skill.poison_resistance.desc": "Zehirli maddelere karşı ilk bağışıklık tabakası.",
"skill.venom_resistance.desc": "Konsantre hayvan zehirlerini metabolize eder.",
"skill.toxin_resistance.desc": "Karmaşık toksinleri nötralize etme kapasitesi.",
"skill.plague_resistance.desc": "En bulaşıcı hastalık zehirlerine dayanır.",
"skill.death_venom_resistance.desc": "Anlık öldürücü zehirlere karşı tam koruma.",
```

**Paralysis chain:**
```json
"skill.stun_resistance.name": "Sersemletme Direnci",
"skill.shock_resistance.name": "Şok Direnci",
"skill.bind_resistance.name": "Bağlama Direnci",
"skill.petrify_resistance.name": "Taşlaşma Direnci",
"skill.immobilize_resistance.name": "Hareketsizleştirme Direnci",
"skill.stun_resistance.desc": "Sersemletme ve felç etkilerine karşı ilk direnç.",
"skill.shock_resistance.desc": "Elektrik şoku kaynaklı felçleri azaltır.",
"skill.bind_resistance.desc": "Bağlama ve hareketsiz bırakma etkilerini kısaltır.",
"skill.petrify_resistance.desc": "Taşlaşma büyülerine yüksek dayanıklılık.",
"skill.immobilize_resistance.desc": "Tüm hareketsizleştirme etkilerine tam direnç.",
```

**Fear chain:**
```json
"skill.fear_resistance.name": "Korku Direnci",
"skill.dread_resistance.name": "Dehşet Direnci",
"skill.terror_resistance.name": "Terör Direnci",
"skill.horror_resistance.name": "Korku Direnci (Yoğun)",
"skill.abyss_fear_resistance.name": "Uçurum Korkusu Direnci",
"skill.fear_resistance.desc": "Korku etkilerine karşı ilk zihinsel kalkan.",
"skill.dread_resistance.desc": "Derin dehşet duygularını susturur.",
"skill.terror_resistance.desc": "Terör ajanlarının zihinsel etkisini kırar.",
"skill.horror_resistance.desc": "En yoğun korku saldırılarına dayanır.",
"skill.abyss_fear_resistance.desc": "Uçurumun varoluşsal korkusuna tam direnç.",
```

**Soul chain:**
```json
"skill.soul_resistance.name": "Ruh Direnci",
"skill.spirit_resistance.name": "Tin Direnci",
"skill.ethereal_resistance.name": "Eteral Direnç",
"skill.phantom_resistance.name": "Fantom Direnci",
"skill.transcendent_resistance.name": "Aşkın Direnç",
"skill.soul_resistance.desc": "Ruh hasarına karşı ilk koruyucu tabaka.",
"skill.spirit_resistance.desc": "Spiritüel saldırıların özü zedeleyemez.",
"skill.ethereal_resistance.desc": "Eteral varlıkların ruh saldırılarını sönümler.",
"skill.phantom_resistance.desc": "Fantomların ve hayaletlerin ruh saldırılarını keser.",
"skill.transcendent_resistance.desc": "En derin ruh hasarına aşkın direnç.",
```

**Nullification skills:**
```json
"skill.physical_null.name": "Fiziksel Yoklama",
"skill.physical_null.desc": "Tüm fiziksel hasar türlerini Lv10'da %85 azaltır.",
"skill.magic_null.name": "Sihir Yoklama",
"skill.magic_null.desc": "Tüm elemental hasar türlerini Lv10'da %85 azaltır.",
"skill.status_null.name": "Durum Yoklama",
"skill.status_null.desc": "Tüm durum bozukluğu hasarını Lv10'da %85 azaltır.",
"skill.ultimate_null.name": "Nihai Yoklama",
"skill.ultimate_null.desc": "Lv10'da tüm hasar türlerinden tam bağışıklık sağlar.",
```

- [ ] **Step 7: i18n — en.json**

```json
"skill.poison_resistance.name": "Poison Resistance", "skill.venom_resistance.name": "Venom Resistance", "skill.toxin_resistance.name": "Toxin Resistance", "skill.plague_resistance.name": "Plague Resistance", "skill.death_venom_resistance.name": "Death Venom Resistance",
"skill.poison_resistance.desc": "First immunity layer against toxic substances.", "skill.venom_resistance.desc": "Metabolizes concentrated animal venoms.", "skill.toxin_resistance.desc": "Capacity to neutralize complex toxins.", "skill.plague_resistance.desc": "Withstands the most virulent plague venoms.", "skill.death_venom_resistance.desc": "Full protection against instantly lethal poisons.",
"skill.stun_resistance.name": "Stun Resistance", "skill.shock_resistance.name": "Shock Resistance", "skill.bind_resistance.name": "Bind Resistance", "skill.petrify_resistance.name": "Petrify Resistance", "skill.immobilize_resistance.name": "Immobilize Resistance",
"skill.stun_resistance.desc": "First resistance against stun and paralysis effects.", "skill.shock_resistance.desc": "Reduces electric-shock-induced paralysis.", "skill.bind_resistance.desc": "Shortens binding and immobilizing effects.", "skill.petrify_resistance.desc": "High resistance to petrification.", "skill.immobilize_resistance.desc": "Full resistance to all immobilizing effects.",
"skill.fear_resistance.name": "Fear Resistance", "skill.dread_resistance.name": "Dread Resistance", "skill.terror_resistance.name": "Terror Resistance", "skill.horror_resistance.name": "Horror Resistance", "skill.abyss_fear_resistance.name": "Abyss Fear Resistance",
"skill.fear_resistance.desc": "First mental shield against fear effects.", "skill.dread_resistance.desc": "Silences deep feelings of dread.", "skill.terror_resistance.desc": "Breaks the mental impact of terror agents.", "skill.horror_resistance.desc": "Endures the most intense fear attacks.", "skill.abyss_fear_resistance.desc": "Full resistance to the existential fear of the abyss.",
"skill.soul_resistance.name": "Soul Resistance", "skill.spirit_resistance.name": "Spirit Resistance", "skill.ethereal_resistance.name": "Ethereal Resistance", "skill.phantom_resistance.name": "Phantom Resistance", "skill.transcendent_resistance.name": "Transcendent Resistance",
"skill.soul_resistance.desc": "First protective layer against soul damage.", "skill.spirit_resistance.desc": "Spiritual attacks cannot wound the core.", "skill.ethereal_resistance.desc": "Dampens soul attacks from ethereal beings.", "skill.phantom_resistance.desc": "Severs soul attacks from phantoms and ghosts.", "skill.transcendent_resistance.desc": "Transcendent resistance to the deepest soul damage.",
"skill.physical_null.name": "Physical Nullification", "skill.physical_null.desc": "Reduces all physical damage by 85% at Lv10.",
"skill.magic_null.name": "Magic Nullification", "skill.magic_null.desc": "Reduces all elemental damage by 85% at Lv10.",
"skill.status_null.name": "Status Nullification", "skill.status_null.desc": "Reduces all status damage by 85% at Lv10.",
"skill.ultimate_null.name": "Ultimate Nullification", "skill.ultimate_null.desc": "Full immunity to all damage types at Lv10.",
```

- [ ] **Step 8: ru.json — en.json değerleriyle doldur**

- [ ] **Step 9: Commit**

```bash
git add data/skills.json data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(data): status+soul chains + 4 nullification skills (Task 5)"
```

---

### Task 6: Wiki Pasif Skill Zincirleri

**Files:**
- Modify: `data/skills.json` (22 yeni skill)
- Modify: `data/i18n/tr.json`, `data/i18n/en.json`, `data/i18n/ru.json`

**Önemli:** Bunlar `kind: 'passive'` skill'leri — resistance chain'i değil. Mevcut `skillLevelUp` mekanizmasıyla çalışır.

- [ ] **Step 1: skills.json — Beş Duyu zinciri (5 skill)**

```json
{ "id": "vision_enhancement",     "locKeyName": "skill.vision_enhancement.name",     "locKeyDesc": "skill.vision_enhancement.desc",     "kind": "passive", "stats": ["LUCK"],             "lvMax": 5,  "evolvesTo": ["auditory_enhancement"],  "lootMult": 0.05, "dodgeBonus": 0.01 },
{ "id": "auditory_enhancement",   "locKeyName": "skill.auditory_enhancement.name",   "locKeyDesc": "skill.auditory_enhancement.desc",   "kind": "passive", "stats": ["LUCK"],             "lvMax": 5,  "evolvesTo": ["olfactory_enhancement"], "lootMult": 0.08, "dodgeBonus": 0.02 },
{ "id": "olfactory_enhancement",  "locKeyName": "skill.olfactory_enhancement.name",  "locKeyDesc": "skill.olfactory_enhancement.desc",  "kind": "passive", "stats": ["LUCK","WIS"],       "lvMax": 5,  "evolvesTo": ["five_senses_enhancement"],"lootMult": 0.12, "dodgeBonus": 0.03 },
{ "id": "five_senses_enhancement","locKeyName": "skill.five_senses_enhancement.name","locKeyDesc": "skill.five_senses_enhancement.desc","kind": "passive", "stats": ["LUCK","WIS","INT"], "lvMax": 5,  "evolvesTo": ["five_senses_super"],     "lootMult": 0.18, "dodgeBonus": 0.04 },
{ "id": "five_senses_super",      "locKeyName": "skill.five_senses_super.name",      "locKeyDesc": "skill.five_senses_super.desc",      "kind": "passive", "stats": ["LUCK","WIS","INT"], "lvMax": 10, "evolvesTo": [],                        "lootMult": 0.25, "dodgeBonus": 0.06 }
```

- [ ] **Step 2: skills.json — Olasılık Düzeltme zinciri (4 skill)**

```json
{ "id": "skill_hit",                   "locKeyName": "skill.skill_hit.name",                   "locKeyDesc": "skill.skill_hit.desc",                   "kind": "passive", "stats": ["AGI"],        "lvMax": 5,  "evolvesTo": ["skill_evasion"],              "dodgeBonus": 0.03 },
{ "id": "skill_evasion",               "locKeyName": "skill.skill_evasion.name",               "locKeyDesc": "skill.skill_evasion.desc",               "kind": "passive", "stats": ["AGI"],        "lvMax": 5,  "evolvesTo": ["probability_correction"],     "dodgeBonus": 0.06 },
{ "id": "probability_correction",      "locKeyName": "skill.probability_correction.name",      "locKeyDesc": "skill.probability_correction.desc",      "kind": "passive", "stats": ["AGI","LUCK"], "lvMax": 5,  "evolvesTo": ["probability_super_correction"],"dodgeBonus": 0.10 },
{ "id": "probability_super_correction","locKeyName": "skill.probability_super_correction.name","locKeyDesc": "skill.probability_super_correction.desc","kind": "passive", "stats": ["AGI","LUCK"], "lvMax": 10, "evolvesTo": [],                             "dodgeBonus": 0.15 }
```

- [ ] **Step 3: skills.json — Yıldırım Korku zinciri (3 skill, Ruler ekseni)**

```json
{ "id": "intimidation_aura", "locKeyName": "skill.intimidation_aura.name", "locKeyDesc": "skill.intimidation_aura.desc", "kind": "ruler", "stats": ["STR","WIS"], "lvMax": 5,  "evolvesTo": ["tyrant_aura"],   "dmgMult": 0.05 },
{ "id": "tyrant_aura",       "locKeyName": "skill.tyrant_aura.name",       "locKeyDesc": "skill.tyrant_aura.desc",       "kind": "ruler", "stats": ["STR","WIS"], "lvMax": 5,  "evolvesTo": ["emperor_aura"],  "dmgMult": 0.10, "statMult": 0.03 },
{ "id": "emperor_aura",      "locKeyName": "skill.emperor_aura.name",      "locKeyDesc": "skill.emperor_aura.desc",      "kind": "ruler", "stats": ["STR","WIS","INT"], "lvMax": 10, "evolvesTo": [], "dmgMult": 0.18, "statMult": 0.05 }
```

- [ ] **Step 4: skills.json — Gece Görüşü zinciri (4 skill)**

```json
{ "id": "night_vision",        "locKeyName": "skill.night_vision.name",        "locKeyDesc": "skill.night_vision.desc",        "kind": "passive", "stats": ["AGI","INT"], "lvMax": 5,  "evolvesTo": ["vision_expansion"],     "dodgeBonus": 0.02, "xpMult": 0.05 },
{ "id": "vision_expansion",    "locKeyName": "skill.vision_expansion.name",    "locKeyDesc": "skill.vision_expansion.desc",    "kind": "passive", "stats": ["AGI","INT"], "lvMax": 5,  "evolvesTo": ["perception_expansion"], "dodgeBonus": 0.04, "xpMult": 0.08 },
{ "id": "perception_expansion","locKeyName": "skill.perception_expansion.name","locKeyDesc": "skill.perception_expansion.desc","kind": "passive", "stats": ["AGI","INT","WIS"], "lvMax": 5, "evolvesTo": ["auditory_expansion"], "dodgeBonus": 0.07, "xpMult": 0.12 },
{ "id": "auditory_expansion",  "locKeyName": "skill.auditory_expansion.name",  "locKeyDesc": "skill.auditory_expansion.desc",  "kind": "passive", "stats": ["AGI","INT","WIS"], "lvMax": 10,"evolvesTo": [],                       "dodgeBonus": 0.10, "xpMult": 0.18 }
```

- [ ] **Step 5: skills.json — Ejderha Zırhı zinciri (3 skill)**

```json
{ "id": "dragon_scales",  "locKeyName": "skill.dragon_scales.name",  "locKeyDesc": "skill.dragon_scales.desc",  "kind": "passive", "stats": ["VIT"], "lvMax": 5,  "evolvesTo": ["imperial_scales"], "armor": 8 },
{ "id": "imperial_scales","locKeyName": "skill.imperial_scales.name","locKeyDesc": "skill.imperial_scales.desc","kind": "passive", "stats": ["VIT"], "lvMax": 5,  "evolvesTo": ["divine_scales"],   "armor": 18 },
{ "id": "divine_scales",  "locKeyName": "skill.divine_scales.name",  "locKeyDesc": "skill.divine_scales.desc",  "kind": "passive", "stats": ["VIT","STR"], "lvMax": 10, "evolvesTo": [],            "armor": 30, "regenMult": 0.15 }
```

- [ ] **Step 6: skills.json — Ölümsüzlük (1 skill, lvMax:5)**

```json
{ "id": "immortality_skill", "locKeyName": "skill.immortality_skill.name", "locKeyDesc": "skill.immortality_skill.desc", "kind": "passive", "stats": ["VIT","WIS"], "lvMax": 5, "evolvesTo": [], "surviveChance": 0.85, "hidden": true, "acquireKey": "skill.immortality_skill.acquire" }
```

(`surviveChance: 0.85` → Lv1'de scale(1,5)=0.2 → %17 hayatta kalma. Lv5'te %85.)

- [ ] **Step 7: skills.json — Atletizm zinciri (2 skill)**

```json
{ "id": "athletics",           "locKeyName": "skill.athletics.name",           "locKeyDesc": "skill.athletics.desc",           "kind": "passive", "stats": ["STR","AGI"], "lvMax": 5,  "evolvesTo": ["martial_arts_mastery"], "dmgMult": 0.05, "statMult": 0.02 },
{ "id": "martial_arts_mastery","locKeyName": "skill.martial_arts_mastery.name","locKeyDesc": "skill.martial_arts_mastery.desc","kind": "passive", "stats": ["STR","AGI"], "lvMax": 10, "evolvesTo": [],                       "dmgMult": 0.15, "statMult": 0.05 }
```

- [ ] **Step 8: i18n — tr.json (22 skill × 2 key)**

```json
"skill.vision_enhancement.name": "Görüş Geliştirme",
"skill.vision_enhancement.desc": "Çevreyi daha keskin algılamaya başlarsın.",
"skill.auditory_enhancement.name": "İşitme Geliştirme",
"skill.auditory_enhancement.desc": "Sesleri daha erken ve net duyarsın.",
"skill.olfactory_enhancement.name": "Koku Geliştirme",
"skill.olfactory_enhancement.desc": "Koku duyusu tehlikeleri önceden hissettirir.",
"skill.five_senses_enhancement.name": "Beş Duyu Geliştirme",
"skill.five_senses_enhancement.desc": "Tüm duyular eş zamanlı keskinleşir.",
"skill.five_senses_super.name": "Süper Beş Duyu",
"skill.five_senses_super.desc": "Gizli odaları ve tehlikeleri sezgisel olarak algılar.",
"skill.skill_hit.name": "İsabet Becerisi",
"skill.skill_hit.desc": "Saldırıların hedefi ıskalama ihtimali azalır.",
"skill.skill_evasion.name": "Kaçınma Becerisi",
"skill.skill_evasion.desc": "Düşman saldırılarından daha kolay sıyrılırsın.",
"skill.probability_correction.name": "Olasılık Düzeltme",
"skill.probability_correction.desc": "Şans faktörü senin lehine eğilir.",
"skill.probability_super_correction.name": "Süper Olasılık Düzeltme",
"skill.probability_super_correction.desc": "Düşmanın kritik şansı %15 azalır.",
"skill.intimidation_aura.name": "Yıldırma Aurası",
"skill.intimidation_aura.desc": "Varlığın düşmanları tedirgin eder.",
"skill.tyrant_aura.name": "Tiran Aurası",
"skill.tyrant_aura.desc": "Zayıf düşmanlar savaşmadan geri adım atar.",
"skill.emperor_aura.name": "İmparator Aurası",
"skill.emperor_aura.desc": "Muazzam baskı düşmanların savaş gücünü kırar.",
"skill.night_vision.name": "Gece Görüşü",
"skill.night_vision.desc": "Karanlıkta keşif ve algılama cezası azalır.",
"skill.vision_expansion.name": "Görüş Genişlemesi",
"skill.vision_expansion.desc": "Görüş alanı uzar, gizliler fark edilir.",
"skill.perception_expansion.name": "Algı Genişlemesi",
"skill.perception_expansion.desc": "Tüm duyular karanlıkta keskinleşir.",
"skill.auditory_expansion.name": "İşitme Genişlemesi",
"skill.auditory_expansion.desc": "Tüm duyusal engeller ortadan kalkar.",
"skill.dragon_scales.name": "Ejderha Pulları",
"skill.dragon_scales.desc": "Pullar fiziksel hasarı önemli ölçüde sönümler.",
"skill.imperial_scales.name": "İmparatorluk Pulları",
"skill.imperial_scales.desc": "Pullar zırh kalitesine ulaşır.",
"skill.divine_scales.name": "İlahi Pullar",
"skill.divine_scales.desc": "Küçük saldırıları geri yansıtır.",
"skill.immortality_skill.name": "Ölümsüzlük",
"skill.immortality_skill.desc": "Öldürücü bir darbede canlanarak ayakta kalırsın.",
"skill.immortality_skill.acquire": "Nadir bir olay veya nihai keşifle açılır.",
"skill.athletics.name": "Atletizm",
"skill.athletics.desc": "Beden ve refleksler birlikte gelişir.",
"skill.martial_arts_mastery.name": "Savaş Sanatları Ustalığı",
"skill.martial_arts_mastery.desc": "Silahsız dövüşün verimi belirgin artar.",
```

- [ ] **Step 9: i18n — en.json**

```json
"skill.vision_enhancement.name": "Vision Enhancement", "skill.vision_enhancement.desc": "Perceive surroundings with sharper clarity.",
"skill.auditory_enhancement.name": "Auditory Enhancement", "skill.auditory_enhancement.desc": "Hear sounds earlier and more precisely.",
"skill.olfactory_enhancement.name": "Olfactory Enhancement", "skill.olfactory_enhancement.desc": "Sense of smell warns of danger in advance.",
"skill.five_senses_enhancement.name": "Five Senses Enhancement", "skill.five_senses_enhancement.desc": "All senses sharpen simultaneously.",
"skill.five_senses_super.name": "Five Senses Super-Enhancement", "skill.five_senses_super.desc": "Intuitively detects hidden rooms and dangers.",
"skill.skill_hit.name": "Hit", "skill.skill_hit.desc": "Attacks are less likely to miss the target.",
"skill.skill_evasion.name": "Evasion", "skill.skill_evasion.desc": "Dodge enemy attacks more readily.",
"skill.probability_correction.name": "Probability Correction", "skill.probability_correction.desc": "The chance factor tilts in your favor.",
"skill.probability_super_correction.name": "Probability Super-Correction", "skill.probability_super_correction.desc": "Enemy critical chance reduced by 15%.",
"skill.intimidation_aura.name": "Intimidation", "skill.intimidation_aura.desc": "Your presence unsettles enemies.",
"skill.tyrant_aura.name": "Tyrant", "skill.tyrant_aura.desc": "Weaker enemies retreat without a fight.",
"skill.emperor_aura.name": "Emperor", "skill.emperor_aura.desc": "Immense pressure breaks enemy combat power.",
"skill.night_vision.name": "Night Vision", "skill.night_vision.desc": "Reduces exploration and perception penalties in darkness.",
"skill.vision_expansion.name": "Vision Expansion", "skill.vision_expansion.desc": "Field of view extends, hidden things noticed.",
"skill.perception_expansion.name": "Perception Expansion", "skill.perception_expansion.desc": "All senses sharpen in darkness.",
"skill.auditory_expansion.name": "Auditory Expansion", "skill.auditory_expansion.desc": "All sensory obstacles removed.",
"skill.dragon_scales.name": "Dragon Scales", "skill.dragon_scales.desc": "Scales significantly dampen physical damage.",
"skill.imperial_scales.name": "Imperial Scales", "skill.imperial_scales.desc": "Scales reach armor-grade quality.",
"skill.divine_scales.name": "Divine Scales", "skill.divine_scales.desc": "Reflects small attacks back at enemies.",
"skill.immortality_skill.name": "Immortality", "skill.immortality_skill.desc": "Survive a killing blow by reviving on the spot.",
"skill.immortality_skill.acquire": "Unlocked through a rare event or ultimate discovery.",
"skill.athletics.name": "Athletics", "skill.athletics.desc": "Body and reflexes develop together.",
"skill.martial_arts_mastery.name": "Martial Arts Mastery", "skill.martial_arts_mastery.desc": "Unarmed combat efficiency noticeably improves.",
```

- [ ] **Step 10: ru.json — en.json ile doldur**

- [ ] **Step 11: Commit**

```bash
git add data/skills.json data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(data): wiki pasif skill zincirleri — 22 yeni skill (Task 6)"
```

---

### Task 7: XP Dağıtım Sistemi + Otomatik Zincir Açma

**Files:**
- Modify: `packages/client/src/game/combat.ts`

**Interfaces:**
- Consumes: `Skill.resistType`, `Skill.tierStatBonus`, `SkillSlot.tier` (Task 1, Task 3-5)
- Produces: `resistChainExpToNext(tier)`, modifiye `addResistExp`, modifiye `skillLevelUp`

**Mantık:**
- `kind === 'resistance'` ve `resistType` olan skill'ler damage XP'den beslenir (rawXP / 2).
- `kind === 'resistance'` ve `resistType` YOK olan skill'ler (nullification) damage XP'den beslenir (rawXP tam).
- İlk kez o hasar tipinden hasar alınınca T1 chain skill otomatik açılır.
- `petrify` hasarı hem `petrify_res` statını hem `stun_res` chain skill'ini besler (hardcoded mapping).

- [ ] **Step 1: combat.ts — resistChainExpToNext fonksiyonunu ekle**

Mevcut `resistExpToNext` fonksiyonundan hemen sonra ekle:

```typescript
/** XP required per level for a resistance chain skill at the given tier (1–5).
 *  Total XP to complete a tier: T1=200, T2=400, T3=700, T4=1200.
 *  lvMax=5 per tier → xpPerLevel = totalXP/5. */
function resistChainExpToNext(tier: number): number {
  const totals = [0, 200, 400, 700, 1200, 2000];
  return (totals[Math.min(tier, 5)] ?? 2000) / 5;
}

/** XP required per level for a Nullification skill (group or ultimate).
 *  Lv1→2: 2000, each subsequent level +800. */
function nullExpToNext(level: number): number {
  return 2000 + (level - 1) * 800;
}
```

- [ ] **Step 2: combat.ts — skillLevelUp'ta resistance chain skill'lerini özel işle**

Mevcut `skillLevelUp` fonksiyonunun başında `const def = content.skills.get(slot.id);` satırından sonra ekle:

```typescript
  // Resistance chain skills and nullification skills use their own XP formula.
  const isResChain = def.kind === 'resistance' && !!def.resistType;
  const isNullSkill = def.kind === 'resistance' && !def.resistType;
  const xpFn = isResChain
    ? () => resistChainExpToNext(slot.tier ?? 1)
    : isNullSkill
      ? () => nullExpToNext(slot.level)
      : skillExpToNext;
```

Ardından mevcut `while (slot.level < def.lvMax && slot.exp >= skillExpToNext(slot.level))` satırını değiştir:

```typescript
  while (slot.level < def.lvMax && slot.exp >= xpFn()) {
    slot.exp -= xpFn();
    slot.level += 1;
    log({ key: 'log.skill_up', params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
  }
```

Ve devamında `if (slot.level >= def.lvMax) slot.exp = Math.min(slot.exp, skillExpToNext(slot.level));`:

```typescript
  if (slot.level >= def.lvMax) slot.exp = Math.min(slot.exp, xpFn());
```

- [ ] **Step 3: combat.ts — addResistExp'e zincir XP dağıtımı ekle**

Mevcut `addResistExp` fonksiyonunun SONUNA (fonksiyon kapanmadan önce) ekle:

```typescript
  // Distribute XP to resistance chain skills and active nullification skills.
  // Chain skills (have resistType) receive rawXP/2 (depth=2: group null + ultimate).
  // Nullification skills (no resistType) receive rawXP (depth=1).
  // Petrify damage also feeds the stun_res chain (shared paralysis chain).
  const chainResistType = type === 'petrify' ? 'stun_res' : `${type}_res`;

  for (const slot of state.skills) {
    const skillDef = content.skills.get(slot.id);
    if (!skillDef || skillDef.kind !== 'resistance') continue;

    if (skillDef.resistType) {
      // Chain skill: only feeds if resistType matches
      if (skillDef.resistType !== chainResistType) continue;
      const chainXp = Math.max(1, Math.floor(amount / 2));
      slot.exp += chainXp;
      skillLevelUp(slot, state, content, log, false);
    } else {
      // Nullification skill: determine if this damage type is relevant
      const group = (skillDef as { nullGroup?: string }).nullGroup;
      const relevant = isRelevantForNull(slot.id, type);
      if (!relevant) continue;
      slot.exp += amount;
      skillLevelUp(slot, state, content, log, false);
    }
  }
```

- [ ] **Step 4: combat.ts — isRelevantForNull yardımcı fonksiyonunu ekle**

`addResistExp`'ten önce ekle:

```typescript
/** Returns true if a nullification skill should receive XP from this damage type. */
function isRelevantForNull(nullSkillId: string, type: DamageType): boolean {
  const MAGIC_TYPES: DamageType[] = ['fire', 'frost', 'lightning', 'wind', 'earth', 'dark', 'light', 'acid'];
  const PHYSICAL_TYPES: DamageType[] = ['physical', 'pierce'];
  const STATUS_TYPES: DamageType[] = ['poison', 'stun', 'petrify', 'fear'];
  const SOUL_TYPES: DamageType[] = ['soul'];
  if (nullSkillId === 'magic_nullification')    return MAGIC_TYPES.includes(type);
  if (nullSkillId === 'physical_nullification') return PHYSICAL_TYPES.includes(type);
  if (nullSkillId === 'status_nullification')   return STATUS_TYPES.includes(type);
  if (nullSkillId === 'ultimate_nullification') return true; // all damage types
  return false;
}
```

- [ ] **Step 5: combat.ts — Auto-unlock T1 chain skill**

`addResistExp`'te stat slot oluşturulduktan hemen sonra (mevcut `ensureResistSlot` çağrısından sonra) ekle:

```typescript
  // Auto-unlock T1 chain skill on first exposure to this damage type.
  autoUnlockChainSkill(state, content, type, log);
```

Ve yeni fonksiyon:

```typescript
/** Grants the T1 chain skill for a damage type if not already owned (any tier). */
function autoUnlockChainSkill(state: GameState, content: Content, type: DamageType, log: Log): void {
  const T1_MAP: Partial<Record<DamageType, string>> = {
    fire: 'fire_resistance',       frost: 'ice_resistance',       lightning: 'lightning_resistance',
    wind: 'wind_resistance',       earth: 'earth_resistance',     dark: 'dark_resistance',
    light: 'light_resistance',     acid: 'acid_resistance',       physical: 'impact_resistance',
    pierce: 'pierce_resistance',   poison: 'poison_resistance',   stun: 'stun_resistance',
    petrify: 'stun_resistance',    fear: 'fear_resistance',       soul: 'soul_resistance',
  };
  const t1Id = T1_MAP[type];
  if (!t1Id) return;
  const def = content.skills.get(t1Id);
  if (!def) return;
  // Check if any skill in this lineage is already owned.
  const lineage = skillForwardLine(content, t1Id);
  const owned = state.skills.some((s) => lineage.has(s.id));
  if (owned) return;
  state.skills.push({ id: t1Id, level: 1, exp: 0, tier: 1 });
  log({ key: 'log.chain_unlock', params: { skill: def.locKeyName } });
}
```

- [ ] **Step 6: i18n — log key ekle (tr/en/ru)**

`tr.json`:
```json
"log.chain_unlock": "Yeni direnç zinciri açıldı: {{skill}}!"
```

`en.json`:
```json
"log.chain_unlock": "New resistance chain unlocked: {{skill}}!"
```

`ru.json`:
```json
"log.chain_unlock": "Открыта новая цепочка сопротивления: {{skill}}!"
```

- [ ] **Step 7: Derleme kontrolü**

```bash
cd packages/client && npx tsc --noEmit
```

Hata yoksa devam. Tip hatası varsa düzelt.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/game/combat.ts data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(combat): XP dağıtım sistemi + resistance zinciri otomatik açılış (Task 7)"
```

---

### Task 8: Merger Sistemi

**Files:**
- Modify: `packages/client/src/game/combat.ts`

**Interfaces:**
- Consumes: `Content.resistanceMergers` (Task 2), `ResistanceMerger` (Task 1), Task 5 skill ID'leri
- Produces: `checkMergerConditions(state, content, log)`, `applyMerger(state, content, merger, log)`, hook in `skillLevelUp`

- [ ] **Step 1: combat.ts — checkMergerConditions fonksiyonu**

`addResistExp`'ten önce ekle:

```typescript
/** Checks all merger definitions; fires applyMerger for any newly satisfied mergers. */
function checkMergerConditions(state: GameState, content: Content, log: Log): void {
  for (const merger of content.resistanceMergers.values()) {
    // Skip if merger result already owned.
    if (state.skills.some((s) => s.id === merger.id)) continue;
    // Check all requirements.
    const satisfied = merger.requires.every((req) => {
      const slot = state.skills.find((s) => s.id === req.skillId);
      if (!slot) return false;
      if (req.minLevel !== undefined && slot.level < req.minLevel) return false;
      return true;
    });
    if (satisfied) applyMerger(state, content, merger, log);
  }
}
```

- [ ] **Step 2: combat.ts — applyMerger fonksiyonu**

```typescript
/** Removes component skills and spawns the merger skill at Lv1. */
function applyMerger(state: GameState, content: Content, merger: ResistanceMerger, log: Log): void {
  // Remove all component skills.
  const toRemove = new Set(merger.requires.map((r) => r.skillId));
  state.skills = state.skills.filter((s) => !toRemove.has(s.id));
  // Add merger skill at Lv1.
  const mergerDef = content.skills.get(merger.id);
  if (!mergerDef) return;
  state.skills.push({ id: merger.id, level: 1, exp: 0 });
  log({ key: 'log.merger_unlocked', params: { merger: merger.locKey } });
}
```

- [ ] **Step 3: combat.ts — skillLevelUp'tan sonra merger kontrolü çağır**

Mevcut `skillLevelUp` fonksiyonunun EN SONUNDA, `checkDerivations` çağrısından ÖNCE ekle:

```typescript
  // After any evolution, check if a resistance merger condition is now met.
  if (def.kind === 'resistance') {
    checkMergerConditions(state, content, log);
  }
```

- [ ] **Step 4: i18n — merger log key'leri ekle**

`tr.json`:
```json
"log.merger_unlocked": "{{merger}} koşulları karşılandı ve açıldı!"
```

`en.json`:
```json
"log.merger_unlocked": "{{merger}} conditions met — unlocked!"
```

`ru.json`:
```json
"log.merger_unlocked": "Условия {{merger}} выполнены — разблокировано!"
```

- [ ] **Step 5: types.ts import kontrolü**

`combat.ts` başındaki import satırında `ResistanceMerger`'ın import edildiğinden emin ol:

```typescript
import type { ..., ResistanceMerger } from '../../../shared/src/types';
```

Yoksa ekle.

- [ ] **Step 6: Derleme kontrolü**

```bash
cd packages/client && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/game/combat.ts data/i18n/tr.json data/i18n/en.json data/i18n/ru.json
git commit -m "feat(combat): merger sistemi — checkMergerConditions + applyMerger (Task 8)"
```

---

### Task 9: Hasar Azaltma — Chain Bonus + Nullification

**Files:**
- Modify: `packages/client/src/game/combat.ts` (`resistReduction` + `applyDamage`)
- Modify: `packages/client/src/game/effects.ts` (`aggregateBonuses`)

**Interfaces:**
- Consumes: `Bonuses.physNullReduction`, `Bonuses.magicNullReduction`, `Bonuses.statusNullReduction`, `Bonuses.ultimateNullLv` (Task 1)
- Produces: Chain skill tier bonus in `resistReduction`; group null + ultimate null reduction in `applyDamage`

**Ultimate Nullification koruma tablosu:**
- Lv0: 0%, Lv1: 10%, Lv2: 22%, Lv3: 34%, Lv4: 45%, Lv5: 55%, Lv6: 65%, Lv7: 75%, Lv8: 85%, Lv9: 90%, Lv10: 100%

- [ ] **Step 1: combat.ts — chainResistBonus yardımcı fonksiyonu**

`resistReduction` fonksiyonundan önce ekle:

```typescript
/** Extra resistance % from the active resistance chain skill for this damage type.
 *  Returns a fraction (0–0.40) added on top of the stat-based reduction. */
function chainResistBonus(state: GameState, content: Content, type: DamageType): number {
  const chainResistType = type === 'petrify' ? 'stun_res' : `${type}_res`;
  for (const slot of state.skills) {
    const def = content.skills.get(slot.id);
    if (!def || def.kind !== 'resistance' || def.resistType !== chainResistType) continue;
    const bonus = (def.tierStatBonus ?? 0) / 100; // e.g. 40 → 0.40
    const s = Math.min(1, slot.level / Math.max(1, def.lvMax));
    return bonus * s;
  }
  return 0;
}
```

- [ ] **Step 2: combat.ts — resistReduction'a chain bonus ekle**

Mevcut `resistReduction`:

```typescript
function resistReduction(state: GameState, content: Content, type: DamageType): number {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return 0;
  if (slot.nullified) return 0.95;
  return Math.min(slot.level * 0.05, 0.9);
}
```

Değiştir:

```typescript
function resistReduction(state: GameState, content: Content, type: DamageType): number {
  const slot = ensureResistSlot(state, content, type);
  if (!slot) return 0;
  if (slot.nullified) return 0.95;
  const statReduction = Math.min(slot.level * 0.05, 0.9);
  const chainBonus = chainResistBonus(state, content, type);
  // Combined cap at 0.95 to reserve 5% floor until Ultimate Nullification
  return Math.min(statReduction + chainBonus, 0.95);
}
```

- [ ] **Step 3: effects.ts — aggregateBonuses'ta nullification skill'lerini hesapla**

Task 1'de eklenen kod bu Task'ta çalışmaya başlar (hiçbir değişiklik gerekmez — Task 1'de zaten eklenmiş olmalı). Kontrol: `aggregateBonuses` içinde `if (def.kind === 'resistance')` bloğunun mevcut olduğunu doğrula.

- [ ] **Step 4: combat.ts — applyDamage'e group + ultimate null azaltmasını ekle**

`applyDamage` fonksiyonunu bul (kabaca satır 600-620 civarı). Mevcut yapı:

```typescript
const reduction = resistReduction(state, content, type);
// ... (armor, painNull vb.)
const finalDamage = Math.max(0, rawDamage - ...);
```

`resistReduction` çağrısından sonra şu bloğu ekle:

```typescript
  // Group nullification reduction (applies after resistance)
  const bonuses = aggregateBonuses(state, content);
  const groupNullPct = getGroupNullPct(bonuses, type);

  // Ultimate Nullification
  const ULT_PCT = [0, 10, 22, 34, 45, 55, 65, 75, 85, 90, 100];
  const ultLv = bonuses.ultimateNullLv;
  const ultPct = ULT_PCT[Math.min(ultLv, 10)] ?? 0;
  // Nullifier enemies bypass full immunity
  const isNullifier = (currentEnemy?.behavior?.nullifier) ?? false;
  const effectiveUltPct = (ultLv >= 10 && isNullifier)
    ? Math.min(ultLv * 6, 60)  // capped at 60% for nullifier enemies
    : ultPct;
```

Ardından `finalDamage` hesaplamasına bu azaltmaları uygula. Mevcut kod (örnek):

```typescript
let dmg = Math.max(1, rawDamage * (1 - reduction) - bonuses.armor);
```

Değiştir:

```typescript
let dmg = Math.max(1, rawDamage * (1 - reduction) - bonuses.armor);
dmg = dmg * (1 - groupNullPct / 100);
dmg = dmg * (1 - effectiveUltPct / 100);
dmg = Math.max(0, Math.floor(dmg));
// Full immunity at Lv10 (non-nullifier only): block all damage
if (ultLv >= 10 && !isNullifier) dmg = 0;
```

- [ ] **Step 5: combat.ts — getGroupNullPct yardımcı fonksiyon**

```typescript
/** Returns the applicable group nullification percentage (0–85) for a damage type. */
function getGroupNullPct(bonuses: Bonuses, type: DamageType): number {
  const MAGIC: DamageType[] = ['fire', 'frost', 'lightning', 'wind', 'earth', 'dark', 'light', 'acid'];
  const PHYSICAL: DamageType[] = ['physical', 'pierce'];
  const STATUS: DamageType[] = ['poison', 'stun', 'petrify', 'fear'];
  if (MAGIC.includes(type))    return bonuses.magicNullReduction * 100;
  if (PHYSICAL.includes(type)) return bonuses.physNullReduction * 100;
  if (STATUS.includes(type))   return bonuses.statusNullReduction * 100;
  if (type === 'soul')         return 0; // Soul has no group null, goes directly to Ultimate
  return 0;
}
```

- [ ] **Step 6: Gerekli import'ları kontrol et**

`combat.ts` import'larına `aggregateBonuses` import edildiğinden emin ol:

```typescript
import { aggregateBonuses } from './effects';
```

Zaten varsa atla.

- [ ] **Step 7: Derleme kontrolü**

```bash
cd packages/client && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/game/combat.ts packages/client/src/game/effects.ts
git commit -m "feat(combat): chain direnç bonusu + grup/ultimate nullification hasar azaltma (Task 9)"
```

---

### Task 10: Changelog v1.13.0

**Files:**
- Modify: `packages/client/src/changelog.ts`

- [ ] **Step 1: changelog.ts'e v1.13.0 ekle**

Mevcut en üst entry'den önce ekle:

```typescript
  {
    version: '1.13.0',
    date: '2026-06-24',
    changes: [
      'feat: 14 resistance zinciri (T1→T5 evrim) — ateş, buz, yıldırım, rüzgar, toprak, karanlık, ışık, asit, fiziksel, delici, zehir, felç, korku, ruh',
      'feat: grup merger sistemi — Physical / Magic / Status Nullification (tüm T5\'ler tamamlanınca otomatik birleşir)',
      'feat: Ultimate Nullification — Lv10\'da %100 bağışıklık (nullifier düşmanlar hariç)',
      'feat: 4 yeni hasar/direnç tipi — rüzgar, toprak, karanlık, ışık',
      'feat: 7 yeni pasif zincir — Beş Duyu, Olasılık Düzeltme, Yıldırım Korku, Gece Görüşü, Ejderha Zırhı, Ölümsüzlük, Atletizm',
      'feat: otomatik T1 zincir açılışı — ilk kez o hasar tipinden hasar alınca',
    ],
  },
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/changelog.ts
git commit -m "chore: v1.13.0 changelog — resistance nullification sistemi (Task 10)"
```

---

## Görev Bağımlılıkları

```
Task 1 (Types)
    ↓
Task 2 (Data)    ← Task 1'den sonra
    ↓
Tasks 3-6 (Skills JSON + i18n) ← Task 1-2'den sonra; birbiriyle PARALEL yapılabilir
    ↓
Task 7 (XP Sistemi) ← Tasks 1-6 tamamlandıktan sonra
    ↓
Task 8 (Merger Sistemi) ← Task 7'den sonra
    ↓
Task 9 (Hasar Azaltma) ← Task 8'den sonra
    ↓
Task 10 (Changelog) ← Task 9'dan sonra
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-24-resistance-nullification.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Task başına fresh subagent + review, hızlı iterasyon

**2. Inline Execution** — Bu session'da adım adım, checkpoint'lerle

**Which approach?**
