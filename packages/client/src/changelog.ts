// Player-facing changelog. UPDATE THIS with every gameplay change: bump VERSION and add an entry
// at the TOP of CHANGELOG (newest first). Shown via the version badge in the top bar.

export const VERSION = '1.4.0';

export interface ChangelogEntry {
  v: string;
  date: string; // YYYY-MM-DD
  tr: string[];
  en: string[];
}

/** Newest first. The first entry is treated as "this version". */
export const CHANGELOG: ChangelogEntry[] = [
  {
    v: '1.4.0',
    date: '2026-06-22',
    tr: [
      'Düzeltme: kardeş evrim formları artık birbirinden farklı',
      'Her dallanmada iki seçenek gerçek bir tercih: biri primary-stat ağırlıklı, diğeri secondary + farklı skiller',
      'Tüm ırkları etkiledi (örn. Kadim Lich INT/saldırı, Ruh Biçen WIS/ruh)',
    ],
    en: [
      'Fix: sibling evolution forms are now actually different from each other',
      'Each branch is a real choice: one leans primary-stat, the other secondary + different skills',
      'Affects all races (e.g. Ancient Lich INT/offense, Soul Reaper WIS/soul)',
    ],
  },
  {
    v: '1.3.1',
    date: '2026-06-22',
    tr: [
      'Düzeltme: skill slot sayacı artık doğru — boş slotlar sessizce otomatik dolmuyor',
      'Yeni "Tümünü bırak" butonu: tüm takılı skilleri tek tıkla çıkar',
    ],
    en: [
      'Fix: skill slot counter is now accurate — empty slots no longer silently auto-fill',
      'New "Unequip all" button: clear your whole loadout in one tap',
    ],
  },
  {
    v: '1.3.0',
    date: '2026-06-22',
    tr: [
      'Paralel Zihin yeniden tasarlandı (Kumo): Paralel Zihin → İrade → Varoluş (1/2/3 zihin)',
      'Çoklu eylem: her paralel zihin turda bekleme süresini yok sayıp EKSTRA bir skill ateşler',
      'Paralel görev: savaşırken pasif MP/SP regen + nadir parça bulma (bir zihin labirenti okur)',
      'Her paralel zihin ayrıca +1 skill slotu verir (kademeli)',
    ],
    en: [
      'Parallel Minds redesigned (Kumo): Parallel Minds → Will → Existence (1/2/3 minds)',
      'Multi-action: each parallel mind fires an EXTRA skill per turn, ignoring cooldown',
      'Parallel tasking: passive MP/SP regen + rare fragment finds while fighting',
      'Each parallel mind also grants +1 skill slot (scaling)',
    ],
  },
  {
    v: '1.2.0',
    date: '2026-06-22',
    tr: [
      'Durum etkileri: Taşlaşma + Sersemletme — düşman uygularsa bir süre saldıramazsın',
      'Yeni dirençler: Taşlaşma/Sersemletme Direnci (12 direnç oldu)',
      'Ağrı İptali skill zinciri (Kumo): düşük canda gelen hasarı yok sayar',
      'Uzaysal Manevra + Şimşek Adım (kaçınma skilleri)',
      'Örümceğe gizli Kumoko yolu: 500 öldürmede Zoa Ele → Ede Saine → Arachne → Zana Horowa (Arachne insansı, envanter açılır)',
      'Bazilisk taşlaştırır, Mağara Maymunu sersemletir — durum uygulayan düşmanlar',
    ],
    en: [
      'Status conditions: Petrify + Stun — enemies can lock you out of acting for a few seconds',
      'New resistances: Petrify/Stun Resistance (now 12 total)',
      'Pain Nullification skill chain (Kumo): ignores incoming damage at low HP',
      'Spatial Maneuver + Flash Step (dodge skills)',
      'Hidden Kumoko path for spiders: at 500 kills, Zoa Ele → Ede Saine → Arachne → Zana Horowa (Arachne is humanoid, unlocks inventory)',
      'Basilisk petrifies, Cave Ape stuns — status-applying enemies',
    ],
  },
  {
    v: '1.1.0',
    date: '2026-06-22',
    tr: [
      'Irk Gücü paneli: savaş sekmesinde bar göstergesi — ne kadar ısı/ağ/kemik biriktiği, slime emiliminde kalan saniye ve etkisi görünür',
      'Düşman element çeşitliliği: bazilisk asit, Kaguna yıldırım, Mağara Dehşeti buz, Kraliçe büyü kullanıyor',
      'Artık 10 direncin hepsi anlamlı (önceden buz/asit/yıldırım/büyü dirençleri ölüydü)',
    ],
    en: [
      'Race Power panel: combat-tab bar gauge — shows built-up heat/web/bone, slime absorb seconds + effect',
      'Enemy element variety: basilisk acid, Kaguna lightning, Cave Horror frost, Queen magic',
      'All 10 resistances now matter (frost/acid/lightning/magic were previously dead)',
    ],
  },
  {
    v: '1.0.0',
    date: '2026-06-22',
    tr: [
      'Canavar Ansiklopedisi (Bestiary): 26 düşmanın keşif kaydı, 5. öldürmede davranış bilgisi açılır',
      'Irk İmza Mekanikleri: örümcek=ağ tuzağı, ejder=ısı patlaması, iskelet=kemik zırhı, slime=element emilimi, golem=taş zırh',
      'Büyü düzeltmesi: magma_fist artık 5 MP harcar (sıfırdan düzeltildi)',
    ],
    en: [
      'Bestiary tab: tracks 26 enemy kills; reveals behaviour tags after 5 kills or Appraisal',
      'Race Signature Mechanics: spider=web trap, wyrmling=heat burst, skeleton=bone armour, slime=element absorb, golem=stone skin',
      'Magic fix: magma_fist now costs 5 MP (was 0)',
    ],
  },
  {
    v: '0.9.0',
    date: '2026-06-22',
    tr: [
      'Gizli Tensura easter egg: Slime ırkı 666 öldürme sonrası insansı yol açılıyor',
      'Demon Slime → Rimuru Fırtına → İblis Lordu Rimuru formu (envanter + kuşanma)',
      'Predatör / Oburluk / Beelzebuth ve Büyük Bilge / Raphael skill zincirleri',
      'Harvest Festival bildirim tostu (666. öldürmede)',
    ],
    en: [
      'Secret Tensura easter egg: Slime race unlocks humanoid path at 666 kills',
      'Demon Slime → Rimuru Tempest → Demon Lord Rimuru forms (with inventory + gear)',
      'Predator / Gluttony / Beelzebuth and Great Sage / Raphael skill chains',
      'Harvest Festival toast notification on the 666th kill',
    ],
  },
  {
    v: '0.8.1',
    date: '2026-06-21',
    tr: [
      'Irklara tematik skiller: iskelet artık Kemik Ok/Zırh (Keskin Pençe yerine)',
      'Ejderha Ateş Nefesi kullanıyor (Alev Oku yerine) + Ejder Pençesi',
      'Golem/örümcek skil havuzları tutarlı hale getirildi',
    ],
    en: [
      'Race-thematic skills: skeleton now uses Bone Arrow/Armor (not Sharp Claw)',
      'Dragon uses Fire Breath (not Flame Bolt) + Dragon Claw',
      'Golem/spider skill pools made coherent',
    ],
  },
  {
    v: '0.8.0',
    date: '2026-06-21',
    tr: [
      'Anime canavarları: 16→26 düşman, 4 kat (Üst/Orta/Alt/Dip)',
      'Otantik isimler (Elroe Gunerush, Toprak Ejderhası Araba, Taratect…)',
      'Davranış çeşitliliği: iyileşen, çift-vuran, öfkelenen, zırhlı, can emen düşmanlar',
      'Düzeltme: zindan derinliği evrime yetişiyor — gatekeeper/rebirth artık erişilebilir',
    ],
    en: [
      'Anime bestiary: 16→26 enemies across 4 strata (Upper/Middle/Lower/Bottom)',
      'Authentic names (Elroe Gunerush, Earth Dragon Araba, Taratect…)',
      'Behaviour variety: regen, double-strike, enrage, armoured, lifesteal foes',
      'Fix: dungeon depth now matches evolution — gatekeeper/rebirth reachable again',
    ],
  },
  {
    v: '0.7.0',
    date: '2026-06-21',
    tr: [
      'Loot derinliği: ekipman gereksinimleri (silah→STR, zırh→VIT…)',
      'Set bonusu — 3/6/9 nadir+ parça kuşanınca artan bonus',
      'Forge: EP ile eşyayı bir nadirlik yükselt',
      'Stat respec: dağıtılan puanları EP karşılığı geri al',
      'Sandık loot: dinlenirken arama yapınca eşya bulma',
      'Hızlı butonlar: en iyiyi kuşan / sıradanları parçala',
    ],
    en: [
      'Loot depth: equip requirements (weapon→STR, armor→VIT…)',
      'Set bonus — wear 3/6/9 rare+ pieces for scaling bonuses',
      'Forge: spend EP to upgrade an item one rarity tier',
      'Stat respec: refund allocated points for EP',
      'Chest loot: searching while resting can find gear',
      'Quick buttons: auto-equip best / scrap commons',
    ],
  },
  {
    v: '0.6.0',
    date: '2026-06-21',
    tr: [
      'Envanter + kuşanma sistemi (sadece insansı ırklar: insan, iskelet)',
      'Prosedürel loot: 9 ekipman slotu, nadirlik renkleri, prefix/suffix',
      'Düşmanlar ve sandıklardan eşya düşüyor; legendary rebirth’te kalır',
    ],
    en: [
      'Inventory + equipment system (humanoid races only: human, skeleton)',
      'Procedural loot: 9 equip slots, rarity colours, prefixes/suffixes',
      'Enemies/chests drop gear; legendaries persist through rebirth',
    ],
  },
  {
    v: '0.5.0',
    date: '2026-06-21',
    tr: [
      'Animasyonlar: savaşta düşman saldırı/parıltısı',
      'Dinlenme/meditasyonda nefes alan aura',
      'Evrim ve yeniden doğuş için tam ekran efektler',
    ],
    en: [
      'Animations: enemy attack/glow in combat',
      'Breathing aura while resting/meditating',
      'Fullscreen bursts for evolution and rebirth',
    ],
  },
  {
    v: '0.4.0',
    date: '2026-06-21',
    tr: [
      'Tüm ırklara saf ikili evrim ağacı (32 form, her form 2 dala ayrılır)',
      'Her ırka tematik başlangıç statları',
      'Offline’da skill evrimi durduruldu (artık aktif oyunda olur)',
    ],
    en: [
      'Pure binary evolution tree for all races (32 forms, each splits in 2)',
      'Thematic starting stats per race',
      'Skills no longer auto-evolve offline (happens in active play)',
    ],
  },
];
