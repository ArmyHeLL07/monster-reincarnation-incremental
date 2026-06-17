# Monster Reincarnation Incremental — İlerleme Kaydı

> Paylaşılabilir ilerleme notu. Arkadaşın (velvetcrowee) Godot/C# oyunundaki
> özellikleri, bizim **web (TypeScript)** oyununa — mevcut kodu bozmadan,
> data-driven + TR/EN lokalize şekilde — sırayla portluyoruz.
>
> **Canlı demo:** https://armyhell07.github.io/monster-reincarnation-incremental/
> **Repo:** https://github.com/ArmyHeLL07/monster-reincarnation-incremental

**Son güncelleme: 2026-06-17 13:00**

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

5. **Lore bilmeceleri** — Araştır ile gizli oda; WIS şans, INT okuma kapısı; metin cevaplı bilmece; ödül skill/EP.
6. **Göz füzyonu** — iki takılı göz → hibrit (pasif+aktif güçlü; aynı mod körlük cezası).
7. **Yemek-evrim koşulu** — belirli canavarı yiyince evrim açılır (`requireEat`) + skill tohumu (`grantsSkill`).
8. **Rebirth + Gatekeeper** — son katman boss'u → yeniden doğuş; kalıcı bonus + slot, günah/erdem/zen korunur.
9. **Zorluk** — Kolay/Normal/Zor/Cehennem (×0.7–2.0); Cehennem = permadeath (koşu silinir, meta kalır).

---

## 📌 Notlar
- Her özellik **önce plan → onay → uygulama** şeklinde ilerliyor; denge sayıları JSON'da (koda dokunmadan ayarlanır).
- Bizim mimaride daha güçlü olanlar korunuyor: tam lokalizasyon (TR/EN), Layer.Floor.Room zindan, SP/Stamina, kademeli Appraisal, deterministik füzyon.
- Sıradaki adım: **Özellik 5 (Lore bilmeceleri)**.
