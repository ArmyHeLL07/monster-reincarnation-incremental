# Skill Kataloğu — Kapsamlı Referans (v1)

> *I'm a Spider, So What?* **sistem mantığından** esinlenildi; tüm isimler **özgün/türetilmiş** (telif-güvenli).
> İki ana bölüm: **A) Racial Skiller** (ırk/evrimle gelir) ve **B) Normal Skiller** (kullanım/puanla öğrenilir).
> Her skill: kısa açıklama + LV10 evrim hedefi + bağlı stat (STR/VIT/AGI/INT/WIS/LUCK).
> Bu dosya prototipin skill JSON'una doğrudan kaynak olacak.

---

# BÖLÜM A — RACIAL SKİLLER (ırk/evrimle gelir)

Bu skiller satın alınmaz; evrim/ırk tarafından **doğuştan** verilir. Çoğu pasif ve formun kimliğini tanımlar.

## A1. Beden / Doğa Skilleri
| Skill | Açıklama | Bağlı Stat |
|-------|----------|-----------|
| **Chitin Hide** | Doğal kabuk; baz fiziksel savunma. | VIT |
| **Many-Legged Gait** | Çok bacaklı hareket; baz hız + denge. | AGI |
| **Venom Gland** | Doğal zehir üretimi; zehir skillerinin ön koşulu. | STR/INT |
| **Silk Gland** | İplik üretme organı; iplik skillerinin ön koşulu. | AGI/INT |
| **Compound Eyes** | Geniş görüş açısı; baz algı. | WIS |
| **Night Born** | Karanlıkta görme; yer altı/zindan avantajı. | WIS |
| **Cold Blood** | Düşük enerji tüketimi; açlık daha yavaş artar. | VIT |

## A2. Evrim-Kilitli Racial Skiller (üst formlarda açılır)
| Skill | Açıklama | Hangi formda |
|-------|----------|--------------|
| **Apex Predator** | Alt-tür canavarlara korku salar; bazı düşmanlar kaçar. | Orta+ evrim |
| **Carapace Lord** | Kabuk savunması katlanır; fiziksel direnç. | Tank dalı |
| **Phase Body** | Kısa süreli yarı-saydamlık; kaçınma sıçraması. | Suikast dalı |
| **Regenerative Core** | Pasif yenilenme organı; regen tabanı yükselir. | Gizli/çürüme dalı |
| **Sovereign Form** | Yarı-insan form; konuşma + item kuşanma + dev stat. | Endgame |
| **Undying Husk** | Ölümcül hasarda bir kez dirilme (cooldown'lı). | Ölümsüzlük dalı |

## A3. Racial Pasif Bonuslar (form kimliği)
| Skill | Açıklama |
|-------|----------|
| **Brood Instinct** | Yumurta/yavru üretme (ileride: minion mekaniği). |
| **Web Sense** | Kurduğun ağdaki titreşimleri algıla (tuzak avantajı). |
| **Molt** | Deri/kabuk değiştirerek statüs efektlerini temizleme. |

---

# BÖLÜM B — NORMAL SKİLLER (öğrenilir / kullanımla gelişir)

LV1→LV10 ilerler, LV10'da evrimleşir (eski skill gider). Bağlı stata göre gruplandı.

## B1. SALDIRI — Zehir Hattı (STR/INT)
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Venom Bite** | Isırıkla zehir enjekte; zamanla hasar (DoT). | **Lethal Venom** |
| **Lethal Venom** | Daha hızlı/güçlü DoT, ağır zehir. | **Necro Toxin** |
| **Necro Toxin** | Çürütücü zehir; iyileşmeyi de baskılar. | (üst tier) |
| **Acid Spit** | Uzaktan asit; zırh aşındırır. | **Caustic Spray** |
| **Caustic Spray** | Alan asit; birden çok hedef. | — |
| **Toxic Cloud** | Zehirli sis bırak; alan reddi. | **Plague Mist** |

## B2. SALDIRI — Fiziksel Hattı (STR/AGI)
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Sharp Claw** | Keskin uzuv; baz fiziksel vuruş. | **Scythe Limb** |
| **Scythe Limb** | Tırpan bacak; yüksek delici hasar. | **Reaper Edge** |
| **Pounce** | Atılma; ilk vuruşta bonus hasar. | **Ambush Strike** |
| **Ambush Strike** | Gizliyken devasa ilk vuruş. | **Lethal Lunge** |
| **Rend** | Yırtma; kanama (DoT) bırakır. | **Maul** |

## B3. İPLİK / KONTROL Hattı (AGI/INT)
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Silk Thread** | Temel iplik; bağla/yavaşlat. | **Binding Silk** |
| **Binding Silk** | Hedefi sabitler; kaçışı engeller. | **Cutting Wire** |
| **Cutting Wire** | Kesici tel; iplik artık hasar verir. | **Spatial Web** |
| **Web Trap** | Yere tuzak ağı kur. | **Snare Field** |
| **Snare Field** | Geniş tuzak alanı; idle avda işe yarar. | **Spatial Web** |
| **Spatial Web** | Alan kontrolü; düşman hareketini yönet. | (üst tier) |

## B4. ALGI / ZİHİN Hattı (INT/WIS) — INT motoru
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Appraisal** | İncele; hedef bilgisi (zayıf katman). | **Insight** |
| **Insight** | Derin inceleme; zayıf nokta + direnç görür. | **All-Sight** |
| **Detect** | Tehlike/varlık sezme. | **Foresight** |
| **Foresight** | Kısa süre sonrası saldırıyı önceden gör. | **Precognition** |
| **Precognition** | Kısa gelecek görüsü; kaçınma tavan. | (üst tier) |
| **Quick Thought** | Hızlı düşünce; tepki süresi azalır. | **Accelerated Mind** |
| **Accelerated Mind** | Düşünce hızlanır; INT besler. | **Parallel Minds** |
| **Parallel Minds** | Paralel düşünce; aynı anda çok işlem (INT tavan). | (üst tier) |
| **Memory Palace** | Hafıza; kitap/lore ilerlemesini hızlandırır. | **Eidetic Recall** |

> **⊙ Göz yeteneği:** `Appraisal → Insight → All-Sight` zinciri normal skill **değildir** — **göze takılan özel yetenektir** (GDD §5.0.7). Göz slotu olmayan ırklar bu hattı kullanamaz; tabloda yalnızca kolaylık için listelendi. (`Detect → Foresight → Precognition` ayrı bir algı hattıdır, göze bağlı değildir.)

> **Birleşik üst skill (gizli):** `All-Sight` + `Precognition` LV10 birlikte → **OMNISCIENCE** (sistemin gizli verilerine erişim: evrim ağacı, exp eşikleri, gizli skiller görünür). Nadir, INT/WIS tavanı ister. *(Animedeki "Wisdom" muadili, özgün isim.)*

## B5. BÜYÜ Hattı (INT) — MP gerektirir
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Mana Sense** | Büyü gücünü algıla (büyünün ön koşulu). | **Mana Control** |
| **Mana Control** | Büyü gücünü yönlendir; büyü kullanımını açar. | **Mana Mastery** |
| **Flame Bolt** | Temel ateş büyüsü. | **Fire Lance** |
| **Frost Shard** | Buz büyüsü; yavaşlatır. | **Ice Spear** |
| **Stone Spike** | Toprak büyüsü; fiziksel-büyü. | **Earth Pillar** |
| **Gale Cut** | Rüzgâr büyüsü; hızlı, düşük maliyet. | **Wind Blade** |
| **Spark** | Yıldırım; yüksek burst. | **Lightning Strike** |
| **Void Step** | Uzaysal büyü; kısa ışınlanma. | **Spatial Rift** |

## B6. GÖZ / AURA Hattı (INT/WIS) — özel saldırı gözleri
"Bakışla etki" temalı, sahnede güçlü, MP/konsantrasyon ister.
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Piercing Gaze** | Bakışla baz hasar/sersemletme. | **Heavy Gaze** |
| **Numbing Gaze** | Felç/yavaşlatma bakışı. | **Paralytic Gaze** |
| **Petrify Gaze** | Taşlaştırma bakışı (güçlü CC). | **Stone Gaze** |
| **Dread Gaze** | Korku salar; zayıf düşman kaçar. | **Terror Gaze** |
| **Soul Gaze** | Doğrudan ruha hasar (dirence takılmaz). | **Rend-Soul Gaze** |
| **Charm Gaze** | Kısa süre düşmanı yönlendir. | **Domination Gaze** |

## B7. YAŞAM / DAYANIKLILIK Hattı (VIT)
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **HP Regen** | Pasif can yenileme. | **Auto-Heal** |
| **Auto-Heal** | Hızlı pasif iyileşme. | **Regeneration** |
| **Regeneration** | Güçlü yenilenme; uzuv/yara onarır. | **Undying Vitality** |
| **MP Regen** | Pasif büyü gücü yenileme. | **Mana Flow** |
| **Mana Flow** | Hızlı MP yenileme. | **Endless Mana** |
| **Endurance** | Acıya/yorgunluğa dayan; stat düşüşü azalır. | **Toughness** |
| **Toughness** | Yüksek dayanıklılık; eşik mekaniğiyle sinerji. | **Undying Will** |
| **Overdraw** | Canı yakıt yaparak güç (eşik/risk sinerjisi). | **Blood Engine** |
| **Carapace** | Öğrenilen kabuk savunması; fiziksel hasar azaltma (racial **Chitin Hide**'ın geliştirilebilir hattı). | **Hardened Shell** |
| **Hardened Shell** | Sertleşmiş kabuk; daha yüksek fiziksel direnç. | **Adamant Plating** |

## B8. RESISTANCE Hattı (VIT/WIS) — hasar-bazlı, LV10 → Nullity
Aldığın hasar tipinin exp'ine gider. LV10 = **Nullity** (direnç tavanı ~bağışıklık).
| Resistance | LV5 ara | LV10 → Nullity |
|------------|---------|----------------|
| **Fire Res** | Heat Ward | **Flame Immunity** |
| **Frost Res** | Chill Ward | **Frost Immunity** |
| **Poison Res** | Toxin Ward | **Poison Immunity** |
| **Acid/Corrosion Res** | Acid Ward | **Corrosion Immunity** |
| **Lightning Res** | Spark Ward | **Lightning Immunity** |
| **Physical Res** | Tough Hide | **Blunt Immunity** |
| **Pierce Res** | Hardened Skin | **Pierce Immunity** |
| **Magic Res** | Spell Ward | **Magic Immunity** |
| **Fear/Mind Res** | Steady Mind | **Mental Immunity** |
| **Soul/Heresy Res** | Soul Ward | **Soul Immunity** *(sistem-içi/ruler etkilerini bastırır — endgame kritik)* |

## B9. KEŞİF / UTIL Hattı (AGI/WIS/LUCK)
| Skill | Açıklama | LV10 → Evrim |
|-------|----------|--------------|
| **Stealth** | Görünürlüğü azalt. | **Silent Step** |
| **Silent Step** | Sessiz hareket; sürpriz vuruş şansı. | **Phantom Presence** |
| **Phantom Presence** | Neredeyse algılanamaz. | (üst tier) |
| **Climb** | Duvar/tavan tırmanma; keşif erişimi. | **Wall Master** |
| **Forage** | Çevreden besin/kaynak bulma. | **Scavenger** |
| **Keen Nose** | Gizli oda/kitap/nadir av koklama (LUCK sinerji). | **Treasure Sense** |
| **Lucky Find** | Nadir drop/oda şansı artışı (LUCK). | **Fortune's Favor** |

## B10. GİZLİ / META Hattı (WIS ↔ karanlık)
Normal yolla görünmez; kitap ipucu, koşul veya keşifle açılır.
| Skill | Açıklama | Not |
|-------|----------|-----|
| **Stillness** | Hiç hareket etmeden bekleyince dolan gizli güç tohumu. | Meditasyon/zen yolu (§7.6) |
| **Inner Silence** | "İçindeki sesi" susturma; zihin dirençleri + WIS. | Aydınlık yol |
| **Forbidden Knowledge** | Gizli bilgi ekseni; ruler güçlerinin anahtarı. | **Taboo muadili** — kalıcı, sonra eklenir |

---

# BÖLÜM C — GÜNAH / ERDEM (Ruler) SKİLLERİ

İki gizli kutup; her biri LV10'da benzersiz bir **ruler gücü** açar. Bazıları "aynı anda tek sahip" (endgame nadir). Bir kutbu ilerletmek **Forbidden Knowledge (Taboo)** seviyesini yükseltir.

## C1. Günah Ekseni (Karanlık Yol — öldürme/ego/risk ile ilerler)
| Skill | Tema / Güç ekseni |
|-------|-------------------|
| **Pride** | Statlara büyük kalıcı çarpan; bazı evrimlerin koşulu. |
| **Wrath** | Yıkıcı saldırı gücü; ölümcül burst. |
| **Greed** | Loot/exp/kaynak toplama artışı. |
| **Gluttony** | Yedikçe güçlen (açlık mekaniği §7.4.5); bedeli hızlı açlık. |
| **Envy** | Düşmanın bir özelliğini/gücünü kopyalama. |
| **Sloth** | Idle/offline kazançta büyük artış (tembellik gücü). |
| **Lust** | Cazibe/yönlendirme; düşmanı kendine çekme. |

## C2. Erdem Ekseni (Aydınlık Yol — meditasyon/sabır/dayanma ile ilerler)
| Skill | Tema / Güç ekseni |
|-------|-------------------|
| **Patience** | Dayanıklılık/direnç tavanı; eşik mekaniğiyle sinerji. |
| **Temperance** | Kaynak verimi; MP/açlık tüketimi düşer. |
| **Diligence** | Skill/stat exp kazancı artışı. |
| **Charity** | Minion/yavru güçlendirme (Brood ile sinerji). |
| **Kindness** | İyileşme/regen güçlenir; destek gücü. |
| **Humility** | Düşük profil; tehdit azalır, sürpriz avantaj. |
| **Chastity** | Zihin/ruh saflığı; mental & soul direnç tavanı. |

> **Denge notu:** Günah ekseni saldırgan/hızlı/riskli; erdem ekseni savunmacı/sabırlı/kalıcı. Oyuncu ikisini karıştırabilir ama saf gitmek özel ödüller açar.

---

# BÖLÜM D — BİRLEŞİK / FÜZYON ÜST SKİLLER (gizli)

Kombinasyon sistemiyle (§5.0.3) açılan nadir tepe skiller. Fusion ipuçları kitaplarda ima edilir.
| Üst Skill | Bileşenler | Etki |
|-----------|-----------|------|
| **Omniscience** | All-Sight + Precognition | Sistemin gizli verilerine tam erişim. |
| **Mana Singularity** | Endless Mana + Mana Mastery | MP maliyeti ~sıfır + hızlı yenilenme. |
| **Apex Soul** | Soul Immunity + Chastity | Ruh/sistem saldırılarına tam bağışıklık. |
| **Perfect Predator** | Apex Predator + Ambush Strike + Stealth | Avcı kimliği tavanı; sürpriz öldürme. |

---

## Notlar
- Tüm isimler **placeholder/özgün** — beğenmediğini değiştiririz.
- Bağlı statlar öneridir; prototipte denge için ayarlanır.
- **Prototip için minimal set önerisi:** B1 (Venom Bite), B2 (Sharp Claw), B3 (Silk Thread), B4 (Appraisal + Quick Thought), B7 (HP Regen), B8 (Fire Res + Physical Res). Bu kadarla core loop test edilir.
- Data-driven hatırlatma: her skill JSON'da `{id, ad, açıklama, tür, bağlı_stat, lv_max, evolves_to[], koşullar}` olarak tanımlanmalı; isimler/metinler lokalizasyon tablosundan gelmeli (hiçbir dil hardcode değil).
