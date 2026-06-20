# Bilmece-Boss Odaları + Deneme Limitleri — Implementation Plan

> **For agentic workers:** Task-task uygula. Test framework YOK; doğrulama `npm run typecheck`
> + (akış/UI için) `npm run build` + manuel. Adımlar `- [ ]`.

**Goal:** Boss odalarını şansla bilmece sınavına çevirmek (çöz→Atla/Savaş+zorluk; yanlış→tırmanan
canavar/boss) ve normal bilmecelere 3-hak + süreli kilit eklemek.

**Architecture:** Yeni izole `riddles.ts` (saf mantık: şans/seçim/cevap+limit). `combat.ts` boss-oda
dalı + `applyBossClear` DRY helper + riddleGuard/zorluk spawn + boss-bilmece çözümü. `discovery.ts`
normal bilmece limiti. UI `pendingEvent` desenini izler.

**Tech Stack:** TypeScript, Vite, vanilla DOM. Monorepo `@mri/client`, `@mri/shared`.

## Global Constraints

- **Kural 0:** onaylı planla. **Kural 2:** tüm metin `t(key)`. **Kural 3:** denge `boss_riddles.json`/sabitler.
- Boss "atla" = boss zekayla yenildi (gatekeeper ise rebirth açılır).
- Zaman gerçek-saat `Date.now()`; kilit 30dk→60dk (cap 60dk).
- Doğrulama: `npm run typecheck`; akış/UI'da `npm run build`.

---

### Task 1: Tipler + içerik (`types.ts`, `boss_riddles.json`, `content.ts`)

**Files:** `packages/shared/src/types.ts`, `data/boss_riddles.json` (yeni), `packages/client/src/game/content.ts`, `data/i18n/tr.json`, `data/i18n/en.json`

**Interfaces:** Produces `BossRiddle`, `Content.bossRiddles`

- [ ] **Step 1: `types.ts` — `SecretRoom`'dan sonra:**

```ts
export interface BossRiddle {
  id: string;
  bossId: string;
  locKey: string;
  locKeyClue: string;
  answers: { tr: string[]; en: string[] };
  reward: { kind: 'skill' | 'stat' | 'unlock' | 'ep' | 'fragment'; value: string | number; amount?: number };
}
```

- [ ] **Step 2: `content.ts`** — import `BossRiddle`; `Content`'e `bossRiddles: Map<string, BossRiddle>;`;
  yükleme dizisine `fetchJson<BossRiddle[]>(\`${base}boss_riddles.json\`)` (+destructure `bossRiddles`);
  dönüşe `bossRiddles: byId(bossRiddles),`. (`events.json` desenini izle; `byId` bossId değil id ile —
  ama erişim bossId ile lazım → dönüşte `new Map(bossRiddles.map((r) => [r.bossId, r]))` kullan.)

- [ ] **Step 3: `data/boss_riddles.json`** — 3 zor bilmece (cave_lurker / flame_jaw / bone_render):

```json
[
  { "id": "br_cave", "bossId": "cave_lurker", "locKey": "br.cave.text", "locKeyClue": "br.cave.clue",
    "answers": { "tr": ["karanlik", "karanlık"], "en": ["darkness", "dark"] },
    "reward": { "kind": "ep", "value": 25 } },
  { "id": "br_flame", "bossId": "flame_jaw", "locKey": "br.flame.text", "locKeyClue": "br.flame.clue",
    "answers": { "tr": ["kul", "kül"], "en": ["ash", "ashes"] },
    "reward": { "kind": "stat", "value": "INT", "amount": 2 } },
  { "id": "br_bone", "bossId": "bone_render", "locKey": "br.bone.text", "locKeyClue": "br.bone.clue",
    "answers": { "tr": ["hatira", "hatıra", "anı", "ani"], "en": ["memory", "memories"] },
    "reward": { "kind": "unlock", "value": "gatekeeper_riddle" } }
]
```

- [ ] **Step 4: i18n** (tr+en): `br.cave.text/clue`, `br.flame.text/clue`, `br.bone.text/clue` — zor,
  lore-derinlikli bilmeceler. (Örn TR `br.cave.text`: "Gözün gördüğü değil, yokluğumda doğan şey. Nedir?")

- [ ] **Step 5:** `npm run typecheck`; commit:

```bash
git add packages/shared/src/types.ts data/boss_riddles.json packages/client/src/game/content.ts data/i18n/tr.json data/i18n/en.json
git commit -m "feat(riddle): BossRiddle tipi + 3 zor boss bilmecesi + yukleme"
```

---

### Task 2: Durum (`state.ts`)

- [ ] **Step 1: Arayüze** (`pendingEvent`'in yanına):

```ts
  /** Aktif boss bilmecesi (çözülmemiş). */
  bossRiddle: { roomKey: string; riddleId: string; attempts: number } | null;
  /** Gizli oda bilmece deneme limitleri: roomId → sayaç/kilit. */
  riddleLimits: Record<string, { attempts: number; lockUntil: number; lockTier: number }>;
```

- [ ] **Step 2: `newGame`** literaline (`resolvedEvents: [],` yanına): `bossRiddle: null,` ve `riddleLimits: {},`.

- [ ] **Step 3:** `npm run typecheck`; commit `"feat(riddle): bossRiddle + riddleLimits durumu"`.

---

### Task 3: Saf mantık — `riddles.ts` (yeni)

**Files:** Create `packages/client/src/game/riddles.ts`; Modify `packages/client/src/game/discovery.ts` (export `normalizeAnswer`)

**Interfaces:** Produces `rollBossRiddle`, `pickBossRiddle`, `checkBossAnswer`, `RIDDLE_*` sabitleri, `lockRemainingMin`, `recordRiddleWrong`, `isRiddleLocked`

- [ ] **Step 1: `discovery.ts`** — `normalizeAnswer`'ı export et: `function normalizeAnswer` → `export function normalizeAnswer`.

- [ ] **Step 2: `riddles.ts` oluştur:**

```ts
import type { BossRiddle, EventCond } from '@mri/shared';
import type { Content } from './content';
import type { GameState } from './state';
import { normalizeAnswer } from './discovery';

export const RIDDLE_CHANCE_BASE = 0.10;
export const RIDDLE_CHANCE_LUCK = 0.005;
export const RIDDLE_CHANCE_CAP = 0.40;
export const RIDDLE_GUARD_MULT = 1.3;
export const RIDDLE_FAILBOSS_MULT = 1.5;
/** "Savaş" zorluk çarpanları (Normal/Güçlü/Acımasız). */
export const RIDDLE_FIGHT_MULTS: Record<string, number> = { normal: 1, hard: 1.5, brutal: 2 };
const LOCK_MS = [30 * 60_000, 60 * 60_000]; // 30dk, sonra 60dk (cap)

/** Boss odasının bilmeceye dönüşme şansı (LUCK ile artar). */
export function bossRiddleChance(state: GameState): number {
  return Math.min(RIDDLE_CHANCE_CAP, RIDDLE_CHANCE_BASE + state.stats.LUCK * RIDDLE_CHANCE_LUCK);
}

/** Bu boss arketipi için bir bilmece var mı? */
export function pickBossRiddle(content: Content, bossId: string): BossRiddle | null {
  return content.bossRiddles.get(bossId) ?? null;
}

/** Cevap doğru mu (TR-katlamalı tolerans)? */
export function checkBossAnswer(riddle: BossRiddle, answer: string): boolean {
  const norm = normalizeAnswer(answer);
  const all = [...(riddle.answers.tr ?? []), ...(riddle.answers.en ?? [])];
  return norm.length > 0 && all.some((a) => normalizeAnswer(a) === norm);
}

// --- normal gizli-oda bilmece limiti -------------------------------------
export function isRiddleLocked(state: GameState, roomId: string): boolean {
  const r = state.riddleLimits[roomId];
  return !!r && r.lockUntil > Date.now();
}

export function lockRemainingMin(state: GameState, roomId: string): number {
  const r = state.riddleLimits[roomId];
  if (!r) return 0;
  return Math.max(0, Math.ceil((r.lockUntil - Date.now()) / 60_000));
}

/** Yanlış cevabı işle: hak azalt, 3'te kilitle (kademeli süre). Kilitlendiyse true. */
export function recordRiddleWrong(state: GameState, roomId: string): boolean {
  const r = (state.riddleLimits[roomId] ??= { attempts: 0, lockUntil: 0, lockTier: 0 });
  if (r.lockUntil > Date.now()) return true; // zaten kilitli
  r.attempts += 1;
  if (r.attempts >= 3) {
    const ms = LOCK_MS[Math.min(r.lockTier, LOCK_MS.length - 1)];
    r.lockUntil = Date.now() + ms;
    r.lockTier += 1;
    r.attempts = 0; // süre dolunca 3 hak yeniden
    return true;
  }
  return false;
}
```

> `EventCond` import gerekmiyorsa çıkar (lint). `rollBossRiddle` şans+roll combat'ta (pos/boss bilgisi orada).

- [ ] **Step 3:** `npm run typecheck` (Task 4 olmadan `content.bossRiddles` derlenir; combat entegrasyonu Task 4). Commit Task 4 ile.

---

### Task 4: Combat entegrasyonu (`combat.ts`)

**Files:** `packages/client/src/game/combat.ts`

**Interfaces:** Produces `answerBossRiddle(state, content, answer, log): boolean`, `chooseBossOption(state, content, mode, difficulty, log): void`, `applyBossClear(state, content, log): void`

- [ ] **Step 1: import:** `import { bossRiddleChance, pickBossRiddle, checkBossAnswer, RIDDLE_GUARD_MULT, RIDDLE_FAILBOSS_MULT, RIDDLE_FIGHT_MULTS } from './riddles';`

- [ ] **Step 2: `makeEnemy`'ye çarpan parametresi.** İmzayı `makeEnemy(state, content, archId, isBoss, mult = 1)`
  yap; `hpMult`/`atkMult`'a `* mult`, `ep`/`satiety`'ye `* (isBoss ? 3 : 1) * mult` ekle (ödül zorlukla ölçeklenir).
  `spawnEventEnemy` ve `spawnEnemy` çağrıları `mult` vermez (varsayılan 1).

- [ ] **Step 3: `applyBossClear` helper** (onKill'in gatekeeper bloğunu çıkar). onKill'deki
  `if (wasBoss && layer?.gatekeeper && state.pos.floor >= floorsOf(state, layer)) { ... }` gövdesini
  `applyBossClear`'a taşı (wasBoss guard'ı çağırana bırak); onKill'de `if (wasBoss) applyBossClear(...)` çağır:

```ts
export function applyBossClear(state: GameState, content: Content, log: Log): void {
  const layer = currentLayer(state, content);
  if (layer?.gatekeeper && state.pos.floor >= floorsOf(state, layer)) {
    state.gatekeeperCleared = true;
    log({ key: 'log.gatekeeper_down' });
    const diff = diffDef(state, content);
    if (diff.brutal && state.permadeath && !state.hellClears.includes(state.raceId)) {
      state.hellClears.push(state.raceId);
      state.statPoints += 15;
      log({ key: 'log.hell_clear', params: { race: `race.${state.raceId}.name` } });
    }
  }
}
```

- [ ] **Step 4: combatRound boss-oda dalı.** `!state.enemy` bloğunda, `atBossRoom` true iken
  (mevcut event guard'ından sonra) boss-bilmece kontrolü:

```ts
    if (atBossRoom && !state.bossRiddle && !state.resolvedEvents.includes(roomKeyOf(state))) {
      const boss = evLayer ? pickBossRiddle(content, evLayer.boss) : null;
      if (boss && Math.random() < bossRiddleChance(state)) {
        state.bossRiddle = { roomKey: roomKeyOf(state), riddleId: boss.id, attempts: 0 };
        recordExplored(state);
        return; // UI bilmece panelini gösterir
      }
    }
```

  ve combatRound başına: `if (state.bossRiddle && !state.enemy) return;` (bilmece açık + ara canavar yokken bekle).

- [ ] **Step 5: riddleGuard ölümü.** `makeEnemy` ile çıkan ara canavarı işaretle: `EnemyInstance`'a
  `riddleGuard?: boolean` ekle (state.ts). `answerBossRiddle` yanlışta guard spawn'larken set eder.
  `onKill` başında: `if (enemy.riddleGuard && state.bossRiddle) { state.enemy = null; return; }` —
  ilerletmeden bilmeceye döndür (hak zaten artmış). (recompute/ep onKill normal verir; sonra return.)

- [ ] **Step 6: `answerBossRiddle`:**

```ts
export function answerBossRiddle(state: GameState, content: Content, answer: string, log: Log): boolean {
  const br = state.bossRiddle;
  const riddle = br && content.bossRiddles.get(br.riddleId);
  if (!br || !riddle) return false;
  if (checkBossAnswer(riddle, answer)) {
    br.attempts = -1; // çözüldü işareti (UI Atla/Savaş gösterir)
    log({ key: 'log.br_solved' });
    return true;
  }
  br.attempts += 1;
  if (br.attempts >= 3) {
    // 3. yanlış → güçlü boss
    const boss = makeEnemy(state, content, currentLayer(state, content)!.boss, true, RIDDLE_FAILBOSS_MULT);
    state.enemy = boss;
    state.bossRiddle = null;
    log({ key: 'log.br_fail_boss' });
  } else {
    // 1-2. yanlış → güçlenmiş ara canavar (riddleGuard)
    const layer = currentLayer(state, content)!;
    const archId = layer.enemyPool[Math.floor(Math.random() * layer.enemyPool.length)];
    const guard = makeEnemy(state, content, archId, false, RIDDLE_GUARD_MULT);
    if (guard) { guard.riddleGuard = true; state.enemy = guard; }
    log({ key: 'log.br_wrong', params: { left: 3 - br.attempts } });
  }
  return false;
}
```

- [ ] **Step 7: `chooseBossOption`** (çözülmüş bilmecede Atla/Savaş):

```ts
export function chooseBossOption(state: GameState, content: Content, mode: 'skip' | 'fight', difficulty: string, log: Log): void {
  const br = state.bossRiddle;
  const riddle = br && content.bossRiddles.get(br.riddleId);
  if (!br || br.attempts !== -1 || !riddle) return; // yalnız çözülmüş bilmecede
  if (mode === 'skip') {
    applyOutcomeReward(state, content, riddle.reward, log); // küçük garanti ödül
    state.resolvedEvents.push(br.roomKey);
    state.bossRiddle = null;
    applyBossClear(state, content, log); // gatekeeper ise rebirth açılır
    if (state.autoAdvance) advancePosition(state, content, log);
    else state.roomCleared = true;
  } else {
    const mult = RIDDLE_FIGHT_MULTS[difficulty] ?? 1;
    state.enemy = makeEnemy(state, content, currentLayer(state, content)!.boss, true, mult);
    state.resolvedEvents.push(br.roomKey);
    state.bossRiddle = null; // boss yenilince normal onKill→applyBossClear
  }
}
```

  `applyOutcomeReward` = küçük yardımcı (reward.kind: ep/stat/skill/unlock/fragment uygula). DRY:
  `discovery.ts answerRoom`'daki reward uygulama mantığını ortak helper'a çıkar (mantık denetimi).

- [ ] **Step 8: Ölüm reset.** `onDeath`'e `state.bossRiddle = null;` ekle (event resetinin yanına).

- [ ] **Step 9:** `npm run typecheck && npm run build`; commit (Task 3-4):

```bash
git add packages/client/src/game/riddles.ts packages/client/src/game/discovery.ts packages/client/src/game/combat.ts packages/client/src/game/state.ts
git commit -m "feat(riddle): boss-bilmece mantik + combat entegrasyonu + applyBossClear DRY"
```

---

### Task 5: Normal bilmece limiti (`discovery.ts`)

- [ ] **Step 1: `answerRoom`** — kilitliyse reddet; yanlışta `recordRiddleWrong`; doğruda `riddleLimits[id]` temizle:

```ts
  // import { isRiddleLocked, recordRiddleWrong } from './riddles';  (dosya başı)
  if (isRiddleLocked(state, id)) { log({ key: 'log.riddle_locked' }); return false; }
  ...
  if (!ok) {
    const locked = recordRiddleWrong(state, id);
    log({ key: locked ? 'log.riddle_locked_now' : 'log.room_wrong' });
    return false;
  }
  ...
  // doğru çözümde (state.discoveries.push(id) yanında):
  delete state.riddleLimits[id];
```

> Döngü kontrolü: `discovery.ts` ↔ `riddles.ts` — riddles `normalizeAnswer`'ı discovery'den alır,
> discovery `isRiddleLocked/recordRiddleWrong`'u riddles'tan alır. İki yönlü import! Çöz: limit
> fonksiyonlarını da discovery'de tut VEYA normalizeAnswer'ı ayrı bir küçük modüle (`text.ts`) taşı.
> **Seçim:** `normalizeAnswer`'ı `riddles.ts`'e taşı + discovery oradan alsın (tek yön). discovery'deki
> tanımı sil, riddles'a koy, export et.

- [ ] **Step 2:** typecheck; commit `"feat(riddle): normal bilmece 3-hak + sureli kilit"`.

---

### Task 6: UI (`ui.ts`, `index.html`, `main.ts`)

- [ ] **Step 1: ACTIONS** (ui.ts): `onAnswerBossRiddle: (a: string) => void;` `onBossChoice: (mode: 'skip' | 'fight', difficulty: string) => void;`

- [ ] **Step 2: `bossRiddlePanel(state)`** (combatTab'a, eventPanel gibi): `state.bossRiddle` varsa —
  `attempts === -1` ise bilmece metni + **Atla** / **Savaş** (Savaş'a basınca 3 zorluk butonu);
  aksi halde bilmece metni + ipucu + input + "kalan hak {3 - attempts}/3". combatTab başına
  `if (state.bossRiddle) return bossRiddlePanel(state);` (ara canavar varken `state.enemy` dolu →
  bossRiddle null değil ama enemy var → normal savaş paneli; guard: `if (state.bossRiddle && !state.enemy) return bossRiddlePanel(...)`).

- [ ] **Step 3: Normal bilmece kilidi** (loreTab): `isRiddleLocked` ise input yerine
  `🔒 ${t('ui.riddle_locked', { min: lockRemainingMin(...) })}`.

- [ ] **Step 4: wiring** (ui.ts): `#br-answer`/`#br-input`, `.br-skip`, `.br-fight`, `.br-diff[data-diff]`
  → ACTIONS. main.ts: `onAnswerBossRiddle`/`onBossChoice` → combat fn + save + render. CSS (.brpanel).

- [ ] **Step 5: i18n** (tr+en): `ui.boss_skip`, `ui.boss_fight`, `ui.diff_normal/hard/brutal`,
  `ui.br_attempts`, `ui.riddle_locked` ("{min} dk sonra"), `log.br_solved/br_wrong/br_fail_boss/riddle_locked/riddle_locked_now`.

- [ ] **Step 6:** `npm run typecheck && npm run build`; commit.

---

### Task 7: migrate + rebirth reset (`main.ts`, `rebirth.ts`)

- [ ] **Step 1: `main.ts migrate`:** `s.bossRiddle ??= null; s.riddleLimits ??= {};`
- [ ] **Step 2: `rebirth.ts`:** `state.bossRiddle = null; state.riddleLimits = {};` (event reset yanına).
- [ ] **Step 3:** typecheck+build; commit.

---

### Task 8: Sistemler-arası mantık denetimi + düzeltme

- [ ] **Boss-oda öncelik:** combatRound sırası `bossRiddle blok → pendingEvent → roomCleared → event →
  boss-bilmece roll → exploration → spawn`. Boss-bilmece yalnız `atBossRoom`'da; event/exploration giriş/boss
  dışında. Çakışma yok mu? Doğrula.
- [ ] **riddleGuard ölümü** ilerletmiyor, bilmece dönüyor; final/3.-yanlış boss normal ilerletir. Test.
- [ ] **Atla→gatekeeper:** `applyBossClear` gatekeeper son-katı şartını koruyor (boss her katta; sadece son kat). Doğrula.
- [ ] **resolvedEvents paylaşımı:** boss-bilmece de `resolvedEvents`'e roomKey yazıyor → çözülen boss odası
  tekrar bilmece/boss vermemeli ama BOSS yine de geçilmeli. Sorun: çözülüp Atla/Savaş yapıldıysa oda geçilir
  (advance), tekrar girilmez. Ama farm'da geri gelinirse? Boss odası farm'lanmaz (son oda=ilerletir). Doğrula;
  gerekirse boss için ayrı `resolvedBossRiddles` kullan (event'le karışmasın).
- [ ] **Döngüsel import:** `normalizeAnswer` riddles.ts'te (tek yön: discovery→riddles, combat→riddles). Teyit.
- [ ] **Reward DRY:** `applyOutcomeReward` hem answerRoom hem chooseBossOption(skip)'te. Tek kaynak.
- [ ] **Ölüm/rebirth reset:** bossRiddle her ikisinde null; riddleLimits rebirth'te sıfır. Doğrula.
- [ ] **Migrate:** eski kayıt patlamaz. typecheck+build+manuel (spec §12). Commit `"fix(riddle): mantik denetimi"`.

---

## Self-Review (plan ↔ spec)

- §2 şans/LUCK → Task 3 `bossRiddleChance` + Task 4 roll. ✓
- §3 içerik → Task 1. ✓ · §4 akış (çöz→Atla/Savaş/3zorluk; yanlış→guard/boss) → Task 4. ✓
- §5 normal limit → Task 3+5. ✓ · §6 state/migrate → Task 2+7. ✓ · §7 entegrasyon → Task 4. ✓
- §8 UI → Task 6. ✓ · §10 denge sabitleri → Task 3. ✓
- **Placeholder:** kod gerçek; reward DRY helper (`applyOutcomeReward`) Task 4/5'te tanımlanır.
- **Tip tutarlılığı:** `bossRiddle{roomKey,riddleId,attempts}`, `answerBossRiddle`/`chooseBossOption`/
  `applyBossClear` adları tüm task'larda aynı. `attempts === -1` = çözüldü işareti (UI + chooseBossOption).
- **Döngü riski (Task 5 yakaladı):** `normalizeAnswer` riddles.ts'e taşınır → tek yön. ✓
- **resolvedEvents ortak kullanımı (Task 8 yakaladı):** gerekirse boss için ayrı liste.
