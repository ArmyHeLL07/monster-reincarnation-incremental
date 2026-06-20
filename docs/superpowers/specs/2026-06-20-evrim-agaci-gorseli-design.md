# Tasarım — Evrim Ağacı Görseli (Statlar sekmesi)

> Tarih: 2026-06-20 · Durum: onay bekliyor → uygulama
> İlgili: `docs/Spider_Race_Data.md` TABLO 2 (kanonik dallanan ağaç),
> `data/evolutions.json`, `packages/client/src/game/evolution.ts`, `ui.ts` (`statsTab`).

## 1. Amaç ve kapsam

Statlar sekmesindeki mevcut **düz "evrim listesi"** (sadece şu an seçilebilir formları
gösteren liste) yerine, ırkın **dallanan evrim ağacının görsel şeması**. Oyuncu nereden
geldiğini, şu an nereye gidebileceğini ve ağacın dallanma/birleşme şeklini görür.

**Bu özellik = saf görselleştirme.** Mevcut ağaç topolojisini çizer; denge sayısı,
yeni yol veya yeni gereksinim **eklemez**. Mevcut `evolutions.json` zaten zengin bir
DAG: T1 Lesser Weaver → 3 dal (Venom/Blade/Greater) → T3'te üç form → **T4 Undying
Horror'da birleşme** → T5–T10 ortak omurga. Çizilecek şekil hazır.

### Kapsam dışı (ertelendi — ayrı plan)
- **Çapraz dallar** ("yandaki daldan da alma", örn. Venom Weaver → Scythe Hunter).
- **Stat-koşullu evrim** (evrim koşulu olarak STR, ya da STR+AGI vb. — Atıl'ın planı).
- Bunların mantığı/dengesi sonra tasarlanacak. Çizici, ileride bu linkleri/koşulları
  eklemek **kolay** olacak şekilde DAG üzerinden genel yazılır (form grafiğini gezer,
  düğüm tiplerini hesaplar) — ama şu an hiçbir çapraz link veya koşul authored edilmez.
- Ana-hat formlarına koşul eklenmez (yalnız mevcut `levelReq` kalır).

## 2. Görünürlük modeli — "Karma" reveal

Oyuncunun mevcut formuna göre her düğümün bir **durumu** vardır. İsim görünürlüğü kalıcı
bir `state.seenForms: string[]` ile yönetilir (bir kez görülen form bir daha gizlenmez).

| Durum | Tanım | Gösterim |
|---|---|---|
| **past** | Soyun: geçtiğin atalar | ✓ isim görünür, sönük-pozitif |
| **current** | Şu anki form | ◉ vurgulu |
| **available** | Şu an seçilebilir (mevcut formun `evolvesTo`'su, level yeterli) | Tam detay + **[Evrimleş]** |
| **locked** | Bir adım ötede ama level yetmiyor | İsim görünür + gereksinim ("Lv 10 gerek") |
| **missed** | Geçmişte seçmediğin kardeş dal (artık ulaşılamaz) | İsim görünür, gri "✕ ulaşılamaz" |
| **hidden** | Mevcut formdan 2+ adım ileri, henüz görülmemiş | Silik **`???`**, isim gizli, sadece tier + dallanma şekli |

**Reveal kuralı:** render anında, mevcut formdan **≤1 adım** mesafedeki tüm formlar +
tüm atalar `seenForms`'a eklenir. Bir form `seenForms`'ta ise ismi/detayı görünür;
değilse `???`. Böylece yaklaştıkça düğümler kalıcı olarak açılır; "dallanma şekli"
(çizgiler/tier'lar) her zaman görünür, sadece **isimler** gizlenir.

**Detay derinliği (form `seenForms`'ta ve available/locked ise):** isim, tier, `levelReq`,
`statBonus` özeti (+VIT3 gibi), kazandırdığı skill sayısı/isimleri, `form.*.desc` lore satırı.

## 3. Çizim — dikey kademe-satırlı ağaç

Oyun mobil-dostu (sidebar 320px, dikey kaydırma doğal). Ağaç **yukarıdan aşağıya**:
T0 üstte, T10 altta. Her **tier bir satır**; o tier'daki formlar satırda yan yana.
Satırlar arası **bağlayıcı çizgiler** (CSS) ana dalları gösterir: tekli iniş, Y/3-yön
ayrım (Lesser → 3 form), ve birleşme (üç T3 → Undying Horror).

- Düğüm = küçük "form kartı" (durum sınıfına göre stil: current/past/available/locked/
  missed/hidden). `data-form="<id>"` taşır.
- **[Evrimleş]** butonu yalnız `available` düğümlerde; mevcut `.evo[data-form]` event
  wiring'i **aynen** kullanılır (`ACTIONS.onEvolve`).
- Birleşme noktası (Undying Horror): üç T3 satırından gelen çizgiler tek düğümde toplanır.
- `???` düğümler tier satırında yer tutar (şekil bozulmaz) ama isim/detay göstermez.

> Çizim, formların `tier`'ına göre satırlara dizilir. Bir formun tier'ı = ağaçtaki
> derinliği (kök=0). `evolvesTo` kenarlarından hesaplanır (BFS), böylece veri-odaklı kalır.

## 4. Mantık — `evolution.ts`

Mevcut `currentForm`, `availableEvolutions`, `canEvolve`, `evolve`, `evolutionReady`
**davranışı korunur** (çapraz yok, sadece `evolvesTo` + `levelReq`). Eklenenler:

- `evolutionTreeView(state, content): TreeNode[]` — tüm formları gezer, her form için
  `{ id, tier, status, name|null, levelReq, statBonus, grantSkills, parents[], children[] }`
  döndürür. `status` §2 tablosuna göre hesaplanır. `name` null ise UI `???` gösterir.
- `formTier(content, formId): number` — `evolvesTo` grafiğinde kökten BFS derinliği (cache).
- `markSeen(state, content)` — render öncesi mevcut formdan ≤1 adım + `formHistory`'deki
  tüm formları `seenForms`'a ekler.
- **"past/missed" ayrımı `formHistory` ile deterministiktir** (BFS/tahmin yok):
  - **past** = `formHistory` içindeki formlar (mevcut hariç).
  - **missed** = bir `past` formun `evolvesTo` kardeşlerinden, oyuncunun **seçmediği**
    (yani `formHistory`'de olmayan) ve mevcut yola dahil olmayanlar. Örn. Venom Weaver'a
    evrimleştiysen, Lesser Weaver'ın diğer çocukları (Blade/Greater) `missed`.
  - **available** = mevcut formun `evolvesTo`'su, `canEvolve` true.
  - **locked** = mevcut formun `evolvesTo`'su, `canEvolve` false (level yetmiyor).
  - **hidden** = yukarıdakilerden hiçbiri ve `seenForms`'ta değil.

## 5. Durum (`state.ts`) ve göç

- `seenForms: string[]` — görülen form id'leri (reveal kalıcılığı).
- `formHistory: string[]` — geçilen formların sırası (lineage/missed için). `newGame`'de
  `[state.formId]` (hatchling) ile başlar; `evolve()` yeni forma geçerken **eski** formId
  zaten history'de, **yeni** formId push edilir.
- `migrate()`: ikisi de `??= []`; ayrıca eski kayıt için `formHistory` boşsa mevcut
  `formId` ile başlat (geçmiş kaybolmuş olsa da en az mevcut form doğru "current" olur;
  eski ara formlar "hidden/seen değil" görünebilir — kabul edilebilir, bozulma yok).

## 6. UI (`ui.ts`)

- `statsTab` içindeki mevcut `evoHtml` bloğu (düz liste) **yeni `evolutionTree(state)`**
  ile değiştirilir. Evrim paneli başlığı/`form` satırı korunur.
- `evolutionTree(state)`: `evolutionTreeView` çıktısını tier satırlarına + bağlayıcılara
  render eder; durum sınıflarına göre stil; `available`'larda [Evrimleş].
- CSS: yeni `.evotree`, `.evo-tier`, `.evo-node` (+ `.current/.past/.available/.locked/
  .missed/.hidden` modifierleri), bağlayıcı çizgiler. Mevcut `.dmap` grid yaklaşımına benzer.
- Render sırasında `markSeen(state, content)` çağrılır (yan etki: `seenForms` güncellenir →
  bir sonraki save'de kalıcı).

## 7. Lokalizasyon (tr + en)

Tüm metin lokalize (Kural 2). Yeni anahtarlar:
- `ui.evo_tree` (başlık), `ui.evo_locked` ("{lv} gerek" → param), `ui.evo_hidden`
  (`???` altı ipucu, örn. "Keşfedilmemiş evrim"), `ui.evo_missed` ("ulaşılamaz"),
  `ui.evo_lineage` ("soyun") vb.
- Form `name`/`desc` anahtarları **zaten var** (`form.*.name`, `form.*.desc`) — yeniden kullanılır.

## 8. Test / doğrulama

- `typecheck` + `build` temiz.
- Manuel: yeni oyunda hatchling current; Lesser available (Lv10'da); evrimleşince ağaç
  güncellenir, geçilen form "past", seçilmeyen kardeşler "missed", 2+ ileri `???`.
- Eski kayıt yüklenince ağaç patlamaz (migrate); mevcut form doğru "current".

## 9. Dosya özeti

| Dosya | Değişiklik |
|---|---|
| `packages/shared/src/types.ts` | (değişiklik yok — çapraz/koşul ertelendi) |
| `data/evolutions.json` | (değişiklik yok bu fazda) |
| `packages/client/src/game/state.ts` | `seenForms`, `formHistory` + newGame init |
| `packages/client/src/game/evolution.ts` | `evolutionTreeView`, `formTier`, `markSeen`; `evolve()` history push |
| `packages/client/src/main.ts` | `migrate()`: `seenForms`/`formHistory` backfill |
| `packages/client/src/ui.ts` | `evolutionTree()` render + `statsTab` değişimi + CSS |
| `data/i18n/tr.json`, `en.json` | yeni `ui.evo_*` anahtarları |

## 10. Ertelenen / gelecek (ayrı plan)

- **Çapraz dallar:** `EvolutionForm.crossEvolvesTo?: {to, requires}[]` + `evolution.ts`'te
  koşul kontrolü + `evolve()` çapraz doğrulama + çizicide rozet. Önerilen ilk çaprazlar
  (tema): Venom Weaver → Scythe Hunter, Blade Weaver → Shade Stalker (tank dalı saf kalır).
- **Stat-koşullu evrim (Atıl'ın planı):** evrim koşulu olarak stat eşiği (örn. STR, ya da
  STR+AGI). `Cond` tipi: `{ stat?: Partial<Record<StatKey,number>>; skill?: {id,level} }`.
  Hem çaprazlara hem (istenirse) ana-hat formlarına uygulanabilir. Denge dikkatli ayarlanır.
- **Irka-özel evrim koşulları (Atıl, 2026-06-20):** başlangıç/ana evrim ağacındaki koşullar
  gerekirse **sıfırdan, ırka göre özel** yeniden tasarlanır (her ırk kendi stat kimliğine göre:
  örn. örümcek AGI/INT, tank-ırk VIT). Yani `Cond` ırk başına farklı eşikler/skiller tutabilir.
  Bu, çapraz-dal + stat-koşul sistemiyle aynı planda ele alınır.
- Çizici bu fazda genel yazıldığı için, yukarıdakiler eklenince render minimal değişir.
