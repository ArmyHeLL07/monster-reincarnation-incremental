# Tasarım — Bilmece-Boss Odaları + Bilmece Deneme Limitleri

> Tarih: 2026-06-20 · Durum: onay bekliyor → uygulama
> İlgili: `discovery.ts` (answerRoom/secret rooms), `combat.ts` (boss/spawn akışı),
> `data/secret_rooms.json`, harita random olayları (benzer `pendingEvent` deseni).

## 1. Amaç

İki bağlantılı mekanik:
1. **Bilmece-boss odaları:** Boss odası şansa bağlı (LUCK ile artan) bir **bilmece sınavına**
   dönüşür. Çözersen oyuncu **seçim kazanır**: boss'u atla, ya da seçtiğin zorlukta savaş.
   Yanlış cevaplar tırmanan bir savaş cezası getirir.
2. **Bilmece deneme limitleri:** Normal gizli-oda bilmeceleri sınırsız denenemez (3 hak →
   süreli kilit) — spam önlenir.

Felsefe: "Bilgi = Hayatta Kalma" — bilgi boss'u zekayla aşmanın ve kontrollü risk/ödül
seçmenin yolu.

## 2. Boss → bilmece dönüşümü (şansa bağlı, LUCK ile artan)

Boss odasına ilk girişte (`room >= R`, boss spawn edilmeden ÖNCE):
- Şans: `0.10 + LUCK * 0.005`, **cap 0.40** [ayarlanabilir; data-driven sabit].
- Tutarsa boss yerine **boss-bilmecesi** kurulur: `state.bossRiddle = { roomKey, riddleId, attempts: 0 }`.
- **Canlı roll** (LUCK'a bağlı, kararlı hash değil). Bir kez kararlaşınca state'te tutulur →
  re-render/yeniden tick tekrar roll yapmaz.
- **Her katın boss'unda** denenir (~%10 → doğal olarak "birkaçı"). Gatekeeper boss'u dahil.

## 3. Boss bilmecesi içeriği (`data/boss_riddles.json` — yeni)

Normal gizli-oda bilmecelerinden **bilerek daha zor** (lore-derinliği gerektirir). Katman
boss'una göre eşlenir (3 boss → 3 zor bilmece; cave_lurker / flame_jaw / bone_render).

```ts
export interface BossRiddle {
  id: string;
  bossId: string;           // hangi boss arketipinde geçerli
  locKey: string;           // bilmece metni
  locKeyClue: string;       // ipucu
  answers: { tr: string[]; en: string[] };
  /** "Atla" yolunun (küçük garanti) ödülü. */
  reward: { kind: 'skill' | 'stat' | 'unlock' | 'ep' | 'fragment'; value: string | number; amount?: number };
}
```

`Content.bossRiddles: Map<string, BossRiddle>` (bossId → riddle). `content.ts` yükler.

## 4. Boss bilmecesi akışı

Cevap `normalizeAnswer` ile karşılaştırılır (mevcut `discovery.ts` toleransı — TR katlama).

- **Doğru cevap →** bilmece çözülür; oyuncuya **iki seçenek** sunulur (panel butonları):
  - **🛡️ Boss'u Atla:** güvenli geçiş + **küçük garanti ödül** (`reward`). Boss "zekayla
    yenildi" sayılır → `onBossCleared` çağrılır (gatekeeper ise rebirth açılır), sonra ilerle.
  - **⚔️ Boss'la Savaş:** zorluk seç (3 kademe) → o çarpanla boss spawn olur:
    - **Normal ×1** · **Güçlü ×1.5** · **Acımasız ×2** (HP/ATK çarpanı) [ayarlanabilir].
    - Ödül (EP/loot) zorlukla ölçeklenir (`riddleBossMult` enemy'ye taşınır → onKill loot/EP × kademe).
    - Yenince normal boss-temizleme (gatekeeper vb.) + ölçekli ödül.
- **Yanlış cevap:**
  - **1. & 2. yanlış (attempts → 1, 2):** katman havuzundan **azıcık güçlenmiş canavar** (~×1.3)
    çıkar (`riddleGuard` işaretli). Öldürünce **ilerlemez** → bilmece geri gelir (sıradaki hak).
  - **3. yanlış (attempts → 3):** gerçek boss ama **güçlendirilmiş (~×1.5)** + **iyi ödül**
    spawn olur; `bossRiddle` kapanır. Yenince normal boss-temizleme + iyi ödül.

**onBossCleared helper (DRY):** mevcut `onKill`'deki boss-sonrası mantık (gatekeeper flag,
hell-clear ödülü, `clearRoom`/advance) küçük bir `onBossCleared(state, content, log)` helper'ına
çıkarılır; hem normal boss kill hem "Atla" bunu çağırır. (Mantık denetimi: tek kaynak.)

## 5. Normal bilmece deneme limiti (`discovery.ts answerRoom`)

- Her gizli oda için sayaç: `state.riddleLimits[roomId] = { attempts, lockUntil, lockTier }`.
- **Yanlış cevap:** `attempts++`. `attempts >= 3` → oda **kilitlenir**: `lockUntil = now + süre`,
  `lockTier++`. Kilit süreleri: **30 dk** (tier 0→1), sonra **1 saat** (tier ≥ 2'de **sabit 1 saat**).
- **Kilitliyken `answerRoom`** reddeder; UI input yerine **geri sayım** gösterir
  (`Math.ceil((lockUntil - now)/60000)` dk). Süre dolunca `attempts` 0'a döner (3 hak yeniden).
- **Doğru cevap:** ödül + `discoveries`'e ekle + `riddleLimits[roomId]` temizlenir.
- **Canavar YOK** (boss bilmecesinden farkı bu).
- Zaman gerçek-saat (`Date.now()`); offline'da da işler (timestamp).

## 6. Durum (`state.ts`) ve göç

- `bossRiddle: { roomKey: string; riddleId: string; attempts: number } | null`
- `riddleLimits: Record<string, { attempts: number; lockUntil: number; lockTier: number }>`
- `newGame`: `bossRiddle: null`, `riddleLimits: {}`. `migrate`: `??=`.
- **Reset:** `onDeath` → `bossRiddle = null`. `rebirth` → `bossRiddle = null`, `riddleLimits = {}`
  (yeni koşu, kilitler ve boss-bilmece sıfır). (Mantık denetimi: olay/oda sıfırlamalarıyla aynı yerde.)

## 7. Akış entegrasyonu (`combat.ts`)

`combatRound` `!state.enemy` dalında, **boss odası** ise (event kontrolünden sonra):
- `bossRiddle` zaten bu oda için aktifse → hiçbir şey yapma (UI panel gösterir; cevabı bekler).
- Değilse ve bu boss odası daha çözülmediyse → şans roll; tutarsa `bossRiddle` kur (boss spawn etme).
- Tutmazsa normal `spawnEnemy` (boss).

`riddleGuard` canavar öldüğünde (`onKill`): `bossRiddle` aktif + `attempts < 3` ise **advance etme**,
sadece enemy temizle (bilmece geri gelsin). Final/3.-yanlış boss (`isBoss`, riddleGuard değil) →
normal `onBossCleared`.

Yeni `riddles.ts` (saf mantık, döngüsel bağımlılık yok — harita olaylarındaki gibi): şans roll,
bilmece seçimi, cevap kontrolü (boss + normal limit). Spawn/ölüm/advance `combat.ts`'te kalır.

## 8. UI (`ui.ts`)

- **Boss-bilmece paneli** (combat view, `pendingEvent` paneli gibi): bilmece metni + ipucu +
  input + "kalan hak: {3-attempts}/3". Doğru çözülünce input yerine **iki buton** (Atla / Savaş);
  Savaş'a basınca **3 zorluk butonu**.
- Ara `riddleGuard` canavar varken normal savaş paneli (bilmece gizli, enemy görünür).
- **Normal bilmece** (Lore sekmesi): kilitliyse input + Çöz yerine **"🔒 {dk} dk sonra tekrar"**.
- Yeni `ACTIONS`: `onAnswerBossRiddle(answer)`, `onBossChoice(mode, difficulty?)`.

## 9. Lokalizasyon (tr + en)

Tüm metin loc key: 3 boss bilmecesi (metin/ipucu/sonuç), buton etiketleri (`ui.boss_skip`,
`ui.boss_fight`, zorluk adları), `ui.riddle_locked` ("{dk} dk"), `log.*` sonuçları.

## 10. Denge (data-driven)

`riddleChanceBase` (0.10), `riddleChanceLuck` (0.005), cap (0.40), guard buff (1.3), fail-boss
buff (1.5), zorluk çarpanları (1/1.5/2), kilit süreleri (30dk/60dk) — sabitler tek yerde
(gerekirse `dungeon.json`/config). Boss reward `boss_riddles.json`'da.

## 11. Dosya özeti

| Dosya | Değişiklik |
|---|---|
| `packages/shared/src/types.ts` | `BossRiddle` + `Content.bossRiddles` |
| `data/boss_riddles.json` | 3 zor boss bilmecesi (yeni) |
| `packages/client/src/game/content.ts` | `boss_riddles.json` yükle |
| `packages/client/src/game/riddles.ts` | **yeni**: şans roll, bilmece seçimi, cevap+limit mantığı |
| `packages/client/src/game/combat.ts` | boss-oda dalı, `onBossCleared` helper, riddleGuard ölüm, zorluk spawn |
| `packages/client/src/game/discovery.ts` | `answerRoom` limit/kilit entegrasyonu |
| `packages/client/src/game/state.ts` | `bossRiddle`, `riddleLimits` + newGame |
| `packages/client/src/game/rebirth.ts` | reset |
| `packages/client/src/main.ts` | migrate + `onAnswerBossRiddle`/`onBossChoice` wiring + onDeath reset |
| `packages/client/src/ui.ts` | boss-bilmece paneli + normal bilmece kilit gösterimi + CSS |
| `data/i18n/tr.json`, `en.json` | bilmeceler + sistem etiketleri |

## 12. Test / doğrulama

`typecheck` + `build` temiz. Manuel: boss odasında bazen (LUCK ile artan) bilmece çıkar; doğru
çözünce Atla/Savaş + 3 zorluk; yanlış 1-2 → canavar (öldür → bilmece döner), 3 → güçlü boss;
normal bilmece 3 yanlış → 30dk kilit → tekrar 3 → 1sa kilit; ölüm/rebirth temizler; eski kayıt patlamaz.

## 13. Kapsam dışı (YAGNI / sonra)

- Boss-bilmece için ayrı "keşif günlüğü" — sonra (Bestiary turu).
- Kademeli kilit 1 saatten ötesi (2sa, 4sa…) — şimdilik 1 saatte sabit.
- LLM/Marvion bilmece üretimi — yok; elle authored.
