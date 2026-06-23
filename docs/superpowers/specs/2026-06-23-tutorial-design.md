# Tutorial Sistemi — Tasarım Spec'i

**Tarih:** 2026-06-23  
**Durum:** Onaylı  

---

## Amaç

Yeni oyuncular oyuna girdiğinde ne yapacaklarını anlamaları için katmanlı, atlanabilir, her zaman erişilebilir bir tutorial sistemi. Oyunun "bilgi = güç" felsefesiyle uyumlu — rehberlik dayatılmaz, ama her zaman orada.

---

## Genel Mimari

Üç katman birbirini tamamlar:

| Katman | Açıklama | Ne Zaman |
|--------|----------|----------|
| **Sihirbaz** | Modal overlay, 8 adım | Yeni oyun açılışında |
| **Hint Toast'ları** | Bağlamsal bildirim | Sistem ilk kez devreye girince |
| **Kılavuz Sekmesi** | Kalıcı referans | Her zaman, nav sekmesi |

`?` ikonları Kılavuz sekmesinin ilgili bölümüne navigate eder. Sihirbaz ve hint toast'larındaki "Götür" butonları direkt o sekme/elemente yönlendirir.

**Kural:** Oyuncuya görünen her metin i18n anahtarı üzerinden gelir — `tr`/`en`/`ru` lokalizasyonu zorunlu.

---

## State Değişiklikleri (`state.ts`)

`GameState`'e iki alan eklenir:

```typescript
tutorialStep: number | 'done' | 'skipped';  // sihirbaz adım indexi
seenHints: string[];                          // gösterilmiş hint ID'leri
```

`newGame()` başlangıç değerleri:
```typescript
tutorialStep: 0,
seenHints: [],
```

---

## Yeni Dosyalar

### `packages/client/src/tutorial.ts`
- Sihirbaz adım tanımları (id, i18n key, hedef sekme/element)
- Hint tetikleyici tanımları (id, i18n key, hedef)
- `shouldShowHint(id, state)` — seenHints kontrolü
- `markHintSeen(id, state)` — seenHints'e ekler

### `data/race_hints.json`
- Her ırk için `tr`/`en`/`ru` açıklaması
- Güçlü yön, zayıf yön, gelişim özeti, özel not
- races.json'a dokunulmaz — bu tamamen ayrı bir dosya

---

## Katman 1 — Sihirbaz

### Davranış
- Yeni oyunda `tutorialStep === 0` ise otomatik açılır
- Her adımda: başlık + açıklama + "Götür" butonu + İleri + Tümünü Atla
- "Götür" → ilgili sekmeye navigate eder, modal açık kalır
- "Tümünü Atla" → `tutorialStep = 'skipped'`, kapanır
- Ayarlar'dan "Tutorial'ı Aç" → `tutorialStep = 0`'a sıfırlar, yeniden açar
- Eğer `tutorialStep === 'skipped'` iken ayarlardan yeniden açılırsa → adım 1 başlığı `tutorial.reopen_greeting` anahtarını gösterir ("Bak kim gelmiş 👀" gibi, lokalize)

### 8 Adım

| # | i18n Prefix | Hedef | İçerik Özeti |
|---|-------------|-------|--------------|
| 1 | `tut.step1` | — | Karşılama, oyun felsefesi |
| 2 | `tut.step2` | Topbar HP/MP/SP | Barlar ne anlama gelir |
| 3 | `tut.step3` | Combat sekmesi | Savaş, otomatik mod |
| 4 | `tut.step4` | Skill sekmesi | XP kazanımı, levelup |
| 5 | `tut.step5` | Map sekmesi | Layer.Floor.Room sistemi |
| 6 | `tut.step6` | Hunger bar | Açlık, forage |
| 7 | `tut.step7` | Stats sekmesi | Stat puanı harcama |
| 8 | `tut.step8` | Stats → evrim ağacı | Evrim nasıl açılır |

### Skip / Reopen Durumları

```
tutorialStep === 0          → sihirbaz açık, adım 1
tutorialStep === N (1-7)    → N. adımdan devam
tutorialStep === 'done'     → tüm adımlar tamamlandı
tutorialStep === 'skipped'  → oyuncu atladı
```

Ayarlar butonu: `tutorialStep !== 'done'` ise "Sihirbazı Aç", `'done'` ise "Sihirbazı Tekrar Aç" — her iki durumda `tutorialStep = 0`'a sıfırlar.

---

## Katman 2 — Contextual Hint Toast'ları

### Davranış
- Tetikleyici koşul sağlandığında ve `seenHints` içinde ID yoksa gösterilir
- 3 saniye sonra otomatik kapanır veya elle kapatılır
- "Götür" linki tıklanınca ilgili sekmeye navigate eder
- Bir daha çıkmaz (seenHints'e eklenir)

### Hint Listesi

| Hint ID | Tetikleyici | Hedef |
|---------|-------------|-------|
| `skill_levelup` | İlk skill levelup | Skill sekmesi |
| `evo_available` | İlk evrim açıldığında | Stats → evrim ağacı |
| `stat_point` | İlk stat puanı | Stats sekmesi |
| `fusion_unlock` | Fusion açıldığında | Skill → fusion |
| `meditation_unlock` | Meditasyon açıldığında | Stats sekmesi |
| `soul_tree` | Ruh ağacı açıldığında | Stats sekmesi |
| `human_path` | Human path açıldığında | Stats sekmesi |
| `first_item` | İlk eşya bulunduğunda | Envanter sekmesi |
| `first_bestiary` | İlk düşman kaydı | Bestiary sekmesi |
| `hunger_warning` | Açlık %70'i geçince | Hunger bar |

Her hint için i18n anahtarları: `hint.<id>.title` + `hint.<id>.body`.

---

## Katman 3 — Kılavuz Sekmesi

### Yapı
- Navigasyona 📖 ikonu ile "Kılavuz" sekmesi eklenir
- İçerik bölümlere ayrılır, her bölümün `id` anchor'ı vardır
- `?` ikonları ve "Götür" butonları `#guide-<section>` anchor'ına scroll eder

### Bölümler ve Anchor'lar

| # | Anchor | Başlık i18n Key |
|---|--------|-----------------|
| 1 | `guide-basics` | `guide.basics` |
| 2 | `guide-combat` | `guide.combat` |
| 3 | `guide-skills` | `guide.skills` |
| 4 | `guide-map` | `guide.map` |
| 5 | `guide-hunger` | `guide.hunger` |
| 6 | `guide-stats` | `guide.stats` |
| 7 | `guide-inventory` | `guide.inventory` |
| 8 | `guide-soul` | `guide.soul` |
| 9 | `guide-fusion` | `guide.fusion` |
| 10 | `guide-human_path` | `guide.human_path` |
| 11 | `guide-lore` | `guide.lore` |
| 12 | `guide-races` | `guide.races` |

§12 içeriği `race_hints.json`'dan dinamik olarak çekilir.

### `?` İkon Yerleşimi

| Element | Hedef Anchor |
|---------|-------------|
| Topbar HP/MP/SP barları | `#guide-basics` |
| Combat sekme başlığı | `#guide-combat` |
| Skill kartları | `#guide-skills` |
| Map sekme başlığı | `#guide-map` |
| Hunger bar | `#guide-hunger` |
| Stats sekme başlığı | `#guide-stats` |
| Evrim ağacı header | `#guide-skills` |
| Envanter sekme başlığı | `#guide-inventory` |
| Race seçim ekranı | `#guide-races` |

---

## Race Açıklamaları (`data/race_hints.json`)

races.json'a dokunulmaz. Ayrı dosya, Atıl yönetir.

### Şema

```json
{
  "spider": {
    "tr": {
      "strength": "Zehir ve ip kombinasyonu",
      "weakness": "Düşük başlangıç HP",
      "growth": "Hatchling → Cave Spider → Poison Weaver / Web Hunter",
      "note": "Fusion sistemi erken açılır"
    },
    "en": { ... },
    "ru": { ... }
  }
}
```

Race seçim ekranındaki her ırk kartının altına bu bilgi paneli eklenir. Dil `state.lang`'dan alınır, yoksa `'en'` fallback.

---

## Achievement Hook (İleride)

- `tutorialStep === 'skipped'` iken oyun kaydedilirse → `achievement: 'no_tutorial'` tetiklenebilir
- Ayarlardan reopen + `tutorialStep === 'skipped'` → `achievement: 'tutorial_returner'` tetiklenebilir

Achievement sistemi bu spec'in kapsamı dışında; hook noktaları hazır bırakılır.

---

## Kapsam Dışı

- Achievement sistemi implementasyonu
- Tutorial içeriğinin yazılması (lokalizasyon metinleri Atıl tarafından doldurulur, kod skeleton key'lerle gelir)
- races.json değişikliği
- evolutions.json değişikliği
