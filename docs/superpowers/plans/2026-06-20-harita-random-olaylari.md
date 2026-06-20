# Harita Random Olayları — Implementation Plan

> **For agentic workers:** Task-task uygula. Bu projede test framework'ü YOK; doğrulama
> `npm run typecheck` + (UI/akış için) `npm run build` + manuel kontrol. Adımlar `- [ ]`.

**Goal:** Zindan odalarına seçim-tabanlı, bilgi-kapılı mini olaylar (events.json) eklemek.

**Architecture:** Yeni izole `events.ts` olay mantığını taşır; `combat.ts` oda-girişinde
(`combatRound`) olay dalı ekler (olay → keşif → savaş önceliği); `pendingEvent` doluyken
savaş/ilerleme bloklu. UI olay panelini `combatTab`'a koyar. İçerik `events.json`'da, denge
data-driven. Bilgi = önsezi (sonuç önizleme) + kapı (koşullu seçenek).

**Tech Stack:** TypeScript, Vite, vanilla DOM. Monorepo `@mri/client`, `@mri/shared`.

## Global Constraints

- **Kural 0:** Kalıcı değişiklik yalnız onaylı planla (bu plan onaylı).
- **Multilanguage (Kural 2):** Oyuncuya görünen TÜM metin `t(key)`'den. Koda metin gömülmez.
- **Data-driven (Kural 3):** Denge sayıları `events.json`'da; kodda sabit yok (`eventRate` hariç tek global, ileride dungeon.json'a taşınabilir).
- Doğrulama: `npm run typecheck`; akış/UI task'larında ayrıca `npm run build`.
- **Outcome `hp` negatifse hasar; canı 0'a indirebilir → normal ölüm akışı (kasıtlı, telgraflı).**

---

### Task 1: Veri tipleri (`@mri/shared`)

**Files:**
- Modify: `packages/shared/src/types.ts`

**Interfaces:**
- Produces: `EventCond`, `EventOutcomeKind`, `EventOutcome`, `EventChoice`, `EventDef`

- [ ] **Step 1: `types.ts` — `SecretRoom` arayüzünden sonra ekle:**

```ts
export interface EventCond {
  appraisalTier?: number;
  int?: number;
  stat?: Partial<Record<StatKey, number>>;
  skill?: { id: string; level: number };
  unlock?: string;
}

export type EventOutcomeKind =
  | 'ep' | 'stat' | 'skill' | 'unlock' | 'fragment'
  | 'hp' | 'status' | 'scar' | 'hunger'
  | 'food' | 'sin' | 'virtue' | 'spawn' | 'none';

export interface EventOutcome {
  kind: EventOutcomeKind;
  value?: string | number;
  amount?: number;
  locKeyResult: string;
}

export interface EventChoice {
  locKey: string;
  requires?: EventCond;
  outcomes?: EventOutcome[];
  random?: { weight: number; outcomes: EventOutcome[] }[];
}

export interface EventDef {
  id: string;
  locKey: string;
  icon?: string;
  layers?: number[];
  weight?: number;
  revealReq?: { appraisalTier?: number; int?: number };
  choices: EventChoice[];
}
```

- [ ] **Step 2: Doğrula.** `npm run typecheck`. Beklenen: hata yok.

- [ ] **Step 3: Commit.**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(events): EventDef/Choice/Outcome/Cond tipleri"
```

---

### Task 2: Durum alanları (`state.ts`)

**Files:**
- Modify: `packages/client/src/game/state.ts`

**Interfaces:**
- Produces: `GameState.pendingEvent: { id: string; roomKey: string } | null`, `GameState.resolvedEvents: string[]`

- [ ] **Step 1: Arayüze ekle** (`roomCleared: boolean;` satırından önce):

```ts
  /** Çözülmemiş harita olayı (varsa savaş/ilerleme bloklu). */
  pendingEvent: { id: string; roomKey: string } | null;
  /** Çözülen olay odalarının anahtarları (layer.floor.room) — farm'da tekrar tetiklenmez. */
  resolvedEvents: string[];
```

- [ ] **Step 2: `newGame()` literaline ekle** (`roomCleared: false,`'dan önce):

```ts
    pendingEvent: null,
    resolvedEvents: [],
```

- [ ] **Step 3: Doğrula + commit.** `npm run typecheck` → hata yok.

```bash
git add packages/client/src/game/state.ts
git commit -m "feat(events): pendingEvent + resolvedEvents durumu"
```

---

### Task 3: Olay mantığı — yeni `events.ts`

**Files:**
- Create: `packages/client/src/game/events.ts`

**Interfaces:**
- Consumes: `Content.events` (Task 4), `GameState` (Task 2), `appraisalTier` (eyes.ts), `gainSin`/`gainVirtue` (ruler.ts), `recomputeMaxes` (state.ts)
- Produces:
  - `rollRoomEvent(state, content): string | null`
  - `pickEventDef(state, content): EventDef | null`
  - `chooseEvent(state, content, choiceIndex, log): boolean`
  - `condMet(state, cond): boolean`
  - `foresee(state, def): boolean`

- [ ] **Step 1: `events.ts` oluştur:**

```ts
import type { EventDef, EventChoice, EventOutcome, EventCond, StatKey } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';
import { appraisalTier } from './eyes';
import { gainSin, gainVirtue } from './ruler';
import { spawnEventEnemy } from './combat';

type Log = (e: LogEvent) => void;

/** Bir oda olay odası mı (kararlı hash) ve çözülmemiş mi → olay id. */
const EVENT_RATE = 0.12;

function roomKeyOf(state: GameState): string {
  return `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
}

/** Keşif odalarından bağımsız, kararlı hash kanalı (salt'lı). */
function eventHash(layer: number, floor: number, room: number): number {
  let n = (Math.imul(layer * 31 + 7, 2654435761) ^ Math.imul(floor + 101, 40503) ^ Math.imul(room + 17, 2246822519)) >>> 0;
  n = (n ^ (n >>> 15)) >>> 0;
  return (n % 100000) / 100000;
}

export function condMet(state: GameState, cond?: EventCond): boolean {
  if (!cond) return true;
  if (cond.appraisalTier != null && appraisalTier(state) < cond.appraisalTier) return false;
  if (cond.int != null && state.stats.INT < cond.int) return false;
  if (cond.stat) for (const [k, v] of Object.entries(cond.stat)) if (state.stats[k as StatKey] < (v ?? 0)) return false;
  if (cond.skill && !state.skills.some((s) => s.id === cond.skill!.id && s.level >= cond.skill!.level)) return false;
  if (cond.unlock && !state.unlocks.includes(cond.unlock)) return false;
  return true;
}

/** Önsezi açık mı (sonuç önizlemesi gösterilir). */
export function foresee(state: GameState, def: EventDef): boolean {
  const r = def.revealReq;
  if (!r) return false;
  if (r.appraisalTier != null && appraisalTier(state) >= r.appraisalTier) return true;
  if (r.int != null && state.stats.INT >= r.int) return true;
  return false;
}

/** Bu odaya uygun olayı (kararlı) seç; yoksa null. */
export function pickEventDef(state: GameState, content: Content): EventDef | null {
  const layer = state.pos.layer;
  const eligible = [...content.events.values()].filter((e) => !e.layers || e.layers.includes(layer));
  if (!eligible.length) return null;
  const totalW = eligible.reduce((s, e) => s + (e.weight ?? 1), 0);
  let r = eventHash(layer + 999, state.pos.floor, state.pos.room) * totalW;
  for (const e of eligible) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

/** Bu oda çözülmemiş bir olay odasıysa olay id'sini döndür (kararlı). */
export function rollRoomEvent(state: GameState, content: Content): string | null {
  const { layer, floor, room } = state.pos;
  if (room <= 1) return null; // giriş odası güvenli
  const key = roomKeyOf(state);
  if (state.resolvedEvents.includes(key)) return null;
  if (eventHash(layer, floor, room) >= EVENT_RATE) return null;
  return pickEventDef(state, content)?.id ?? null;
}

function applyOutcome(state: GameState, content: Content, o: EventOutcome, log: Log): void {
  const amt = o.amount ?? (typeof o.value === 'number' ? o.value : 0);
  switch (o.kind) {
    case 'ep': state.ep += amt; break;
    case 'stat': if (typeof o.value === 'string') { state.stats[o.value as StatKey] += amt || 1; recomputeMaxes(state); } break;
    case 'skill': if (typeof o.value === 'string' && !state.skills.some((s) => s.id === o.value)) state.skills.push({ id: o.value, level: 1, exp: 0 }); break;
    case 'unlock': if (typeof o.value === 'string' && !state.unlocks.includes(o.value)) state.unlocks.push(o.value); break;
    case 'fragment': if (o.value === 'map') state.mapFragments += amt || 1; else state.loreFragments += amt || 1; break;
    case 'hp': state.hp = Math.max(0, Math.min(state.maxHp, state.hp + amt)); break; // amt<0 hasar; 0 → ölüm
    case 'status': if (typeof o.value === 'string') state.statusEffects.push({ type: o.value as never, ticksLeft: amt || 5, dmgPerTick: Math.max(1, Math.round(state.maxHp * 0.01)) }); break;
    case 'scar': state.scars += amt || 1; break;
    case 'hunger': state.hunger = Math.max(0, Math.min(100, state.hunger + amt)); break;
    case 'food': state.inventory.push({ enemyId: typeof o.value === 'string' ? o.value : 'cave_pest', satiety: amt || 30, decay: 0 }); break;
    case 'sin': gainSin(state, content, amt || 1, log); break;
    case 'virtue': gainVirtue(state, content, amt || 1, log); break;
    case 'spawn': if (typeof o.value === 'string') spawnEventEnemy(state, content, o.value, log); break;
    case 'none': break;
  }
  log({ key: o.locKeyResult });
}

/** Bir random daldan ağırlıklı seç. */
function pickRandom(branches: NonNullable<EventChoice['random']>): EventOutcome[] {
  const total = branches.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const b of branches) { r -= b.weight; if (r <= 0) return b.outcomes; }
  return branches[branches.length - 1].outcomes;
}

/** Seçim uygula: koşul doğrula → outcome → log → çözüldü işaretle → blok kalk. */
export function chooseEvent(state: GameState, content: Content, choiceIndex: number, log: Log): boolean {
  const pe = state.pendingEvent;
  if (!pe) return false;
  const def = content.events.get(pe.id);
  const choice = def?.choices[choiceIndex];
  if (!def || !choice) return false;
  if (!condMet(state, choice.requires)) { log({ key: 'log.ev_locked' }); return false; }

  const outcomes = choice.random ? pickRandom(choice.random) : (choice.outcomes ?? []);
  const spawns = outcomes.some((o) => o.kind === 'spawn');
  for (const o of outcomes) applyOutcome(state, content, o, log);

  state.resolvedEvents.push(pe.roomKey);
  state.pendingEvent = null;
  // 'spawn' olduysa savaş başlar (combatRound enemy ile devam eder); aksi halde oda "çözüldü" → ilerle/bekle.
  if (!spawns && state.hp > 0) {
    if (state.autoAdvance) {
      // advancePosition combat.ts'te; burada roomCleared bırakıp combatRound'a devretmek yerine işaret:
      state.roomCleared = true;
    } else {
      state.roomCleared = true;
    }
  }
  return true;
}
```

> **Mantık notu:** `chooseEvent` `roomCleared=true` bırakır (spawn yoksa) → mevcut "Advance" akışı
> (manuel) ya da oto-ilerle devralır. `combat.ts` tarafı `pendingEvent` doluyken combat'ı bloklar.

- [ ] **Step 2: Doğrula.** `npm run typecheck` (Task 4 `Content.events` + Task 5 `spawnEventEnemy`
  eklenmeden derlenmez — bu task 4 & 5 ile birlikte doğrulanır). Commit Task 5 sonunda.

---

### Task 4: İçerik yükleme (`content.ts`)

**Files:**
- Modify: `packages/client/src/game/content.ts`

- [ ] **Step 1:** `import type { ... EventDef }` ekle; `Content` arayüzüne `events: Map<string, EventDef>;`
  ekle; yükleme dizisine `fetchJson<EventDef[]>(\`${base}events.json\`)` ekle ve destructuring'e
  `events` ekle; dönen objeye `events: byId(events),` ekle. (Mevcut `rooms`/`secret_rooms.json`
  desenini birebir izle.)

- [ ] **Step 2:** `npm run typecheck` (events.json yoksa fetch runtime'da patlar ama tip geçer;
  Task 8 dosyayı yaratır). Commit Task 5 ile.

---

### Task 5: Combat kavşakları (`combat.ts`)

**Files:**
- Modify: `packages/client/src/game/combat.ts`

**Interfaces:**
- Produces: `spawnEventEnemy(state, content, enemyId, log): void` (events.ts kullanır)
- Consumes: `rollRoomEvent` (Task 3)

- [ ] **Step 1: import ekle** (dosya başı): `import { rollRoomEvent } from './events';`

- [ ] **Step 2: `combatRound` başına olay dalı + blok.** `if (state.roomCleared) return;` satırından
  ÖNCE:

```ts
  if (state.pendingEvent) return; // olay paneli açık — seçim yapılana kadar savaş yok
```

  ve `if (!state.enemy) {` bloğunun en başına (exploration kontrolünden ÖNCE):

```ts
    const evId = rollRoomEvent(state, content);
    if (evId) {
      state.pendingEvent = { id: evId, roomKey: `${state.pos.layer}.${state.pos.floor}.${state.pos.room}` };
      return; // olay kuruldu; UI panel gösterir
    }
```

- [ ] **Step 3: `advanceRoom` başına blok.** `export function advanceRoom(...)` gövdesinin başına:

```ts
  if (state.pendingEvent) return; // çözülmemiş olay varken ilerlenemez
```

- [ ] **Step 4: `spawnEventEnemy` ekle** (spawnEnemy'nin yanına). spawnEnemy'nin gövdesini sarmalayan
  bir varyant — verilen `enemyId` ile, boss olmadan, mevcut derinlik ölçeğiyle bir düşman kurar:

```ts
/** Olay sonucu: belirli bir düşmanı bu odada başlat (boss değil). */
export function spawnEventEnemy(state: GameState, content: Content, enemyId: string, log: Log): void {
  const def = content.enemies.get(enemyId);
  if (!def) return;
  const diff = diffDef(state, content);
  const depth = (state.pos.layer - 1) * 100 + (state.pos.floor - 1) * 15 + state.pos.room;
  const hpMult = (1 + depth * DEPTH_HP) * diff.enemyMult;
  const atkMult = (1 + depth * DEPTH_ATK) * diff.enemyMult;
  state.enemy = {
    id: enemyId, locKey: def.locKey, hp: Math.round(def.hp * hpMult), maxHp: Math.round(def.hp * hpMult),
    attack: Math.round(def.attack * atkMult), damageType: def.damageType, damageType2: def.damageType2,
    ep: def.ep, satiety: def.satiety, isBoss: false, atkCd: ENEMY_ATK_INTERVAL, race: def.race, icon: def.icon,
  };
  log({ key: 'log.ev_spawn', params: { enemy: def.locKey } });
}
```

> **Mantık notu:** `spawnEventEnemy` alanları `spawnEnemy` ile birebir aynı şema olmalı (EnemyInstance).
> Step 4 yazılırken `spawnEnemy`'nin gerçek alan setine bakıp eşitle (DRY: ortak bir `makeEnemy` helper'ı
> çıkarmak daha temiz — `spawnEnemy` ve `spawnEventEnemy` ikisi de onu çağırsın; mantık denetiminde uygula).

- [ ] **Step 5: Ölüm/rebirth reset.** `onDeath` ve `rebirth` (rebirth.ts) içinde `state.pendingEvent = null;`
  ekle (olayda takılı kalmasın). `onDeath`'te `state.roomCleared = false;` yakınına; `rebirth`'te reset bloğuna.

- [ ] **Step 6: Doğrula.** `npm run typecheck` (Task 8 events.json olmadan fetch runtime'da boş döner;
  tip/derleme geçer). `npm run build`. Beklenen: ikisi de hatasız.

- [ ] **Step 7: Commit (Task 3-5 birlikte).**

```bash
git add packages/client/src/game/events.ts packages/client/src/game/content.ts packages/client/src/game/combat.ts packages/client/src/game/rebirth.ts
git commit -m "feat(events): events.ts mantik + combat kavsaklari + content yukleme"
```

---

### Task 6: UI — olay paneli (`ui.ts`)

**Files:**
- Modify: `packages/client/src/ui.ts` (combatTab + yeni `eventPanel` + import + ACTIONS + wiring)
- Modify: `packages/client/index.html` (CSS)
- Modify: `packages/client/src/main.ts` (`onChooseEvent` wiring)

- [ ] **Step 1: ACTIONS tipine ekle** (ui.ts Actions arayüzü): `onChooseEvent: (i: number) => void;`

- [ ] **Step 2: import:** `import { chooseEvent, condMet, foresee } from './game/events';`
  (chooseEvent UI'da değil main'de çağrılır; ui'da `condMet`/`foresee` + `CONTENT.events` kullanılır.)

- [ ] **Step 3: `eventPanel(state)` fonksiyonu** (combatTab üstüne):

```ts
function eventPanel(state: GameState): string {
  const pe = state.pendingEvent;
  if (!pe) return '';
  const def = CONTENT.events.get(pe.id);
  if (!def) return '';
  const reveal = foresee(state, def);
  const choices = def.choices
    .map((c, i) => {
      const ok = condMet(state, c.requires);
      const fore = reveal
        ? (c.random ?? c.outcomes ?? []).map((o) => ('outcomes' in o ? o.outcomes : [o]))
        : null;
      const preview = reveal
        ? `<div class="muted ev-foresee">↳ ${[...(c.outcomes ?? []), ...(c.random?.flatMap((b) => b.outcomes) ?? [])].map((o) => t(o.locKeyResult)).join(' / ')}</div>`
        : '';
      const lock = !ok ? ` <span class="muted">(${t('ui.ev_requires')})</span>` : '';
      return `<button class="evchoice" data-evchoice="${i}"${ok ? '' : ' disabled'}>${t(c.locKey)}${lock}</button>${preview}`;
    })
    .join('');
  return `<section class="panel evpanel"><div class="ev-head">${def.icon ?? '❗'} <b>${t('ui.ev_title')}</b></div>
    <p>${t(def.locKey)}</p><div class="ev-choices">${choices}</div></section>`;
}
```

> **Mantık notu (denetimde düzelt):** önsezi önizleme `fore` değişkeni kullanılmıyor; sadeleştir —
> `preview` zaten outcome `locKeyResult`'larını listeliyor. Gereksiz `fore`'u sil.

- [ ] **Step 4: combatTab'a yerleştir.** combatTab return'ünün EN ÜSTÜNE (enemy panelinden önce):
  `${eventPanel(state)}` ve olay varken savaş kontrollerini gizle: `state.pendingEvent` doluyken
  `${act(...)}` kontrol bloğunu ve advance/skillBar'ı render etme (koşullu).

- [ ] **Step 5: wiring (ui.ts bind fonksiyonu):**

```ts
  el.querySelectorAll<HTMLButtonElement>('.evchoice').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onChooseEvent(Number(b.dataset.evchoice))),
  );
```

- [ ] **Step 6: main.ts wiring:**

```ts
    onChooseEvent: (i) => { chooseEvent(state, content, i, logFn); save(state); render(state); },
```

  (+ `import { chooseEvent } from './game/events';` main.ts'e.)

- [ ] **Step 7: CSS (index.html, .evotree yakınına):**

```css
.evpanel .ev-head { font-size: 0.95rem; margin-bottom: 0.3rem; }
.ev-choices { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
.evchoice { text-align: left; }
.ev-foresee { font-size: 0.72rem; margin: -0.2rem 0 0.2rem 0.4rem; }
```

- [ ] **Step 8: Doğrula + commit.** `npm run typecheck && npm run build` → temiz.

```bash
git add packages/client/src/ui.ts packages/client/index.html packages/client/src/main.ts
git commit -m "feat(events): olay paneli UI + secim wiring"
```

---

### Task 7: Sistem i18n anahtarları (tr + en)

**Files:** `data/i18n/tr.json`, `data/i18n/en.json`

- [ ] **Step 1:** İki dosyaya da sistem etiketleri: `ui.ev_title`, `ui.ev_requires`, `ui.ev_foresee`,
  `log.ev_locked`, `log.ev_spawn` (`{enemy}`). TR örnek: `"ui.ev_title": "Bir Olay"`,
  `"ui.ev_requires": "kilitli"`, `"log.ev_locked": "Bu seçenek kilitli."`,
  `"log.ev_spawn": "{enemy} beliriverdi!"`. EN karşılıkları.

- [ ] **Step 2:** typecheck → commit.

```bash
git add data/i18n/tr.json data/i18n/en.json
git commit -m "feat(events): sistem i18n anahtarlari"
```

---

### Task 8: İçerik — `events.json` (~20 olay) + olay loc anahtarları

**Files:** `data/events.json` (yeni), `data/i18n/tr.json`, `data/i18n/en.json`

Her olay `EventDef` şeması (Task 1). Her `locKey`/`locKeyResult`/seçenek `locKey` tr+en'de tanımlanır.
**Örnek (Çatal yol)** — pattern kilidi:

```json
{
  "id": "fork", "icon": "🔀", "locKey": "ev.fork.text", "weight": 2,
  "revealReq": { "appraisalTier": 2, "int": 25 },
  "choices": [
    { "locKey": "ev.fork.left", "random": [
      { "weight": 3, "outcomes": [{ "kind": "ep", "amount": 8, "locKeyResult": "ev.fork.left_ok" }] },
      { "weight": 1, "outcomes": [{ "kind": "hp", "amount": -10, "locKeyResult": "ev.fork.left_bad" }] } ] },
    { "locKey": "ev.fork.right", "outcomes": [{ "kind": "fragment", "value": "lore", "amount": 1, "locKeyResult": "ev.fork.right_ok" }] }
  ]
}
```

**Örnek (Tuzak — kapı + risk)**:

```json
{
  "id": "trap", "icon": "🪤", "locKey": "ev.trap.text", "revealReq": { "appraisalTier": 1 },
  "choices": [
    { "locKey": "ev.trap.disarm", "requires": { "int": 30 }, "outcomes": [{ "kind": "ep", "amount": 12, "locKeyResult": "ev.trap.disarm_ok" }] },
    { "locKey": "ev.trap.force", "outcomes": [{ "kind": "hp", "amount": -40, "locKeyResult": "ev.trap.force_hurt" }] },
    { "locKey": "ev.trap.retreat", "outcomes": [{ "kind": "ep", "amount": -5, "locKeyResult": "ev.trap.retreat" }] }
  ]
}
```

- [ ] **Step 1:** Spec §10 kataloğundaki **20 olayı** bu şemada `events.json`'a yaz. Her olayın
  layer kısıtı (element=2,3; boşluk yarığı=3), weight, revealReq, choices/outcomes spec'teki bağlara göre.
- [ ] **Step 2:** Her olay/seçenek/sonuç loc anahtarını tr.json + en.json'a ekle (atmosferik, lore-uyumlu).
- [ ] **Step 3:** `npm run typecheck && npm run build` → temiz.
- [ ] **Step 4: Commit.**

```bash
git add data/events.json data/i18n/tr.json data/i18n/en.json
git commit -m "feat(events): 20 olayli icerik katalogu (tr+en)"
```

---

### Task 9: Sistemler-arası mantık denetimi + düzeltme

**Amaç:** Kavşaklardaki mantık hatalarını bul ve düzelt (Atıl'ın özel isteği).

- [ ] **Step 1: Oda-tipi önceliği.** `combatRound`'da sıra: `pendingEvent` blok → `roomCleared` →
  event → exploration → combat. Çakışma yok mu? event hash kanalı exploration'dan bağımsız (salt);
  event önce kontrol edildiği için öncelik nettir. Doğrula.
- [ ] **Step 2: İlerleme kilidi.** `advanceRoom` + `onSetPos` (main.ts) + oto-ilerle (`advancePosition`
  via clearRoom) `pendingEvent` doluyken ilerletmemeli. Hepsini gözden geçir; `advancePosition` zaten
  yalnız combat/clearRoom'dan çağrılıyor, olay sırasında combat bloklu → güvenli. `onSetPos` (farm
  zıplama): olay sırasında zıplarsa `pendingEvent` başka odaya ait roomKey ile kalır → **bug**.
  Düzeltme: `onSetPos` ve `onSelectLayer`/rebirth/death pos değişiminde `pendingEvent = null`.
- [ ] **Step 3: resolvedEvents & roomKey.** roomKey `layer.floor.room`; aynı koordinat farklı katmanda
  çakışmaz (layer dahil). Rebirth sonrası resolvedEvents sıfırlanmalı mı? Rebirth haritayı sıfırlıyorsa
  (yeni koşu) evet → rebirth resetine `resolvedEvents=[]`, `seenForms` gibi davran. Kontrol et.
- [ ] **Step 4: spawn outcome.** 'spawn' sonrası `pendingEvent=null` ama `roomCleared` set EDİLMEZ →
  combatRound enemy ile savaşa devam eder. Düşman ölünce normal `onKill→clearRoom`. Doğru akış mı? Doğrula.
- [ ] **Step 5: hp=0 outcome → ölüm.** `chooseEvent` sonrası `state.hp<=0` ise tick'teki `onDeath`
  bir sonraki turda mı tetiklenir? `chooseEvent` main'den (tick dışı) çağrılıyor → ölüm hemen işlenmeli.
  Düzeltme: `chooseEvent` sonunda `if (state.hp<=0)` ölüm yerine: main wiring'de choose sonrası
  `if (state.hp<=0)` kontrolü, ya da chooseEvent içinde onDeath çağrısı (combat.ts'e bağımlılık →
  daha temiz: main `onChooseEvent`'te tick benzeri ölüm kontrolü). Uygula.
- [ ] **Step 6: status outcome tipi.** `StatusEffect` şemasına (state.ts) bak; `type` DamageType,
  `ticksLeft`, `dmgPerTick` alan adları birebir eşleşmeli. Doğrula/düzelt.
- [ ] **Step 7: Bu oturumda eklenen önceki sistemlerle çakışma.** Oda modeli (per-floor) + evrim ağacı
  + olaylar arası: `recordExplored` olay odasında da çalışmalı mı? Olay odası keşif sayılır →
  çözülünce `recordExplored(state)` çağır (fog ilerlesin). Ekle.
- [ ] **Step 8: typecheck + build + manuel.** Hepsi temiz; manuel kontrol (spec §12).
- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "fix(events): sistemler-arasi mantik denetimi duzeltmeleri"
```

---

## Self-Review (plan ↔ spec)

- **Spec §2 olay odası/blok:** Task 5 (combatRound event dalı + blok), Task 9 öncelik denetimi. ✓
- **Spec §3 veri modeli:** Task 1. ✓
- **Spec §4 bilgi (önsezi+kapı):** Task 3 `condMet`/`foresee`, Task 6 panel. ✓
- **Spec §5 akış/events.ts:** Task 3. ✓
- **Spec §6 state/migrate:** Task 2 + migrate (Task 2 Step'e migrate eklenmeli → main.ts; düzeltildi: Task 2'ye migrate eklenmediyse Task 9 Step 3'te ele alınır — NET: migrate backfill main.ts'te, aşağı not).
- **Spec §7 UI:** Task 6. ✓
- **Spec §8 i18n:** Task 7 (sistem) + Task 8 (içerik). ✓
- **Spec §9 denge/data-driven:** EVENT_RATE tek global; gerisi JSON. ✓
- **Spec §10 katalog ~20:** Task 8. ✓
- **Spec §12 test:** Task 9 Step 8. ✓

> **DÜZELTME (migrate):** Task 2'ye eksik kalan migrate backfill: `main.ts migrate()`'e
> `s.pendingEvent ??= null; s.resolvedEvents ??= [];` eklenir — Task 6 Step 6 main.ts dokunuşuyla
> aynı turda yapılır.
> **Tip tutarlılığı:** `rollRoomEvent`/`chooseEvent`/`condMet`/`foresee`/`spawnEventEnemy` adları
> tüm task'larda aynı. `pendingEvent` şekli `{id, roomKey}` her yerde aynı. ✓
