# Değişiklik Günlüğü (Changelog)

> Bu dosya her işlemden sonra güncellenir — ne, ne zaman değişti. Büyük resim ve
> yapılacaklar listesi için `ILERLEME.md`'ye, tasarım gerekçeleri için
> `docs/superpowers/specs/`'e bak. Format: [Keep a Changelog](https://keepachangelog.com) esinli.

## [Yayınlanmadı] — 2026-06-18

### Eklendi (Backlog — Sol üstte küçük durum paneli)
- **Mini durum HUD'u**: sol üst köşede sabit, her tick güncellenen küçük panel — form
  adı · T/Lv · konum + HP/MP/SP (sayı + mini bar). Geniş ekranda sol boşlukta; ≤1100px
  gizli (topbar zaten orada). (`index.html` CSS, `ui.ts: miniStatusHtml`.)

### Eklendi (Backlog — Skill ediniş yolları)
- **Skill ediniş yolları**: `Skill.acquireKey` eklendi; özel/keşfedilen skiller
  (appraisal, dread_gaze, hp_regen, undying_husk, stillness, forbidden_knowledge, larder)
  "nasıl alınır" metni taşıyor → Skiller sekmesinde skill detayında gösteriliyor.
  Ayrıca Skiller sekmesine genel **"Ediniş Yolları" rehber paneli** (evrim/keşif/göz/
  füzyon/lore/ruler). TR+EN. (`shared/types.ts`, `data/skills.json`, `ui.ts`.)

### Eklendi (Backlog — Seviye atlayınca otomatik güç)
- **Otomatik güç**: efektif seviye (tier×10+level) başına **+%1.5 hasar** (stat point'ten
  ayrı) + her seviye **maks HP +2 / MP +1 / SP +1**. Statlar sekmesinde "Otomatik güç: +%X"
  gösterilir; seviye atlayınca maks'lar anında büyür. (`combat.ts: levelPower/effectiveLevel`,
  `state.ts: recomputeMaxes`, `ui.ts`.)

### Değişti (Sırada #1 — Analiz düşman üstünde)
- **Analiz (deep-read) artık savaş log'unu doldurmuyor** — detay düşman panelinde
  gösteriliyor (zaten tier'e göre name/type/ATK/HP/zayıflık vardı). "Analiz et"
  düşmanı `analyzed` işaretler → panelde **bir tier daha derin** detay + 🔍 işareti,
  tek satır onay log'u. (`combat.ts: deepRead`, `EnemyInstance.analyzed`, `ui.ts: enemyView`.)

### Eklendi (Madde 6 — Göz Füzyonu)
- **Göz füzyonu / hibrit göz** (GDD §5.0.7): iki takılı göz → **tek slotta** hibrit
  (diğer slot boşalır). Hibrit hem pasif aura hem aktif bakış sağlar. **Aynı mod**
  iki göz (ikisi de sadece aktif ya da sadece pasif) → **körlük cezası** (appraisal
  −2, etkiler ×0.6). Beden sekmesinde panel; **'gözler' lore'u (book_8) ile açılır**.
  (`eyes.ts: fuseEyes`, `EyeAssignment.fusedId/blind`, `ui.ts`, `main.ts`, i18n TR+EN.)

### Düzeltildi
- **Layer 3 ölü kapı bug'ı** (arkadaş raporu): Layer 3 `tierReq: 7` istiyordu ama
  evrim zinciri T5'te bitiyordu → katmana ulaşılamıyordu. Evrim ağacı **T10'a
  uzatıldı** (Layer 3 `tierReq: 7` korundu, oyun zor kaldı).

### Eklendi
- **6 yeni evrim formu** (`data/evolutions.json`): colossal_weaver (T3),
  revenant_horror (T5), dread_weaver (T6), wraith_sovereign (T7 — Layer 3 burada
  açılır), elder_sovereign (T8), abyssal_sovereign (T9). Apex `arachnid_sovereign`
  artık T10. `greater_weaver` çıkmazı kapatıldı. Formlar mevcut üst-tier skilleri verir.
- **Katman element teması + çevresel direnç dinamiği**: L2 = ateş, L3 = ruh. Savaşta
  ortam yanması `maxHP × drainPct × (1−direnç) × envMult`; eşleşen direnç ×2.5 hızlı
  birikir; difficulty `envMult` (Kolay 0.5 / Normal 1 / Zor 1.4 / Cehennem 1.8).
  (`data/dungeon.json`, `data/difficulty.json`, `combat.ts`)
- **Sakin keşif odaları**: her katın bir oranı (`explorationRate`) savaşsız keşif
  odası — küçük EP + toparlanma + lore/gizli oda şansı. 1. oda ve boss odası hariç.
- **Manuel harita ilerlemesi**: varsayılan manuel; oda temizlenince "İlerle →"
  butonu. "Oto-ilerle" toggle ile eski otomatik akış. (`state.autoAdvance`)
- **Random kat sayısı 12-20** (`state.layerFloors`); oda sayısı zaten 12-20 random'dı.
  Boss her katın sonunda (o katın ana boss'u).

### Teknik
- `shared/types.ts`: `DungeonLayer` (element/ambient/explorationRate), `DifficultyDef`
  (envMult), `LayerAmbient` tipi.
- `advancePosition` boss'u pozisyondan türetir; `clearRoom`/`advanceRoom`/`floorsOf`
  eklendi. Tüm metinler TR+EN lokalize. `typecheck` + `build` ✓.
