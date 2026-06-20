# Tasarım — Harita Random Olayları (seçim-tabanlı oda olayları)

> Tarih: 2026-06-20 · Durum: onay bekliyor → uygulama
> İlgili: `docs/GDD.md §8.2` (keşif/bilgi-kapısı), `discovery.ts` (search/secret room),
> `combat.ts` (oda akışı), `data/secret_rooms.json` (benzer desen).

## 1. Amaç

Zindan odalarına **seçim-tabanlı mini olaylar** eklemek (çatal yol, tuzak, sunak, leş…).
Oyuncu metin okur, seçenek seçer, sonucu alır. **"Bilgi = Hayatta Kalma"** olayların kalbinde:
bilgi hem tehlikeyi **önceden gösterir** (önsezi) hem özel seçenekler **açar** (kapı).

## 2. Mimari — yeni "olay odası" tipi

Bir odanın türü **kararlı** (coordinate hash — keşif odaları gibi önceden-bilinebilir):
`roomHash(layer, floor, room)` ile oda bir kovaya düşer: **boss** (son oda) → savaş; aksi
halde sırayla **olay** (`eventRate`), **sakin keşif** (`explorationRate`), kalan → **savaş**.
Giriş odası (room ≤ 1) her zaman savaş/güvenli (mevcut kural korunur).

- Olay odasına girince `state.pendingEvent` kurulur; **olay paneli** çıkar.
- **İlerleme + savaş kilitli** (roomCleared gibi) — seçim yapılana kadar.
- Bir olay **bir kez** çözülür (`resolvedEvents` roomKey listesi); farm'da tekrar çıkmaz.
- Olaylar **kararlı** olduğundan harita stabil, önceden üretilebilir, topluluk paylaşabilir.

## 3. Veri modeli (`packages/shared/src/types.ts`)

```ts
export interface EventCond {
  appraisalTier?: number;            // gören-göz tier eşiği
  int?: number;                      // INT eşiği
  stat?: Partial<Record<StatKey, number>>;
  skill?: { id: string; level: number };
  unlock?: string;                   // sahip olunması gereken unlock
}

export type EventOutcomeKind =
  | 'ep' | 'stat' | 'skill' | 'unlock' | 'fragment'   // ödüller
  | 'hp' | 'status' | 'scar' | 'hunger'               // riskler/etkiler (hp<0 = hasar)
  | 'food' | 'sin' | 'virtue' | 'spawn' | 'none';     // diğer/ahlak/savaş

export interface EventOutcome {
  kind: EventOutcomeKind;
  value?: string | number;           // stat key / skill id / miktar / status type / enemy id …
  amount?: number;                   // sayısal büyüklük (hp, ep, status süresi…)
  locKeyResult: string;              // sonuç metni (log + panelde)
}

export interface EventChoice {
  locKey: string;                    // seçenek etiketi
  requires?: EventCond;              // kapı: sağlanmazsa pasif (gereksinim gösterilir)
  /** Sabit sonuç(lar). */
  outcomes?: EventOutcome[];
  /** VEYA ağırlıklı rastgele dal (biri seçilir). */
  random?: { weight: number; outcomes: EventOutcome[] }[];
}

export interface EventDef {
  id: string;
  locKey: string;                    // olay metni/açıklaması
  icon?: string;                     // 🪤 ⚰️ 🔮 …
  layers?: number[];                 // sınırla (yoksa hepsi)
  weight?: number;                   // seçim ağırlığı (varsayılan 1)
  /** Önsezi: appraisalTier/INT bu eşiği geçerse her seçeneğin sonucu/tehlikesi gösterilir. */
  revealReq?: { appraisalTier?: number; int?: number };
  choices: EventChoice[];
}
```

`Content`'e `events: Map<string, EventDef>` eklenir; `content.ts` `events.json`'u yükler.

## 4. Bilgi mekaniği (ikisi de)

- **Önsezi:** `appraisalTier(state) ≥ revealReq.appraisalTier` **veya** `INT ≥ revealReq.int`
  ise her seçeneğin altında **sonuç önizlemesi** (`locKeyResult`/türetilmiş özet) görünür
  (örn. "↳ tuzak: −%40 HP", "↳ +3 STR"). Yoksa kör seçim (sadece etiket).
- **Kapı:** `requires`'lı seçenek koşul sağlanınca aktifleşir; sağlanmazsa **pasif** + gereksinim
  metni ("INT 30 gerek"). Genelde en güvenli/iyi yol kapının ardındadır.

## 5. Akış & mantık (`combat.ts` + yeni `events.ts`)

Yeni dosya **`packages/client/src/game/events.ts`** (olay mantığı izole):
- `rollRoomEvent(state, content): string | null` — kararlı hash + `eventRate` + uygunluk
  (layers, daha önce çözülmemiş) ile bu odaya bir `EventDef.id` atar veya null.
- `pickEvent(state, content, roomKey): EventDef | null` — hash'ten ağırlıklı deterministik seçim.
- `chooseEvent(state, content, choiceIndex, log): boolean` — koşulu doğrula → outcome'ları uygula
  (random dalsa ağırlıklı seç) → `locKeyResult` log'la → `resolvedEvents.push(roomKey)` →
  `pendingEvent = null`. Geçersiz/kilitli seçim → false.
- `applyOutcome(state, content, o, log)` — `kind`'a göre: ep/stat(+recompute)/skill(varsa atla)/
  unlock/fragment/hp(min 1'de durmaz — 0 olabilir → normal ölüm)/status(statusEffects'e ekle)/
  scar(+1)/hunger/food(inventory'e ekle)/sin(gainSin)/virtue(gainVirtue)/spawn(düşman başlat).

`combat.ts` oda-girişinde (mevcut `spawnEnemy`/`isExplorationRoom` dalında): giriş/boss değilse
`rollRoomEvent` → varsa `pendingEvent` kur, düşman/keşif yapma. `advancePosition` ve savaş,
`pendingEvent` doluyken **bloklanır** (roomCleared benzeri kapı).

## 6. Durum (`state.ts`) ve göç

- `pendingEvent: { id: string; roomKey: string } | null` — çözülmemiş olay.
- `resolvedEvents: string[]` — çözülen oda anahtarları (`layer.floor.room`).
- `newGame`: `pendingEvent: null`, `resolvedEvents: []`. `migrate`: `??=`.
- Ölüm/rebirth olayda kalmışsa: `onDeath`/`rebirth` `pendingEvent`'i sıfırlar (takılma olmasın).

## 7. UI (`ui.ts`)

- `combatTab`'ta `state.pendingEvent` varsa düşman paneli yerine **olay paneli**:
  ikon + olay metni + seçenek butonları (`data-evchoice="<i>"`); kilitli seçenek pasif +
  gereksinim; önsezi açıksa her seçeneğin altında sonuç önizleme satırı.
- Olay varken savaş/ilerleme kontrolleri gizli/pasif. Seçim → `ACTIONS.onChooseEvent(i)`.
- Sonuç log'a (Keşif akışı) düşer; panel kapanır; ilerleme açılır.
- Yeni `ACTIONS.onChooseEvent` + `main.ts` wiring (chooseEvent → save → render).

## 8. Lokalizasyon (tr + en)

Tüm metin loc key: olay metinleri, seçenek etiketleri, sonuç metinleri, gereksinim/önsezi
etiketleri (`ui.ev_requires`, `ui.ev_foresee`, `ui.ev_locked` vb.). Her olay & seçenek & sonuç
kendi anahtarını taşır. (Kural 2 — koda metin gömülmez.)

## 9. Denge

- `eventRate` ~0.12 (global sabit veya katman başına `dungeon.json`'da; data-driven).
- Tüm olay/seçenek/outcome sayıları `events.json`'da. Kodda denge sabiti yok.
- **Ölüm** yalnız `hp` outcome'ı canı 0'a indirirse (normal ölüm akışı) — önseziyle telgraflı,
  yüksek bilgi tehlikeyi önceden gösterir. (Atıl: "hepsi olabilir" — ölüm dahil, seyrek.)

## 10. İçerik kataloğu (v1 — tüm set, ~20 olay)

Her olay: metin + 2-3 seçenek (en az biri **kapı** veya **risk**), önsezi ipucu. Tam sayılar
`events.json` authoring'de. Sisteme bağlananlar öncelikli.

**Temel (6)**
1. 🔀 **Çatal yol** — sağ/sol farklı küçük ödül/risk; önsezi güvenliyi gösterir.
2. 🪤 **Tuzak** — etkisizleştir (INT/appraisal kapısı) · zorla geç (HP riski) · geri çekil (EP kaybı).
3. ⚰️ **Leş** — yağmala (random: food/fragment **ya da** status/zehir) · bırak.
4. 🔮 **Sunak** — EP feda → stat/skill şansı · "rünleri çöz" (INT kapısı) → garanti ödül · görmezden gel.
5. 🥚 **Garip yumurta** — kır (random: spawn düşman **ya da** food) · kuluçka (kapı) sonra ödül · bırak.
6. 🚪 **Gizli geçit** — algıla (appraisal kapısı) → ileri-atla/lore · değilse kapalı.

**Ağ teması (2)**
7. 🕸️ **Terk edilmiş ağ** — yağmala (food/fragment) · kendine kat (küçük pasif) · (önsezi: tuzaklı mı).
8. 🧵 **Kozalanmış kurban** — aç (random: food **ya da** spawn) · appraisal kapısı → güvenli yağma.

**Açlık / Ruler (3)**
9. 🩸 **Yaralı yaratık** — bitir & ye (food + **sin**) · bağışla (**virtue**) · yoksay.
10. 👶 **Aç yavru** — besle (hunger↑ + **virtue**) · ye (food + **sin**) · geç.
11. 🤝 **Başka reenkarne** — ittifak (geçici buff/fragment) · ye (food + **sin**) · geç.

**Element / Direnç (1)**
12. 🔥 **Element kaynağı** (layers: 2,3) — dokun (random: direnç-exp **ya da** status) · emici (direnç-LV kapısı) → güvenli emiş · kaç.

**Lore / Bilgi (2)**
13. 📖 **Kanlı günlük** — oku (loreFragment + ipucu) · sayfaları ye (küçük ep, lore kaybı) · sakla (sonra).
14. 🕯️ **Lore taşı** — çöz (INT kapısı → unlock/skill) · ezbere al (loreFragment) · kır (EP).

**Göz / Gaze (1)**
15. 👁️ **Bakan göz** — karşılık bak (göz-skili kapısı → ödül **ya da** dread status) · kör et (saldır, HP riski) · kaç.

**Yüksek risk (2)**
16. 🌀 **Boşluk yarığı** (layers: 3) — bak (random: lore **ya da** status) · elini sok (random: skill **ya da** **scar**) · uzak dur.
17. 💀 **Hükümdar izi** — saygı (**virtue**) · gücünü çal (**sin** + HP riski) · incele (appraisal kapısı → unlock).

**Keşif/avantaj (3)**
18. 🐀 **Yankılanan tıkırtı** — izle (gizli oda/kısa yol sezme) · pusu kur (avantajlı savaş başlat) · kaç (güvenli, ödül yok).
19. 🪞 **Tuhaf yansıma** — bak (random: ep/içgörü **ya da** dread) · iç (random: HP/SP yenilenme **ya da** zehir) · geç.
20. 🍖 **Terk edilmiş kiler** — hepsini ye (random: hunger doy **ya da** çürük status) · seç (INT/appraisal kapısı → en iyisi) · bırak.

> Atıl kendi olay fikirlerini ekleyebilir (spec incelemesinde) → kataloğa girer. Sistem aynı.

## 11. Dosya özeti

| Dosya | Değişiklik |
|---|---|
| `packages/shared/src/types.ts` | `EventCond/EventOutcome/EventChoice/EventDef` + `Content.events` |
| `data/events.json` | ~20 olay tanımı (yeni dosya) |
| `packages/client/src/game/content.ts` | `events.json` yükle → `events: byId(...)` |
| `packages/client/src/game/events.ts` | **yeni**: rollRoomEvent/pickEvent/chooseEvent/applyOutcome |
| `packages/client/src/game/combat.ts` | oda-girişi olay dalı + advance/savaş bloğu |
| `packages/client/src/game/state.ts` | `pendingEvent`, `resolvedEvents` + newGame |
| `packages/client/src/main.ts` | migrate backfill + `onChooseEvent` wiring + onDeath/rebirth reset |
| `packages/client/src/ui.ts` | olay paneli (combatTab) + `.evchoice` wiring + CSS |
| `data/i18n/tr.json`, `en.json` | sistem etiketleri + tüm olay/seçenek/sonuç metinleri |

## 12. Test / doğrulama

- `typecheck` + `build` temiz.
- Manuel: olay odasına gir → panel çıkar, ilerleme kilitli; seçim → sonuç log + ilerleme açılır;
  düşük bilgi = kör seçim, yüksek Appraisal/INT = önsezi + kapı seçenekleri; çözülen oda farm'da
  tekrar olay vermez; ölümcül seçim canı 0'a indirebilir (telgraflı); eski kayıt patlamaz.

## 13. Kapsam dışı (YAGNI / sonra)

- Olay-keşif günlüğü (hangi olayları gördün) — Bestiary turuyla birlikte düşünülebilir.
- Marvion/LLM ile olay üretimi — bu fazda yok; tüm olaylar elle authored JSON.
- Olay zincirleri (bir olay sonraki olayı tetikler) — sonra.
