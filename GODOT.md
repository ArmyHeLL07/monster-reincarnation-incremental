# GODOT.md — Web Claude İşlem Günlüğü

> Bu dosya web (TypeScript) oyununu geliştiren Claude'un kendi log dosyasıdır.
> ILERLEME.md'yi yalnızca okur; GODOT.md'yi yazar.

---

## 2026-06-20 — Madde 7: Yemek-Evrim Koşulu (requireEat + eatGrantSkill)

**Görev:** ILERLEME.md Madde 7 — belirli canavarı yiyince evrim açılır (`requireEat`) + skill tohumu (`grantsSkill`).

### Yapılanlar

- **`packages/shared/src/types.ts`**: `EvolutionForm`'a `requireEat?: string` ve `eatGrantSkill?: string` eklendi.
- **`packages/client/src/game/state.ts`**: `GameState`'e `eatenEnemies: string[]` eklendi; `newGame()` başlatması yapıldı.
- **`packages/client/src/game/evolution.ts`**: `canEvolve()` artık `requireEat` koşulunu kontrol ediyor.
- **`packages/client/src/game/combat.ts`**: `recordEat()` yardımcı fonksiyonu eklendi — ilk yemede `eatenEnemies`'e kayıt + evrim yoluna bağlı skill tohumu verilmesi. `autoEat()` ve `eatFood()` güncellendi.
- **`packages/client/src/ui.ts`**: Evrim panelinde koşul karşılanmamışsa "Koşul: önce ye → [düşman adı]" gösteriliyor. `log.eat_seed` toast + discovery kategorisine eklendi.
- **`packages/client/src/main.ts`**: `migrate()` fonksiyonuna `s.eatenEnemies ??= []` eklendi (eski kayıt uyumluluğu).
- **`packages/client/src/game/rebirth.ts`**: Rebirth'te `eatenEnemies` sıfırlanıyor (alt hiyerarşi).
- **`data/evolutions.json`**: 3 evrim formuna koşul eklendi:
  - `venom_weaver`: `requireEat: "venom_toad"`, `eatGrantSkill: "acid_spit"`
  - `blade_weaver`: `requireEat: "cave_lurker"`, `eatGrantSkill: "pounce"`
  - `greater_weaver`: `requireEat: "acid_slug"`, `eatGrantSkill: "endurance"`
- **`data/i18n/tr.json` + `en.json`**: `log.eat_seed` ve `ui.evo_eat_req` lokalizasyon anahtarları eklendi.

### Sonuç

`typecheck` ✅ · `build` ✅ · Data-driven + TR/EN lokalize. Mevcut kayıtlar `migrate()` ile uyumlu.
