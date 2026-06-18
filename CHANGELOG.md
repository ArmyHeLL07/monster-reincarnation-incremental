# Değişiklik Günlüğü (Changelog)

> Bu dosya her işlemden sonra güncellenir — ne, ne zaman değişti. Büyük resim ve
> yapılacaklar listesi için `ILERLEME.md`'ye, tasarım gerekçeleri için
> `docs/superpowers/specs/`'e bak. Format: [Keep a Changelog](https://keepachangelog.com) esinli.

## [Yayınlanmadı] — 2026-06-18

### Eklendi (Geri bildirim: bug + öneri → GitHub)
- **Öneri gönder** butonu (Ayarlar): bug report gibi GitHub issue açar ama `[öneri]` +
  `enhancement` etiketiyle ve hafif bağlam (sadece dil). Bug report `[bug]` + `bug` etiketi +
  tam debug bağlamı (tier/level/konum/UA). `reportBug` → genel `openIssue(kind)`. (Harici form yok.)

### Düzeltildi (tüm-kod mantık/bug taraması)
- **Gatekeeper/rebirth zamanlaması**: boss her katın sonunda spawn olduğundan Layer 3'ün
  **ilk katı** öldürülünce rebirth açılıyordu. Artık **son kat** (floors=7) boss'u gerekiyor —
  "son katman boss'u" mantığına uygun. Hell-clear ödülü de aynı şekilde son-kat şartına bağlandı.
  (`combat.ts: onKill`.)
- **Rebirth temiz sıfırlama**: yeniden doğuş artık `statusEffects` (eski zehir/yanma),
  `roomCleared` (takılı "oda temiz") ve `cooldowns`'u sıfırlıyor. (`rebirth.ts`.)
- **Metin**: `ui.rebirth_locked` "Katman 5" → "Katman 3, son kat" (zindan 3 katman).

### Eklendi (Sırada #2 — Düşman skin/texture)
- **Düşman portreleri**: her düşmana emoji "skin" (`Enemy.icon`) + **element-renkli çerçeve**
  (boss'lar parıldar). Savaş panelinde portre + isim/bar yan yana — "isim+bar sıkıcı" giderildi.
  Gözsüzken bile yaratık şekli görünür (statlar gizli). (`enemies.json`, `ui.ts: enemyPortrait`.)

### Eklendi / Değişti (skill yönetimi + HUD yeri)
- **Skiller gruplandı**: liste artık **Kol (saldırı) / Bacak (hareket) / Vücut (pasif) / Göz**
  başlıkları altında derli toplu. `Skill.part` (opsiyonel) + koddan türetme (`skillPart`).
- **Skill silme**: skill detayında **Sil** (onaylı; equipped/göz slotu temizlenir).
- **Feda Et (sacrifice)**: bir Kurban Kitabı bulununca açılır; skili feda → yatırıma göre
  **kalıcı stat puanı + EP** (eff=tier×10+lv; pts=1+eff/6, ep=eff×4). (`combat.ts: removeSkill/sacrificeSkill`.)
- **Mini-HUD yeri düzeltildi**: sabit köşe overlay sekme butonlarının üstüne biniyordu →
  artık **sol sidebar'ın üstünde, akış içinde** (ayırıcı çizgili), çakışma yok. Sidebar
  200px'e genişledi. Mobilde HUD gizli, topbar barları görünür. (px-overlay kaldırıldı.)

### Eklendi / Değişti (geri bildirim turu 2)
- **Evrim riski** (backlog): evrim seni savunmasız bırakır — evrimde **LUCK ile azalan**
  ambush şansı (~%35 − LUCK×1.5, min %5); olursa maks HP'nin ~%45'i kadar hasar (asla
  öldürmez). Evrim artık bedava full-heal değil. (`evolution.ts`.)
- **Açlık % olarak** (backlog): Tok/Aç etiketi yerine **yüzde** (mini-HUD + topbar).
- **Rest + arama** (backlog): **dinlenirken oda tekrar tekrar aranabilir** (tek-arama
  kilidi yalnızca savaşta). (`discovery.ts`.)
- **Günah yeniden** (backlog): günah artık **sadece kendi ırkından (spider) düşman
  öldürünce** artıyor (`Enemy.race`; cave_lurker & venom_brute kin) + belirgin
  "günah işledin" log/toast. (`enemies.json`, `combat.ts: onKill`, `ruler` aynı kaldı.)
- **Mini-HUD büyütüldü** (320px, daha büyük font/bar) — hâlâ küçük görünüyordu.

### Düzeltildi / Değişti (Atıl geri bildirim turu)
- **Bug: savaşta can "durduk yere" iniyordu** — SP (stamina) tükenince her tick HP sızıyordu
  (düşman vurmasa da; farm-in-place ile savaş durmadığından sürekli). Artık **stamina tükenmesi
  HP'ye sızdırmıyor**; sadece yorgunluk hasar cezası (×0.5) uygulanır, MP varsa önce o yastıklar.
  (`combat.ts: drainStamina`.)
- **Kat sayısı sabit 7** (önceki random 12-20 kaldırıldı); oda sayısı **floor başına random
  12-20** olarak kalıyor. (`dungeon.json floors:7`, `combat.ts: floorsOf` artık sabit okur.)
- **Toast'lar tıklamayla kapanıyor** (artık hızlıca kaçmıyor; 30sn uzun yedek + ✕ ipucu).
  (`ui.ts: pushToast`, `index.html` CSS.)
- **Mini durum HUD'u** biraz büyütüldü (172px) ve **açlık** eklendi; masaüstünde topbar'daki
  HP/MP/SP/açlık barları gizlendi (mini-HUD üstleniyor; ≤1100px'de topbar barları geri gelir).
- **Manuel ilerleme = sadece oda geçişi**: auto-advance kapalıyken oda **yerinde farmlanır**
  (düşman aynı odada respawn olur, sürekli Fight'a basmaya gerek yok); "İlerle →" butonu
  istendiğinde sonraki odaya geçirir. (`combat.ts: clearRoom/combatRound/advanceRoom`, `ui.ts`.)

### Eklendi (Backlog — Status efektleri)
- **Status efektleri (DoT)**: düşmanın elementsel vuruşu (zehir/ateş/asit/yıldırım/buz)
  **1-10 sn süreli** bir etki bırakabilir; süre ve hasar vuruş büyüklüğü ile artar,
  **direnç ile azalır** (yüksek dirençte nadir/zayıf). Her tick HP götürür + o direnci
  besler; ölümde temizlenir. Savaş panelinde aktif etkiler (tür · kalan sn · -hasar)
  gösterilir. (`state.ts: StatusEffect`, `combat.ts: applyStatus/processStatuses`, `ui.ts`.)

### Değişti (Backlog — Meditasyon)
- **Meditasyon erdem oranı** 0.5/tick → **+0.01/sn** (float; sabırlı aydınlık yol). Zaten
  bekleme-ile çalışıyordu (autoclicker yok).
- **Canlı ilerleme**: meditasyon barı artık her tick güncelleniyor — Lore sekmesinde
  `#medlive` (riddle input'una dokunmadan), ayrıca meditasyon yaparken Savaş sekmesinde
  canlı gösterge (% + ☼ erdem). (`meditation.ts`, `ui.ts: medBarHtml + live`.)

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
