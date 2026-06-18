# Tasarım: Harita Element/Keşif Sistemi + Manuel İlerleme + Evrim T10

**Tarih:** 2026-06-18
**Durum:** Onaylandı + uygulandı
**Kapsam:** Zindan katmanlarının bölgesel/element kimliği, çevresel direnç dinamiği,
sakin keşif odaları, manuel/otomatik harita ilerlemesi, random kat sayısı, evrim
zincirinin T10'a uzatılması (Layer 3 bug fix).

---

## Bağlam & Problem

- **Bug (arkadaş raporu):** Layer 3 `tierReq: 7` istiyor ama evrim zinciri en uzun
  yolda T5'te (`arachnid_sovereign`, `evolvesTo: []`) bitiyordu → ulaşılabilir maks
  tier 5 → Layer 3 **ölü kapı**.
- Atıl'ın yönü: Layer 3 **T7 kalsın** (oyun zor olsun), karakter **T10'a kadar**
  evrimleşebilsin. "Araya formlar karıştır, gerekirse yeni form yarat."
- Harita şu an tamamen savaş; her öldürmede oda **otomatik** ilerliyordu.
- Katmanların element kimliği yoktu; direnç sadece düşman vuruşundan kazanılıyordu.

## Kararlar

### A) Evrim zinciri T10 (Sovereign = apex/T10)
Tüm dallar `undying_horror` (T4)'te birleşip ortak yükseliş omurgasından T10'a çıkar.
6 yeni form eklendi; `arachnid_sovereign` apex (T10) olarak korundu.

| Tier | Form | Yeni? | Verdiği skiller |
|---|---|---|---|
| T3 | colossal_weaver | 🆕 | adamant_plating, blood_engine, toughness |
| T5 | revenant_horror | 🆕 | undying_vitality, regenerative_core |
| T6 | dread_weaver | 🆕 | phantom_presence, plague_mist |
| T7 | wraith_sovereign | 🆕 (**Layer 3 açılır**) | spatial_web, soul_gaze |
| T8 | elder_sovereign | 🆕 | all_sight, precognition |
| T9 | abyssal_sovereign | 🆕 | reaper_edge, domination_gaze, endless_mana |

`greater_weaver` artık çıkmaz değil (→ colossal_weaver), böylece hiçbir build T7'ye
ulaşmaktan kilitlenmez. Yeni formlar yalnızca `skills.json`'da zaten var olan üst-tier
skilleri verir (dokümanla tutarlı, yeni skill gerekmedi).

### B) Element teması + çevresel direnç dinamiği
`dungeon.json` katmanlarına `element` + `ambient {drainPct, resistBoost}` eklendi.

| Katman | element | drainPct | resistBoost |
|---|---|---|---|
| L1 Üst Karanlık | — | — | — |
| L2 Derin Karanlık | fire | 0.004 | 2.5 |
| L3 Uçurum | soul | 0.005 | 2.5 |

- Her savaş tick'inde ortam yanması: `maxHP × drainPct × (1 − elementDirenci) × envMult`.
  Direnç arttıkça yanma azalır → **"Bilgi = Hayatta Kalma."** Direnç maksta yanma durur.
- Eşleşen elementin direnç-exp'i `× resistBoost × resistMult` hızlı birikir.
- Difficulty `envMult`: Kolay 0.5 · Normal 1.0 · Zor 1.4 · Cehennem 1.8.
- Sadece savaş odalarında uygulanır (keşif odaları güvenli).

### C) Sakin keşif odaları
Katman başına `explorationRate` (L1 %15, L2 %20, L3 %20). Deterministik `roomHash`
ile belirlenir; **1. oda ve boss odası asla** keşif olmaz. Keşif odası: düşman yok,
küçük EP + can/SP toparlanması + lore parçası/gizli oda şansı, sonra ilerlenir.

### D) Manuel ilerleme + oto-ilerle
`state.autoAdvance` (varsayılan **false = manuel**). Oda temizlenince `roomCleared`
true olur, "İlerle →" butonu çıkar; basınca sonraki oda. "Oto-ilerle: Açık/Kapalı"
toggle isteyene eski otomatik akışı verir. Saldırı modu (`combatMode`) ayrı kavram.

### E) Random kat sayısı
`state.layerFloors` eklendi, katman başına **12-20 random** (mevcut `roomsOf` ile
simetrik). Oda sayısı zaten 12-20 random'dı. Boss **her katın sonunda** (o katın ana
boss'u — Atıl onayı). `advancePosition`/harita `floorsOf`'tan okur; JSON `floors` artık
vestigial.

## Mimari Notlar
- Tümü data-driven; denge sayıları JSON'da (`dungeon.json`, `difficulty.json`).
- Tüm yeni metinler TR+EN lokalize (Kural 2).
- `advancePosition` artık `wasBoss`'u pozisyondan türetir (`room >= R`).
- `clearRoom` ortak yardımcı: öldürme + keşif sonrası oto-ilerle ya da bekleme.

## Dosyalar
`shared/types.ts`, `data/dungeon.json`, `data/difficulty.json`, `data/evolutions.json`,
`data/i18n/{tr,en}.json`, `client/game/state.ts`, `client/game/combat.ts`,
`client/main.ts`, `client/ui.ts`. Doğrulama: `npm run typecheck` + `npm run build` ✓.

## Riskler / Açık Notlar
- Manuel varsayılan → offline ilerleme ilk temiz odada durur (idle isteyen oto-ilerle
  açar; bilinçli tasarım).
- Yeni form isimleri placeholder; Atıl beğenmezse değişir.
- Rebirth panel metni "Katman 5" diyor ama gatekeeper Layer 3'te — mevcut tutarsızlık,
  bu kapsamda dokunulmadı.
