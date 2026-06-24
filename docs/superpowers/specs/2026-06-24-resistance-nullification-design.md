# Resistance Nullification Sistemi — Tasarım Dokümanı

**Tarih:** 2026-06-24  
**Kapsam:** Resistance skill zincirleri (T1→T5), grup nullification merger'ları, Ultimate Nullification, yeni pasif skill'ler

---

## 1. Genel Mimari

Üç katmanlı bir skill sistemi:

```
[Katman 1] Resistance Zincirleri (T1→T5)
      ↓ hepsi T5'e gelince
[Katman 2] Grup Nullification (Lv1→Lv10)
      ↓ hepsi Lv10'a gelince
[Katman 3] Ultimate Nullification (Lv1→Lv10 → %100 bağışıklık)
```

Mevcut 12 resistance stat (`fire_res`, `physical_res` vb.) **değişmez**. Resistance skill'leri bu statlara bonus verir.

---

## 2. Resistance Zincirleri (Katman 1)

### 2.1 Yapı

Her hasar tipi için **tek bir lineer zincir**. Skill aynı slot'ta kalır, ismi tier'a göre değişir. T1'den T5'e kadar her seviye mevcut resistance statını artırır.

**Unlock:** İlk kez o hasar tipinden hasar alınca T1 otomatik açılır. Sonrası normal exp ile levellanır.

### 2.2 Zincir Tablosu

| Hasar Tipi | T1 | T2 | T3 | T4 | T5 | Stat |
|---|---|---|---|---|---|---|
| Fire | Fire Resistance | Flame Resistance | Magma Resistance | Heat Resistance | Volcanic Resistance | fire_res |
| Frost | Ice Resistance | Frost Resistance | Freeze Resistance | Glacial Resistance | Blizzard Resistance | frost_res |
| Lightning | Lightning Resistance | Bolt Resistance | Storm Resistance | Thunder Resistance | Tempest Resistance | lightning_res |
| Wind | Wind Resistance | Gale Resistance | Whirlwind Resistance | Cyclone Resistance | Tornado Resistance | *(yeni: wind_res)* |
| Earth | Earth Resistance | Stone Resistance | Boulder Resistance | Terrain Resistance | Tectonic Resistance | *(yeni: earth_res)* |
| Dark | Dark Resistance | Shadow Resistance | Black Resistance | Void Resistance | Abyss Resistance | *(yeni: dark_res)* |
| Light | Light Resistance | Holy Resistance | Radiant Resistance | Divine Resistance | Sacred Resistance | *(yeni: light_res)* |
| Acid | Acid Resistance | Caustic Resistance | Corrosive Resistance | Dissolving Resistance | Melting Resistance | acid_res |
| Physical | Impact Resistance | Bludgeon Resistance | Crush Resistance | Shatter Resistance | Devastation Resistance | physical_res |
| Pierce | Pierce Resistance | Stab Resistance | Impale Resistance | Perforate Resistance | Annihilation Resistance | pierce_res |
| Poison | Poison Resistance | Venom Resistance | Toxin Resistance | Plague Resistance | Death Venom Resistance | poison_res |
| Paralysis | Stun Resistance | Shock Resistance | Bind Resistance | Petrify Resistance | Immobilize Resistance | stun_res / petrify_res |
| Fear | Fear Resistance | Dread Resistance | Terror Resistance | Horror Resistance | Abyss Fear Resistance | fear_res |
| Soul | Soul Resistance | Spirit Resistance | Ethereal Resistance | Phantom Resistance | Transcendent Resistance | soul_res |

> **Not:** wind, earth, dark, light için yeni resistance stat türleri eklenecek. magic_res → Magic Nullification'a giriş yerine Katman 2'nin kendisi olarak sayılır.

### 2.3 Stat Bonus Formülü

Her tier mevcut resistance statına flat bonus verir:
- T1: +5, T2: +10, T3: +18, T4: +28, T5: +40

---

## 3. XP Bölme Sistemi

Gelen hasar XP'si, skill'in kaç **nullification katmanına** bağlı olduğuna göre bölünür:

```
xpPerSkill = rawDamageXP / nullificationDepth
```

- **Resistance Zinciri (T1-T5):** depth = 2 (kendi Grup Null + Ultimate Null) → XP ÷ 2
- **Grup Nullification:** depth = 1 (sadece Ultimate Null) → tam XP
- **Ultimate Nullification:** depth = 0 üst katman yok → tam XP

Her tier geçildikçe **XP kapasitesi artar** (daha fazla XP gerekir), hız değişmez ama zorluk artar:
- T1→T2: 200 XP, T2→T3: 400, T3→T4: 700, T4→T5: 1200
- Nullification Lv1→Lv2: 2000, her level +800 XP

---

## 4. Grup Nullification Merger'ları (Katman 2)

### Koşul
Gruptaki **tüm zincirler T5'e gelince** → bileşen skill'lerin **hepsi silinir**, yerlerine **Lv1 Grup Nullification** gelir. Savaş ortasında koşul karşılanınca log mesajı gösterilir:
> `"[Grup Adı] koşulları karşılandı! [Nullification] açıldı!"`

### Gruplar

**Physical Nullification**
- Gerekli T5'ler: Devastation Resistance + Annihilation Resistance (+ ileriki eklemeler: slash, ranged)
- Etki Lv10: Tüm fiziksel hasarı %85 azaltır

**Magic Nullification**
- Gerekli T5'ler: Volcanic + Blizzard + Tempest + Tornado + Tectonic + Abyss + Sacred + Melting Resistance (8 zincir)
- Etki Lv10: Tüm elemental/sihir hasarını %85 azaltır

**Status Nullification**
- Gerekli T5'ler: Death Venom + Immobilize + Abyss Fear Resistance (poison + paralysis + fear zincirleri)
- Etki Lv10: Tüm durum bozuklukları %85 azaltır / direnir

**Soul Resistance (Özel)**
- Tek zincir: Transcendent Resistance T5
- T5'e gelince diğer 3 gruba katılabilir (opsiyonel) veya bağımsız kalır
- Ultimate için gerekli: Evet (4. grup olarak)

---

## 5. Ultimate Nullification (Katman 3)

### Koşul
Physical Null Lv10 + Magic Null Lv10 + Status Null Lv10 + Soul Transcendent Res T5 →
**Ultimate Nullification** Lv1'den başlar. Tüm Grup Null skill'leri **silinir**.

### Seviyelendirme (Lv1→Lv10)
- Her level tüm hasar tiplerinden koruma artar
- Lv1: %10, Lv5: %55, Lv9: %90, **Lv10: %100 bağışıklık**

### Lv10 — Tam Bağışıklık
- Tüm hasar türlerinden **%100 koruma**
- **İstisna:** Düşmanda `nullifier: true` özelliği varsa bağışıklık delinir
  - Derin layer boss'ları + elite düşmanlar `nullifier` taşır
  - Nullifier'lı düşmana karşı Ultimate Lv10 = %60 koruma (Lv başına +4%)

---

## 6. Yeni Pasif Skill Zincirleri (Wiki Kaynaklı)

Mevcut sistemle çakışmayan, oyuna değer katan yeni passiveler:

### 6.1 Beş Duyu Zinciri
```
Vision Enhancement (T1) → Auditory Enhancement (T2) → Olfactory Enhancement (T3)
→ Five Senses Enhancement (T4) → Five Senses Super-Enhancement (T5)
```
- Her tier: +LUCK, +keşif şansı, +search roll bonus
- T5: Gizli odaları %30 daha kolay algılar

### 6.2 Olasılık Düzeltme Zinciri
```
Hit (T1) → Evasion (T2) → Probability Correction (T3) → Probability Super-Correction (T4)
```
- Her tier: +isabetlilik%, +kaçınma%
- T4: Düşman kritik şansı %15 azalır

### 6.3 Yıldırım Korku Zinciri (Ruler Ekseni)
```
Intimidation (T1) → Tyrant (T2) → Emperor (T3)
```
- Her tier: Düşmanın saldırı gücü -%, Sin eksenine bağlı
- T3 Emperor: Zayıf düşmanlar savaşmadan kaçar

### 6.4 Gece Görüşü Zinciri
```
Night Vision (T1) → Vision Expansion (T2) → Perception Expansion (T3) → Auditory Expansion (T4)
```
- Her tier: Karanlık layer'larda keşif/combat penalty azalır
- T4: Tüm duyusal engeller kaldırılır

### 6.5 Ejderha Zırhı Zinciri
```
Dragon Scales (T1) → Imperial Scales (T2) → Divine Scales (T3)
```
- Her tier: Flat DEF + resistance bonus
- T3: Küçük saldırıları %20 yansıtır
- Kilit: Draconic ırk evrimi veya belirli dungeon keşfi gerektirir

### 6.6 Ölümsüzlük
```
Immortality (tekil skill, Lv1→Lv5)
```
- Lv1: Ölümde bir kez hayatta kalır (HP 1'e düşer), 10 dakika cooldown
- Lv5: Cooldown 3 dakika, HP %15'e döner
- Nadir event veya endgame unlock

### 6.7 Atletizm Zinciri
```
Athletics (T1) → Martial Arts Mastery (T2)
```
- Her tier: STR + AGI passive boost
- T2: Silahsız dövüş skill'lerinin hasarı +%20

---

## 7. Veri Yapısı

### resistance_mergers.json (yeni dosya)
```json
[
  {
    "id": "physical_nullification",
    "locKey": "skill.physical_null.name",
    "requires": ["devastation_resistance_t5", "annihilation_resistance_t5"],
    "group": "physical",
    "lvMax": 10
  },
  {
    "id": "magic_nullification",
    "locKey": "skill.magic_null.name",
    "requires": ["volcanic_resistance_t5", "blizzard_resistance_t5", "tempest_resistance_t5", "tornado_resistance_t5", "tectonic_resistance_t5", "abyss_resistance_t5", "sacred_resistance_t5", "melting_resistance_t5"],
    "group": "magic",
    "lvMax": 10
  },
  {
    "id": "status_nullification",
    "locKey": "skill.status_null.name",
    "requires": ["death_venom_resistance_t5", "immobilize_resistance_t5", "abyss_fear_resistance_t5"],
    "group": "status",
    "lvMax": 10
  },
  {
    "id": "ultimate_nullification",
    "locKey": "skill.ultimate_null.name",
    "requires": ["physical_nullification_lv10", "magic_nullification_lv10", "status_nullification_lv10", "transcendent_resistance_t5"],
    "group": "ultimate",
    "lvMax": 10,
    "lv10Effect": "full_immunity"
  }
]
```

### Skill JSON alanları (resistance zincirleri)
```json
{
  "id": "fire_resistance",
  "kind": "passive",
  "resistType": "fire_res",
  "chain": "fire",
  "chainGroup": "magic",
  "tier": 1,
  "evolves_to": ["flame_resistance"],
  "statBonus": { "fire_res": 5 },
  "locKeyName": "skill.fire_resistance.name"
}
```

### Enemy JSON (nullifier özelliği)
```json
{
  "id": "void_tyrant",
  "nullifier": true
}
```

---

## 8. Combat Entegrasyon Noktaları

1. **`addResistExp()`** — mevcut fonksiyon, resistance zincir skill'lerine XP dağıtır (depth formülü)
2. **`checkMergerConditions()`** — yeni fonksiyon, her combat tick veya skill level-up sonrası merger koşullarını kontrol eder
3. **`applyMerger()`** — yeni fonksiyon, bileşen skill'leri siler, merger skill'i Lv1'den ekler, log yazar
4. **`applyDamage()`** — Ultimate Nullification kontrolü: `nullifier` varsa tam bağışıklık delinir

---

## 9. Kapsam Dışı

- Resistance stat görsel paneli değişikliği (ayrı task)
- Roblox/Godot sürümü (ayrı cephe)
- Marvion fusion entegrasyonu (şimdilik)
