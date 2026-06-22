// Player-facing changelog. UPDATE THIS with every gameplay change: bump VERSION and add an entry
// at the TOP of CHANGELOG (newest first). Shown via the version badge in the top bar.

export const VERSION = '1.1.0';

export interface ChangelogEntry {
  v: string;
  date: string; // YYYY-MM-DD
  tr: string[];
  en: string[];
}

/** Newest first. The first entry is treated as "this version". */
export const CHANGELOG: ChangelogEntry[] = [
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
