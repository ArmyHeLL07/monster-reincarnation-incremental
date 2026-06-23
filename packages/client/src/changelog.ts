// Player-facing changelog. UPDATE THIS with every gameplay change: bump VERSION and add an entry
// at the TOP of CHANGELOG (newest first). Shown via the version badge in the top bar.

export const VERSION = '1.9.4';

export interface ChangelogEntry {
  v: string;
  date: string; // YYYY-MM-DD
  tr: string[];
  en: string[];
}

/** Newest first. The first entry is treated as "this version". */
export const CHANGELOG: ChangelogEntry[] = [
  {
    v: '1.9.4',
    date: '2026-06-23',
    tr: [
      'Düzeltme: İnsan Yolu uzmanlaşması artık söz verilen skilleri gerçekten veriyor (6 skill eksikti — Büyücü/Suikastçı hiç almıyordu)',
      'Düzeltme: forage yiyeceklerindeki geçersiz hasar tipi (damage) tematik tiplere çevrildi (poison/fire/acid…)',
    ],
    en: [
      'Fix: Human Path specialization now actually grants its skills (6 were missing — Mage/Assassin got none)',
      'Fix: invalid forage food damage type ("damage") replaced with thematic types (poison/fire/acid…)',
    ],
  },
  {
    v: '1.9.3',
    date: '2026-06-23',
    tr: [
      'Yeni: Ruh Ağacı — yeniden doğuş artık kalıcı bir yükseltme sistemi açıyor',
      'Ruh kazanımı performansa bağlı: ne kadar derine inersen o kadar Ruh',
      '7 yükseltme: Yırtıcı Ruh, Kadim Zırh, Açgözlülük, Uykusuz Zihin, Bilgelik, Ruh Şansı, Ekstra Yuva',
      'Stats sekmesinde Ruh paneli (ilk yeniden doğuştan sonra açılır)',
    ],
    en: [
      'New: Soul Tree — rebirth now unlocks a permanent upgrade system',
      'Soul gain is performance-based: the deeper you reach, the more Souls',
      '7 upgrades: Predator Soul, Ancient Armor, Greed, Sleepless Mind, Wisdom, Soul Luck, Extra Slot',
      'Soul panel in the Stats tab (unlocks after the first rebirth)',
    ],
  },
  {
    v: '1.9.1',
    date: '2026-06-23',
    tr: [
      'Füzyon: artık kol skilleri yanında bacak/vücut skilleri de seçilebilir (göz hariç)',
      'Lore okuma: yüzey lore +5 EP, ilk derin okuma +intReq EP kazandırıyor',
      'Log panelleri tıklanabilir aç/kapat başlıklara dönüştürüldü',
      'Ayrı LORE logu: kitap içerikleri keşif/savaş loguna karışmaz, kalıcı olarak saklanır',
      'Oda sayacı: düşman paneli sağ üstte 1/10 göstergesi (kota dolunca yeşile döner)',
      'Normal odalarda oda-temizlendi ekranı kaldırıldı; 10 öldürme sonrası İlerle butonu açılır ama dövüşmeye devam edebilirsin',
      'Boss odalarında yenildi mesajı ayrıca gösteriliyor',
      'Tüm kitap lore metinleri daha atmosferik ve mekanik ipuçlu hale getirildi',
    ],
    en: [
      'Fusion: leg/body skills now selectable in addition to arm (eye skills excluded)',
      'Lore reading: surface lore grants +5 EP, first deep read grants +intReq EP',
      'Log panels converted to collapsible click-to-open/close headers',
      'Separate LORE log: book content no longer mixed with discovery/combat, stored permanently',
      'Room kill counter: enemy panel shows 1/10 in top-right (turns green when quota met)',
      'Non-boss rooms no longer show "room cleared" screen; Advance button unlocks at 10 kills but combat continues',
      'Boss defeated message shown separately for boss rooms',
      'All book lore texts improved: more atmospheric, more actionable mechanic hints',
    ],
  },
  {
    v: '1.9.0',
    date: '2026-06-22',
    tr: [
      'Skill Ağacı: Beceriler Liste ve Ağaç görünümü arasında geçiş yapılabilir (Ağaç sekmesi)',
      'Skill sıralama sistemi (F/E/D/C/B/A/S/SS): üst beceriler daha yavaş XP kazanır',
      'Türetme (Derivation): birden fazla skili yeterli seviyeye getirince gizli skill otomatik açılır',
      'İlerici keşif: yalnızca sahip olduğun/komşu skilleri ağaçta görürsün; geri kalanı ??? kalır',
      'İnsan Yolu: T0 LV10 insan ırkı — Savaşçı/Büyücü/Suikastçı/Şifacı uzmanlaşması seçimi',
      'Oda öldürme kotası: normal odalarda 10 öldürme yapmadan ilerleme yapılamaz (boss odası hariç)',
      'Eşik Dayanıklılığı: hayatta kalma becerisiyle çok yakın ölümlerden kalıcı VIT kazanımı',
      'True Sight ve Plague Weaver: türetme yoluyla açılan iki yeni gizli skill',
    ],
    en: [
      'Skill Tree: skills tab now has List / Tree view toggle',
      'Skill rank system (F/E/D/C/B/A/S/SS): higher-rank skills gain XP slower',
      'Derivation: raise multiple skills to threshold levels to auto-unlock hidden skills',
      'Progressive reveal: only owned/adjacent skills visible in tree; rest stays ???',
      'Human Path: T0 LV10 human race — choose Warrior/Mage/Assassin/Healer specialization',
      'Room kill quota: must defeat 10 enemies per room before advancing (boss rooms exempt)',
      'Threshold Endurance: near-death events with the right skill grant permanent VIT bonus',
      'True Sight and Plague Weaver: two new hidden skills unlocked via derivation',
    ],
  },
  {
    v: '1.8.1',
    date: '2026-06-22',
    tr: [
      'Dinlenme/meditasyon ekranında artık ırkının gerçek portresi nefes alan aurayla görünüyor',
    ],
    en: [
      'Resting/meditation screen now shows your race portrait with a breathing aura',
    ],
  },
  {
    v: '1.8.0',
    date: '2026-06-22',
    tr: [
      'Artık 26 düşmanın HEPSİ portre resimli (kalan 10 da eklendi)',
      'Irk seçim ekranı yenilendi: her kartın arka planında o ırkın görseli',
      'Tüm yeni resimler şeffaflaştırıldı (beyaz kare arka plan temizlendi)',
    ],
    en: [
      'All 26 enemies now have portrait art (the last 10 added)',
      'Race select screen revamped: each card shows that race behind it',
      'All new images made transparent (white checkered background removed)',
    ],
  },
  {
    v: '1.7.2',
    date: '2026-06-22',
    tr: [
      'Düşman portrelerindeki kenar beyazlığı (halo) tamamen temizlendi',
      'İki aşamalı defringe: küçültme öncesi + sonrası kenar temizliği',
    ],
    en: [
      'Fully cleaned the leftover white edge halo on enemy portraits',
      'Two-pass defringe: edge cleanup before and after downscaling',
    ],
  },
  {
    v: '1.7.1',
    date: '2026-06-22',
    tr: [
      'Düşman portrelerinin gömülü beyaz/kareli arka planı temizlendi — artık gerçekten şeffaf',
      'Kenardan flood-fill: canavarın içindeki açık detaylar (kemik, kristal, zırh) korundu',
    ],
    en: [
      'Removed the baked-in white/checkered background from enemy portraits — now truly transparent',
      'Edge flood-fill: light details inside the creature (bone, crystal, armor) are preserved',
    ],
  },
  {
    v: '1.7.0',
    date: '2026-06-22',
    tr: [
      '16 düşman artık elle çizilmiş portre resmiyle görünüyor (emoji yerine)',
      'Savaş ekranında ve Yaratıklar (Bestiary) sekmesinde gösteriliyor',
      'Resmi olmayan düşmanlar emoji ile devam ediyor',
    ],
    en: [
      '16 enemies now show hand-drawn portrait art (instead of emoji)',
      'Shown in the combat screen and the Bestiary tab',
      'Enemies without art keep their emoji',
    ],
  },
  {
    v: '1.6.1',
    date: '2026-06-22',
    tr: [
      'Denge: slime/iskelet/golem/insan artık 2 saldırı skiliyle başlıyor (eskiden 1)',
      'Erken oyun çok yavaştı — başlangıç DPS\'i ~2 katına çıktı',
      'Slime: Asit Tükürüğü + Zehir Bulutu',
      'Mevcut karakterlere de eksik 2. saldırı skili otomatik ekleniyor',
    ],
    en: [
      'Balance: slime/skeleton/golem/human now start with 2 attack skills (was 1)',
      'Early game was too slow — opening DPS roughly doubled',
      'Slime: Acid Spit + Toxic Cloud',
      'Existing characters auto-receive the missing 2nd attack skill',
    ],
  },
  {
    v: '1.6.0',
    date: '2026-06-22',
    tr: [
      'Zirve formlar artık güçlü bir "ultimate" skill veriyor (rol bazlı)',
      'Kardeş zirveler farklı ultimate alır — her evrim yolu benzersiz',
      'Örn: Ruh Hükümdarı → Ölüm Tırpanı, Reaper Tanrısı → Ruh Yutan Bakış',
    ],
    en: [
      'Pinnacle forms now grant a powerful "ultimate" skill (role-based)',
      'Sibling pinnacles get different ultimates — every path is unique',
      'E.g. Soul Sovereign → Death Scythe, Reaper God → Soul Devour Gaze',
    ],
  },
  {
    v: '1.5.0',
    date: '2026-06-22',
    tr: [
      '27 yeni üst-kademe skill evrimi — skiller artık daha derin gelişiyor',
      'Büyüler: Meteor, Buzul Mızrağı, Yıldırım Fırtınası, Cehennem Nefesi…',
      'Saldırılar: Ölüm Tırpanı, Suikast, Felaket Darbesi, Ok Fırtınası…',
      'Gözler: Medusa Bakışı, Kâbus Bakışı, Tiran Bakışı (daha güçlü)',
      'Pasifler: Kale Beden, İlksel Kalp, Ölümsüz, Ebedi Kalkan…',
    ],
    en: [
      '27 new tier-3 skill evolutions — skills now grow deeper',
      'Spells: Meteor, Glacier Spike, Thunderstorm, Infernal Breath…',
      'Strikes: Death Scythe, Assassinate, Cataclysm Strike, Arrow Storm…',
      'Eyes: Medusa Gaze, Nightmare Gaze, Tyrant Gaze (stronger)',
      'Passives: Fortress Body, Primordial Heart, Deathless, Aegis Eternal…',
    ],
  },
  {
    v: '1.4.2',
    date: '2026-06-22',
    tr: [
      'KRİTİK düzeltme: Can/MP "NaN" gösterip bozulması giderildi (eski kayıtlarda ırk gücü alanı eksikti)',
      'Eski kayıtlar otomatik onarılıyor; bozulmuş Can/MP/SP değerleri geri yükleniyor',
    ],
    en: [
      'CRITICAL fix: HP/MP showing "NaN" and breaking (old saves lacked the race-signature field)',
      'Old saves auto-repair; corrupted HP/MP/SP values are restored',
    ],
  },
  {
    v: '1.4.1',
    date: '2026-06-22',
    tr: [
      'Düzeltme: boss bilmece odasında savaş ekranının boş kalması giderildi',
      'Bilmece verisi yanlış anahtarla aranıyordu — artık doğru eşleşiyor',
      'Güvenlik: bilmece yüklenemezse ekran boş kalmaz, normal savaşa döner',
    ],
    en: [
      'Fix: blank combat screen at boss riddle rooms',
      'Riddle data was looked up by the wrong key — now matched correctly',
      'Safety: if a riddle fails to load, the screen no longer blanks — falls back to normal combat',
    ],
  },
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
