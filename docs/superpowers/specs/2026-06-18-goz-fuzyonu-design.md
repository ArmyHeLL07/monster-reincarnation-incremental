# Tasarım: Göz Füzyonu (Hibrit Göz) — Madde 6

**Tarih:** 2026-06-18 · **Durum:** Onaylandı + uygulandı · **GDD:** §5.0.7

## Karar
İki **takılı** göz yeteneği birleşip **tek slotta hibrit göz** olur; ikinci slot
boşalır (güç = slot ekonomisi + çift mod). Hibrit hem pasif aura hem aktif bakış olarak
çalışır (normalde bir göz tek mod). **Açılış:** book_8 ('eyes' lore) bulununca.

### Uyumluluk / körlük cezası
- Bir gözün modu: `eyeModes` 2 ise **flex**, değilse tek mod (active/passive).
- **Aynı mod** (ikisi de yalnız-active YA DA ikisi de yalnız-passive) → **körlük cezası**:
  appraisal tier −2, tüm hibrit etkileri (negate + gaze damage) ×0.6.
- Komplementer (active+passive, ya da en az biri flex) → temiz hibrit, tam güç.

### Mekanik
- `EyeAssignment` genişletildi: `fusedId?` (ikinci yetenek), `blind?`.
- Hibrit, `appraisalTier` / `gazeNegateChance` / `gazeAttack` içinde **iki yeteneği de**
  hesaba katar; `blind` ise penaltı uygulanır.
- Geri dönüşlü: hibrit slotu boşaltınca iki yetenek tekrar serbest (skiller kaybolmaz).
  Bir bileşeni başka slota atamak hibridi birincil göze indirir.

## Dosyalar
`client/game/state.ts` (EyeAssignment), `client/game/eyes.ts` (`fuseEyes` + hesaplar),
`client/main.ts` (`onFuseEyes`), `client/ui.ts` (Beden sekmesi paneli, hibrit renk/etiket),
`data/i18n/{tr,en}.json`. Doğrulama: `typecheck` + `build` ✓.

## Tunable
Körlük çarpanı `BLIND_MULT=0.6`, appraisal cezası `BLIND_APPRAISAL_PENALTY=2`
(`eyes.ts` sabitleri). Açılış lore'u book_8 (`hints:'eyes'`).
