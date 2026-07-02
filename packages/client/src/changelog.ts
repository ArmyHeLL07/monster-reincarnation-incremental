// Player-facing changelog. UPDATE THIS with every gameplay change: bump VERSION and add an entry
// at the TOP of CHANGELOG (newest first). Shown via the version badge in the top bar.

export const VERSION = '1.23.37';

export interface ChangelogEntry {
  v: string;
  date: string; // YYYY-MM-DD
  tr: string[];
  en: string[];
  /** Optional Russian text; falls back to `en` when absent (so future entries never break the build). */
  ru?: string[];
}

/** Newest first. The first entry is treated as "this version". */
export const CHANGELOG: ChangelogEntry[] = [
  {
    v: '1.23.37',
    date: '2026-07-02',
    tr: [
      'fix: uzun aradan (2+ saat) dönünce oyun saniyelerce donuyordu — ilk 10 dakika birebir simüle ediliyor, kalanı ölçülen hızla anında hesaplanıyor (EP/av/seviye kazanımları korunur)',
      'not: çok uzun offline dönüşlerde eşya ve skill seviyesi kazanımı ilk simüle edilen pencereden gelir — dengeli ve kasıtlı',
    ],
    en: [
      'fix: returning after a long absence (2h+) froze the game for seconds — the first 10 minutes are simulated 1:1, the rest is applied instantly from measured rates (EP/kills/levels preserved)',
      'note: on very long offline returns, item and skill-level gains come from the simulated window only — balanced and intentional',
    ],
    ru: [
      'fix: возврат после долгого отсутствия (2ч+) замораживал игру на секунды — первые 10 минут симулируются точно, остальное применяется мгновенно по измеренной скорости (ОЭ/добыча/уровни сохраняются)',
      'примечание: при очень долгом оффлайне предметы и уровни навыков начисляются только за симулированное окно — сбалансировано и намеренно',
    ],
  },
  {
    v: '1.23.36',
    date: '2026-07-02',
    tr: [
      'yeni arayüz (Sahne Faz 2+3): 10 sekme 4 alana indi — Av (Savaş+Harita), Beden (Skiller+Beden+Envanter), Zihin (Keşif+Yaratıklar), Ruh (Statlar)',
      'Beden/Zihin/Ruh artık sahnenin ÜZERİNE açılan bir panel — savaş arkada canlı akmaya devam ediyor; ✕ veya Esc ile kapanır',
      'mobilde alt gezinme çubuğu (başparmak erişimi) + paneller alttan kayan sayfa; Ayarlar ve Kılavuz üst bardaki ⚙/📖 ikonlarına taşındı',
    ],
    en: [
      'new UI (Stage Phase 2+3): 10 tabs collapsed into 4 areas — Hunt (Combat+Map), Body (Skills+Body+Inventory), Mind (Lore+Bestiary), Soul (Stats)',
      'Body/Mind/Soul now open as a panel OVER the stage — combat keeps running live behind it; close with ✕ or Esc',
      'mobile gets a bottom navigation dock (thumb-first) + panels slide up as sheets; Settings and Guide moved to the ⚙/📖 topbar icons',
    ],
    ru: [
      'новый интерфейс (Сцена, фазы 2+3): 10 вкладок сведены в 4 области — Охота (Бой+Карта), Тело (Навыки+Тело+Инвентарь), Разум (Знания+Бестиарий), Душа (Статы)',
      'Тело/Разум/Душа открываются панелью ПОВЕРХ сцены — бой продолжается за ней; закрытие ✕ или Esc',
      'на мобильных — нижняя панель навигации + выезжающие снизу листы; Настройки и Руководство перенесены на иконки ⚙/📖 в верхней панели',
    ],
  },
  {
    v: '1.23.35',
    date: '2026-07-02',
    tr: [
      'görsel: savaş ekranı artık bir düello sahnesi — canavarın düşmanın karşısında duruyor ve her turda saldırı hamlesi yapıyor ("Sahne" arayüz vizyonunun 1. fazı)',
      'görsel: zindan katmanları atmosferi değiştiriyor — derinlere indikçe ekranın ışığı katmana göre boyanıyor (Magma közleri, Çekirdek moru)',
    ],
    en: [
      'visual: the combat screen is now a duel stage — your monster stands opposite the foe and lunges with each round (phase 1 of the "Stage" UI vision)',
      'visual: dungeon layers set the atmosphere — as you descend, the ambient light retints per layer (Magma embers, Core violet)',
    ],
    ru: [
      'визуал: экран боя теперь дуэльная сцена — ваш монстр стоит напротив врага и делает выпад каждый раунд (фаза 1 концепции «Сцена»)',
      'визуал: слои подземелья задают атмосферу — при спуске окружающий свет перекрашивается по слою (угли Магмы, фиолет Ядра)',
    ],
  },
  {
    v: '1.23.34',
    date: '2026-07-02',
    tr: [
      'yeni: minyon komutası 10 ırka yayıldı — Vampir (Gece Sarayı: Yarasa Sürüsü→Kan Kulu→Kan Muhafızı), Lycan (Kurt Sürüsü), Slime (Bölünme), Golem (Taş Ordusu), Wyrmling (Yuva), Göksel (Işık Konseyi), Beastkin (Av Sürüsü) — hepsi T5\'te açılır, T7/T9\'da evrimleşir',
      'İnsan bilinçli olarak minyonsuz: onun kimliği teçhizat ve yol seçimi',
    ],
    en: [
      'new: minion command extended to 10 races — Vampire (Night Court: Bat Swarm→Blood Thrall→Blood Guard), Lycan (Wolf Pack), Slime (Division), Golem (Stone Host), Wyrmling (Brood), Celestial (Choir of Light), Beastkin (Hunting Pack) — all unlock at T5 and evolve at T7/T9',
      'Human deliberately has no minions: their identity is gear and path choices',
    ],
    ru: [
      'новое: командование миньонами теперь у 10 рас — Вампир (Ночной двор: Стая мышей→Трэлл→Кровавый страж), Ликан (Волчья стая), Слизь (Деление), Голем (Каменное воинство), Вирмлинг (Выводок), Небесный (Хор света), Зверолюд (Охотничья стая) — открываются на T5, эволюционируют на T7/T9',
      'У Человека миньонов намеренно нет: его сила — снаряжение и выбор пути',
    ],
  },
  {
    v: '1.23.33',
    date: '2026-07-02',
    tr: [
      'yeni: minyonlar artık komutanlarıyla birlikte evrimleşiyor — T7 ve T9\'da form atlar, güçleri artar (İskelet → Şövalye İskelet → Ölüm Muhafızı; örümcek ve şeytan hatları da dahil)',
      'minyon panelinde mevcut form ve sıradaki evrim gösteriliyor; evrim anında canlı tank sürüsünün HP havuzu yeni güçle ölçekleniyor',
    ],
    en: [
      'new: minions now evolve alongside their commander — at T7 and T9 they take stronger forms (Skeleton → Skeleton Knight → Death Guard; spider and demon lines too)',
      'the minion panel shows the current form and the next evolution; a live tank swarm\'s HP pool rescales at the moment of evolution',
    ],
    ru: [
      'новое: миньоны теперь эволюционируют вместе с командиром — на T7 и T9 принимают более сильные формы (Скелет → Скелет-рыцарь → Страж смерти; линии паука и демона тоже)',
      'панель миньонов показывает текущую форму и следующую эволюцию; HP живого танк-роя масштабируется в момент эволюции',
    ],
  },
  {
    v: '1.23.32',
    date: '2026-07-02',
    tr: [
      'yeni: "Sen Yokken" özeti — 2 dakikadan uzun aradan dönünce av, seviye, EP, skill ve eşya kazanımlarını gösteren karşılama kartı',
      'yeni: oyun artık telefona kurulabiliyor (Ana Ekrana Ekle) — tam ekran, tarayıcı çubuğu yok',
      'yeni: minyonlar artık sadece örümceğe özel değil — İskelet (Kemik Orduları, undead_sovereign) ve Şeytan (Cehennem Lejyonu, demon_overlord) T5+ formları da minyon komuta ediyor',
    ],
    en: [
      'new: "While You Were Away" summary — returning after 2+ minutes shows a welcome card with kills, levels, EP, skill-ups and loot',
      'new: the game is now installable on your phone (Add to Home Screen) — fullscreen, no browser chrome',
      'new: minions are no longer spider-only — Skeleton (Bone Legion, undead_sovereign) and Demon (Infernal Legion, demon_overlord) T5+ forms also command minions',
    ],
    ru: [
      'новое: сводка "Пока тебя не было" — после 2+ минут отсутствия карточка показывает добычу, уровни, ОЭ, навыки и предметы',
      'новое: игру можно установить на телефон (Добавить на главный экран) — полный экран, без браузерной рамки',
      'новое: миньоны больше не только у паука — Скелет (Костяной легион, undead_sovereign) и Демон (Адский легион, demon_overlord) на T5+ тоже командуют миньонами',
    ],
  },
  {
    v: '1.23.31',
    date: '2026-07-02',
    tr: [
      'görsel: canın %25 altına düşünce HP barı nabız gibi atarak uyarıyor (tüm HUD\'larda)',
      'görsel: sekme değişiminde yumuşak içerik geçişi; bildirimler kayarak geliyor; ırk kartları üzerine gelince yükseliyor',
      'görsel: düşman paneli boş durumu artık sahne gibi ortalanmış; bestiary tablosunda zebra satırlar',
      'görsel: masaüstünde yan menü butonları üzerine gelince kayıyor; metin seçimi ve devre dışı butonlar temaya uygun',
    ],
    en: [
      'visual: the HP bar now pulses as a warning when health drops below 25% (all HUDs)',
      'visual: smooth content transition on tab switch; toasts slide in; race cards lift on hover',
      'visual: the empty enemy panel state is now centered like a stage; zebra rows in the bestiary table',
      'visual: desktop sidebar buttons slide on hover; text selection and disabled buttons match the theme',
    ],
    ru: [
      'визуал: полоса HP пульсирует как предупреждение, когда здоровье падает ниже 25% (во всех HUD)',
      'визуал: плавный переход контента при смене вкладки; уведомления въезжают; карточки рас приподнимаются при наведении',
      'визуал: пустое состояние панели врага теперь по центру, как сцена; полосатые строки в таблице бестиария',
      'визуал: кнопки бокового меню сдвигаются при наведении; выделение текста и отключённые кнопки в стиле темы',
    ],
  },
  {
    v: '1.23.30',
    date: '2026-07-02',
    tr: [
      'görsel: arayüz cilası — panel başlıklarına ince ayraç çizgisi, barlara parlaklık dokusu, ekran kenarlarına derinlik (vinyet), boss çerçevesi turuncu',
      'görsel: koyu temaya uygun ince kaydırma çubukları; klavye gezinmesinde görünür odak halkası',
      'mobil: üst bar kompaktlaştı (2 sütun) — savaş ekranı artık ilk bakışta görünüyor',
      'masaüstü: oyun alanı biraz genişledi (980→1060px); log panelinde en yeni satır vurgulanıyor',
    ],
    en: [
      'visual: UI polish — ruled divider on panel titles, sheen on resource bars, edge vignette for depth, boss portraits framed in ember',
      'visual: slim dark-theme scrollbars; visible focus ring for keyboard navigation',
      'mobile: compact 2-column top bar — the combat screen now fits the first view',
      'desktop: play area slightly wider (980→1060px); newest log line is highlighted',
    ],
    ru: [
      'визуал: полировка интерфейса — линии-разделители у заголовков панелей, блик на полосах ресурсов, виньетка по краям экрана, рамка босса цвета углей',
      'визуал: тонкие тёмные полосы прокрутки; видимое кольцо фокуса при навигации с клавиатуры',
      'мобильные: компактная верхняя панель в 2 колонки — экран боя теперь виден с первого взгляда',
      'десктоп: игровая область немного шире (980→1060px); последняя строка лога подсвечивается',
    ],
  },
  {
    v: '1.23.29',
    date: '2026-07-02',
    tr: [
      'mobil: ekranın altına ince bir HP/MP/SP/açlık şeridi eklendi — savaşta aşağı kaydırınca canın artık görünür kalıyor',
      'mobil: sekme çubuğu artık yukarı yapışıyor (sticky) — sekme değiştirmek için en üste kaydırmak gerekmiyor',
      'mobil fix: hasar sayıları ekranın sol üst köşesinde belirmiyor, karakterin üstünde çıkıyor',
      'mobil: bilmece cevap kutusu artık temaya uygun ve odaklanınca iOS ekranı yakınlaştırmıyor; küçük butonlar (kuşan/stat/kat/oda) parmakla basılabilir boyuta büyütüldü',
    ],
    en: [
      'mobile: slim HP/MP/SP/hunger strip pinned to the bottom of the screen — your health stays visible while scrolling in combat',
      'mobile: the tab bar is now sticky at the top — no more scrolling back up to switch tabs',
      'mobile fix: damage numbers no longer spawn in the top-left corner of the screen, they appear over your character',
      'mobile: the riddle answer box is now themed and no longer triggers iOS zoom on focus; small buttons (equip/stat/floor/room) enlarged to finger-friendly sizes',
    ],
    ru: [
      'мобильные: тонкая полоса HP/MP/SP/голода закреплена внизу экрана — здоровье видно при прокрутке в бою',
      'мобильные: панель вкладок теперь закреплена сверху — не нужно прокручивать вверх для смены вкладки',
      'мобильный fix: числа урона больше не появляются в левом верхнем углу экрана — они показываются над персонажем',
      'мобильные: поле ответа на загадку оформлено в стиле игры и больше не вызывает зум iOS; мелкие кнопки (экипировка/статы/этаж/комната) увеличены для пальцев',
    ],
  },
  {
    v: '1.23.28',
    date: '2026-07-02',
    tr: [
      'fix: Eski Samsung Internet / eski Android tarayıcılarında oyun boş siyah ekranda kalıyordu (replaceAll uyumluluğu) — artık açılıyor',
      'iyileştirme: Oyun açılışta çökerse boş ekran yerine hata mesajı gösteriliyor',
    ],
    en: [
      'fix: the game was stuck on a blank black screen on older Samsung Internet / older Android browsers (replaceAll compatibility) — it now boots',
      'improvement: if the game crashes on startup, an error message is shown instead of a blank page',
    ],
    ru: [
      'fix: на старых браузерах Samsung Internet / старом Android игра зависала на чёрном экране (совместимость replaceAll) — теперь запускается',
      'улучшение: при сбое запуска вместо пустой страницы показывается сообщение об ошибке',
    ],
  },
  {
    v: '1.23.27',
    date: '2026-07-01',
    tr: [
      'fix: Tiran/İmparator Aurası, Atletizm ve Dövüş Sanatları Ustalığı yeteneklerinin "tüm statlara +%" bonusu artık gerçekten uygulanıyor (eskiden hiçbir etkisi yoktu)',
      'fix: forage ve explore aramalarının SP maliyeti iki ayrı yerde tanımlıydı, tek kaynağa indirildi',
      'temizlik: kullanılmayan ölü kod kaldırıldı (eski gearscore modülü)',
    ],
    en: [
      'fix: the "+% to all stats" bonus on Tyrant/Emperor Aura, Athletics and Martial Arts Mastery now actually applies (it previously did nothing)',
      'fix: forage and explore search SP cost was defined in two places, consolidated to one source',
      'cleanup: removed unused dead code (legacy gearscore module)',
    ],
    ru: [
      'fix: бонус "+% ко всем характеристикам" у Аур Тирана/Императора, Атлетики и Мастерства боевых искусств теперь действительно работает (раньше не давал ничего)',
      'fix: стоимость SP для поиска (forage/explore) была задана в двух местах, объединена в одном источнике',
      'очистка: удалён неиспользуемый мёртвый код (старый модуль gearscore)',
    ],
  },
  {
    v: '1.23.26',
    date: '2026-06-30',
    tr: [
      'güvenlik: Tüm metin gösterimi artık otomatik kaçışlı (XSS) — bozuk/paylaşılan kayıttaki zararlı kod hiçbir yerden çalışamaz (ırk/form/düşman alanları + tüm çeviri çıktısı sıkılaştırıldı)',
    ],
    en: [
      'security: all displayed text is auto-escaped now (XSS) — markup from a crafted/shared save can no longer execute anywhere (race/form/enemy fields + every translation output hardened)',
    ],
    ru: [
      'безопасность: весь отображаемый текст авто-экранируется (XSS) — код из подделанного/общего сохранения больше нигде не выполнится',
    ],
  },
  {
    v: '1.23.25',
    date: '2026-06-30',
    tr: [
      'güvenlik: İçe aktarılan bozuk/kötü-niyetli kayıtların oyuna zararlı kod (HTML/script) enjekte etmesi engellendi — paylaşılan kayıt dosyalarına karşı XSS koruması',
    ],
    en: [
      'security: hardened save import against injected markup/script — stored-XSS protection from crafted or shared save files',
    ],
    ru: [
      'безопасность: защита импорта сохранений от внедрённого HTML/скрипта — защита от XSS из подделанных или общих файлов сохранений',
    ],
  },
  {
    v: '1.23.24',
    date: '2026-06-30',
    tr: [
      'fix: Çok uzun oturumlarda füzyon telemetrisinin kaydı şişirmesi engellendi (son 200 ile sınırlı); hata-bildirim etiketi tutarlı hale getirildi',
    ],
    en: [
      'fix: fusion telemetry can no longer bloat the save over very long sessions (capped at the last 200); consistent bug-report tag',
    ],
    ru: [
      'fix: телеметрия слияний больше не раздувает сохранение в долгих сессиях (ограничена последними 200); единый тег отчётов об ошибках',
    ],
  },
  {
    v: '1.23.23',
    date: '2026-06-30',
    tr: [
      'fix: Bozuk/elle düzenlenmiş kayıt koruması — geçersiz (NaN) statlar artık oyunu kilitlemiyor, güvenli değerlere çekiliyor',
    ],
    en: [
      'fix: Corrupt/hand-edited save guard — invalid (NaN) stats no longer soft-lock the game; clamped to safe values',
    ],
    ru: [
      'fix: защита от повреждённых сохранений — некорректные (NaN) характеристики больше не блокируют игру',
    ],
  },
  {
    v: '1.23.22',
    date: '2026-06-30',
    tr: [
      'chore: Lansman cilası — sekme ikonu (favicon), sosyal medya paylaşım önizlemesi (Open Graph) ve sayfa dili otomatik (tr/en/ru)',
    ],
    en: [
      'chore: Launch polish — tab favicon, social share preview (Open Graph), and automatic page language (tr/en/ru)',
    ],
    ru: [
      'chore: Подготовка к запуску — иконка вкладки (favicon), превью для соцсетей (Open Graph), автоопределение языка страницы (tr/en/ru)',
    ],
  },
  {
    v: '1.23.21',
    date: '2026-06-30',
    tr: [
      'fix: Beastkin "Kan Öfkesi" göstergesi artık görünüyor — mekanik çalışıyordu ama panel eski ırk adına bağlıydı (öldürme başına +2 yığın, her yığın +%5 hasar)',
    ],
    en: [
      'fix: Beastkin "Blood Fury" gauge now shows up — the mechanic worked but the panel was wired to the old race id (+2 stacks per kill, +5% damage each)',
    ],
    ru: [
      'fix: индикатор «Кровавая ярость» (Beastkin) теперь отображается — механика работала, но панель была привязана к старому id расы (+2 заряда за убийство, +5% урона за заряд)',
    ],
  },
  {
    v: '1.23.20',
    date: '2026-06-29',
    tr: [
      'feat: 5 yeni ırk için açıklama kartları eklendi — Güçlü/Zayıf Yön, Gelişim Yolu ve Not bilgileri artık gösteriliyor',
    ],
    en: [
      'feat: added race hint panels for 5 new races — Strength, Weakness, Growth Path and Note now shown on race cards',
    ],
    ru: [
      'feat: добавлены подсказки для 5 новых рас — Сила, Слабость, Путь роста и Примечание теперь отображаются на карточках рас',
    ],
  },
  {
    v: '1.23.19',
    date: '2026-06-29',
    tr: [
      'feat: 5 yeni ırk oynanabilir hale getirildi — Hayvan-İnsan, İblis, Vampir, Lycan ve Melek artık ırk seçim ekranında seçilebilir',
    ],
    en: [
      'feat: 5 new races are now playable — Beastkin, Demon, Vampire, Lycan, and Celestial are unlocked in the race selection screen',
    ],
    ru: [
      'feat: 5 новых рас теперь доступны для игры — Зверолюд, Демон, Вампир, Ликан и Небожитель разблокированы в экране выбора расы',
    ],
  },
  {
    v: '1.23.18',
    date: '2026-06-29',
    tr: [
      'feat: 5 yeni ırk için tam evrim ağaçları eklendi — Hayvan-İnsan, İblis, Vampir, Lycan ve Melek ırkları artık her biri 33 formlu (T0→T10) ikili dallanma ağacına ve gizli apex formuna sahip',
      'chore: Yinelenen beastman ve fiend ırk girdileri silindi (beastkin ve demon ile birebir aynıydı)',
    ],
    en: [
      'feat: Full evolution trees added for 5 races — Beastkin, Demon, Vampire, Lycan, and Celestial each now have a 33-form binary branching tree (T0→T10) with a secret apex form',
      'chore: Duplicate beastman and fiend race entries removed (were identical to beastkin and demon)',
    ],
    ru: [
      'feat: Полные деревья эволюции добавлены для 5 рас — Зверолюд, Демон, Вампир, Ликан и Небожитель теперь имеют дерево из 33 форм (T0→T10) с секретной вершиной',
      'chore: Удалены дублирующиеся расы beastman и fiend (были идентичны beastkin и demon)',
    ],
  },
  {
    v: '1.23.17',
    date: '2026-06-28',
    tr: [
      'feat: Otomatik güncelleme bildirimi — yeni sürüm yayınlanınca oyun "Yenile" uyarısı gösterir; artık önbelleğe takılı eski sürümde kalmazsın (eski service worker\'lar da temizlenir)',
      'fix: Evrim ağacı düzeni dengelendi — kök ortada, dallar simetrik açılıp tek üst forma birleşiyor (büyük ırklardaki sola yığılma/karışıklık düzeldi)',
    ],
    en: [
      'feat: Auto update notice — when a new version ships, the game shows a "Refresh" prompt, so you no longer get stuck on a stale cached build (it also clears old service workers)',
      'fix: Evolution tree layout balanced — root centered, branches fan out symmetrically and converge to the final form (fixes the left-pile/tangle on the bigger races)',
    ],
    ru: [
      'feat: Авто-уведомление об обновлении — при выходе новой версии игра показывает кнопку «Обновить», чтобы вы не застревали на старой закэшированной сборке (также очищаются старые service worker)',
      'fix: Раскладка дерева эволюции выровнена — корень по центру, ветви симметричны и сходятся к финальной форме (исправлен перекос у больших рас)',
    ],
  },
  {
    v: '1.23.16',
    date: '2026-06-28',
    tr: [
      'fix: Evrim ağacı düzeni iyileştirildi — formlar artık ebeveynlerinin altında hizalı (büyük ırklarda dağınık/kopuk görünen ağaç düzeldi); geniş ağaçlar yatay kayar',
      'feat: 5 ek ırk (Beastman/Vampire/Lycan/Fiend/Celestial) listeye 🔒 kilitli olarak geri eklendi — tasarımları hazır olunca açılacak',
    ],
    en: [
      'fix: Evolution tree layout improved — forms now sit aligned under their parents (fixes the tangled/disconnected look on the bigger races); wide trees scroll horizontally',
      'feat: 5 more races (Beastman/Vampire/Lycan/Fiend/Celestial) re-added as 🔒 locked in the picker — they unlock when their designs are ready',
    ],
    ru: [
      'fix: Улучшена раскладка дерева эволюции — формы теперь выровнены под родителями (исправлен запутанный вид у больших рас); широкие деревья прокручиваются',
      'feat: Снова добавлены 5 рас (Beastman/Vampire/Lycan/Fiend/Celestial) как 🔒 заблокированные — откроются, когда будут готовы их дизайны',
    ],
  },
  {
    v: '1.23.15',
    date: '2026-06-28',
    tr: [
      'fix: Dil — ilk açılışta tarayıcı diline göre otomatik seçilir (TR/RU/EN) + ırk seçim ekranına dil butonları eklendi; artık ilk ekrandan dil değiştirilebiliyor (güçlü/zayıf yön açıklamaları doğru dilde gelir)',
    ],
    en: [
      'fix: Language — auto-detects from your browser on first run (TR/RU/EN) + language buttons added to the race-select screen; you can now switch language from the very first screen (race strengths/weaknesses show in the right language)',
    ],
    ru: [
      'fix: Язык — при первом запуске определяется по браузеру (TR/RU/EN) + кнопки языка на экране выбора расы; теперь язык можно сменить с первого экрана',
    ],
  },
  {
    v: '1.23.14',
    date: '2026-06-28',
    tr: [
      'fix: Evrim ağaçları yeniden DALLANIYOR — her ırkın dallanan evrim ağacı geri geldi (geçici olarak düz tek-yola dönmüştü)',
      'feat: Wyvern (Wyrmling) ırkına güçlü/zayıf yön bilgisi eklendi (ırk seçim ekranında)',
      'note: Beastkin ve Demon ırkları geçici olarak kilitlendi — dallanan evrim ağaçları bağlanınca geri açılacak',
    ],
    en: [
      'fix: Evolution trees branch again — each race\'s branching tree is back (it had temporarily become a single linear path)',
      'feat: Added strengths/weaknesses info for the Wyrmling (wyvern) race in the picker',
      'note: Beastkin & Demon are temporarily locked — they return once their branching trees are connected',
    ],
    ru: [
      'fix: Деревья эволюции снова ветвятся — ветвящееся дерево каждой расы вернулось (временно стало линейным)',
      'feat: Добавлена информация о сильных/слабых сторонах расы Wyrmling (виверна) при выборе расы',
      'note: Расы Beastkin и Demon временно заблокированы — вернутся, когда подключим их ветвящиеся деревья',
    ],
  },
  {
    v: '1.23.13',
    date: '2026-06-28',
    tr: [
      'feat: Tüm ırklar oynanabilir — Canavarsı (beastkin) ve İblis (demon) artık açık; her ırkın 10 kademeli evrim zinciri tam adlandırıldı',
      'fix: Yeni içeriğin eksik metinleri tamamlandı — 71 yetenek (isim + açıklama) + 80 evrim formu + 2 ırk adı, üç dilde; artık ham anahtar görünmüyor',
    ],
    en: [
      'feat: All races playable — Beastkin and Demon are now unlocked; every race\'s full 10-tier evolution chain is named',
      'fix: Filled in the new content\'s missing text — 71 skills (name + description) + 80 evolution forms + 2 race names, in all 3 languages; no more raw keys',
    ],
    ru: [
      'feat: Все расы играбельны — Зверолюд и Демон теперь открыты; вся 10-ступенчатая цепочка эволюции каждой расы получила названия',
      'fix: Заполнен недостающий текст нового контента — 71 навык (название + описание) + 80 форм эволюции + 2 названия рас, на трёх языках; сырых ключей больше нет',
    ],
  },
  {
    v: '1.23.12',
    date: '2026-06-28',
    tr: [
      'feat: Şeytan "Kan Paktı" — MP yetmeyince eksik kısım HP\'den karşılanır, büyü iptal olmaz; Golem "Sarsılmaz Çekirdek" — tam taş katmanıyla kontrol (CC) etkilerine bağışıklık',
      'fix: Eksik çeviriler tamamlandı (Kan Paktı mesajı TR/RU)',
    ],
    en: [
      'feat: Demon "Blood Pact" — when MP runs short the shortfall is paid from HP, so the cast still fires; Golem "Unmovable Core" — a full stone layer grants immunity to control (CC) effects',
      'fix: Completed missing translations (Blood Pact message in TR/RU)',
    ],
    ru: [
      'feat: Демон «Кровавый пакт» — при нехватке MP недостаток берётся из HP, заклинание не отменяется; Голем «Незыблемое ядро» — полный каменный слой даёт иммунитет к контролю (CC)',
      'fix: Добавлены недостающие переводы (сообщение Кровавого пакта на TR/RU)',
    ],
  },
  {
    v: '1.23.11',
    date: '2026-06-28',
    tr: [
      'balance: Direnç/Nullification yeniden dengelendi — temel direnç artık max %20 (eskiden lv10\'da aniden ~%95 oluyordu); gerçek azaltma zincir kademelerinden (%20→%85) ve Nullification yolundan geliyor; Ultimate Nullification = %100 tam bağışıklık',
      'feat: Dirençler ekranına "Nullification Yolu" paneli eklendi — her gruba giden ilerleme (X/N) görünür; insight (kavrayış) yoksa kilitli adımlar ??? olarak gösterilir',
    ],
    en: [
      'balance: Resistance/Nullification reworked — base resistance now caps at 20% (it used to jump to ~95% at Lv10); real reduction comes from chain tiers (20%→85%) and the Nullification path; Ultimate Nullification = 100% full immunity',
      'feat: Added a "Nullification Path" panel to the Resistances screen — shows progress (X/N) toward each group; locked steps show as ??? until you have Insight',
    ],
    ru: [
      'balance: Сопротивления/нуллификация переработаны — базовое сопротивление теперь не выше 20% (раньше на ур.10 скакало до ~95%); реальное снижение даёт цепочка (20%→85%) и путь нуллификации; Ultimate Nullification = 100% полный иммунитет',
      'feat: На экран сопротивлений добавлен «Путь нуллификации» — прогресс (X/N) к каждой группе; закрытые шаги показаны как ??? без Озарения',
    ],
  },
  {
    v: '1.23.10',
    date: '2026-06-28',
    tr: [
      'balance: Element zinciri tamamlandı — rüzgâr/toprak/karanlık/ışık/hiçlik artık kendi üstünlük halkasına sahip (×1.5 güçlü / ×0.7 zayıf), düz hasar değil',
      'fix: Void (hiçlik) direnci eklendi — artık dirençlenebilir; ayrıca eksik element ad çevirileri (rüzgâr/toprak/karanlık/ışık/hiçlik) 3 dilde eklendi',
    ],
    en: [
      'balance: Element chart completed — wind/earth/dark/light/void now have their own advantage cycle (×1.5 strong / ×0.7 weak) instead of flat damage',
      'fix: Added void resistance — void can now be resisted; also added missing element name translations (wind/earth/dark/light/void) in 3 languages',
    ],
    ru: [
      'balance: Таблица стихий дополнена — ветер/земля/тьма/свет/пустота теперь имеют свой круг преимуществ (×1.5 / ×0.7), а не плоский урон',
      'fix: Добавлено сопротивление пустоте — её теперь можно сопротивлять; также добавлены недостающие переводы названий стихий (3 языка)',
    ],
  },
  {
    v: '1.23.9',
    date: '2026-06-28',
    tr: [
      'fix: Hikaye Modu savaşı düzeltildi — Orman bölümü var olmayan düşmanları çağırıyordu; gerçek düşmanlarla değiştirildi',
      'fix: Eksik çeviriler eklendi — rüzgâr/toprak/karanlık/ışık direnç adları + birkaç UI etiketi (3 dil) artık ham anahtar yerine düzgün metin',
      'feat: Henüz tamamlanmamış ırklar (beastman/vampire/lycan/fiend/celestial) listede 🔒 kilitli gösteriliyor — içerikleri hazır olunca açılacak',
    ],
    en: [
      'fix: Story Mode combat fixed — the Forest chapter referenced enemies that did not exist; replaced with real ones',
      'fix: Added missing translations — wind/earth/dark/light resistance names + a couple of UI labels (3 languages) now show proper text instead of raw keys',
      'feat: Unfinished races (beastman/vampire/lycan/fiend/celestial) now appear 🔒 locked in the picker — they unlock once their content is ready',
    ],
    ru: [
      'fix: Бой в Сюжетном режиме исправлен — глава «Лес» ссылалась на несуществующих врагов; заменены на реальных',
      'fix: Добавлены недостающие переводы — названия сопротивлений ветру/земле/тьме/свету + пара UI-меток (3 языка) теперь корректны',
      'feat: Незавершённые расы (beastman/vampire/lycan/fiend/celestial) теперь показаны 🔒 заблокированными — откроются, когда будет готов контент',
    ],
  },
  {
    v: '1.23.8',
    date: '2026-06-28',
    tr: [
      'feat: Destekçi listesi artık Patreon\'dan OTOMATİK güncelleniyor — oyun destekçileri arka plandaki bir servisten canlı çeker (günde 1 senkron). Biri abone olunca elle uğraşmadan listede belirir',
    ],
    en: [
      'feat: The supporters list now auto-updates from Patreon — the game pulls supporters live from a background service (synced daily). New patrons appear automatically, no manual edits',
    ],
    ru: [
      'feat: Список спонсоров теперь автоматически обновляется из Patreon — игра подтягивает спонсоров из фонового сервиса (синхронизация раз в день). Новые спонсоры появляются сами',
    ],
  },
  {
    v: '1.23.7',
    date: '2026-06-28',
    tr: [
      'feat: 💜 Destekçiler paneli (Ayarlar) — Patreon destekçileri oyun içinde tier\'e göre listelenir (Apex/Evolved/Spiderling). Şimdilik boş ("ilk sen ol"); destekçi geldikçe eklenir',
    ],
    en: [
      'feat: 💜 Supporters panel (Settings) — Patreon supporters are listed in-game by tier (Apex/Evolved/Spiderling). Empty for now ("be the first"); names are added as supporters join',
    ],
    ru: [
      'feat: 💜 Панель спонсоров (Настройки) — спонсоры Patreon показываются в игре по тиру (Apex/Evolved/Spiderling). Пока пусто; имена добавляются по мере появления',
    ],
  },
  {
    v: '1.23.6',
    date: '2026-06-28',
    tr: [
      'feat: 💜 Destek bölümü (Ayarlar) — Patreon\'da Destekle butonu (her sürümde) + GitHub sürümünde "✨ Desteklenen sürümü oyna" linki (reklamsız ayna → asıl sürüme yönlendirir)',
    ],
    en: [
      'feat: 💜 Support section (Settings) — a "Support on Patreon" button (both versions) + on the GitHub version a "✨ Play the supported version" link (ad-free mirror → points to the main build)',
    ],
    ru: [
      'feat: 💜 Раздел поддержки (Настройки) — кнопка «Поддержать на Patreon» (обе версии) + в GitHub-версии ссылка «✨ Играть в поддерживаемой версии» (зеркало без рекламы → ведёт на основную сборку)',
    ],
  },
  {
    v: '1.23.5',
    date: '2026-06-28',
    tr: [
      'balance: INT\'e geçen büyülere MP maliyeti eklendi — artık tüm büyüler aynı kademeli mantıkla MP harcar (hasara göre 12/22/38/60/90, seviye arttıkça azalır). Önceden bu 26 büyü "bedava" magic\'ti',
    ],
    en: [
      'balance: The reclassified INT spells now cost MP — every magic skill spends MP on the same tiered curve (12/22/38/60/90 by damage, scaling down with level). Those 26 spells were previously "free" magic',
    ],
    ru: [
      'balance: Переведённые на INT заклинания теперь стоят MP — все магические скилы тратят MP по одной ступенчатой шкале (12/22/38/60/90 по урону, снижается с уровнем). Раньше эти 26 заклинаний были «бесплатной» магией',
    ],
  },
  {
    v: '1.23.4',
    date: '2026-06-28',
    tr: [
      'fix (telif): Telif riski olan isimler özgün isimlerle değiştirildi — Raphael→Marvion, Rimuru Tempest→Azure Tempest, Demon Lord Rimuru→Azure Demon Lord, örümcek gizli formları (Zoa Ele/Ede Saine/Zana Horowa)→Voidweaver/Doomspinner/Fateweaver; "Kumoko" göndermesi kaldırıldı. Sadece görünen isimler değişti, mekanikler aynı',
    ],
    en: [
      'fix (copyright): Renamed copyright-risky names to original ones — Raphael→Marvion, Rimuru Tempest→Azure Tempest, Demon Lord Rimuru→Azure Demon Lord, spider secret forms (Zoa Ele/Ede Saine/Zana Horowa)→Voidweaver/Doomspinner/Fateweaver; removed the "Kumoko" reference. Display names only, mechanics unchanged',
    ],
    ru: [
      'fix (авторские права): Имена с риском авторских прав заменены на оригинальные — Raphael→Marvion, Rimuru Tempest→Azure Tempest, Demon Lord Rimuru→Azure Demon Lord, секретные формы паука (Zoa Ele/Ede Saine/Zana Horowa)→Voidweaver/Doomspinner/Fateweaver; убрана отсылка к «Кумоко». Изменены только отображаемые имена, механика без изменений',
    ],
  },
  {
    v: '1.23.3',
    date: '2026-06-28',
    tr: [
      'fix: İki büyü (magic) skill\'ini birleştirince sonuç da artık magic olur → INT\'ten ölçeklenir (önceden tüm füzyonlar active idi, hep STR\'den vuruyordu)',
      'balance: Skill türleri düzenlendi — su/ışık/karanlık/void/ruh/asit hasarı veren 23 skill artık doğru şekilde INT\'ten ölçeklenir (önceden yanlışlıkla STR\'den vuruyordu); fiziksel/delici/ısırık/kükreme STR\'de kalır',
    ],
    en: [
      'fix: Fusing two magic skills now yields a magic-kind result → it scales off INT (previously every fusion was active and scaled off STR)',
      'balance: Skill kinds cleaned up — 23 spell skills (water/light/dark/void/soul/acid) now correctly scale off INT instead of STR; physical/pierce/bite/roar stay STR',
    ],
    ru: [
      'fix: Слияние двух магических скилов теперь даёт магический результат → масштабируется от INT (раньше все слияния были active и шли от STR)',
      'balance: Виды скилов упорядочены — 23 заклинания (вода/свет/тьма/void/душа/кислота) теперь масштабируются от INT, а не STR; физические/колющие/укус/рёв остаются на STR',
    ],
  },
  {
    v: '1.23.2',
    date: '2026-06-28',
    tr: [
      'fix: Fusion skill\'leri yeniden yükleme sonrası equipped\'ten düşüyordu — açılışta fused skill\'ler content\'e kaydedilmeden önce equipped süzülüyordu (boot sırası). Artık kayıt önce yapılıyor; fusion skill\'lerin equipped kalır',
      'fix: Aynı-element füzyonları hep "Reinforced" adıyla çıkıyordu (birden çok aynı isimli skill) — artık her birine benzersiz isim verilir (▲ synergy tipi korunur)',
      'fix: Raphael füzyon önerileri aynı sonucu birden çok kombodan öneriyordu (ör. iki farklı kombo → envenom pierce) — artık öneriler efekte göre tekilleştirildi, hep farklı seçenekler',
      'qol: Otomatik Event Kararı\'nın INT ≥ 50 şartı artık renkli + mevcut INT ile gösteriliyor (yetersizse kırmızı)',
    ],
    en: [
      'fix: Fusion skills fell out of your equipped set after a reload — on load the equipped list was filtered before fused skills were registered (boot order). They\'re now registered first, so equipped fusions stick',
      'fix: Same-element fusions were all named "Reinforced" (multiple identically-named skills) — each now gets a unique name (still a ▲ synergy type)',
      'fix: Raphael fusion suggestions recommended the same result from multiple combos (e.g. two combos → envenom pierce) — suggestions are now deduped by effect, always distinct picks',
      'qol: The Auto Event Decision\'s INT ≥ 50 requirement is now color-coded and shows your current INT (red if too low)',
    ],
    ru: [
      'fix: Скилы слияния выпадали из набора экипировки после перезагрузки — при загрузке список фильтровался до регистрации слитых скилов (порядок инициализации). Теперь они регистрируются первыми и остаются экипированными',
      'fix: Слияния одной стихии все назывались «Reinforced» (несколько одноимённых скилов) — теперь у каждого уникальное имя (тип ▲ синергия сохраняется)',
      'fix: Подсказки слияния Рафаэля предлагали один результат из разных комбо (напр. два комбо → envenom pierce) — теперь подсказки дедуплицируются по эффекту, всегда разные варианты',
      'qol: Требование INT ≥ 50 для Авто-решения событий теперь выделено цветом и показывает текущий INT (красный, если мало)',
    ],
  },
  {
    v: '1.23.1',
    date: '2026-06-28',
    tr: [
      'fix: Otomatik Event Kararı artık SAVAŞ modunda da çalışıyor — önceden auto-çözüm yalnızca dinlenme modunda tetikleniyordu, bu yüzden savaşırken (AFK dahil) çıkan moral-olmayan olaylar ve boss bilmeceleri otomatik seçilmiyordu. Artık event hangi modda çıkarsa çıksın (auto açık + INT≥50) anında çözülür',
      'balance: EP mağazası stat puanı maliyeti artık her alımda ×2 yerine ×1.3 büyüyor (100, 130, 169, 220, 286...) — eski katlanma birkaç alımdan sonra patlayıp stat puanını alınamaz yapıyordu; artık kalıcı ama makul bir EP gideri',
    ],
    en: [
      'fix: Auto-Event Decision now works in COMBAT mode too — previously auto-resolve only fired while resting, so non-moral events and boss riddles raised during combat (incl. AFK) never auto-selected. Now an event auto-resolves no matter the mode (auto on + INT≥50)',
      'balance: EP shop stat-point cost now grows ×1.3 per purchase instead of ×2 (100, 130, 169, 220, 286...) — the old doubling exploded after a few buys and locked you out; now it stays a meaningful but affordable EP sink',
    ],
    ru: [
      'fix: Авто-решение событий теперь работает и в БОЮ — раньше оно срабатывало только во время отдыха, поэтому не-моральные события и загадки боссов во время боя (вкл. AFK) не выбирались автоматически. Теперь событие решается в любом режиме (авто вкл + INT≥50)',
      'balance: Стоимость очка характеристик в EP-магазине теперь растёт ×1.3 за покупку вместо ×2 (100, 130, 169, 220, 286...) — прежнее удвоение взрывалось после нескольких покупок; теперь это ощутимый, но доступный расход EP',
    ],
  },
  {
    v: '1.23.0',
    date: '2026-06-28',
    tr: [
      'feat: 📖 HİKAYE MODU (yeni!) — normal oyundan ayrı, kendi kaydı olan bir kampanya. Truck-kun açılışı (insan ölür → başka bir dünyada canavar olarak doğar) + "son düşüncen neydi?" seçimi başlangıç ırkını belirler (örümcek/slime/wyrmling). El-yapımı bölüm (özel düşman alanı + boss) native anlatıyla gelir; boss\'u yen → bölüm tamamlanır. Ayarlar\'dan ya da ırk-seçim ekranından girilir. (İlk bölüm: Orman\'da Uyanış — devamı yolda.)',
    ],
    en: [
      'feat: 📖 STORY MODE (new!) — a separate campaign with its own save. A truck-kun opening (a human dies → reborn as a monster in another world) + a "what was your last thought?" choice sets your starting race (spider/slime/wyrmling). A hand-authored chapter (custom enemy area + boss) with native narration; beat the boss → chapter complete. Enter from Settings or the race-select screen. (First chapter: Awakening in the Forest — more on the way.)',
    ],
    ru: [
      'feat: 📖 СЮЖЕТНЫЙ РЕЖИМ (новое!) — отдельная кампания с собственным сохранением. Вступление «грузовик-кун» (человек погибает → перерождается монстром в другом мире) + выбор «о чём была твоя последняя мысль?» задаёт стартовую расу (паук/слизь/вирмлинг). Авторская глава (особая зона врагов + босс) с родным повествованием; победи босса → глава пройдена. Вход из Настроек или экрана выбора расы. (Первая глава: Пробуждение в лесу — продолжение следует.)',
    ],
  },
  {
    v: '1.22.0',
    date: '2026-06-28',
    tr: [
      'feat: Irk Lore Ustalığı — bir ırkın 6 lore kitabının HEPSİNİ bulup okursan o ırka özel kalıcı bir pasif açılır (örümcek: Ağ Sezgisi, slime: Sınırsız Beden, insan: Uyarlanan Zihin, iskelet: Çürümez Kemik, wyrmling: Ejder Kanı, golem: Taş Beden). "Bilgi = Hayatta Kalma Gücü" — tüm hikâyeyi bilmenin ödülü. Rebirth\'te kalır, açılışta ekran-ortası kutlama',
    ],
    en: [
      'feat: Racial Lore Mastery — find and read ALL 6 of a race\'s lore books to unlock a permanent race-specific passive (spider: Web Sense, slime: Boundless Body, human: Adaptive Mind, skeleton: Undying Bone, wyrmling: Dragon Blood, golem: Stone Body). "Knowledge = Survival Power" — your reward for knowing the whole story. Survives rebirth, with a centred celebration on unlock',
    ],
    ru: [
      'feat: Расовое мастерство знаний — найди и прочти ВСЕ 6 книг лора расы, чтобы открыть постоянный расовый пассив (паук: Чутьё паутины, слизь: Безграничное тело, человек: Адаптивный разум, скелет: Нетленная кость, вирмлинг: Кровь дракона, голем: Каменное тело). «Знание = сила выживания» — награда за знание всей истории. Сохраняется при перерождении, с празднованием по центру экрана',
    ],
  },
  {
    v: '1.21.1',
    date: '2026-06-28',
    tr: [
      'feat: Çok daha fazla native lore — her ırka özel 6 kitaplık saga (örümcek/slime/insan/iskelet/wyrmling/golem) + 4 genel = 40 lore, 3 dilde native. Irk lore\'u yalnızca o ırkı oynarken bulunur (kendi hikâyeni keşfedersin)',
      'feat: Daha fazla bilmece — bilmece havuzu 5\'ten 10\'a çıktı (ölüm/anahtar/günah/korku/kan...), 3 dilde özgün',
    ],
    en: [
      'feat: Much more native lore — a 6-book saga for each race (spider/slime/human/skeleton/wyrmling/golem) + 4 generic = 40 lore, native in 3 languages. Race lore only appears while you play that race (discover your own story)',
      'feat: More riddles — the riddle pool grew from 5 to 10 (death/key/sin/fear/blood...), native in 3 languages',
    ],
    ru: [
      'feat: Гораздо больше родного лора — сага из 6 книг для каждой расы (паук/слизь/человек/скелет/вирмлинг/голем) + 4 общих = 40 знаний, на 3 языках. Расовый лор находится только при игре за эту расу',
      'feat: Больше загадок — пул загадок вырос с 5 до 10, на 3 языках',
    ],
  },
  {
    v: '1.21.0',
    date: '2026-06-28',
    tr: [
      'feat: Dile-ÖZEL native bilmeceler — bilmeceler artık çeviri değil, her dile özgü yazılıyor (wordplay korunur). Boss odalarında rastgele native bilmece çıkar; doğru cevap → boss\'u atla/ödül. data/riddles/<dil>.json',
      'feat: Dile-özel native lore — kitaplar artık çevrilmiyor, her dil kendi lore metnini okur (data/lore/<dil>.json). Search ile bulunur, INT ile derin katman açılır',
      'feat: Lore-kapılı bilmeceler — bazı bilmeceler bir lore gerektirir; o lore bulunmadan bilmece kilitli kalır ("önce şu lore\'u bul") — yine de boss\'la savaşabilir ya da INT≥100 ile geçebilirsin',
    ],
    en: [
      'feat: Language-NATIVE riddles — riddles are no longer translated; each language is written on its own so wordplay survives. Boss rooms now show a random native riddle; a correct answer skips the boss / rewards. data/riddles/<lang>.json',
      'feat: Language-native lore — books are no longer translated; each language reads its own lore text (data/lore/<lang>.json). Found via search, deep layer unlocked by INT',
      'feat: Lore-gated riddles — some riddles require a lore; until you find it the riddle stays locked ("find this lore first") — you can still fight the boss or pass with INT≥100',
    ],
    ru: [
      'feat: Загадки НА РОДНОМ языке — загадки больше не переводятся; каждый язык пишется отдельно (игра слов сохраняется). В комнатах боссов появляется случайная родная загадка',
      'feat: Знания на родном языке — книги больше не переводятся; каждый язык читает свой текст (data/lore/<язык>.json)',
      'feat: Загадки с гейтом знаний — некоторым загадкам нужно знание; пока не найдёшь — загадка заблокирована (можно сразиться с боссом или пройти при INT≥100)',
    ],
  },
  {
    v: '1.20.5',
    date: '2026-06-28',
    tr: [
      'fix: Boss bilmecesi otomatik çözülmüyordu — oto-olay kararı yalnızca normal olaylarda çalışıyordu, bilmece ayrı bir durum (state.bossRiddle) olduğu için INT yüksek olsa bile tetiklenmiyordu. Artık oto-olay açık + INT≥100 + "çöz" modunda boss bilmecesi otomatik geçilir',
      'feat: "🧠 INT ile geç" butonu — oto kapalıyken bile INT≥100 ise bilmeceyi düşünmeden çözüp geçebilirsin (INT yetmezse gereken değer gösterilir)',
    ],
    en: [
      'fix: Boss riddles never auto-solved — the auto-event decision only ran for normal events, but a riddle is a separate state (state.bossRiddle), so it never fired even with high INT. Now with auto-events on + INT≥100 + "solve" mode, boss riddles auto-pass',
      'feat: "🧠 Solve with INT" button — even with auto off, INT≥100 lets you crack the riddle instantly and pass (shows the requirement if your INT is too low)',
    ],
    ru: [
      'fix: Загадки боссов не решались автоматически — авто-решение событий работало только для обычных событий, а загадка — отдельное состояние, поэтому не срабатывало даже при высоком INT. Теперь при авто-событиях + INT≥100 + режим «решать» загадки проходятся авто',
      'feat: Кнопка «🧠 Решить через INT» — даже при выключенном авто, INT≥100 мгновенно разгадывает загадку',
    ],
  },
  {
    v: '1.20.4',
    date: '2026-06-28',
    tr: [
      'fix: Otomatik yemek arama artık bulduğu yiyeceğe otomatik karar veriyor — güvenli/hafif riskli olanı yer, toksik/ölümcül olanı bırakır. Eskiden auto modda bile Ye/Bırak ekranı çıkıp bekliyordu',
    ],
    en: [
      'fix: Auto-forage now auto-decides on the food it finds — eats safe/minor items, discards toxic/lethal ones. Previously it still popped the Eat/Discard prompt and waited even in auto mode',
    ],
    ru: [
      'fix: Авто-добыча еды теперь сама решает по найденной еде — ест безопасную/слегка рискованную, выбрасывает токсичную/смертельную. Раньше даже в авто-режиме появлялось окно «Съесть/Выбросить»',
    ],
  },
  {
    v: '1.20.3',
    date: '2026-06-28',
    tr: [
      'fix: Otomatik keşif (auto-explore) ve otomatik yemek arama artık SAVAŞTA da çalışıyor — eskiden sadece dinlenme modunda tetikleniyordu, bu yüzden savaşırken açık olmasına rağmen hiç lore/parça bulmuyordu. (SP korumalı, oda başına bir arama)',
    ],
    en: [
      'fix: Auto-explore and auto-forage now also run DURING combat — they previously only fired while resting, so they found no lore/fragments while you fought. (SP-gated, one search per room)',
    ],
    ru: [
      'fix: Авто-исследование и авто-добыча еды теперь работают и В БОЮ — раньше срабатывали только в режиме отдыха, поэтому не находили лор/фрагменты во время боя. (с учётом SP, один поиск на комнату)',
    ],
  },
  {
    v: '1.20.2',
    date: '2026-06-28',
    tr: [
      'balance: Günah dengesi — yamyamlık/Predator bir skil yutunca +2 günah (her ırka tematik günah musluğu); Taboo rank başına gereken günah 300→200 (Taboo Authority 600→400); 7 ölümcül günah eşiği ~%20 düşürüldü (pride 50→40 … lust 950→760). Karanlık/günah yolu artık ulaşılabilir',
    ],
    en: [
      'balance: Sin rebalance — devouring a skill (cannibalism/Predator) now grants +2 sin (a sin tap for every race); Taboo now rises every 200 sin instead of 300 (Taboo Authority 600→400); the 7 deadly-sin thresholds lowered ~20% (pride 50→40 … lust 950→760). The dark/sin path is now reachable',
    ],
    ru: [
      'balance: Баланс греха — поглощение навыка (каннибализм/Хищник) теперь даёт +2 греха; Табу растёт каждые 200 греха вместо 300 (Власть Табу 600→400); 7 порогов смертных грехов снижены ~20% (гордыня 50→40 … похоть 950→760)',
    ],
  },
  {
    v: '1.20.1',
    date: '2026-06-27',
    tr: [
      'feat: Loadout (skill seti) preset\'leri — Skiller sekmesinde 3 set slotu: 💾 mevcut equipped\'i kaydet, 📥 kaydedilen seti yükle (sahip olduğun + slot kapasitesine göre). Build değiştirme QoL',
    ],
    en: [
      'feat: Loadout presets — 3 build slots in the Skills tab: 💾 save your current equipped set, 📥 load a saved one (filtered to owned skills + slot capacity). Build-swapping QoL',
    ],
    ru: [
      'feat: Наборы экипировки — 3 слота во вкладке «Навыки»: 💾 сохранить текущий набор, 📥 загрузить сохранённый (с учётом владения и лимита слотов)',
    ],
  },
  {
    v: '1.20.0',
    date: '2026-06-27',
    tr: [
      'feat: Görevler — 3 aktif tekrarlanan görev slotu (Statlar sekmesinde, ilerleme barlı). Biri bitince ödül (EP/stat puanı) + toast + havuzdan yeni görev gelir. Başarımlardan farklı: tekrarlanan ödül döngüsü. Data-driven (quests.json), 6 görev tipi',
    ],
    en: [
      'feat: Quests — 3 active repeatable quest slots (Stats tab, with progress bars). Completing one grants a reward (EP/stat point) + toast, then a fresh quest rolls in. Unlike achievements: a repeatable reward loop. Data-driven (quests.json), 6 quest types',
    ],
    ru: [
      'feat: Задания — 3 активных повторяемых слота (вкладка «Статы», с полосами прогресса). Выполнение даёт награду (EP/очко статов) + уведомление, затем выпадает новое задание. Повторяемый цикл наград. Data-driven, 6 типов',
    ],
  },
  {
    v: '1.19.1',
    date: '2026-06-27',
    tr: [
      'feat: Ahlaki seçim anları — 3 yeni karşılaşma (yaralı av / teslim olan düşman / savunmasız yuva): Bağışla → +erdem (saf, maddi ödül yok) ya da Ye → +günah + yiyecek/EP. Ruler eksenini gerçek bir karara çevirir',
      'feat: Ahlak otomasyonu — Ayarlar\'da "Ahlaki Karşılaşmalar": Sor / Hep Bağışla / Hep Ye. Otomatik seçilirse moral olaylar duraklatmadan çözülür (AFK\'de oyun kilitlenmez)',
    ],
    en: [
      'feat: Moral choice moments — 3 new encounters (wounded prey / surrendering foe / defenseless nest): Spare → +virtue (pure, no material gain) or Devour → +sin + food/EP. Turns the ruler axis into a real choice',
      'feat: Moral automation — Settings "Moral Encounters": Ask / Always Spare / Always Devour. Auto modes resolve moral events without pausing (AFK play never locks)',
    ],
    ru: [
      'feat: Моральные моменты — 3 новые встречи (раненая добыча / сдавшийся враг / беззащитное гнездо): пощадить → +добродетель (без выгоды) или пожрать → +грех + еда/EP',
      'feat: Авто-мораль — в настройках «Моральные встречи»: Спрашивать / Всегда щадить / Всегда пожирать. Авто-режимы решают события без паузы (AFK не зависнет)',
    ],
  },
  {
    v: '1.19.0',
    date: '2026-06-27',
    tr: [
      'feat: Önsezi — yüksek WIS ile sonraki odayı önceden gör (savaş sekmesinde). WIS≥30: tehlike + olay var/yok ipucu; WIS≥60: kesin modifier + hazard + olay türü; WIS≥100: + düşman havuzu. "Bilgi = Hayatta Kalma"',
    ],
    en: [
      'feat: Precognition — high WIS previews the next room (in the combat tab). WIS≥30: danger + whether an event waits; WIS≥60: exact modifier + hazard + event type; WIS≥100: + the enemy pool. "Knowledge = Survival"',
    ],
    ru: [
      'feat: Предвидение — высокий WIS показывает следующую комнату (во вкладке боя). WIS≥30: опасность + есть ли событие; WIS≥60: точный модификатор + опасность + тип события; WIS≥100: + пул врагов',
    ],
  },
  {
    v: '1.18.5',
    date: '2026-06-27',
    tr: [
      'ux: Başarımlar paneli artık katlanabilir (başlığa tıkla) — varsayılan kapalı, Statlar sekmesi gereksiz uzamıyor',
    ],
    en: [
      'ux: The achievements panel is now collapsible (click the header) — collapsed by default so the Stats tab no longer scrolls forever',
    ],
    ru: [
      'ux: Панель достижений теперь сворачивается (клик по заголовку) — по умолчанию свёрнута, вкладка «Статы» больше не растягивается',
    ],
  },
  {
    v: '1.18.4',
    date: '2026-06-27',
    tr: [
      'feat: Yamyamlık → skill öğrenme — kendi ırkından bir düşmanı (kin) ~100 öldürdükten sonra her kin öldürmede %8 şansla o düşmanın sahip olmadığın bir skilini öğrenirsin (kin öldürmek günah → güç için karanlık tradeoff)',
      'feat: Slime Predator — slime HERHANGI bir düşmanı öldürünce %5 şansla anında bir skil yutar (eşik yok, imza yeteneği)',
      'feat: Slime Absorb — slime her öldürmede düşmanın element(ler)ini direnç olarak emer + maks HP %4 iyileşir + %2 şansla kalıcı +1 VIT (tier başına 2 ile sınırlı)',
    ],
    en: [
      'feat: Cannibalism → skill learning — after devouring the same kin (your own race) ~100 times, each further kin kill has an 8% chance to teach you one of its skills you don\'t own (killing kin is a sin → a dark trade for power)',
      'feat: Slime Predator — a slime devouring ANY foe has a 5% chance to instantly absorb one of its skills (no threshold, the slime signature)',
      'feat: Slime Absorb — on every kill a slime soaks the foe\'s element(s) as resistance + heals 4% max HP + a 2% chance of permanent +1 VIT (capped per tier)',
    ],
    ru: [
      'feat: Каннибализм → изучение навыков — поглотив одного и того же сородича ~100 раз, при каждом следующем убийстве сородича есть 8% шанс выучить его навык (убийство сородича — грех)',
      'feat: Хищник слизи — слизь при убийстве ЛЮБОГО врага с шансом 5% мгновенно поглощает один его навык (без порога)',
      'feat: Поглощение слизи — при каждом убийстве слизь впитывает элемент(ы) врага как сопротивление + лечит 4% макс HP + 2% шанс постоянного +1 VIT (с лимитом по тиру)',
    ],
  },
  {
    v: '1.18.3',
    date: '2026-06-27',
    tr: [
      'feat: Elit düşmanlar — her normal düşmanın ~%5 (LUCK ile artar, max %20) şansla elit varyantı çıkar: HP ×2.2, ATK ×1.5 ama EP/XP ×3 + doygunluk ×1.5. Altın çerçeve + ⭐ ELİT rozeti + belirince toast. Risk/ödül sürprizi',
    ],
    en: [
      'feat: Elite enemies — every normal foe has a ~5% chance (rises with LUCK, max 20%) to spawn as an elite: ×2.2 HP, ×1.5 ATK but ×3 EP/XP and ×1.5 satiety. Gold frame + ⭐ ELITE badge + a toast on spawn. A risk/reward surprise',
    ],
    ru: [
      'feat: Элитные враги — у каждого обычного врага ~5% шанс (растёт с LUCK, макс 20%) появиться элитным: ×2.2 HP, ×1.5 ATK, но ×3 EP/XP и ×1.5 сытость. Золотая рамка + значок ⭐ ЭЛИТА + уведомление',
    ],
  },
  {
    v: '1.18.2',
    date: '2026-06-27',
    tr: [
      'feat: Başarım açılınca ekranın ortasında evrimdeki gibi büyük kutlama gösterimi (altın tonlu ışık patlaması + ikon + ad) — toast\'a ek olarak',
    ],
    en: [
      'feat: Unlocking an achievement now plays a big centred celebration like evolution does (gold-tinted light burst + icon + name) — in addition to the toast',
    ],
    ru: [
      'feat: При получении достижения теперь по центру экрана появляется крупная анимация, как при эволюции (золотистая вспышка + иконка + название) — вдобавок к уведомлению',
    ],
  },
  {
    v: '1.18.1',
    date: '2026-06-27',
    tr: [
      'feat: Irk başarımları — her 6 ırk için 3 kademe: o ırkı oyna (+25 EP), o ırkla kapı bekçisini yen (+1 stat puanı), o ırkın evrim ağacını tamamla / uç forma ulaş (+1 ruh). Toplam 18 yeni başarım (genel toplam 32). Her ırkı keşfetmeye + tamamlamaya teşvik',
    ],
    en: [
      'feat: Race achievements — 3 tiers for each of the 6 races: play as it (+25 EP), beat the gatekeeper as it (+1 stat point), complete its evolution tree / reach a terminal form (+1 soul). 18 new achievements (32 total). Rewards exploring and mastering every race',
    ],
    ru: [
      'feat: Расовые достижения — 3 ступени для каждой из 6 рас: сыграть за неё (+25 EP), победить привратника за неё (+1 очко статов), завершить её древо эволюции (+1 душа). 18 новых достижений (всего 32)',
    ],
  },
  {
    v: '1.18.0',
    date: '2026-06-27',
    tr: [
      'feat: Başarımlar — 14 kilometre taşı (ilk evrim, 100/1000 öldürme, ilk füzyon, dal değiştir, kapı bekçisi, cehennem, rebirth, T10, 25 tür, Katman 3, 1 saat, ilk ölüm...). Açılınca toast + kalıcı ödül (küçük=+50 EP, kilometre taşı=+1 stat puanı, nadir=+1 ruh). Statlar sekmesinde ilerlemeli liste. Data-driven (achievements.json), 3 dil',
    ],
    en: [
      'feat: Achievements — 14 milestones (first evolution, 100/1000 kills, first fusion, branch switch, gatekeeper, hell, rebirth, T10, 25 types, Layer 3, 1 hour, first death...). Unlocking pops a toast + a permanent reward (minor=+50 EP, milestone=+1 stat point, rare=+1 soul). Progress list in the Stats tab. Data-driven (achievements.json), 3 languages',
    ],
    ru: [
      'feat: Достижения — 14 вех (первая эволюция, 100/1000 убийств, первое слияние, смена ветки, привратник, ад, перерождение, T10, 25 типов, слой 3, 1 час, первая смерть...). Открытие даёт всплывающее уведомление + постоянную награду (малое=+50 EP, веха=+1 очко статов, редкое=+1 душа). Список с прогрессом во вкладке Статы. Data-driven, 3 языка',
    ],
  },
  {
    v: '1.17.4',
    date: '2026-06-27',
    tr: [
      'feat: Dalı Değiştir — yüksek EP (2500 × tier) ödeyerek geçmişte seçmediğin bir kardeş dala geçebilirsin (Statlar → evrim ağacı → kaçırılmış düğüm → "Dalı Değiştir"). Tier\'ın, dağıttığın statlar, füzyon/öğrenilen skiller ve meta korunur; sadece terk edilen dalın evrim stat+skill\'leri gider. Rebirth\'ten hafif bir yeniden-yönlendirme — pahalı ama dalı sıfırdan grind\'lemeden değiştirirsin',
    ],
    en: [
      'feat: Switch Branch — pay a steep EP fee (2500 × tier) to re-route into an unchosen sibling branch from your past (Stats → evolution tree → a missed node → "Switch Branch"). Your tier, allocated stats, fusions/learned skills and meta are kept; only the abandoned branch\'s evolution stats + skills are lost. A lighter re-route than rebirth — expensive, but switches branches without re-grinding from scratch',
    ],
    ru: [
      'feat: Смена ветки — заплатив крупную сумму EP (2500 × тир), можно перейти на невыбранную родственную ветку из прошлого (Статы → древо эволюции → пропущенный узел → «Сменить ветку»). Тир, распределённые статы, слияния/изученные навыки и мета сохраняются; теряются только эволюционные статы и навыки покинутой ветки. Более лёгкий перенаправление, чем перерождение',
    ],
  },
  {
    v: '1.17.3',
    date: '2026-06-27',
    tr: [
      'feat: Evrim seçim kontrolü — kademeli bir düğümde (ör. slime/spider gizli formları) artık ilk dal açılınca savaş panelinde bir banner çıkar: o formu hemen seç ya da "Büyümeye Devam Et" ile üst kardeşleri (ve gizli ✦ formları) aç. Demon Slime/Zoa Ele gibi gizli kısa-yollar T5\'te erken yakalanabilir VEYA T10 uç-formları için büyümeye devam edilebilir',
    ],
    en: [
      'feat: Evolution choice control — at a staggered node (e.g. slime/spider hidden forms) a banner now appears in combat once the first branch unlocks: evolve into it now, or "Keep Growing" to open the higher-tier siblings (and hidden ✦ forms). Secret shortcuts like Demon Slime/Zoa Ele can be caught early at T5 OR you can keep growing toward the T10 apex forms',
    ],
    ru: [
      'feat: Управление выбором эволюции — в ступенчатом узле (напр. скрытые формы слизи/паука) теперь при открытии первой ветки в бою появляется баннер: эволюционировать сейчас или «Продолжить рост», чтобы открыть старшие ветки (и скрытые ✦ формы). Секретные сокращения вроде Demon Slime/Zoa Ele можно поймать рано на T5 ИЛИ продолжить рост к вершинным формам T10',
    ],
  },
  {
    v: '1.17.2',
    date: '2026-06-27',
    tr: [
      'fix: Evrim tier kilitlenmesi — kademeli kardeş formlar (ör. slime acid T3 / crystalline T4 / demon_slime T5) en düşük dal açılınca tier yükselmesini durduruyordu; artık oyun o düğümdeki TÜM dallar açılana kadar tier yükseltir, böylece tüm seçenekler görünür (slime + spider, 7 düğüm). Takılı kayıtlar kendiliğinden ilerlemeye devam eder',
    ],
    en: [
      'fix: Evolution tier lockout — staggered sibling forms (e.g. slime acid T3 / crystalline T4 / demon_slime T5) halted tier growth as soon as the cheapest branch unlocked; the game now climbs until EVERY branch at that node is open, so all options appear (slime + spider, 7 nodes). Stuck saves resume progressing on their own',
    ],
    ru: [
      'fix: Блокировка тира эволюции — ступенчатые родственные формы (напр. слизь acid T3 / crystalline T4 / demon_slime T5) останавливали рост тира, как только открывалась самая дешёвая ветка; теперь игра поднимает тир, пока не откроются ВСЕ ветки узла, и видны все варианты (слизь + паук, 7 узлов). Застрявшие сохранения продолжают прогресс сами',
    ],
  },
  {
    v: '1.17.1',
    date: '2026-06-25',
    tr: [
      'fix: Eski kayıtlarda ırk zaten seçilmişken yeniden ırk seçim ekranına düşme sorunu giderildi (raceConfirmed migration)',
      'fix: Dinlen/Meditasyon modunda oyun donmuş gibi hissettiriyordu — arama butonu çalışmıyor, açlık düşmüyordu; her ikisi de düzeltildi',
      'fix: Dinlen/Meditasyon panelinde canlı HP/SP/MP barları eklendi; tüm sekmeler artık her saniye güncelleniyor',
    ],
    en: [
      'fix: Old saves with a race already selected no longer land on the race selection screen (raceConfirmed migration)',
      'fix: Rest/Meditate felt frozen — search button and hunger drain both fixed',
      'fix: Live HP/SP/MP bars added to rest/meditate panel; all tabs now refresh every tick during rest or meditation',
    ],
    ru: [
      'fix: Старые сохранения с выбранной расой больше не попадают на экран выбора расы',
      'fix: Режим отдыха/медитации ощущался замороженным — исправлены кнопка поиска и расход голода',
      'fix: В панели отдыха добавлены живые полосы HP/SP/MP; все вкладки теперь обновляются каждую секунду',
    ],
  },
  {
    v: '1.17.0',
    date: '2026-06-25',
    tr: [
      'feat: Save migration — yeni save şeması; eski kayıtlar yeni alanlarla birleşir, eksik alanlar sıfırlanmaz',
      'feat: Status reaksiyonları — 2. status eklenince patlama: Toksik Alev (zehir+ateş), Dondurulmuş Devre (buz+yıldırım), Buhar Patlaması (ateş+buz sersemlik), Aşındırıcı Yanık (asit+ateş)',
      'feat: Oda modifier çeşitliliği — her oda bağımsız hash ile modifiye edilir; katman havuzları: L1 Zehir Bulutu/Kök Ağı, L2 Kor Yağmuru/Kavurucu Hava, L3 Ağır Yer Çekimi/Yankı Odası, L4 Ruh Çekilmesi/Yokluk Baskısı; ayarlardan modifiyersiz şans açılabilir (%10 + LUCK×0.5%)',
      'feat: Taboo rank ağacı — Rank 1 +5 INT, Rank 2 Forbidden Knowledge, Rank 3 +5 STR/AGI, Rank 4 oto-appraise, Rank 5 +10 INT/WIS +5 tüm direnç',
      'feat: Gluttony (Oburluk) — dolu iken ye → %1 (%10 Taboo varsa) Gluttony açma şansı; aktifken: dolu=%15 hasar/%20 regen/%15 ganimet, aç=−%20 hasar/−%15 kaçınma',
      'balance: Kin kill günah 1→3, boss kin 5→15; dolu yeme 2 günah (Taboo varsa 10)',
    ],
    en: [
      'feat: Save migration — new save schema merges with newGame() defaults; missing fields recover automatically',
      'feat: Status reactions — second status triggers instant burst: Toxic Blaze (poison+fire), Frozen Circuit (frost+lightning), Steam Burst (fire+frost stun), Corrosive Burn (acid+fire)',
      'feat: Per-room modifiers — each room independently randomised via hash; layer pools: L1 Toxin Cloud/Root Web, L2 Ember Rain/Scorched Air, L3 Heavy Gravity/Echo Chamber, L4 Soul Ebb/Void Pressure; modifier-free room chance toggle in settings (10% + LUCK×0.5%)',
      'feat: Taboo rank tree — Rank 1 +5 INT, Rank 2 Forbidden Knowledge, Rank 3 +5 STR/AGI, Rank 4 auto-appraise, Rank 5 +10 INT/WIS +5 all resistances',
      'feat: Gluttony — eat while full → 1% (10% if Taboo) to awaken; active: full=+15% dmg/+20% regen/+15% loot, hungry=−20% dmg/−15% dodge',
      'balance: Kin kill sin 1→3, boss kin 5→15; eating while full 2 sin (10 if Taboo active)',
    ],
  },
  {
    v: '1.16.0',
    date: '2026-06-25',
    tr: [
      'feat: Rebirth scaling — her rebirth düşmanları %10 güçlendirir, tüm kazançları (EP/XP/soul) %10 artırır',
      'feat: Soul Tree revize — mevcut upgrade\'lerin sınırları artırıldı (predator×50, wisdom×100, soul_luck×50, extra_slot×3…), costMult\'lar yüksek cap için ayarlandı',
      'feat: Yeni soul upgrade: Oto Arama (🔍) — Lv1 oto-yemek, Lv2 oto-keşif; 100 arama sayacı gerekmez (25✦/3.0× maliyet)',
      'feat: Yeni soul upgrade: Hızlı İlerleyiş (⚡) — her seviye oda kill kotasını 1 düşürür (10→1 min, 25✦/2.5× maliyet)',
    ],
    en: [
      'feat: Rebirth scaling — each rebirth makes enemies 10% harder and increases all gains (EP/XP/soul) by 10%',
      'feat: Soul Tree revised — higher caps on existing upgrades (predator×50, wisdom×100, soul_luck×50, extra_slot×3…), costMults tuned for high caps',
      'feat: New soul upgrade: Auto Search (🔍) — Lv1 auto-forage, Lv2 auto-explore; bypasses 100-search requirement (25✦/3.0× cost)',
      'feat: New soul upgrade: Swift Advance (⚡) — each level lowers room kill quota by 1 (10→1 min, 25✦/2.5× cost)',
    ],
    ru: [
      'feat: Масштабирование перерождений — каждое перерождение +10% сложности врагов и +10% ко всем наградам',
      'feat: Древо Душ пересмотрено — увеличены лимиты апгрейдов, costMult подобран для высоких уровней',
      'feat: Новый апгрейд: Авто-поиск (🔍) — Ур.1 авто-еда, Ур.2 авто-исследование (25✦/3.0× стоимость)',
      'feat: Новый апгрейд: Быстрый Прорыв (⚡) — каждый уровень снижает квоту убийств в комнате на 1 (25✦/2.5× стоимость)',
    ],
  },
  {
    v: '1.15.1',
    date: '2026-06-25',
    tr: [
      'fix: skill evrim sonrası equipped slot eski ID\'yi tutuyordu — savaşta saldırı yapılamıyordu (critical)',
      'feat: İstatistik paneli — Stat sekmesine oynama süresi, en derin konum, rebirth/keşif/düşman istatistikleri eklendi',
    ],
    en: [
      'fix: equipped skill slot retained old ID after evolution — attacks stopped firing (critical)',
      'feat: Statistics panel — play time, deepest position, rebirths/discoveries/enemy types in Stats tab',
    ],
    ru: [
      'fix: слот экипированного скилла сохранял старый ID после эволюции — атаки переставали срабатывать (critical)',
      'feat: Панель статистики — время игры, наибольшая глубина, перерождения/открытия/типы врагов',
    ],
  },
  {
    v: '1.15.0',
    date: '2026-06-25',
    tr: [
      'feat: EP Mağazası — Stat sekmesinde EP harcama sistemi eklendi',
      'feat: EP → Stat puanı satın alma (100 EP, her alımda 2 katına çıkar, rebirth\'te sıfırlanır)',
      'feat: Geçici bufflar — Yarı Açlık (100 EP/1 saat), XP Patlaması (150 EP/30 dk), Rejenerasyon (80 EP/30 dk)',
      'feat: Skill XP enjeksiyonu — skill kartı açıkken EP ile bir seviye atlat (rank\'a göre maliyet)',
      'fix: larder dolu + açlık 0 iken satiety boşa gidiyordu — taşan kısım %50 EP\'ye dönüşüyor',
      'fix: yeni düşman spawn\'ında hasar streak sıfırlanıyor (artık yeni düşman önceki saldırılardan adaptasyon almıyor)',
      'fix: combat\'ta MP regen ondalıklı birikim düzeltildi',
    ],
    en: [
      'feat: EP Shop — new EP spending system in the Stats tab',
      'feat: EP → stat point purchase (100 EP base, cost doubles each buy, resets on rebirth)',
      'feat: temporary buffs — Half Hunger (100 EP/1 h), XP Rush (150 EP/30 min), Regen Surge (80 EP/30 min)',
      'feat: skill XP injection — spend EP to level up a skill once (cost scales with rank)',
      'fix: satiety wasted when larder full and hunger at 0 — overflow now converts to EP at 50%',
      'fix: dmgStreak now resets on enemy spawn (new enemy no longer penalised for hits on previous foes)',
      'fix: combat MP regen floating-point accumulation fixed',
    ],
    ru: [
      'feat: Магазин EP — новая система трат EP во вкладке Статы',
      'feat: EP → покупка очка статы (100 EP базово, цена удваивается, сбрасывается при возрождении)',
      'feat: временные баффы — Полуголод (100 EP/1 ч), XP-бафф (150 EP/30 мин), Реген (80 EP/30 мин)',
      'feat: влить XP в навык — потратить EP для мгновенного повышения уровня (стоимость зависит от ранга)',
      'fix: насыщенность больше не теряется при полном ларе и нулевом голоде — избыток конвертируется в EP',
      'fix: серия урона сбрасывается при спауне нового врага',
      'fix: исправлено накопление дробных значений MP в бою',
    ],
  },
  {
    v: '1.14.0',
    date: '2026-06-25',
    tr: [
      'fix: evrim T10 sistemi — her terminal form artık T10 gerektiriyor; tier bekleme otomatik ilerler',
      'fix: Lv10 terminal formda ilerleme duruyordu — tierReq kapısı eklendi, tier advance döngüsü çalışıyor',
      'feat: evrim ağacında tier gereksinimi göstergesi — kilitli formlarda "Gerekli: T{n}" ifadesi',
      'feat: tier advance log mesajı — yeni tier bildirim metni eklendi (TR/EN/RU)',
    ],
    en: [
      'fix: T10 evolution system — every terminal form now requires T10; tier gap auto-advances without player input',
      'fix: progression stuck at Lv10 terminal form — tierReq gate added, auto tier-advance loop implemented',
      'feat: evolution tree shows tier requirement on locked forms',
      'feat: tier advance log notification added (TR/EN/RU)',
    ],
    ru: [
      'fix: система эволюции T10 — каждая терминальная форма теперь требует T10; тир авансирует автоматически',
      'fix: прогресс застревал на Lv10 терминальной форме — добавлен barrer tierReq, реализован авто-advance',
      'feat: дерево эволюций показывает требование тира на заблокированных формах',
      'feat: добавлено уведомление о повышении тира (TR/EN/RU)',
    ],
  },
  {
    v: '1.13.0',
    date: '2026-06-24',
    tr: [
      'feat: 14 direnç zinciri (T1→T5 evrim) — ateş, buz, yıldırım, rüzgar, toprak, karanlık, ışık, asit, fiziksel, delici, zehir, felç, korku, ruh',
      'feat: grup merger sistemi — Physical / Magic / Status Nullification (tüm T5\'ler tamamlanınca otomatik birleşir)',
      'feat: Ultimate Nullification — Lv10\'da %100 bağışıklık (nullifier düşmanlar hariç)',
      'feat: 4 yeni hasar/direnç tipi — rüzgar, toprak, karanlık, ışık',
      'feat: 7 yeni pasif zincir — Beş Duyu, Olasılık Düzeltme, Yıldırım Korku, Gece Görüşü, Ejderha Zırhı, Ölümsüzlük, Atletizm',
      'feat: otomatik T1 zincir açılışı — ilk kez o hasar tipinden hasar alınca',
    ],
    en: [
      'feat: 14 resistance chains (T1→T5 evolution) — fire, frost, lightning, wind, earth, darkness, light, acid, physical, pierce, poison, paralyze, fear, soul',
      'feat: group merger system — Physical / Magic / Status Nullification (auto-merges when all T5s complete)',
      'feat: Ultimate Nullification — Lv10 grants 100% immunity (nullifier enemies exempt)',
      'feat: 4 new damage/resistance types — wind, earth, darkness, light',
      'feat: 7 new passive chains — Five Senses, Probability Correction, Thunder Fear, Night Vision, Dragon Armor, Deathless, Athletics',
      'feat: auto T1 chain unlock — first damage of that type triggers opening',
    ],
    ru: [
      'feat: 14 цепочек сопротивлений (T1→T5 эволюция) — огонь, мороз, молния, ветер, земля, тьма, свет, кислота, физич., пронзание, яд, паралич, страх, душа',
      'feat: система слияния групп — Physical / Magic / Status Nullification (авто-слияние при завершении всех T5)',
      'feat: Ultimate Nullification — Lv10 даёт 100% иммунитет (враги-nullifier исключены)',
      'feat: 4 новых типа урона/сопротивления — ветер, земля, тьма, свет',
      'feat: 7 новых пассивных цепочек — Пять чувств, Коррекция вероятности, Страх грома, Ночное зрение, Броня дракона, Бессмертный, Атлетизм',
      'feat: авто-открытие T1 цепочки — первый урон этого типа инициирует открытие',
    ],
  },
  {
    v: '1.12.0',
    date: '2026-06-24',
    tr: [
      'Otomatik arama sistemi: 100 aramadan sonra açılır, SP harcar',
      'Forage ve Ara butonları otomatikleştirilebilir (rest sırasında çalışır)',
      'Manuel forage ve arama artık 25 SP harcar',
      'Otomatik event kararı: INT ≥ 50 ise karakter AFK\'da event seçer',
      'Bulmaca modu: atla (direkt savaş) veya otomatik çöz (INT ≥ 100)',
    ],
    en: [
      'Auto-search system: unlocks after 100 searches, costs SP',
      'Forage and Explore buttons can be automated (runs during rest)',
      'Manual forage and search now cost 25 SP',
      'Auto event decision: INT ≥ 50 picks best event choice while AFK',
      'Puzzle mode: skip (fight directly) or auto-solve (INT ≥ 100)',
    ],
    ru: [
      'Авто-поиск: открывается после 100 поисков, тратит SP',
      'Кнопки Поиск Еды и Исследование можно автоматизировать',
      'Ручной поиск теперь тратит 25 SP',
      'Авто-решение событий: INT ≥ 50 выбирает лучший вариант',
      'Режим загадок: пропустить или авто-решить (INT ≥ 100)',
    ],
  },
  {
    v: '1.11.0',
    date: '2026-06-24',
    tr: [
      'Tutorial sistemi: 8 adımlı sihirbaz, 10 hint bildirimi, Kılavuz sekmesi',
      'Race seçim ekranına ırk açıklaması paneli eklendi (güçlü/zayıf yön, gelişim yolu)',
      '? ikonları: her sekmeye ve topbar\'a Kılavuz navigasyonu',
      'Ayarlar\'dan tutorial sıfırlanabilir',
    ],
    en: [
      'Tutorial system: 8-step wizard, 10 hint toasts, Guide tab',
      'Race selection now shows race hint panel (strengths, weaknesses, growth path)',
      '? icons on tabs and topbar navigate to Guide sections',
      'Tutorial can be reopened from Settings',
    ],
    ru: [
      'Система туториала: мастер из 8 шагов, 10 подсказок, вкладка Руководство',
      'Экран выбора расы теперь показывает панель подсказок расы',
      'Иконки ? на вкладках и панели навигируют в Руководство',
      'Туториал можно снова открыть из Настроек',
    ],
  },
  {
    v: '1.10.1',
    date: '2026-06-24',
    tr: [
      'Düzeltme: evrim ağacındaki form durumları (Geçmiş/Mevcut/Kilitli…) İngilizce/Rusça\'da artık doğru çevriliyor',
    ],
    en: [
      'Fix: evolution tree form statuses (Past/Current/Locked…) now translate correctly in EN/RU',
    ],
    ru: [
      'Исправление: статусы форм в древе эволюции (Прошлая/Текущая/Заблокировано…) теперь корректно переводятся',
    ],
  },
  {
    v: '1.10.0',
    date: '2026-06-23',
    tr: [
      'Evrim formlarına görsel desteği: her formun kendi portresi olabilir (data/forms/<id>.png)',
      'Dinlenme/meditasyon ekranı artık MEVCUT FORMUN görselini gösteriyor — her evrimde değişir',
      'Görseli olmayan formlar ırk portresine düşer (sorunsuz)',
    ],
    en: [
      'Evolution forms now support art: each form can have its own portrait (data/forms/<id>.png)',
      'Rest/meditation screen shows the CURRENT FORM image — changes on every evolution',
      'Forms without art fall back to the race portrait (seamless)',
    ],
    ru: [
      'Формы эволюции теперь поддерживают арт: у каждой формы свой портрет (data/forms/<id>.png)',
      'Экран отдыха/медитации показывает изображение ТЕКУЩЕЙ ФОРМЫ — меняется при каждой эволюции',
      'Формы без арта используют портрет расы (бесшовно)',
    ],
  },
  {
    v: '1.9.9',
    date: '2026-06-23',
    tr: [
      'Pasif skiller artık açınca canlı bonus gösteriyor (örn. Raphael: 📘+%30 XP · ⚔+%15 · ✨%15)',
      'Düşman paneli sabit yükseklik: canavar ölünce/gelince arayüz artık zıplamıyor',
    ],
    en: [
      'Passive skills now show a live bonus readout when expanded (e.g. Raphael: 📘+30% XP · ⚔+15% · ✨15%)',
      'Enemy panel fixed height: UI no longer jumps when a foe dies/spawns',
    ],
    ru: [
      'Пассивные навыки теперь показывают текущий бонус при раскрытии (напр. Рафаэль: 📘+30% опыта · ⚔+15% · ✨15%)',
      'Фиксированная высота панели врага: интерфейс больше не прыгает при смерти/появлении врага',
    ],
  },
  {
    v: '1.9.8',
    date: '2026-06-23',
    tr: [
      'Düzeltme: Rimuru formlarında çift Raphael/Beelzebuth skili (aynı yetenek 2 kez listede)',
      'Skill verme artık tüm soy zincirini kontrol ediyor (ata + torun) — kopya üretmiyor',
      'Rimuru formları benzersiz skiller veriyor; Raphael/Beelzebuth doğal evrimle geliyor',
      'Mevcut bozuk kayıtlar sayfa yenilenince otomatik birleştirilir',
    ],
    en: [
      'Fix: duplicate Raphael/Beelzebuth on Rimuru forms (same skill listed twice)',
      'Skill granting now checks the whole lineage (ancestors + descendants) — no more dupes',
      'Rimuru forms grant unique skills; Raphael/Beelzebuth come from natural evolution',
      'Existing corrupted saves auto-merge on reload',
    ],
    ru: [
      'Исправление: дублирующиеся Рафаэль/Вельзевул на формах Римуру (один навык дважды)',
      'Выдача навыков теперь проверяет всю линию развития (предки + потомки) — без дублей',
      'Формы Римуру дают уникальные навыки; Рафаэль/Вельзевул приходят через эволюцию',
      'Существующие повреждённые сохранения авто-объединяются при перезагрузке',
    ],
  },
  {
    v: '1.9.7',
    date: '2026-06-23',
    tr: [
      'Öldürme ilerleme çubuğu artık TÜM ırklarda: gizli yolu olmayanlar için kilometre taşı hedefi (100/250/500/1000…)',
    ],
    en: [
      'Kill progress bar now on ALL races: milestone target for races without a hidden path (100/250/500/1000…)',
    ],
    ru: [
      'Полоса прогресса убийств теперь у ВСЕХ рас: веха-цель для рас без скрытого пути (100/250/500/1000…)',
    ],
  },
  {
    v: '1.9.6',
    date: '2026-06-23',
    tr: [
      'Stats sekmesinde öldürme sayacı: bu hayattaki + toplam öldürme',
      'Slime/Örümcek için gizli yol ilerleme çubuğu (Ruh Hasadı 666 / Labirent 500)',
    ],
    en: [
      'Kill counter in Stats tab: this-life + total kills',
      'Hidden-path progress bar for Slime/Spider (Soul Harvest 666 / Labyrinth 500)',
    ],
    ru: [
      'Счётчик убийств во вкладке Статы: за эту жизнь + всего',
      'Полоса прогресса скрытого пути для Слизи/Паука (Жатва Душ 666 / Лабиринт 500)',
    ],
  },
  {
    v: '1.9.5',
    date: '2026-06-23',
    tr: [
      'Rusça dil desteği eklendi (Русский) — Ayarlar → Dil',
      'Varsayılan dil artık İngilizce (kayıtlı tercihi olmayan yeni oyuncular için)',
    ],
    en: [
      'Russian language support added (Русский) — Settings → Language',
      'Default language is now English (for new players without a saved preference)',
    ],
    ru: [
      'Добавлена поддержка русского языка (Русский) — Настройки → Язык',
      'Язык по умолчанию теперь английский (для новых игроков без сохранённого выбора)',
    ],
  },
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
    ru: [
      'Исправление: специализация Пути Человека теперь действительно даёт свои навыки (6 отсутствовали — Маг/Убийца не получали ничего)',
      'Исправление: недопустимый тип урона еды собирательства ("damage") заменён тематическими типами (яд/огонь/кислота…)',
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
    ru: [
      'Новое: Древо Душ — перерождение теперь открывает систему постоянных улучшений',
      'Получение Душ зависит от результата: чем глубже доберёшься, тем больше Душ',
      '7 улучшений: Душа Хищника, Древняя Броня, Жадность, Неспящий Разум, Мудрость, Удача Душ, Доп. Слот',
      'Панель Душ во вкладке Статы (открывается после первого перерождения)',
    ],
  },
  {
    v: '1.9.2',
    date: '2026-06-23',
    tr: [
      'Yemek Ara butonu: savaş ekranında 5 sn bekleme süresiyle yemek ara',
      'Element bazlı yemek havuzu: nötr + bulunduğun katmanın elementine göre yemek çıkar',
      'Appraisala bağlı bilgi açılımı: tier 0 = ???, tier 1 = isim, tier 3 = +tokluk, tier 5 = tehlike ikonu',
      '24 yemek türü: 9 farklı element (nötr/zehir/ateş/fizik/asit/buz/yıldırım/delici/büyü/ruh)',
      'Tehlike seviyeleri: güvenli / riskli / toksik / ölümcül',
      'Bulunan yemeği Ye veya Bırak seçeneği ile yönet',
    ],
    en: [
      'Search Food button: forage for food in combat with a 5s cooldown',
      'Element-based food pool: neutral + current layer element determines what you find',
      'Appraisal-gated reveal: tier 0 = ???, tier 1 = name, tier 3 = +satiety, tier 5 = danger icon',
      '24 food types across 9 elements (neutral/poison/fire/physical/acid/frost/lightning/pierce/magic/soul)',
      'Danger levels: safe / risky / toxic / lethal',
      'Manage found food with Eat or Discard',
    ],
    ru: [
      'Кнопка Поиск еды: ищи еду в бою с перезарядкой 5 сек',
      'Пул еды по стихии: нейтральная + стихия текущего слоя определяют находки',
      'Раскрытие через Оценку: тир 0 = ???, тир 1 = имя, тир 3 = +сытость, тир 5 = иконка опасности',
      '24 вида еды по 9 стихиям (нейтр/яд/огонь/физ/кислота/мороз/молния/колющий/магия/душа)',
      'Уровни опасности: безопасно / рискованно / токсично / смертельно',
      'Управляй найденной едой: Съесть или Выбросить',
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
    ru: [
      'Слияние: помимо навыков рук теперь можно выбирать навыки ног/тела (кроме глаз)',
      'Чтение знаний: поверхностное знание даёт +5 ОЭ, первое глубокое чтение даёт +intReq ОЭ',
      'Панели журнала превращены в сворачиваемые заголовки по клику',
      'Отдельный журнал ЗНАНИЙ: содержимое книг не смешивается с открытиями/боем, хранится постоянно',
      'Счётчик комнаты: панель врага показывает 1/10 справа вверху (зеленеет при выполнении квоты)',
      'Обычные комнаты больше не показывают экран "комната зачищена"; кнопка Дальше открывается на 10 убийствах, но бой продолжается',
      'Сообщение о победе над боссом показывается отдельно для комнат боссов',
      'Все тексты знаний книг улучшены: атмосфернее, с более полезными подсказками по механикам',
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
    ru: [
      'Древо навыков: вкладка навыков теперь имеет переключатель Список / Древо',
      'Система рангов навыков (F/E/D/C/B/A/S/SS): навыки высокого ранга получают опыт медленнее',
      'Выведение: подними несколько навыков до пороговых уровней, чтобы авто-открыть скрытые навыки',
      'Прогрессивное раскрытие: в древе видны только твои/соседние навыки; остальное остаётся ???',
      'Путь Человека: раса человек T0 LV10 — выбор специализации Воин/Маг/Убийца/Целитель',
      'Квота убийств в комнате: нужно победить 10 врагов в комнате до продвижения (комнаты боссов исключены)',
      'Пороговая Стойкость: события на краю смерти с нужным навыком дают постоянный бонус ВЫН',
      'Истинное зрение и Чумной ткач: два новых скрытых навыка через выведение',
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
    ru: [
      'Экран отдыха/медитации теперь показывает портрет твоей расы с дышащей аурой',
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
    ru: [
      'Теперь у ВСЕХ 26 врагов есть портреты (добавлены последние 10)',
      'Экран выбора расы обновлён: на каждой карте видна эта раса позади',
      'Все новые изображения сделаны прозрачными (убран бело-клетчатый фон)',
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
    ru: [
      'Полностью убран остаточный белый ореол по краю портретов врагов',
      'Двухпроходный дефриндж: очистка краёв до и после уменьшения',
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
    ru: [
      'Убран запечённый бело-клетчатый фон с портретов врагов — теперь по-настоящему прозрачные',
      'Заливка от края: светлые детали внутри существа (кость, кристалл, броня) сохранены',
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
    ru: [
      '16 врагов теперь показаны нарисованными от руки портретами (вместо эмодзи)',
      'Показываются в экране боя и во вкладке Бестиарий',
      'Враги без изображения сохраняют свой эмодзи',
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
    ru: [
      'Баланс: слизь/скелет/голем/человек теперь начинают с 2 атакующими навыками (было 1)',
      'Ранняя игра была слишком медленной — стартовый урон примерно удвоен',
      'Слизь: Кислотный плевок + Токсичное облако',
      'Существующие персонажи авто-получают недостающий 2-й атакующий навык',
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
    ru: [
      'Вершинные формы теперь дают мощный "ультимативный" навык (по роли)',
      'Родственные вершины получают разные ультимейты — каждый путь уникален',
      'Напр.: Владыка душ → Коса смерти, Бог-жнец → Взгляд пожирания души',
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
    ru: [
      '27 новых эволюций навыков 3-го тира — навыки теперь развиваются глубже',
      'Заклинания: Метеор, Ледниковый шип, Гроза, Адское дыхание…',
      'Удары: Коса смерти, Убийство, Удар катаклизма, Буря стрел…',
      'Глаза: Взгляд Медузы, Кошмарный взгляд, Взгляд тирана (сильнее)',
      'Пассивы: Тело-крепость, Первозданное сердце, Бессмертный, Вечная эгида…',
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
    ru: [
      'КРИТИЧЕСКОЕ исправление: ОЗ/ОМ показывали "NaN" и ломались (в старых сохранениях не было поля силы расы)',
      'Старые сохранения авто-чинятся; повреждённые значения ОЗ/ОМ/ОВ восстанавливаются',
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
    ru: [
      'Исправление: пустой экран боя в комнатах загадок боссов',
      'Данные загадки искались по неверному ключу — теперь сопоставляются правильно',
      'Безопасность: если загадка не загрузилась, экран не пустеет — откат к обычному бою',
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
    ru: [
      'Исправление: родственные формы эволюции теперь действительно отличаются друг от друга',
      'Каждое ветвление — реальный выбор: одна склоняется к основному стату, другая — к вторичному + другие навыки',
      'Затронуло все расы (напр. Древний лич ИНТ/атака, Жнец душ МДР/душа)',
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
    ru: [
      'Исправление: счётчик слотов навыков теперь точен — пустые слоты больше не заполняются молча сами',
      'Новая кнопка "Снять всё": очисти всю экипировку одним нажатием',
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
    ru: [
      'Параллельные разумы переработаны (Кумо): Параллельные разумы → Воля → Существование (1/2/3 разума)',
      'Мультидействие: каждый параллельный разум запускает ДОПОЛНИТЕЛЬНЫЙ навык за ход, игнорируя перезарядку',
      'Параллельные задачи: пассивный реген ОМ/ОВ + находки редких фрагментов во время боя',
      'Каждый параллельный разум также даёт +1 слот навыка (масштабируется)',
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
    ru: [
      'Состояния: Окаменение + Оглушение — враги могут лишить тебя действий на несколько секунд',
      'Новые сопротивления: Сопротивление окаменению/оглушению (теперь 12 всего)',
      'Цепочка навыков Отрицание боли (Кумо): игнорирует входящий урон на низком ОЗ',
      'Пространственный манёвр + Молниеносный шаг (навыки уклонения)',
      'Скрытый путь Кумоко для пауков: на 500 убийствах Зоа Эле → Эде Сайне → Арахна → Зана Хорова (Арахна — гуманоид, открывает инвентарь)',
      'Василиск окаменяет, Пещерная обезьяна оглушает — враги, накладывающие состояния',
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
    ru: [
      'Панель Силы расы: индикатор-полоса во вкладке боя — показывает накопленный жар/паутину/кости, секунды поглощения слизи + эффект',
      'Разнообразие стихий врагов: василиск кислота, Кагуна молния, Пещерный ужас мороз, Королева магия',
      'Теперь все 10 сопротивлений важны (мороз/кислота/молния/магия раньше были мертвы)',
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
    ru: [
      'Бестиарий: отслеживает 26 убийств врагов; раскрывает теги поведения после 5 убийств или Оценки',
      'Сигнатурные механики рас: паук=ловушка-паутина, дракончик=всплеск жара, скелет=костяная броня, слизь=поглощение стихии, голем=каменная кожа',
      'Исправление магии: magma_fist теперь стоит 5 ОМ (было 0)',
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
    ru: [
      'Секретная пасхалка Тенсура: раса Слизь открывает гуманоидный путь на 666 убийствах',
      'Формы Демоническая слизь → Римуру Темпест → Демон-лорд Римуру (с инвентарём + снаряжением)',
      'Цепочки навыков Хищник / Чревоугодие / Вельзевул и Великий мудрец / Рафаэль',
      'Тост-уведомление Праздник урожая на 666-м убийстве',
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
    ru: [
      'Тематические навыки рас: скелет теперь использует Костяную стрелу/броню (не Острый коготь)',
      'Дракон использует Огненное дыхание (не Огненный снаряд) + Драконий коготь',
      'Пулы навыков голема/паука сделаны согласованными',
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
    ru: [
      'Аниме-бестиарий: 16→26 врагов по 4 пластам (Верхний/Средний/Нижний/Донный)',
      'Аутентичные имена (Эльроэский гунераш, Земляной дракон Араба, Таратект…)',
      'Разнообразие поведения: регенерация, двойной удар, ярость, бронированные, вампиризм',
      'Исправление: глубина подземелья теперь соответствует эволюции — привратник/перерождение снова достижимы',
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
    ru: [
      'Глубина добычи: требования экипировки (оружие→СИЛ, броня→ВЫН…)',
      'Бонус комплекта — носи 3/6/9 редких+ предметов для растущих бонусов',
      'Ковка: трать ОЭ для повышения предмета на одну ступень редкости',
      'Перераспределение статов: возврат вложенных очков за ОЭ',
      'Добыча из сундуков: поиск во время отдыха может найти снаряжение',
      'Быстрые кнопки: авто-надеть лучшее / распылить обычное',
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
    ru: [
      'Система инвентаря + экипировки (только гуманоидные расы: человек, скелет)',
      'Процедурная добыча: 9 слотов экипировки, цвета редкости, префиксы/суффиксы',
      'Враги/сундуки роняют снаряжение; легендарные сохраняются через перерождение',
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
    ru: [
      'Анимации: атака/свечение врага в бою',
      'Дышащая аура во время отдыха/медитации',
      'Полноэкранные всплески для эволюции и перерождения',
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
    ru: [
      'Чистое бинарное древо эволюции для всех рас (32 формы, каждая делится на 2)',
      'Тематические стартовые статы для каждой расы',
      'Навыки больше не авто-эволюционируют офлайн (происходит в активной игре)',
    ],
  },
];
