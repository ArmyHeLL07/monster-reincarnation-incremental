# Evrim Ağacı Görseli — Implementation Plan

> **For agentic workers:** Bu plan task-task uygulanır. Bu projede **test framework'ü yok**;
> her task'ın doğrulaması **`npm run typecheck`** + (UI task'ı için) **`npm run build`** +
> manuel kontrol. Adımlar checkbox (`- [ ]`) ile izlenir.

**Goal:** Statlar sekmesindeki düz evrim listesini, ırkın dallanan evrim ağacının dikey
görsel şemasıyla (Karma reveal) değiştirmek.

**Architecture:** Veri-odaklı: `evolution.ts` form grafiğini gezip her düğümün durumunu
(`past/current/available/locked/missed/hidden`) hesaplar; `ui.ts` bunu tier-satırlı bir
ağaç olarak render eder. Görünürlük `state.seenForms` + `state.formHistory` ile kalıcı.
Mevcut `evolvesTo` + `levelReq` mantığı korunur; çapraz dal/koşul YOK (ertelendi).

**Tech Stack:** TypeScript, Vite, vanilla DOM (innerHTML render), CSS. Monorepo:
`@mri/client`, `@mri/shared`.

## Global Constraints

- **Kural 0:** Kalıcı değişiklik yalnız onaylı planla. (Bu plan onaylı.)
- **Multilanguage (Kural 2):** Oyuncuya görünen TÜM metin i18n tablosundan (`t(key)`).
  Koda sabit TR/EN yazılmaz. Form isim/lore anahtarları zaten var.
- **Data-driven (Kural 3):** Denge sayısı koda gömülmez. Bu faz denge sayısı eklemiyor.
- **Bu faz `types.ts` ve `evolutions.json`'a DOKUNMAZ.**
- Doğrulama: `npm run typecheck` (kök), UI için `npm run build`.

---

### Task 1: Durum alanları — `seenForms` + `formHistory`

**Files:**
- Modify: `packages/client/src/game/state.ts` (GameState arayüzü + `newGame()`)
- Modify: `packages/client/src/main.ts` (`migrate()`)

**Interfaces:**
- Produces: `GameState.seenForms: string[]`, `GameState.formHistory: string[]`

- [ ] **Step 1: `state.ts` — arayüze alanları ekle.** `roomCleared: boolean;` satırından
  hemen önce (interface içinde) ekle:

```ts
  /** Görülen evrim formları (ağaç reveal kalıcılığı) — bir kez görülen isim gizlenmez. */
  seenForms: string[];
  /** Geçilen formların sırası (lineage) — past/missed ayrımı için. İlk eleman = başlangıç formu. */
  formHistory: string[];
```

- [ ] **Step 2: `state.ts` — `newGame()` içinde başlat.** `exploredMax: {},` satırının
  yakınındaki obje literaline ekle (closest: `roomCleared: false,`'dan önce):

```ts
    seenForms: [],
    formHistory: ['hatchling_spider'],
```

> Not: `formHistory` başlangıç formuyla başlar (`state.formId` ile aynı). `newGame`'de formId
> zaten `'hatchling_spider'`. Sabit yerine `formId` referansı veremeyiz (obje henüz kurulmadı),
> bu yüzden literal — hatchling spider başlangıç formu olduğu için güvenli.

- [ ] **Step 3: `main.ts` — `migrate()` backfill.** `s.layerFloors ??= {};` satırından sonra ekle:

```ts
  s.seenForms ??= [];
  s.formHistory ??= [];
  // Eski kayıt: formHistory boşsa en az mevcut formu koy (geçmiş ara formlar kaybolmuş olabilir;
  // ağaç patlamaz, mevcut form doğru "current" görünür).
  if (s.formHistory.length === 0 && s.formId) s.formHistory.push(s.formId);
```

- [ ] **Step 4: Doğrula.** Çalıştır: `npm run typecheck`. Beklenen: hata yok.

- [ ] **Step 5: Commit.**

```bash
git add packages/client/src/game/state.ts packages/client/src/main.ts
git commit -m "feat(evo): seenForms + formHistory durum alanlari"
```

---

### Task 2: Ağaç mantığı — `evolution.ts`

**Files:**
- Modify: `packages/client/src/game/evolution.ts`

**Interfaces:**
- Consumes: `GameState.seenForms`, `GameState.formHistory` (Task 1); `content.forms: Map<string, EvolutionForm>`
- Produces:
  - `EvoNodeStatus = 'past'|'current'|'available'|'locked'|'missed'|'hidden'`
  - `interface EvoNode { id; tier; status; name; levelReq; statBonus?; grantSkills?; parents; children }`
  - `evolutionTreeView(state, content): EvoNode[]`
  - `formTier(content, formId): number`
  - `markSeen(state, content): void`

- [ ] **Step 1: `evolution.ts` — yardımcılar + view fonksiyonu ekle** (dosya sonuna):

```ts
export type EvoNodeStatus = 'past' | 'current' | 'available' | 'locked' | 'missed' | 'hidden';

export interface EvoNode {
  id: string;
  tier: number; // kökten derinlik (root = 0)
  status: EvoNodeStatus;
  name: string | null; // null → UI '???' gösterir
  levelReq: number;
  statBonus?: EvolutionForm['statBonus'];
  grantSkills?: string[];
  parents: string[];
  children: string[];
}

/** Bu ırkın formları (mevcut formun raceId'sine göre). */
function raceForms(state: GameState, content: Content): EvolutionForm[] {
  const cur = content.forms.get(state.formId);
  const raceId = cur?.raceId;
  return [...content.forms.values()].filter((f) => f.raceId === raceId);
}

/** evolvesTo grafiğinde her forma giden ebeveynler. */
function parentMap(forms: EvolutionForm[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const f of forms) for (const c of f.evolvesTo) (m.get(c) ?? m.set(c, []).get(c)!).push(f.id);
  return m;
}

/** Kökten (ebeveynsiz form) BFS ile bir formun ağaç derinliği. */
export function formTier(content: Content, formId: string): number {
  const f0 = content.forms.get(formId);
  if (!f0) return 0;
  const forms = [...content.forms.values()].filter((f) => f.raceId === f0.raceId);
  const parents = parentMap(forms);
  const roots = forms.filter((f) => !(parents.get(f.id)?.length)).map((f) => f.id);
  const depth = new Map<string, number>();
  const q: string[] = [];
  for (const r of roots) { depth.set(r, 0); q.push(r); }
  while (q.length) {
    const id = q.shift()!;
    const d = depth.get(id)!;
    for (const c of content.forms.get(id)?.evolvesTo ?? []) {
      if (!depth.has(c) || d + 1 < depth.get(c)!) { depth.set(c, d + 1); q.push(c); }
    }
  }
  return depth.get(formId) ?? 0;
}

/** Render öncesi: mevcut form + soyun + bir-adım komşular + soyun seçilmeyen kardeşleri görülür. */
export function markSeen(state: GameState, content: Content): void {
  const add = (id: string) => { if (!state.seenForms.includes(id)) state.seenForms.push(id); };
  add(state.formId);
  for (const id of state.formHistory) {
    add(id);
    for (const c of content.forms.get(id)?.evolvesTo ?? []) add(c); // soyun kardeşleri (missed dahil)
  }
  for (const c of content.forms.get(state.formId)?.evolvesTo ?? []) add(c); // bir-adım komşular
}

/** Tüm ırk formları için ağaç düğümü durumlarını hesapla. */
export function evolutionTreeView(state: GameState, content: Content): EvoNode[] {
  markSeen(state, content);
  const forms = raceForms(state, content);
  const parents = parentMap(forms);
  const cur = content.forms.get(state.formId);
  const nextIds = new Set(cur?.evolvesTo ?? []);
  const past = new Set(state.formHistory.filter((id) => id !== state.formId));

  return forms.map((f): EvoNode => {
    let status: EvoNodeStatus;
    if (f.id === state.formId) status = 'current';
    else if (past.has(f.id)) status = 'past';
    else if (nextIds.has(f.id)) status = canEvolve(state, f) ? 'available' : 'locked';
    else if ((parents.get(f.id) ?? []).some((p) => past.has(p))) status = 'missed';
    else status = 'hidden';
    const seen = state.seenForms.includes(f.id);
    return {
      id: f.id,
      tier: formTier(content, f.id),
      status,
      name: seen ? f.locKey : null,
      levelReq: f.levelReq,
      statBonus: f.statBonus,
      grantSkills: f.grantSkills,
      parents: parents.get(f.id) ?? [],
      children: f.evolvesTo,
    };
  }).sort((a, b) => a.tier - b.tier);
}
```

- [ ] **Step 2: `evolution.ts` — `evolve()` içinde formHistory'e yaz.** `state.formId = formId;`
  satırını şununla değiştir:

```ts
  state.formId = formId;
  if (!state.formHistory.includes(formId)) state.formHistory.push(formId);
```

- [ ] **Step 3: Doğrula.** Çalıştır: `npm run typecheck`. Beklenen: hata yok.
  (Eğer `EvolutionForm`/`Content`/`GameState`/`canEvolve` import değilse: dosya başı zaten
  `EvolutionForm, StatKey` ve `Content`, `GameState` import ediyor; `canEvolve` aynı dosyada.)

- [ ] **Step 4: Commit.**

```bash
git add packages/client/src/game/evolution.ts
git commit -m "feat(evo): evolutionTreeView + formTier + markSeen + history"
```

---

### Task 3: Lokalizasyon anahtarları (tr + en)

**Files:**
- Modify: `data/i18n/tr.json`
- Modify: `data/i18n/en.json`

**Interfaces:**
- Produces: i18n anahtarları `ui.evo_tree`, `ui.evo_locked`, `ui.evo_hidden`, `ui.evo_missed`, `ui.evo_lineage`

- [ ] **Step 1: `tr.json` — `"ui.evolve"` satırının yanına ekle:**

```json
  "ui.evo_tree": "Evrim Ağacı",
  "ui.evo_lineage": "Soyun",
  "ui.evo_locked": "Lv {lv} gerek",
  "ui.evo_missed": "ulaşılamaz",
  "ui.evo_hidden": "keşfedilmemiş evrim",
```

- [ ] **Step 2: `en.json` — `"ui.evolve"` satırının yanına ekle:**

```json
  "ui.evo_tree": "Evolution Tree",
  "ui.evo_lineage": "Lineage",
  "ui.evo_locked": "Needs Lv {lv}",
  "ui.evo_missed": "unreachable",
  "ui.evo_hidden": "undiscovered evolution",
```

- [ ] **Step 3: Doğrula.** Çalıştır: `npm run typecheck`. Beklenen: hata yok (JSON geçerli).

- [ ] **Step 4: Commit.**

```bash
git add data/i18n/tr.json data/i18n/en.json
git commit -m "feat(evo): agac i18n anahtarlari (tr+en)"
```

---

### Task 4: UI — ağaç render + CSS + statsTab değişimi

**Files:**
- Modify: `packages/client/src/ui.ts` (`statsTab` + yeni `evolutionTree` fn + import)
- Modify: `packages/client/index.html` (CSS — stil bloğu buradaysa) *veya* projedeki CSS dosyası

**Interfaces:**
- Consumes: `evolutionTreeView`, `EvoNode` (Task 2); `t()`, `canEvolve`, `CONTENT`

- [ ] **Step 1: `ui.ts` — import satırına ekle.** Mevcut combat import'una `evolutionTreeView`'i,
  evolution import'una ise tip/fonksiyonu ekle. `evolution.ts`'ten import satırını bul
  (`availableEvolutions, canEvolve, currentForm` içeren) ve `evolutionTreeView` ekle:

```ts
import { availableEvolutions, canEvolve, currentForm, evolutionTreeView } from './game/evolution';
```

> (Mevcut import bu fonksiyonları içermiyorsa, dosyadaki `./game/evolution` import'unu bul ve
> `evolutionTreeView`'i listeye ekle.)

- [ ] **Step 2: `ui.ts` — `evolutionTree(state)` render fonksiyonu ekle** (statsTab'ın hemen üstüne):

```ts
/** Dikey dallanan evrim ağacı: tier satırları, durum-stilli düğümler, available'da [Evrimleş]. */
function evolutionTree(state: GameState): string {
  const nodes = evolutionTreeView(state, CONTENT);
  if (!nodes.length) return '';
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const rows = tiers
    .map((tier) => {
      const cells = nodes
        .filter((n) => n.tier === tier)
        .map((n) => {
          const name = n.name ? t(n.name) : '???';
          const bonus = n.statBonus
            ? Object.entries(n.statBonus).map(([k, v]) => `+${v}${k}`).join(' ')
            : '';
          const skills = n.grantSkills?.length ? ` · ${n.grantSkills.length} skill` : '';
          let detail = '';
          if (n.status === 'available') {
            detail = `<div class="muted evo-d">${bonus}${skills}</div><button class="evo" data-form="${n.id}">${t('ui.evolve')}</button>`;
          } else if (n.status === 'locked') {
            detail = `<div class="muted evo-d">${t('ui.evo_locked', { lv: n.levelReq })}</div>`;
          } else if (n.status === 'missed') {
            detail = `<div class="muted evo-d">✕ ${t('ui.evo_missed')}</div>`;
          } else if (n.status === 'hidden') {
            detail = `<div class="muted evo-d">${t('ui.evo_hidden')}</div>`;
          } else if (n.status === 'past' || n.status === 'current') {
            detail = bonus ? `<div class="muted evo-d">${bonus}${skills}</div>` : '';
          }
          const mark = n.status === 'current' ? '◉ ' : n.status === 'past' ? '✓ ' : '';
          return `<div class="evo-node ${n.status}"><div class="evo-name">${mark}${name}</div>${detail}</div>`;
        })
        .join('');
      return `<div class="evo-tier"><span class="evo-tlabel">T${tier}</span><div class="evo-cells">${cells}</div></div>`;
    })
    .join('');
  return `<div class="evotree">${rows}</div>`;
}
```

- [ ] **Step 3: `ui.ts` — `statsTab` içinde eski `evoHtml`'i değiştir.** `statsTab` içindeki
  `const evos = availableEvolutions(...)` ve `const evoHtml = ...` bloğunu **sil**, yerine:

```ts
  const treeHtml = evolutionTree(state);
```

  Ardından evrim panelindeki `${evoHtml}` kullanımını `${treeHtml}` yap. (Panel başlığı
  `${t('ui.evolution')}` ve `form` satırı korunur.)

> Not: `availableEvolutions`/`currentForm` hâlâ panel başlığı/`form` satırında kullanılıyorsa
> import'ta kalsın; kullanılmıyorsa lint/typecheck "unused" uyarısı verebilir — o durumda
> import'tan çıkar.

- [ ] **Step 4: CSS ekle.** Projedeki stil bloğunu bul (`.dmap`/`.dcell` kurallarının olduğu yer —
  `index.html` içi `<style>` ya da ayrı `.css`). Şunu ekle:

```css
.evotree { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
.evo-tier { display: flex; align-items: flex-start; gap: 0.4rem; }
.evo-tlabel { font-size: 0.7rem; color: var(--muted, #989384); width: 1.8rem; flex: none; padding-top: 0.3rem; }
.evo-cells { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
.evo-node { border: 1px solid #3a352c; border-radius: 6px; padding: 0.35rem 0.5rem; min-width: 7rem; background: #1c1a16; }
.evo-node .evo-name { font-weight: 600; font-size: 0.84rem; }
.evo-node .evo-d { font-size: 0.72rem; margin-top: 0.15rem; }
.evo-node.current { border-color: #6d44d9; box-shadow: 0 0 8px #6d44d9aa; }
.evo-node.past { opacity: 0.7; }
.evo-node.available { border-color: #4caa5a; }
.evo-node.locked { opacity: 0.85; }
.evo-node.missed { opacity: 0.4; border-style: dashed; }
.evo-node.hidden { opacity: 0.45; border-style: dashed; color: var(--muted, #989384); }
.evo-node .evo { margin-top: 0.3rem; }
```

- [ ] **Step 5: Doğrula (typecheck + build).** Çalıştır: `npm run typecheck && npm run build`.
  Beklenen: ikisi de hatasız (`✓ built`).

- [ ] **Step 6: Manuel kontrol (tarif).** `npm run dev` → Statlar sekmesi:
  - Yeni oyunda `◉ Hatchling Spider` current; T1 Lesser Weaver Lv10'da `available` ([Evrimleş]).
  - Daha ileri formlar `???` (silik) — sadece T0/T1 isimli.
  - Lesser Weaver'a evrimleşince: Hatchling `✓ past`; Venom/Blade/Greater `available/locked`;
    T3+ hâlâ `???`. Bir dalı seçince diğer iki kardeş `✕ ulaşılamaz` (missed) görünür.
  - TR/EN dil değişiminde tüm etiketler çevrilir.

- [ ] **Step 7: Commit.**

```bash
git add packages/client/src/ui.ts packages/client/index.html
git commit -m "feat(evo): Statlar sekmesinde dallanan evrim agaci gorseli"
```

---

## Self-Review (plan ↔ spec)

- **Spec §2 reveal:** Task 2 `evolutionTreeView` 6 durumu + `markSeen` reveal kuralını,
  Task 4 görselleştirmeyi karşılar. ✓
- **Spec §3 dikey tier çizim:** Task 4 tier satırları + CSS. ✓ (Bağlayıcı çizgi yerine tier
  etiketi + dallanma flex-wrap ile; düz çizgi v2'de eklenebilir — spec "CSS bağlayıcı çizgiler"
  diyor, ilk sürüm tier-satır + durum stili; çizgi detayı manuel kontrolde değerlendirilir.)
- **Spec §4 mantık:** Task 2 `evolutionTreeView`/`formTier`/`markSeen` + `evolve` history. ✓
- **Spec §5 state/migrate:** Task 1. ✓
- **Spec §6 UI:** Task 4. ✓
- **Spec §7 i18n:** Task 3. ✓
- **Spec §9 dosya özeti:** types.ts/evolutions.json'a dokunulmadı. ✓
- **Placeholder taraması:** kod blokları gerçek; "TODO" yok. ✓
- **Tip tutarlılığı:** `EvoNode`/`EvoNodeStatus`/`evolutionTreeView` Task 2'de tanımlı,
  Task 4'te aynı isimlerle tüketiliyor. ✓

> **Açık nokta (manuel kontrolde):** Spec §3 "CSS bağlayıcı çizgiler" tam düz çizgi ağ
> görünümü istiyor; bu plan ilk sürümde tier-satır + durum-stili veriyor (dallanma flex ile
> ima edilir). Görsel yetersizse, bağlayıcı çizgiler (SVG veya CSS ::before) küçük bir takip
> task'ı olarak eklenir. Denge/mantık etkisi yok.
