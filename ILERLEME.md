# Monster Reincarnation Incremental — İlerleme Kaydı

> Paylaşılabilir ilerleme notu. Arkadaşın (velvetcrowee) Godot/C# oyunundaki
> özellikleri, bizim **web (TypeScript)** oyununa — mevcut kodu bozmadan,
> data-driven + TR/EN lokalize şekilde — sırayla portluyoruz.
>
> **Canlı demo:** https://armyhell07.github.io/monster-reincarnation-incremental/
> **Repo:** https://github.com/ArmyHeLL07/monster-reincarnation-incremental

**Son güncelleme: 2026-06-20**

---

## ✅ Yapıldı (2026-06-20) — harita random olayları

- **Seçim-tabanlı oda olayları:** yeni olay-odası tipi (hash-kararlı), metin+seçenek paneli, seçene
  kadar savaş/ilerleme kilitli, bir kez çözülür. **Bilgi=Hayatta Kalma:** önsezi (sonuç önizleme) +
  kapı (koşullu seçenek, gereksinim gösterilir). Risk yelpazesi lezzet→ölümcül (telgraflı). Data-driven
  `events.json` **20 olay** (sistem-bağlı: ağ/açlık/ruler/element/lore/gaze/scar), tüm metin tr+en.
  Yeni `roomevents.ts` (saf mantık) + combat kavşakları + UI paneli.
- **Sistemler-arası mantık denetimi (Atıl isteği) — 6 hata bulundu & düzeltildi:** döngüsel import,
  dosya-adı çakışması, **rebirth'te formHistory sıfırlanmıyordu (evrim ağacı bug'ı)**, boss odası olay
  olabiliyordu, spawn metni gösterilmiyordu, farm-zıplamada stale event. typecheck+build ✓. *(Push/deploy beklemede.)*

## ✅ Yapıldı (2026-06-20) — evrim ağacı görseli

- **Evrim ağacı görseli (Statlar sekmesi):** düz liste yerine **dikey dallanan ağaç** (tier T0→T10,
  durum-stilli düğümler). **Karma reveal:** yolun + bir sonraki kademe net, ileri formlar silik `???`
  (isim gizli, dallanma şekli görünür), yaklaştıkça kalıcı açılır (`seenForms`+`formHistory`). Mevcut
  topoloji çizilir, denge/yeni yol yok. **Ertelendi:** çapraz dallar + stat-koşullu (ırka özel) evrim —
  ayrı plan (spec §10). Brainstorm→spec→plan→uygulama (typecheck+build ✓). *(Push/deploy beklemede.)*

## ✅ Yapıldı (2026-06-20) — kat-bazlı random oda + stat lore

- **Oda sayısı artık gerçekten kat-bazlı random (12–20).** Eskiden oda sayısı **katman başına**
  tek sefer yuvarlanıp o katmanın tüm katlarına aynı veriliyordu → katlar hep aynı genişlikteydi
  (3. kez "düzeltildi" denip geri saran sorun). Kök neden: harita/ilerleme matematiği "kat başına
  sabit oda" varsayımına gömülüydü. Veri modeli kat-bazlı diziye taşındı (`layerRooms[layer][kat]`,
  `exploredMax[layer][kat]`); `roomsOf` kata özgü; harita gridi her katı kendi genişliğinde çiziyor.
  Aralık `dungeon.json`'da `minRooms`/`maxRooms` (data-driven). Eski kayıtlar otomatik göç ediyor.
- **Stat lore açıklamaları:** 6 ana stat (STR/VIT/AGI/INT/WIS/LUCK) için lore ağırlıklı TR+EN
  açıklama; Stats sekmesinde her statın altında görünüyor.

---

## ✅ Yapıldı (2026-06-18) — harita & evrim revizyonu

- **Bug fix (arkadaş raporu):** Layer 3'e geçilemiyordu — `tierReq: 7` istiyordu ama
  evrim zinciri T5'te bitiyordu. Evrim ağacı **T10'a uzatıldı** (Layer 3 T7 kaldı,
  oyun zor kaldı). 6 yeni form: colossal_weaver, revenant_horror, dread_weaver,
  wraith_sovereign (T7 = Layer 3 açılır), elder_sovereign, abyssal_sovereign.
  Apex `arachnid_sovereign` = T10. `greater_weaver` çıkmazı kapatıldı.
- **Katman element teması + çevresel direnç:** L2 ateş, L3 ruh. Savaşta ortam yanması
  (dirence göre azalır), eşleşen direnç ×2.5 hızlı birikir; difficulty `envMult`.
- **Sakin keşif odaları:** her katın bir oranı (`explorationRate`) savaşsız —
  EP + toparlanma + lore/gizli oda şansı.
- **Manuel harita ilerlemesi:** varsayılan manuel ("İlerle →" butonu); "Oto-ilerle"
  toggle ile otomatik. (Önceden her öldürmede otomatik ilerliyordu.)
- **Random kat sayısı 12-20** (o tarihte oda sayısı **katman-bazlı** random'dı — kat-bazlı değil;
  gerçek kat-bazlı oda 2026-06-20'de yapıldı). Boss her katın sonunda.
- **Göz füzyonu (Madde 6):** iki takılı göz → tek slotta hibrit (hem pasif hem aktif);
  aynı mod → körlük cezası; book_8 ('gözler' lore) ile açılır.

> Tümü data-driven + TR/EN lokalize. typecheck + build geçti. Ayrıntı: `CHANGELOG.md`
> ve `docs/superpowers/specs/2026-06-18-harita-element-kesif-ilerleme-design.md`.

---

## ✅ Yapıldı (deploy edildi — 2026-06-17)

### Daha önce (temel)
- Manuel harita ilerlemesi (Layer.Floor.Room + sınır/frontier + farming).
- Kayan barlar (HP/MP/SP/açlık + düşman HP).
- AGI'ye bağlı saldırı hızı (cooldown).
- Gerçek ölüm (revive yalnızca `undying_husk` skili varsa).

### Arkadaşın oyunundan portlanan 4 özellik (bu turda)
1. **Element üstünlük matrisi** — `data/elements.json`
   - 8 elementlik halka; avantaj ×1.5, dezavantaj ×0.7.
   - Saldıran element vs düşman elementi → hasar çarpanı; log'da `↑ çok etkili!` / `↓ dirençli.`
   - Düşman zayıflığı **Appraisal seviyesi ≥2** ise görünür ("Bilgi = Güç").
2. **Günah/Erdem (Ruler) ekseni** — `data/rulers.json`
   - **Günah:** sadece **kendi ırkından** (örümcek) düşman öldürünce (`venom_brute`, `cave_lurker` etiketli).
   - **Erdem:** `rest`'te 0.001 şans; her şey fullse 0.01; erdem skili varsa ×1.01.
   - 7+7 ruler, aktif eksen ruler başına +%8 (Günah→hasar, Erdem→XP).
   - **Paralel Zihin** (ikisi de eşiği geçince ikisi birden aktif) + **Taboo** (günah çok yükselince kalıcı +%50 hasar).
   - Stats sekmesinde "Günah / Erdem" paneli.
3. **Brink (Eşiğe gitme)** — `data/brink.json`
   - "Eşiğe git" butonu → HP ~%10'a düşer.
   - Düşük canda direnç kazancı ×2.5 + revive skili (`undying_husk`) keşif şansı.
4. **Meditasyon / Zen** — `data/meditation.json`
   - `rest`'te gösterge dolar (full dinlenirken daha hızlı) → **Zen** açılır.
   - Zen → `inner_calm` skili (kalıcı regen + erdem ×1.01) + bir kerelik erdem sıçraması.

> Tümü: data-driven JSON + TR/EN lokalize. Her özellik typecheck + build + headless smoke testi geçti.

---

## ⏳ Yapılacak (önerilen sırayla)

5. ~~**Lore bilmeceleri**~~ — ✅ Zaten yapılmış (discovery.ts, answerRoom, secret_rooms.json).
6. ~~**Göz füzyonu**~~ — ✅ **Yapıldı 2026-06-18**: iki takılı göz → tek slotta hibrit
   (pasif+aktif), aynı mod körlük cezası, book_8 ('eyes') ile açılır.
7. **Yemek-evrim koşulu** — belirli canavarı yiyince evrim açılır (`requireEat`) + skill
   tohumu (`grantsSkill`). ← **SIRADAKİ (tek gerçek kalan madde)**.
8. ~~**Rebirth + Gatekeeper**~~ — ✅ Zaten yapılmış (rebirth.ts, gatekeeperCleared).
9. ~~**Zorluk**~~ — ✅ Zaten yapılmış (difficulty.json + permadeath); 2026-06-18'de
   `envMult` (çevresel direnç) eklendi.

> Liste 2026-06-18'de denetlendi — 5/8/9 zaten koddaydı, 6 yapıldı. Geriye **Madde 7** kaldı.

---

## 📌 Notlar
- Her özellik **önce plan → onay → uygulama** şeklinde ilerliyor; denge sayıları JSON'da (koda dokunmadan ayarlanır).
- Bizim mimaride daha güçlü olanlar korunuyor: tam lokalizasyon (TR/EN), Layer.Floor.Room zindan, SP/Stamina, kademeli Appraisal, deterministik füzyon.
- Sıradaki adım: **Madde 7 (Yemek-evrim koşulu)**.
