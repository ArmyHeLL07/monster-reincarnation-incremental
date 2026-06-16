# Örümcek Irkı — İçerik Veri Tabloları (v1)

> *I'm a Spider, So What?* **mekaniğinden** esinlenildi; tüm isimler **özgün/türetilmiş** (telif-güvenli).
> Bu doküman oyunun data-driven JSON'una temel olacak ham tasarım verisidir.

---

## TABLO 1 — Skill Evrim Zincirleri (X LV10 → Y)

Her skill LV1→LV10 ilerler, LV10'da üst forma dönüşür (eski skill kaybolur). Bazı zincirler dallanır.

### A) Saldırı / Zehir Hattı
| Skill (LV1-10) | LV10 Evrim → | Sonraki → |
|---|---|---|
| **Venom Bite** (zehirli ısırık) | **Lethal Venom** | **Necro Toxin** (çürütücü zehir) |
| **Toxic Fang** | **Corrosive Fang** | — |
| **Acid Spit** (uzaktan zehir) | **Caustic Spray** | — |

### B) İplik / Tuzak Hattı
| Skill (LV1-10) | LV10 Evrim → | Sonraki → |
|---|---|---|
| **Silk Thread** (temel iplik) | **Binding Silk** (bağlama) | **Cutting Wire** (kesici tel) |
| **Web Trap** | **Snare Field** | **Spatial Web** (alan kontrolü) |
| **Sticky Coat** | **Adhesive Mastery** | — |

### C) Fiziksel / Avcı Hattı
| Skill (LV1-10) | LV10 Evrim → | Sonraki → |
|---|---|---|
| **Sharp Claw** | **Scythe Limb** (tırpan bacak) | **Reaper Edge** |
| **Pounce** (atılma) | **Ambush Strike** | **Lethal Lunge** |
| **Carapace** (kabuk savunma) | **Hardened Shell** | **Adamant Plating** |

### D) Algı / Util Hattı (keşif & destek)
| Skill (LV1-10) | LV10 Evrim → | Sonraki → |
|---|---|---|
| **Appraisal** (inceleme) | **Insight** | **All-Sight** (her şeyi gör) |
| **Detect** (tehlike sezme) | **Foresight** | **Precognition** (kısa gelecek görüsü) |
| **Quick Thought** | **Accelerated Mind** | **Parallel Minds** (paralel düşünce) |
| **Stealth** | **Silent Step** | **Phantom Presence** |

> **Zihin hattı = Intelligence motoru:** `Quick Thought → Accelerated Mind → Parallel Minds` zinciri INT'i yükselten ana skill koludur (bkz GDD §7.8). Yüksek INT → kitapların derin katmanı + büyü gücü + bazı evrim koşulları açılır.

> **⊙ Göz yeteneği:** `Appraisal → Insight → All-Sight` göz slotuna takılan özel yetenektir (GDD §5.0.7), saf "skill" değil — tabloda kolaylık için listelendi.

### E) İyileşme / Yaşam Hattı
| Skill (LV1-10) | LV10 Evrim → | Sonraki → |
|---|---|---|
| **HP Regen** | **Auto-Heal** | **Regeneration** |
| **MP Regen** | **Mana Flow** | **Endless Mana** |
| **Endurance** | **Toughness** | **Undying Will** |

> **Tasarım kuralı:** Her üst skill önceki formdan *belirgin* daha güçlü olmalı (kayıp değil kazanç hissi). Dallanan zincirlerde (B, C, D) oyuncu LV10'da yön seçer → build kararı.

---

## TABLO 2 — Örümcek Evolution Ağacı (dallanan)

Evolution Point yeterince birikince + bazen koşul (belli skill/resistance) sağlanınca evrim açılır. Her düğümde dallanma var → kalıcı build kimliği.

```
                    [Hatchling Spider]          ← başlangıç (zayıf)
                          │
                    [Lesser Weaver]             ← ilk evrim
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     [Venom Weaver]  [Blade Weaver]  [Greater Weaver]
     (zehir dalı)    (fiziksel dal)  (büyüme/HP dalı)
            │             │
            ▼             ▼
     [Shade Stalker]  [Scythe Hunter]
     (gizli/suikast)  (hız/avcı)
            │             │
            └──────┬──────┘
                   ▼
            [Undying Horror]          ← nadir; "Çürüme" koşulu + LV50
            (ölümsüzlük yetisi)        gerektirir, gizli/zor dal
                   │
                   ▼
            [Arachnid Sovereign]       ← endgame; yarı-insan form,
            (konuşma + item kuşanma)    "Gurur" ruler skill + LV50 koşulu
```

### Evrim Düğümü Detayları
| Form | Tema | Açılış Koşulu (öneri) | Evrimde Kazanım |
|---|---|---|---|
| **Hatchling Spider** | Zayıf başlangıç | — | Temel statlar |
| **Lesser Weaver** | İlk güçlenme | EP eşiği | Stat artışı, +1 skill slot |
| **Venom Weaver** | Zehir uzmanı | Zehir skilleri LV5+ | Zehir hasarı ×, zehir skill açılır |
| **Blade Weaver** | Fiziksel | Fiziksel skiller LV5+ | Tırpan bacak, kritik şansı |
| **Greater Weaver** | Tank/büyüme | HP/Endurance LV5+ | Büyük HP/DEF sıçraması |
| **Shade Stalker** | Suikastçı | Stealth + zehir | Gizlilik, ani vuruş skilleri |
| **Scythe Hunter** | Avcı | Hız + fiziksel | Yüksek SPD, çoklu saldırı |
| **Undying Horror** | Ölümsüz (gizli) | "Çürüme" attribute + LV50 | **Immortality** pasifi (özel) |
| **Arachnid Sovereign** | Endgame | "Gurur" ruler skill + LV50 | Konuşma, item kuşanma, dev stat |

> **Not:** "Undying Horror" bilinçli olarak **zor/gizli** bir dal — sadece belirli yolu (gizlilik+çürüme) seçen oyuncu ulaşır. Senin keşif/easter-egg felsefene uygun.

---

## TABLO 3 — Resistance & Günah/Erdem (Ruler) Sistemi

### 3A) Resistance Hatları (hasar-bazlı)
Aldığın hasar tipinin exp'ine gider; LV10'da **Nullity** (bağışıklık) evrimi.

| Resistance | LV5 ara form | LV10 → Nullity |
|---|---|---|
| **Fire Res** | Heat Ward | **Flame Immunity** |
| **Poison Res** | Toxin Ward | **Poison Immunity** |
| **Acid/Corrosion Res** | Acid Ward | **Corrosion Immunity** |
| **Physical Res** | Tough Hide | **Blunt Immunity** |
| **Magic Res** | Spell Ward | **Magic Immunity** |
| **Fear/Mind Res** | Steady Mind | **Mental Immunity** |

> Yüksek riskli oyun (çok hasar al) = hızlı resistance → risk/ödül.

### 3B) Günah / Erdem Çift Kutbu (endgame meta-sistem)
Animedeki "7 günah + 7 erdem" ruler skill yapısından esinli. **İki gizli ilerleme hattı**, birbirinin karşı kutbu:

```
   KARANLIK YOL (Günah)              AYDINLIK YOL (Erdem)
   ─ öldürerek/ego ile ilerler       ─ meditasyon/sabırla ilerler
   ─ "Taboo" buraya bağlanır         ─ gizli zen gücü buraya bağlanır
   ─ saldırgan/yıkıcı güçler         ─ savunma/destek/kalıcı güçler
            └──────────┬──────────────┘
                       ▼
          İkisi de KALICI (rebirth/ırk değişimi silmez)
```

**Türetilmiş günah temaları (öneri):** Wrath (Öfke), Greed (Açgözlülük), Pride (Gurur), Envy, Sloth, **Gluttony (Oburluk → açlık/beslenme mekaniğine bağlı, bkz GDD §7.4.5)**, Lust → her biri bir güç ekseni.
**Türetilmiş erdem temaları:** Patience (Sabır), Temperance, Diligence, Charity, Kindness, Humility, Chastity.

> **Mekanik bağ:** Bir günah/erdem hattını LV10'a getirmek, o eksende **benzersiz bir ruler gücü** açar. Bazıları "aynı anda tek sahip" (endgame nadir) olabilir → ileride online/leaderboard'a bağlanır.
> **Taboo:** Karanlık yolun anahtarı; LV10'da "ruler authority" (üst güçleri kullanma yetkisi) açar. Bir kez açıldı mı kalıcı.

---

## Sonraki Adım Önerileri
1. Bu tablolardan **prototip için minimal set** seç (1 başlangıç + 2-3 evrim, ~8 skill, 2 resistance).
2. Tabloları **JSON şemasına** dök (skill: id, ad, açıklama, lv_max, evolves_to, dallar).
3. Gatekeeper boss + ilk 2-3 zonu tasarla (her zon yeni hasar tipi = yeni resistance fırsatı).

*İsimler placeholder — beğenmediklerini değiştiririz. Mekanik iskelet sağlam.*
