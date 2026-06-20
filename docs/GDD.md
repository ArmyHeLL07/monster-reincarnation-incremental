# Game Design Document — "Reincarnation" (çalışma adı)

> *I'm a Spider, So What?* temalı incremental / idle oyunu
> Engine: **Web-native TypeScript** (Vite istemci + Cloudflare Workers backend) · Platform:
> bedava tarayıcı demosu → ileride Steam (Electron/Tauri sarmalı) · *Motor 2026-06-16'da
> Godot/C#'tan revize edildi — bkz §11.*

> **SÜRÜM:** Bu doküman **saf incremental ana sürüm**dür (Melvor/Antimatter tarzı: butonlar, sekmeler, sayılar, bilgi-kapısı keşif — 3B yok). Tüm mekanikler incremental dilinde tasarlanmıştır.
> Aynı oyunun **3D/Roblox sürümü ayrı dokümandadır** (GDD_Roblox_3D.md) — aynı sistemler, ama gerçek 3D oynanış. O ayrı kod tabanı (Luau) ve ikinci cephedir; bu incremental sürüm ana plandır.

---

## 1. Yüksek Seviye Vizyon

Oyuncu zayıf bir yaratık olarak hayatta kalmaya başlar. Savaştıkça, hasar aldıkça ve avladıkça **skill** kazanır; skiller seviye atlayıp **evrimleşir**; yeterince güçlenince oyuncu **evolution** (ırk evrimi) ile tamamen yeni bir forma dönüşür. Idle + aktif karışımı: oyuncu aktifken hızlı ilerler, kapalıyken (offline) yavaş ilerleme devam eder.

**Temel his:** "Sürekli bir şey level atlıyor, sürekli yeni bir bildirim geliyor, hiç durmuyorum." (Animedeki o skill-spam tatmini.)

### 1.1 Çekirdek Felsefe — "Bilgi = Hayatta Kalma Gücü"
Oyunun kalbi bu ilke: ilerlemenin asıl kaynağı kaba güç değil, **oyuncunun bilgisi.** Zindan derinleştikçe düşmanlar acımasızlaşır; tek bir "doğru build" yoktur. Hayatta kalmak, hangi skilin neye karşı işe yaradığını, hangi kombinasyonun hangi durumu çözdüğünü **bilmeye** bağlıdır.
- Bol skill + mantıklı kombinasyonlar → oyuncuya **çok sayıda geçerli seçenek.** Farklı tehlike, farklı bilgi gerektirir.
- Kombinasyonlar "efsane" hissettirmeli ama mantıklı olmalı (zehir+iplik, ateş+rüzgâr gibi sezilebilir kurallar — bkz §5.0.3 Kombinasyon Sistemi).
- Anime bağı: zayıf statlı bir yaratık, zekâ ve doğru skill kullanımıyla en ölümcül yerde hayatta kalır. Güç sonradan gelir; önce **akıl ve bilgi.**

---

## 2. Core Loop (Çekirdek Döngü)

```
   ┌─────────────────────────────────────────────────┐
   │                                                   │
   ▼                                                   │
SAVAŞ ──► HASAR AL / VER ──► SKILL EXP ──► SKILL LV+   │
   │            │                              │       │
   │            ▼                              ▼       │
   │      RESISTANCE EXP              SKILL LV10 = EVRİM│
   │            │                              │       │
   │            ▼                              ▼       │
   │      RESISTANCE LV+            YENİ ÜST SKILL AÇILIR
   │                                           │       │
   ▼                                           │       │
AV/KILL ──► RACE EXP ──► EVOLUTION POINT ──────┘       │
                              │                        │
                              ▼                        │
                        EVOLUTION AĞACI ───────────────┘
                        (yeni ırk = yeni statlar,
                         yeni skill slotları, yeni alanlar)
```

**Tek cümlede:** Savaş → av hem **exp hem yemek** (açlık dolar) → leveling → evrim → daha güçlü savaş → gatekeeper boss → **rebirth** → yeni içerikle yeniden başla. *(Beslenmezsen zayıflarsın — avlanmak zorunlu.)*

---

## 3. İlerleme Ölçeği (Sayı Felsefesi)

Sonsuz şişen sayı **yok**. Animedeki gibi **kademeli evrim zinciri**:

- Her skill **LV1 → LV10** arası ilerler.
- **LV10'a ulaşan skill evrimleşir** ve bir üst skille dönüşür (eski skill **kaybolur, geride bonus bırakmaz** — animeye sadık; bkz. §5.2).
- Statlar (HP, MP, ATK, DEF, SPD...) ırk ve skillerden gelir; lineer-üstü ama "okunabilir" aralıkta tutulur (örn. erken oyun HP 20 → geç oyun HP 50.000 gibi, milyarlar değil).

**Neden böyle:** Antimatter tarzı astronomik sayı değil; oyuncu her sayının ne anlama geldiğini hissedebilsin. Derinlik **sayının büyüklüğünden değil, evrim zincirlerinin dallanmasından** gelir.

---

## 4. Race / Evolution Sistemi

### 4.1 Irk Seçimi
Oyun başında (veya ilk büyük evrimde) oyuncu bir **başlangıç ırkı** seçer. Her ırkın:
- kendine özgü **stat profili** (örn. örümcek: düşük HP, yüksek SPD + zehir; ejderhamsı: yüksek HP/ATK, yavaş),
- kendine özgü **evolution ağacı**,
- kendine özgü başlangıç skilleri,
- ve kendine özgü **imza kimlik mekaniği** vardır (bkz §4.3).

### 4.1.1 Irk Kimlik Mekaniği — Değişken Derinlik
Her ırk sadece "farklı statlar" değil, **oynanışı değiştiren bir imza özelliğe** sahiptir. Irk seçimini gerçek bir karar yapan şey budur. Derinlik ırktan ırka **bilinçli olarak değişir**:

- **Derin ırklar** (örn. örümcek): kendi alt-mekaniği olan, ustalaşması katmanlı ırklar. "Main" yapılacak, derinlik isteyen oyuncu için.
  - *Örümcek:* duvara tırmanma, ağ örme, zehir (geliştikçe), ve **çoklu göz slot sistemi** (bkz Spider_Race_Data §Göz Sistemi).
- **Basit ırklar** (örn. insan): tek net imza özelliği, kolay anlaşılır, düz ama etkili. Sade oynamak/yeni başlayan için.
  - *İnsan:* doğal silahı yok ama **öğrenme/gelişme avantajı** — training/exp kazanımı ~%20 boostlu, esneklik, item kullanımı. "Zayıf doğdun ama hızlı öğrenirsin/uyum sağlarsın" arketipi.

> **Tasarım avantajı:** Her ırka dev sistem yazmak gerekmez (geliştirme yükü dengeli) + oyunculara çeşitlilik sunulur (kompleksite sevmeyene basit ırk, derinlik isteyene örümcek). Farklı ırklar farklı imza mekanikleri taşır → her biri ayrı bir oynanış kimliği.

### 4.2 Evolution Ağacı (ırk başına, dallanan)
- Yeterince **Evolution Point** (kill/exp ile birikir) toplanınca evrim açılır.
- Her evrim adımında **dallanma** var: oyuncu yön seçer.
  - Örnek (Örümcek hattı — tek kaynak: Spider_Race_Data Tablo 2):
    ```
    Lesser Weaver
        ├── Venom Weaver           (zehir dalı)
        │       └── Shade Stalker  (gizli/suikast dalı)
        └── Blade Weaver           (fiziksel dal)
                └── Scythe Hunter  (hız/avcı dalı)
    ```
- Seçim **kalıcı** (o oyun için) → replay değeri. Farklı dallar farklı oynanış.

### 4.3 Evrimin Etkisi
Evrim = yeni stat tabanı + yeni skill slotları + bazen yeni mekanik (örn. "ağ kurma", "uçma"). Önceki skiller korunur (uyumluysa).

---

## 5. Stat & Skill Mimarisi

> **Bu oyunun omurgasıdır.** Diğer tüm sistemler (resistance, regen, açlık, INT, evrim) bu hiyerarşinin altında yaşar.

### 5.0 Üç Katmanlı Hiyerarşi (D&D-vari)

```
KATMAN 1 — ANA STATLAR (6'lı temel)
   STR · VIT · AGI · INT · WIS · LUCK
        │
        ▼
KATMAN 2 — SKİLLER (her skill bir/birkaç stata bağlı, onu besler)
   resistance, zehir, iplik, zihin, büyü, regen... 
        │
        ▼
KATMAN 3 — KOMBİNASYON (skilleri birleştir/füzyonla)
   merge (aynı tip güçlenir) · fusion (farklı tip → yeni, riskli)
```

### 5.0.1 Ana Statlar (6'lı)
| Stat | Alanı | Besleyen skiller / etkiler |
|------|-------|----------------------------|
| **STR** | Fiziksel hasar, kuvvet | Sharp Claw, Pounce, fiziksel hat |
| **VIT** | Can, dayanıklılık | Carapace, Endurance, regen, HP |
| **AGI** | Hız, kaçınma, saldırı sırası | Stealth, hız skilleri |
| **INT** | Sistem/lore anlama, büyü gücü & MP | Zihin hattı, kitap anlama (§7.8), büyü skilleri |
| **WIS** | Zen, sezgi, algı, iç huzur | Meditasyon (§7.6), algı/erdem yolu |
| **LUCK** | Şans-bazlı her şey | Regen öğrenme şansı, fusion sürprizi, nadir drop/oda/kitap, kritik |

> **INT ↔ WIS ayrımı:** INT = "sistemi *anlama*" (kitap, büyü mekaniği, manipülasyon — karanlık/aktif yola yakın). WIS = "iç huzur/sezgi" (meditasyon, erdem — aydınlık/pasif yola yakın). Farklı build felsefeleri.

> **LUCK eksenі:** Oyunun tüm şans-bazlı katmanlarını yönetir — regen öğrenme şansı (§6.1), fusion'da iyi/sürpriz sonuç olasılığı (§5.0.3), nadir canavar/besin drop'u, gizli oda ve nadir kitap bulma, kritik vuruş. "Eğlence statı" değil, gerçek bir build ekseni. (Büyü gücü ve MP, MAG yerine artık **INT** altında.)

### 5.0.2 Statlar ↔ Skiller İlişkisi
- Her skill bir veya birkaç ana stata **bağlıdır** ve kullanıldıkça o statı **besler** (örn. büyü kullanmak INT'i yükseltir — büyü gücü artık INT altında, §5.0.1).
- Statlar da skilleri **boost'lar:** yüksek INT → büyü skilleri daha güçlü; yüksek VIT → regen daha etkili.
- **Karşılıklı döngü:** skill kullan → stat artar → aynı/yakın skiller güçlenir. (Örn. INT örneği: kitap+büyü+magic birbirini besler.)

### 5.0.3 Kombinasyon Sistemi — Merge & Fusion
Oyunu özgün yapan optimizasyon/keşif katmanı. İki mod:

**Merge (birleştirme):** Aynı veya yakın özellikteki skilleri birleştir → tek, daha güçlü skill. (Örn. iki zehir skill'i → daha güçlü zehir.) Düşük risk, sezgisel.

**Fusion (füzyon):** Farklı skilleri birleştir → yeni bir şey. Riskli ve keşif odaklı. Sonuç **üç sınıftan** birine düşer:

| Sınıf | Ne olur | Örnek |
|-------|---------|-------|
| **İyi (Synergy)** | Uyumlu skiller → güç boost'u. Verimli ama **küçük** (sömürü değil, ince optimizasyon). | Zehir + İplik → "zehirli ağ" (bağlanan düşmana sürekli zehir) |
| **Tuhaf (Quirk)** | Beklenmedik **üçüncü sonuç**. Saf güç olarak verimsiz ama tamamen yeni bir araç. | Su + Ateş → **Buhar** (görüş engelleme / alan kontrolü / haşlama) |
| **Kötü (Backfire)** | Uyumsuz → zayıf sonuç + yan etki/ceza. Yine de bir çıktısı var (ölü değil), ama çoğu durumda istemezsin. | Zıt/çatışan iki büyü → kararsız, geri tepen etki |

> **Tasarım felsefesi:** *Çöp kombinasyon yok.* "Kötü" eşleşme bile bir sonuç doğurur — sadece bazıları "verimli güç" değil "garip ama kullanışlı" (Quirk) ya da "riskli/zayıf" (Backfire). Bu, oyuncuyu her şeyi denemeye iter; hiçbir yol ölü içerik olmaz.

**Hibrit tepkime modeli — nasıl belirlenir:**
- **Element kuralları (sistemik matris):** Temel elementler (ateş, su, toprak, rüzgâr, yıldırım, zehir...) arasında *sabit tepkime matrisi*. Öğrenilebilir kurallar → oyuncu mantık kurar. Örnekler:
  - Su + Ateş → **Buhar** (Quirk: görüş/alan)
  - Ateş + Rüzgâr → **Alev Fırtınası** (Synergy: alan hasarı)
  - Su + Yıldırım → **İletken Şok** (Synergy: ıslak hedefe bonus)
  - Toprak + Su → **Çamur** (Quirk: yavaşlatma/tuzak)
  - Zehir + İplik → **Zehirli Ağ** (Synergy)
  - Ateş + Buz → **Termal Şok** (Backfire eğilimli: kararsız)
- **Özel çiftler (elle tasarlı istisnalar):** Belirli ikililerin kurala uymayan, gizli/sürpriz sonuçları. Kitap ipuçlarıyla keşfedilir ("normalde alakasız ama birleşince şaşırtıcı bir şey olur").

> **Geliştirme notu (data-driven):** Element matrisi otomatik kapsar (her çifti elle tasarlamak gerekmez); özel çiftler ayrı bir istisna tablosunda. İkisi de JSON'da, hardcode değil. → yeni element/çift eklemek = veri eklemek.

### 5.0.4 Yara İzi Sistemi — Geri Alınabilir Ama İzli Ceza
Yanlış füzyonun cezası kalıcı *hissedilir* ama umutsuz değil:
- Füzyonu **bozabilirsin**, ama skiller geri dönerken **azalmış** gelir (level/güç kaybı), statlar düşer. → "dene-boz-dene" sömürüsü yok, gerçek bedel var.
- Bu hasar bir **"yara izi"**: hatalar kalıcı hissettirir ama sonsuza kadar cezalandırmaz.
- **Onarım (ileri oyun hedefi):** ileride bir yolla (özel item, yüksek stat eşiği, kurban kitabı yöntemi) bu izleri **silip skilleri/statları onarabilirsin.** → "eski hatalarımın izini nasıl temizlerim?" diye bir endgame motivasyonu.

### 5.0.5 Göz Slot Sistemi (Evrensel Mekanik)

Göz teması **her ırk** kullanabilir — örümceğe özel değil. Tema evrensel, ama **kapasite ırk kimliğidir.**

**Slot sayısı ırka göre sabit:**
| Irk | Göz slotu (öneri) |
|-----|-------------------|
| Örümcek | 8 (çok-göz uzmanı) |
| İnsan | 2 |
| (diğer ırklar) | kendi sabit sayısı |

- Slot sayısı baştan sabit, evrimle artmaz. Örümceğin yüksek slotu onu "çok-gözlü büyücü-avcı" yapan imza avantajıdır.

**Her göze bir yetenek takılır — iki mod:**
| Mod | Davranış | Maliyet |
|-----|----------|---------|
| **Pasif göz** | Sürekli açık etki (örn. korku aurası) | MP yok |
| **Aktif göz** | Tetiklenince patlar (örn. Death Stare) | **MP harcar** |

**Kural 1 — Tek göze ters mod yığılamaz (KESİN KURAL):** Her göz tek moddadır. Bir göze pasif koyduysan **üstüne aktif eklenemez**; aktif koyduysan **üstüne pasif eklenemez.** Tek göz = tek mod, kendi içinde karışmaz.
- ✅ **Ayrı gözlerde farklı modlar serbest:** bir göz pasif, başka bir göz aktif olabilir — hiç sorun yok.
- ❌ **Aynı gözde mod yığma yasak:** pasif gözün üstüne aktif, aktif gözün üstüne pasif.

**Kural 2 — Kombinasyon bir istisnadır (üretim):** Yukarıdaki yığma yasağı **kullanıma** dairdir. **Kombinasyon mekaniğinde** (füzyon) pasif ve aktif göz *birleştirilebilir* — çünkü kombinasyon bir **üretim** eylemidir (iki gözden yeni bir füzyon-göz üretmek). Üretilen yeni göz yine **tek modda** çalışır (Kural 1 ona da uygulanır).
- ✅ Pasif göz + Aktif göz → kombinle → yeni füzyon-göz (tek mod).
- ❌ Bir gözün üstüne ters mod *yığmak* → yasak (Kural 1).
- Ayrım: *kombinasyon = üretim* (iki gözden yeni göz), *yığma = aynı göze ters mod ekleme* (yasak).

**Kural 3 — Göz kombinasyonu mantık şartı:** İki göz birleştirilebilir, füzyon sınıflandırması (§5.0.3) geçerli:
- **Mantıklı kombinasyon** → işe yarar (örn. zehir bakışı + felç bakışı → "zehirli felç").
- **Mantıksız kombinasyon** → **göze özel kademeli ceza** (aşağıda).

**Göz Cezası — Kademeli (tematik):**
| Şiddet | Sonuç |
|--------|-------|
| **Hafif yanlış** | **Geçici körlük** — o göz slotu bir süre devre dışı, sonra kendine gelir. |
| **Ağır yanlış** | **Kalıcı hasar + görüş engeli** — slot bozulur, ayrıca genel görüş/algı/isabet düşer; **onarılana kadar** sürer (yara izi onarımıyla aynı mantık, §5.0.4). |

### 5.0.6 Evrimle Ek Göz — Özel Güç Kapısı

Göz slotu normalde ırka göre sabittir (§5.0.5), **ama belirli evrimler istisnadır:** bazı üst formlar **ekstra göz** açar.
- *Örnek:* örümceğin endgame formu (Arachnid Sovereign, yarı-insan/yarı-örümcek) evrimde **+2 göz** getirir.
- Bu ekstra gözler **sıradan slot değil — özel güç kapısıdır.** Sadece o evrime özel, normalde hiçbir slota takılamayan **benzersiz/üst seviye göz güçleri** buralara konabilir.
- "Bu formun gözü sıradan göz değil" hissi → evrimi gerçekten ödüllü yapar: sadece stat artışı değil, **yeni bir güç katmanı.**

> **Tasarım sonucu:** Ek göz getiren bir evrim, oyuncu için büyük bir hedef olur ("o forma ulaşırsam yeni göz güçleri açılır"). Hangi evrimlerin ek göz verdiği, o ırkın evrim ağacında işaretlenir (data-driven).

> **Tematik güç (göz cezası):** Ceza bedenin o kısmına özel — "yanlış yaparsan körleşirsin." Mantıklı kurmaya zorlar, hem korkutucu hem adil. Element füzyonunun geri tepmesi gibi, göz füzyonu da göze geri teper.

> **Çok dilli:** tüm göz yeteneği adları, açıklamaları, ceza mesajları lokalizasyon tablosundan gelir (hardcode değil).

### 5.0.7 Appraisal — Özel Göz Yeteneği ("Gören Göz")

Appraisal (inceleme/değerlendirme) normal bir skill değil, **göze bağlı özel bir yetenektir.** "Bakarak okuma" göz temasına insanın elindeki bir skilden daha doğal oturur → bu yüzden göz slotuna takılır.

**Elde etme:** esnek — normal yolla bulunabilir **veya** kombinasyonla üretilebilir.

**Özel mod — "pasif ama aktifleştirilebilir":** Bu, kendine özgü bir mod tipidir (Kural 1'e aykırı değil — göze ters mod *yığmıyorsun*, skill'in kendi doğası ikili):
- **Pasif (sürekli):** yüzeysel/otomatik tarama. Etrafa baktıkça temel bilgi seviyene göre kendiliğinden süzülür.
- **Aktif (tetiklenir):** tek bir hedefe odaklanıp **derin okuma** — o hedefin çok daha fazla katmanını açar (mercek tutmak).

**Kademeli bilgi açılımı (seviyeye bağlı):** Appraisal'ın asıl gücü, seviye arttıkça gösterdiği bilginin katman katman açılmasıdır:
| Seviye | Açılan bilgi (örnek kademe) |
|--------|------------------------------|
| LV1 | sadece **isim** |
| LV2 | + **unvan** |
| LV3 | + **seviye** |
| LV4 | + **can (HP)** görünmeye başlar |
| LV5+ | + statlar, dirençler |
| üst | + zayıf noktalar, skiller, gizli bilgi |

> Kademeler esnektir — Appraisal evrimleştikçe (üst formlar) daha da güçlenir, hangi seviyede ne açıldığı denge için ayarlanır. Anlam: **Appraisal güçlendikçe sen "gören" olursun.** "Bilgi = hayatta kalma" (§1.1) felsefesinin saf hali — düşmanı ne kadar okursan o kadar iyi savaşırsın.

**Kapsam — ne okur:**
- **Düşman:** isim → unvan → seviye → can → stat → direnç → zayıf nokta → skiller (seviyeye göre).
- **Eşya / kaynak:** ne işe yarar, değeri, özellikleri.
- **Lore / gizli sezme (kademeli):** kitap okuma da seviyeye bağlı katman katman açılır:
  | Seviye | Kitaba baktığında |
  |--------|-------------------|
  | Başlangıç | sadece **"kitap"** yazar — kurban kitabı ile sıradan kitap **ayırt edilemez** |
  | Orta | kitabın anlamı/içeriği çözülmeye başlar (INT ile sinerji, §7.8) |
  | Üst | **"bu bir lore eşyası"** diye işaretler → özel kurban kitaplarını sıradan kitaplardan ayırabilirsin; diğerleri "normal kitap" kalır |
  - **Gizli oda/mekanik sezme:** ancak **üst seviyede (~LV7+)** açılır. Erken seviyede görünmeyeni sezemezsin (yoksa keşif fazla kolaylaşır). "Gören göz" önce yakınını okur, ustalaştıkça gizli olanı sezer → hem savaşta hem keşifte değerli.

> **İlerleme anı:** LV7'de ilk kez bir duvarın ardındaki gizli odayı fark etmek güçlü bir "gözüm artık bunu görüyor" hissi verir. Daha önce yanından geçtiğin yerlere geri dönüp keşfetme motivasyonu da doğar.

> **Gizlilik katmanı:** Düşük Appraisal'lı oyuncu değerli bir kurban kitabının üstünden habersiz geçebilir (sıradan kitaptan ayıramaz). Yüksek Appraisal "dur, bu özel" dedirtir. Appraisal'a yatırım = gizli lore'u **fark etme** yetisi. "Gören göz" temasının lore karşılığı.

> **Not:** Aktif derin okuma MP harcayabilir (üst seviye okumalar daha pahalı). Çok dilli: tüm okunan etiketler/değerler lokalizasyon tablosundan.

---

### 5.1 Skill Türleri
| Tür | Açıklama | Örnek |
|-----|----------|-------|
| **Aktif** | Oyuncu tetikler, MP harcar | Poison Fang, Fire Ball |
| **Pasif** | Sürekli etki | HP Recovery, Night Vision |
| **Resistance** | Hasar aldıkça artar (bkz §6) | Fire Resistance, Poison Resistance |
| **Perception/Util** | Bilgi/keşif | Appraisal → Detection |

### 5.2 Skill Leveling & Evrim
- Skill, kullanım/exp ile **LV1→LV10** ilerler.
- **LV10 = Evrim.** Skill üst forma dönüşür ve **eski skill kaybolur** (animeye sadık — tek bir üst skille dönüşüp gider, geride bonus bırakmaz):
  - `Poison Fang LV10 → Deadly Poison`
  - `Appraisal LV10 → Insight`
  - `Thread LV10 → Cutting Thread → ...`
- Evrim zincirleri **dallanabilir** (bazı skiller LV10'da 2 seçenek sunar).
- "Kaybetme" hissi burada bilinçli bir tasarım: üst skill her zaman net biçimde daha güçlü olmalı ki dönüşüm bir kazanç gibi hissedilsin, kayıp gibi değil.

### 5.3 Skill Slotları
Oyuncunun sınırlı aktif skill slotu var (ırk/evrim ile artar) → hangi skilleri taşıyacağı bir karar (build çeşitliliği).

---

## 6. Resistance / Proficiency (Hasar-bazlı)

Animenin imza mekaniği. **Aldığın her hasar, o hasar tipinin resistance exp'ine gider.**

```
Ateşten 50 hasar al → Fire Resistance EXP +50
Fire Resistance EXP eşiği dolar → Fire Resistance LV1
LV1 = alınan ateş hasarı %X azalır
... LV10 → "Fire Nullity" (ateş bağışıklığı) evrimi
```

- Her hasar tipi (fire, poison, physical, magic, ...) ayrı resistance hattı.
- Yüksek riskli oynayan (çok hasar alan) oyuncu daha hızlı resistance kazanır → **risk/ödül dengesi**.
- LV10'da resistance → **Nullity** (tam bağışıklık) evrimine ulaşır.

### 6.1 Düşük-Can / Eşik Mekaniği (Brink)

Hayatta kalma baskısını güce çeviren çekirdek risk sistemi. Tema: *vücut ancak gerçekten tehlikedeyken kendini onarmayı/dayanmayı öğrenir.*

**Regenerasyon öğrenme — düşük canda artan şans:**
- Regen skill'inin açılması **şansa** bağlı, ama şans sabit değil — **can azaldıkça yükselir.**

| Can durumu | Regen açılma şansı (öneri) |
|---|---|
| Tam can | ~%0.01 (neredeyse imkânsız) |
| Orta can | tırmanan ara değer |
| Ölümün eşiği | maksimum ~%10 |

- Oyuncu bunu fark edince doğal olarak riskli oynamaya teşvik olur — zorla değil, kendi keşfiyle.
- Kurban kitabı ipucu buraya bağlanır (örn. *"ölümün kıyısında, her şey bittiğini sandığım an, bedenim kendi kendine kapanmaya başladı..."*) → oyuncu "düşük canda bir şey oluyor" çıkarımını yapar.

**Bilinçli risk eylemi — "Push to the Brink" (cezalı, ölümcül):**
- Oyuncu kendini *kasıtlı* riske atarak (canını düşürerek) yüksek-şans penceresini açabilir.
- **Gerçek bedel:** regen yeterince hızlı tetiklenmezse **ölebilirsin.** Bu bir kumardır — bilerek eşiğe git, güçlen ya da öl.
- Çerçeveleme: "kendine zarar ver" değil, **hayatta-kalma/eşik dili** — *Push to the Brink / Embrace the Pain / Court Death.* Mekanik birebir aynı (bilinçli riskle güçlenme), sadece ton oyunun epik-karanlık hissine oturur.

**Resistance'a yayılım:**
- Bu yol sadece regeni değil, **tüm resistance ailesini** besler: düşük canda hasar almak resistance exp'ini de hızlandırır.
- Yani risk al → hem regen öğrenme şansı hem resistance kazanımı artar. Tek mekanik, iki kazanç ekseni.

> **Wellbeing notu:** Bu bir oyun-içi hayatta kalma sistemidir; gerçek dünya kendine-zarar ile ilgisi yoktur. Dil ve sunum bilinçli olarak "tehlikeyle güçlenme" çerçevesinde tutulur.

---

## 7. Idle / Aktif Mix

| Durum | Davranış |
|-------|----------|
| **Aktif (oyun açık)** | Manuel savaş, skill tetikleme, hızlı exp, seçimler |
| **Idle (oyun açık, müdahale yok)** | Otomatik savaş "auto-battle" → yavaş exp/loot |
| **Offline (oyun kapalı)** | Zaman bazlı birikim (örn. son aktif zona göre saat başı X exp/loot), giriş yapınca "yokken şunları topladın" özeti |

Offline kazanç **aktiften daha yavaş** olmalı (oyuncuyu geri çekmek için ama cezalandırmadan).

> **Stamina (SP) sınırı:** Hem aktif hem auto-battle/idle savaş SP harcar; SP bitince
> ilerleme yorgunluk/HP erimesiyle doğal tavanlanır (bkz §7.9). Idle = sınırsız farm değil.

---

## 7.4 Açlık & Beslenme (Hunger / Feeding)

Örümcek temasının kalbi: oyuncu avlanmak *zorunda*. Av artık sadece exp/loot değil, aynı zamanda **yemek**. Bu, idle'a hayatta kalma baskısı katar — boşta kazanç değil, "beslenmezsen zayıflarsın".

### 7.4.1 Açlık Metresi
- **Hunger** bir metre olarak sürekli (yavaşça) artar — savaşmasan, idle olsan bile acıkırsın.
- Açlık derinlikle/aktiviteyle hızlanır: derin zonlarda ve yoğun savaşta daha hızlı acıkırsın.

### 7.4.2 Beslenme — Hibrit Sistem
- **Oto-ye:** Öldürdüğün av otomatik yenir → anında açlık dolar (varsayılan, akıcı oynanış).
- **Stoklama:** İstersen cesedi yemeyip **kilere** koyarsın. Derin zonlarda av kıtlaşınca açabileceğin rezerv. → Oyuncuya planlama imkânı: "yukarıda bol avken stok yap, aşağıda aç kalma."
- Av boyutu/türü ne kadar tokluk verdiğini belirler (küçük böcek az, büyük canavar çok).

### 7.4.3 Kademeli Açlık Cezası
Açlık eşikleri aştıkça ceza sertleşir — oyuncuyu "ne zaman geri çekilmeliyim?" kararına zorlar:

| Eşik | Durum | Etki |
|------|-------|------|
| **Tok** | normal | Statlar tam, regen çalışır |
| **Aç (hafif)** | regen yavaşlar | HP/MP yenilenmesi düşer |
| **Çok aç (orta)** | stat düşüşü | ATK/DEF/SPD belli oranda azalır |
| **Açlıktan tükeniyor (sert)** | HP erimesi | HP yavaşça azalır → gerçek ölüm riski |

> Kademeli yapı sayesinde açlık cezalandırıcı değil *gerilim verici*: erken uyarı sinyalleri var, oyuncu durumu yönetebilir.

### 7.4.4 Özel Besin
Bazı nadir canavarlar **özel besin** sayılır:
- Fazladan/uzun süreli tokluk,
- Geçici stat boost'u,
- Bazı **evrim koşulları** (belirli bir canavarı yemek bir evrim dalını açabilir — animedeki "ceset yiyerek evrim" mantığı),
- Bazı **gizli skill tohumları:** belirli bir canavarın özelliği yiyene geçebilir. *Örnek:* kuyruğu koptuğunda kendini yenileyen bir canavarı yemek → **regenerasyon** öğrenmenin alternatif (kitap-ipuçlu) yolu. Kurban kitabı bu canavarı ima eder, oyuncu bulur ve yer.

### 7.4.5 Gluttony (Oburluk) Mekaniği — risk/ödül
Açlık sistemi, günah/erdem ekseninin **Gluttony** koluyla birleşir (bkz. Spider_Race_Data §3B):
- **Bonus:** Çok ve sürekli yiyen oyuncu bir güç ekseni açar — yedikçe kalıcı güçlenme (örn. "yenen her N avda küçük stat birikimi").
- **Bedel (azıcık ceza):** Karşılığında açlık daha hızlı artar veya hafif bir "doymazlık" durumu — sürekli beslenmek zorunda kalırsın.
- **Karanlık yola bağlanır:** Gluttony bir günah ekseni; yeterince ilerleyince benzersiz bir oburluk-temalı güç açar. Risk seven oyuncu için derinlik.

> **Tema notu:** Animedeki Gluttony ruler skill'i de tam böyle — yedikçe güçlenme ama bitmeyen açlık laneti. Mekanik buradan esinli, isimler özgün.

---

## 7.5 Rebirth (Yeniden Doğuş / Prestige)

Türün belkemiği. Tematik olarak en güçlü an: oyuncu bir tavana dayanır, **sistem ona seslenir**.

### 7.5.1 Tetikleyici — "Gatekeeper Boss"
Rebirth başta kilitlidir. Belli bir **tavan bossu (gatekeeper)** yenildiğinde açılır.
- *Idling to Rule the Gods* mantığı: belli bir tanrıyı/eşik düşmanı yenmeden rebirth görünmez bile.
- İlk gatekeeper yenildiğinde sistem mesajı tetiklenir (bkz. aşağıda).
- Sonraki rebirth'ler daha güçlü gatekeeper'lar gerektirir → her döngü biraz daha ileri.

### 7.5.2 Sistem Mesajı (tematik an)
Boss yenilince ekrana animedeki "system voice" tonunda bir mesaj gelir:

> *"Mevcut bedenin sınırlarına ulaştın. Gücün bu form tarafından kısıtlanıyor.*
> *Her şeyi geride bırak — yeniden doğ — ve sınırların genişlesin."*

Oyuncu kabul edince rebirth gerçekleşir. (Metin lokalizasyon tablosundan gelir, hiçbir dil hardcode değil.)

### 7.5.3 Ne Sıfırlanır
**Neredeyse her şey:** tüm skiller, tüm skill evrimleri, evolution ağacındaki ilerleme, zon ilerlemesi → hepsi başa döner. Oyuncu yeniden zayıf bir başlangıç formuna döner.

**İki şey rebirth'ten etkilenmez (kalıcılık hiyerarşisi):**

| Katman | Davranış |
|--------|----------|
| **Taboo** (en üst) | Bir kez açıldıysa **hiçbir şey silemez** — rebirth, hatta ırk değişimi bile. Karakterin "ruhuna" işler, tüm doğuşlara taşınır. |
| **Irk kimliği** (orta) | Rebirth **ırkı değiştirmez.** Başta seçilen ırkla devam edilir. Yeni ırk denemek = ya yeni oyun (fresh save) ya da nadir özel eşya (bkz §7.5.5). |
| **Skill / evrim / zon** (alt) | Her rebirth'te tamamen sıfırlanır. |

### 7.5.4 Ne Kalır — Ödül: Yeni Kilitler
Rebirth bir **güç çarpanı değil, bir içerik kapısıdır.** Her rebirth kalıcı olarak yeni şeyler açar:
- **Yeni skiller / yeni evrim dalları** (mevcut ırkın ağacında),
- bazen **yeni zonlar veya mekanikler**.

> Not: Yeni *ırklar* rebirth ile açılmaz — ırk seçimi kalıcı bir kimlik kararıdır. Farklı ırk = yeni oyun veya özel eşya. (Bu, ırk seçimini "her döngüde değiştir-dene" hafifliğinden korur.)

Böylece her doğuş "aynı şeyi daha hızlı" değil, **"bu sefer mevcut ırkımla farklı bir build/dal dene"** olur → yüksek tekrar oynama değeri.

> **Tasarım notu:** Saf "kilit açma" ilerlemeyi yavaş hissettirebilir. Dengeyi korumak için her rebirth'ün, açtığı yeni içeriğin yanında küçük bir kalıcı kolaylık da vermesi düşünülebilir (örn. başlangıç skill slotu +1). Sonra dengelenecek.

### 7.5.5 Irk Değişimi — Nadir Özel Eşya
Tek istisna: oyun içinde bulunabilen **çok nadir bir eşya** ırkı değiştirmeye izin verir. Bedeli ağır, tamamen taze bir başlangıçtır:
- Tüm özellikler, skiller ve evrim ilerlemesi **yeni ırkın tabanına göre sıfırdan yenilenir** (hiçbir şey taşınmaz).
- Karşılığında **küçük bir kalıcı boost** verilir — geçişi tamamen cezalandırmamak, bir "ödül" hissi bırakmak için.
- **Taboo yine kalıcıdır** — ırk değişse bile silinmez (kalıcılık hiyerarşisinin en üstü).

> Tasarım amacı: ırk değişimini *mümkün ama ciddi bir karar* yapmak. Kolayca erişilse ırk kimliği anlamını yitirir; imkânsız olsa oyuncu sıkışmış hisseder. Nadir eşya + tam sıfırlama + küçük boost bu dengeyi kurar.

---

## 7.6 Meditasyon (Gizli Mekanik)

Oyuncuya hiç anlatılmayan, kendi keşfedeceği bir yol.

- Oyuncu uzun süre **hiçbir şey yapmazsa** (savaşmadan, sadece bekleyerek — idle'ın da ötesi, bir "zen" hali) gizli bir **meditasyon göstergesi** dolmaya başlar.
- Yeterince dolunca **özel bir güç / gizli skill** açılır (normal yolla asla elde edilemeyen).
- UI'da başta hiçbir ipucu yok; oyuncu tesadüfen ya da topluluk paylaşımıyla keşfeder → "easter egg" hissi.
- **İskelet bağlantısı:** Bu gizli "zen yolu", ileride eklenecek **Taboo**'nun karşı kutbu olarak kurgulanabilir (aydınlık/sakin yol ↔ karanlık/ego yolu). Mimaride "gizli ilerleme hattı" altyapısı şimdiden kurulursa Taboo sonra aynı sisteme oturur.
- **Kalıcılık:** Hem bu gizli güç hem de Taboo, bir kez açıldıktan sonra **kalıcılık hiyerarşisinin en üstünde** yer alır — rebirth ve ırk değişimi dahil hiçbir sıfırlama bunları silmez (bkz §7.5.3 tablosu).

---

## 7.7 Kurban Kitapları (Lore + Örtük İpucu)

Zindana gömülü, keşfedilen bir lore katmanı. Gizli mekanikleri **asla doğrudan söylemez** — sadece ima eder. Oyunun gizem felsefesinin merkezi.

### 7.7.1 Ne Oldukları
- Derin zonların **gizli odalarında** bulunan kitaplar/parşömenler (keşif ödülü, nadir).
- Yazanlar: oyuncudan **önce gelen varlıklar** — Taboo'ya bulaşmış, ondan kurtulamamış ama yenilmek yerine onu *güce çevirmeyi* başarmışlar. Yazdıkları, o mücadelenin günlüğü.
- **Bağlı seri:** Her kitap bir öncekinin devamı. Derine indikçe tek bir kurbanın hikâyesi kronolojik olarak açılır → "benden önce de biri buradaydı" hissi, karanlık ve atmosferik.

### 7.7.2 İşlev — "Ne" söyler, "Ne verdiğini" söylemez
Bu ayrım tasarımın kalbi:
- Oyuncu kitabı **okur** → lore'u öğrenir. Hikâyenin *içine gömülü* örtük bir ipucu vardır: açılabilecek bir gizli skill/güce dair, ama **asla açık talimat değil.**
  - *Örnek (meditasyon ipucu):* kurban "...karanlıkta günlerce hiç kıpırdamadan bekledim, ta ki içimdeki ses susana dek..." der. Bu zen/meditasyon yolunu **ima eder**, söylemez.
- Oyun **mekanik etkiyi açıklamaz.** Oyuncu "bir şey olduğunu" hisseder ama "ne kadar / hangi skill / nasıl" bilmez.
- **Gerçek bilgi sadece ayrı wiki sayfasındadır.** Meraklı oyuncu araştırır / topluluk çözer → Souls-vari, ARG-vari gizem. Oyun içi UI temiz ve esrarlı kalır.

### 7.7.3 Tasarım Felsefesi
- Oyun **hiçbir şeyi spoil etmez** — Taboo'nun varlığını bile doğrudan söylemez. Sadece atmosfer, ima, oyuncunun kendi merakı.
- Kitaplar pasif lore + aktif keşif teşviki: oyuncuyu gizli odaları aramaya, ipuçlarını denemeye, topluluğa danışmaya iter.
- **İki katmanlı bilgi modeli:**
  - *Oyun içi:* atmosfer, hikâye, ima → "bir şey var ama ne?"
  - *Oyun dışı (wiki):* tam mekanik → "şu kitap şu yolu ima ediyor, şu koşulda şu açılır."

> **Not:** İpuçları hem aydınlık (meditasyon/erdem) hem karanlık (Taboo/günah) yola dair olabilir — kurbanın hangi yolu seçtiğine göre. Böylece kitaplar her iki gizli hattı da besler.

---

## 7.8 Intelligence (Zekâ) — Üçüncü Ana Eksen

Oyunun build derinliği üç ayak üstünde durur: **Güç** (fiziksel), **Dayanıklılık** (resistance/regen), **Zekâ** (sistem/büyü/lore). INT bu üçüncü ayağı kurar ve özellikle kurban kitaplarını canlı bir keşif sistemine çevirir.

### 7.8.1 Kitap Anlama — Hibrit (temel hep okunur, derin katman eşikli)
- Her kitabın **temel katmanı** (yüzeysel hikâye/atmosfer) **her zaman okunur** — oyuncu boş dönmez.
- **Derin katman** (gizli ipuçları, skill imaları, lore'un asıl sırrı) **INT eşiğine kilitli.**
- Düşük INT'le kitap "ilginç bir günlük"; yüksek INT'le "bir yol haritası". → **Aynı kitap, oyuncu güçlendikçe yeniden değer kazanır.** Tek seferlik tüketim değil, kalıcı keşif.

### 7.8.2 INT Nasıl Artar — Kullanım Bazlı
- **Zihin skilleri** ile artar: `Quick Thought → Accelerated Mind → Parallel Minds` hattı (bkz Spider_Race_Data Tablo 1-D).
- **Okuma eylemi** ile artar: kitap okumak INT kazandırır.
- **Pozitif döngü:** oku → biraz akıllan → daha derin katmanlar açılır → daha çok oku. Oyuncuyu lore'a doğal çeker.

### 7.8.3 INT'in Kapsamı — Üç Kapı
| Kapı | Etki |
|------|------|
| **Lore anlama** | Kurban kitaplarının derin katman eşiği |
| **Büyü / MP ekseni** | Yüksek INT = daha güçlü büyü, daha geniş MP havuzu |
| **Skill/evrim koşulları** | Bazı skiller ve evrim dalları minimum INT ister |

> **Tasarım sonucu:** INT artık soyut bir sayı değil, somut bir *anahtar*. Oyuncu "şu kitabı tam anlamak / şu büyüyü kullanmak / şu evrime geçmek için daha akıllı olmalıyım" diye hedef koyar. Anime bağı: zihinsel skiller (hızlı düşünce, paralel zihin) karakteri System'i *okuyan ve manipüle eden* şeye dönüştürür — zekâ = sistemi okuma yetisi.

---

## 7.9 Stamina (SP) — Savaş Kaynağı & Idle Sınırlayıcı

HP ve MP yanında **üçüncü kaynak.** Çekirdek rolü: savaşma kapasitesini ve
idle/auto-battle farm'ını sınırlamak — "sonsuz idle farm" yerine **soluklanma/dinlenme
ritmi** getirir. Bağlı stat: **VIT** (Endurance/Toughness dayanıklılık hattıyla sinerji).

### 7.9.1 Tüketim (Drain)
- Savaş SP harcar — taban örn. **-1 SP/s.** **Hem manuel hem auto-battle** tüketir →
  idle/offline farm'ın **doğal sınırlayıcısı** (bkz §7).
- Drain içeriğe göre ölçeklenir: **bölge derinliği × canavar gücü × boss.** Derin zon /
  güçlü canavar / boss = daha hızlı SP gider.
- **Data-driven:** efektif drain = `düşman.sp_drain × zon.sp_drain_çarpanı` (hardcode değil).

### 7.9.2 Regen & Büyütme
- **Regen:** savaş dışında / dinlenirken taban yavaş regen. Skiller **+1/+2 SP/s** ekler
  (Stamina-regen skill hattı; veri alanı `skill.sp_regen`). Değerler bölgeye/forma göre ayarlı.
- **Max SP — Stamina Training:** ayrı bir eğitim eylemiyle tavan SP artar. Savaşırken
  **çok az** (aşırı düşük oranda) pasif birikim de olur — ama asıl artış training'le gelir.

### 7.9.3 Tükenme — Kademeli Yorgunluk + Cascade
SP bittiğinde oyun durmaz; **yorgunluk** devreye girer ve kaynak zinciri (cascade) işler:

| Aşama | Koşul | Sonuç |
|-------|-------|-------|
| **1. Normal** | SP > 0 | Tam performans. |
| **2. Yorgunluk** | SP = 0 | **Cezalı savaş** (zayıf vuruş / düşük isabet / stat düşüşü) **+ HP erir** — savaşa devam edersen candan gider. |
| **3. MP→Stamina (gizli/bulunan)** | "MP transfer" yeteneği zindanda **açıldıysa** | SP bitince HP yerine **MP** stamina olarak yakılır → HP'yi korur. |
| **4. Tekrar HP** | MP de bitti | Yeniden **HP erir** (2. aşamaya döner). |

> **Cascade:** `SP → (MP-transfer açıksa) MP → HP`. MP→Stamina transfer bir **keşif ödülüdür**
> (zindanda bulunur) — kalıcı bir nefes payı verir ama sınırsız değil.

### 7.9.4 Sistem Bağları
- **Idle sınırlayıcı (ana rol):** auto-battle SP tükettiğinden offline/idle kazanç sonsuz
  değil — SP bitince yorgunluk/HP erimesi devreye girer. Offline hesapta SP drain/regen
  dengesi modellenir, kazanç doğal tavanlanır (bkz §7).
- **Brink/Overdraw sinerjisi (§6.1):** SP→HP yakma, düşük-can risk penceresini besler —
  bilinçli risk oyuncusu SP'yi tüketip HP'ye binerek regen/resistance kazanımını hızlandırır.
- **Açlıktan farkı (§7.4):** Hunger = uzun vadeli beslenme baskısı; SP = kısa vadeli savaş
  soluklanması. Farklı zaman ölçeği, üst üste binmez.
- **Çok dilli:** tüm SP etiketleri ve yorgunluk mesajları lokalizasyon tablosundan gelir.

---

## 8. İçerik İlerleme Yapısı (Zonlar)

- Oyun **bölge/zon** bazlı: Lower Stratum → Middle → Upper → Surface → ... (animedeki yer altı labirenti gibi katmanlar).
- Her zonun: kendi düşmanları, hasar tipleri (yeni resistance fırsatları), loot'u, "boss"u var.
- İlerlemek için belli güç/evrim eşiği gerekir → doğal gating.

### 8.1 Katmanlı Harita Yapısı
Hiyerarşik yapı: **Katman → Bölüm → Oda.**
- **Katman** (en büyük birim) → içinde **Bölümler** → her bölümde **Odalar.**
- **3. katman özel:** ayrıca dikey **Katlar**a bölünür (en derin katman aşağı doğru derinleşir).
- **Katlar = Cehennem'e yaklaşma:** kat derinleştikçe koşullar Cehennem'e (§8.5) yaklaşır — en derin kat, normal modda bile "mini-cehennem" gibi. Zorluk dikey derinlikle artar.
- Yapı hem **zorluğu** (derinlik = zorluk) hem **keşif alanını** tanımlar.

> **Uygulanan oda modeli (kod):** Her **katmanın** kat sayısı `dungeon.json`'da sabittir (şu an 7). **Her katın oda sayısı, o kata özgü olarak `[minRooms, maxRooms]` (varsayılan 12–20) arasından bağımsız yuvarlanır** — aynı katmanın katları birbirinden farklı genişlikte olur. Her katın son odası o katın **boss**'udur. Yuvarlanan değerler oyuncu başına bir kez üretilip kayda yazılır (`state.layerRooms[layer][kat]`), böylece harita oturum boyunca sabit kalır. Keşif (fog-of-war) **kat-bazlı** takip edilir (`state.exploredMax[layer][kat]`).

### 8.2 Keşif Sistemi — İncremental Mantığı (3B değil)
**Önemli tasarım ilkesi:** Bu bir incremental oyundur — fiziksel "gidip duvar yokla" YOK. Keşif **bilgi-kapısı** mekaniğidir: gizli oda doğrudan görünmez, ama **doğru bilgi onu açar.**

**Gizli oda nasıl bulunur — "Ara" + Bilmece çözme:**
- Bazı gizli noktalar basit bir **"Ara" eylemi** ile bulunur; sonuç **text olarak** bildirilir (örn. "bir şey buldun" / "burası boş" / "gizli geçit açıldı").
- Bazı odalar ise **bilmece/şifre** ister — "açıl susam açıl" mantığı: oyuncu bir **metin kutusuna cevabı yazar**, doğru kelime/cevap odayı açar.
  - Cevap genelde **lore'da gizlidir** — kurban kitaplarını/cesetleri okuyup ipuçlarını birleştiren oyuncu çözer.
  - "Bilgi = hayatta kalma" (§1.1) felsefesinin en saf hali: bilgiyi sadece *bulmak* değil, *anlamak/birleştirmek* gerekir.
  - ARG/Souls-vari gizem → topluluk bilmeceleri birlikte çözer, oyun-dışı wiki kültürü doğar.
- "Ara" ve bilmece her yerde işe yaramaz — önce bir **bilgi kapısı** gerekir (aşağıdaki iki yoldan biri).

**Gizli odanın kilidini açan iki bilgi yolu:**
1. **Appraisal gözü (~LV7+):** "Gören göz" gizli oda/geçit *sezer* (§5.0.7). Yüksek Appraisal = çevredeki gizli noktaları fark etme.
2. **Cesetten harita VEYA lore (random loot):** Etrafta senden önce gelmiş **kurban cesetleri** var. Üzerlerini araştırınca (şansa bağlı) **harita parçası veya lore parçası** çıkabilir.
   - **Random:** hangi katman/katta düşeceği belli değil — belki aşağıda, belki cesetle aynı yerde.
   - **Cesedin gücüne bağlı:** daha güçlü/önemli görünen ceset daha değerli/derin harita ya da lore taşıyabilir. (Appraisal ile ceset okunup "bu değerli mi?" anlaşılır.)
   - **Saklanabilir:** oyuncu hemen kullanmak zorunda değil — loot'layıp biriktirebilir, sonra bakabilir.
   - **Harita = bölgeyi işaret eder** (yine de "Ara"/bilmece gerekir). **Lore = bilmecelerin ipuçlarını taşır** (kurban kitabı evreniyle aynı — senden öncekilerin hikâyesi).

> **Tipik keşif döngüsü:** Güçlü görünen ceset bul → Appraisal ile oku → loot'la → (şansa bağlı) harita veya lore çıkar → lore bir bilmecenin ipucunu verir → gizli odada "açıl susam açıl" misali doğru cevabı yaz → oda açılır. Hepsi **bilgi-temelli**, hiç duvar yoklamadan.
> **Felsefe bağı:** Keşif = mekânsal gezinme değil, **bilgiye sahip olma ve onu anlama.** "Bilgi = hayatta kalma" (§1.1) keşif tarafında da geçerli.
> **Çok dilli:** tüm arama sonucu metinleri, bilmeceler/cevaplar, harita/ceset/lore etiketleri lokalizasyon tablosundan gelir. (Bilmece cevap kontrolü dile duyarlı olmalı — her dilde geçerli cevap tanımlanır.)

---

## 8.5 Zorluk Seviyeleri

Oyun başında seçilir. Zorluk **üç boyutu birden** değiştirir: başlangıç yeri + düşman çarpanı + ölüm cezası. Ayrıca **oyuncu tarafına da** yansır (düşman+oyuncu makası iki taraftan açılır). Denge hep **Normal** üzerinden kurulur; diğerleri ondan sapmadır. "Bilgi = hayatta kalma" felsefesi (§1.1) en çok burada test edilir.

| Mod | Başlangıç yeri | Düşman | Oyuncu tarafı | Ölüm cezası |
|-----|----------------|--------|---------------|-------------|
| **Kolay** | Üst katman (güvenli) | Zayıf | **Küçük boost** | Hafif (kısa geri sayım, az kayıp) |
| **Normal** | Üst-orta | Baz (modifier yok) | **Modifier yok** (referans) | Orta |
| **Zor** | Orta-derin | Güçlü | **Küçük debuff** | Ağır (zon başına dönüş) |
| **Cehennem** | **Doğrudan dip — son boss bölgesi** | Acımasız + akıllı/agresif | Hayatta kalma baskısı tavan | **Kalıcı risk (seçilebilir permadeath)** |

> **Normal = referans nokta:** Hiçbir modifier yok, her şey "olması gereken" baz değerde. Tüm denge buradan kurulur, diğer modlar sadece çarpan/sapma → geliştirmesi temiz.

### 8.5.1 Cehennem Modu — "Tam Cehennem"
Oyunun saf felsefesi: en ölümcül yerde, zayıf bir başlangıç yaratığı olarak doğarsın. Etraf seni anında öldürebilecek şeylerle dolu. Kaba güçle hayatta kalamazsın — **sadece her skili, kombinasyonu ve kaçış mekaniğini ustaca bilerek** yaşarsın.

Yüksek modifier + dipten başlamanın üstüne **üç ek baskı** (hepsi birden):
- **Açlık/regen acımasız:** beslenme ve iyileşme çok daha zor; hayatta kalma baskısı tavan.
- **Skill exp yavaş:** her güç zorlu kazanılır, hiçbir şey bedava gelmez.
- **Akıllı/agresif düşmanlar:** pasif beklemezler, seni aktif avlarlar. Köşeye sinip farm yok.

- **Anime bağı:** Birebir animenin açılışı — ana karakter en tehlikeli katmanda minik bir yaratık olarak doğup oradan kazıyarak yükseliyordu.
- **Erişim:** **Tutorial'dan sonra** herkese açık. Kapı kapalı değil; temel mekanikleri öğrenen "hazırım" diyen dalabilir. (Tutorial şartı kör atışı engeller.)

### 8.5.2 Permadeath — Seçilebilir & Ödüllü
Cehennem'de permadeath bir **seçimdir**, zorunluluk değil:
| Seçim | Davranış |
|-------|----------|
| **Permadeath KAPALI** | Normal Cehennem; ölünce ağır ceza ama devam. Bitirme ödülü yok. |
| **Permadeath AÇIK** | Ölüm = gerçekten başa dönüş (yüksek bahis). Bitirirsen aşağıdaki ödüller. |

**Bitirme ödülü (permadeath açıkken Cehennem'i geçince):**
1. **Irka-özel kalıcı güç bonusu:** Cehennem'i hangi ırkla geçtiysen, o kalıcı bonus **sadece o ırk için** geçerli. Örümcekle geçtiysen bonus sadece örümcek oynarken aktif; başka ırkla yeni oyunda yok — onu da o ırkla Cehennem'i geçerek kazanman gerek.
2. **Özel kilit:** Sadece Cehennem'le açılan içerik (özel skill / ırk / form). Normal yoldan asla ulaşılamaz → gerçek prestij.

> **Tasarım gücü:** Irka-özel bonus, "her ırkla Cehennem'i geç" gibi devasa bir uzun vadeli hedef yaratır. Her ırkın kendi Cehennem zaferi ve ödülü var → tek seferlik "hepsini ezdim" yok, kat kat tekrar oynama değeri. Irk kimliğini de güçlendirir.

> **Felsefe:** Baskı yapma, cesaret edeni ödüllendir. Permadeath'i göze almayan da Cehennem'i yine deneyimleyebilir; göze alan kalıcı hakkını alır.

---

## 8.7 UI — Log & Panel Sistemi

Arayüzün merkezinde **açılıp kapanabilir (collapsible) paneller** var. Oyuncu hangi bilgiyi istiyorsa onu açar; ekran boğulmaz. "Bilgi = hayatta kalma" felsefesiyle (§1.1) doğrudan örtüşür — oyuncu loglardan ne olduğunu okuyup öğrenir.

### 8.7.1 Action Log (Combat Log) — ana alan
GUI'da büyük yer kaplar, savaşın canlı akışını gösterir. Açılıp kapanabilir.
- **Verilen hasar:** hangi skill, ne kadar, hangi tipte (zehir/ateş/fiziksel...).
- **Alınan hasar:** kaynaktan gelen hasar + tipi (resistance kazanımıyla ilişkili).
- **Skill olayları:** tetiklenen skiller, level up, evrim bildirimleri.
- Akış halinde, en yeni üstte; filtrelenebilir (sadece hasar / sadece skill vb.) olabilir.

### 8.7.2 Loot / Ganimet Paneli — collapsible
Kazanımların kaydı:
- Düşen item/ganimet,
- Kazanılan XP / skill exp / resistance exp,
- Yenen av / tokluk kazancı (açlık sistemiyle bağlı),
- Evolution Point kazanımı.
- Doğru tutulur (toplam sayaçlar) ve oturum/zon bazında özetlenebilir.

### 8.7.3 Discovery / Keşif Paneli — collapsible (Loot'tan ayrı)
Lore ve keşif kaydı:
- Okunan kurban kitapları (§7.7) — hangi katmanı çözüldü (INT'e göre derinlik),
- Bulunan gizli odalar,
- Açılan lore parçaları, ipuçları,
- Keşfedilen yeni zon/canavar/özel besin.
- Loot'tan **ayrı** tutulur çünkü farklı bir ilerleme ekseni (bilgi/lore vs maddi kazanç).

### 8.7.4 Genel İlkeler
- Tüm paneller **collapsible** — oyuncu düzeni kendi kurar.
- **Çok dilli (kritik):** Tüm log metinleri (hasar, ödül, kitap adı, olay) **lokalizasyon tablosundan** gelir. Hiçbir dil (Türkçe/İngilizce) hardcode edilmez — sayılar, tipler, etiketler, mesajlar dahil. Oyuncu hangi dildeyse log o dilde akar.
- **Data-driven:** Log satırları olay tipinden üretilir (`{olay_tipi, kaynak, hedef, değer, tip}` → lokalize şablon), elle yazılmaz.
- **Mobil-uyumlu (responsive):** UI telefon tarayıcısında rahat çalışır — dokunmatik-dostu hedefler, esnek yerleşim. Bedava demo GitHub Pages'te bir URL'den açılır (bkz §11).

---

```
        ┌──────────────┐
        │   SAVAŞ        │
        └──────┬───────┘
   ┌───────────┼───────────┐
   ▼           ▼           ▼
[Skill EXP] [Resist EXP] [Race EXP]
   │           │           │
   ▼           ▼           ▼
[Skill LV] [Resist LV] [Evolution Pt]
   │           │           │
   ▼           ▼           ▼
[Skill Evrim][Nullity]  [Evolution Ağacı]
   └───────────┴───────────┘
               ▼
        [Daha güçlü karakter] → yeni zon
```

---

## 10. İleride / Kenarda (Şimdilik tasarlanmıyor)

- **Taboo / gizli skill**: kill/ego biriktikçe gizli ilerleyen endgame mekanik. **Meditasyon (§7.6) ile aynı "gizli ilerleme hattı" altyapısına oturacak** — zen/aydınlık yolun karşı kutbu olarak. Mimaride yer açık bırakılacak, içerik sonra.
- **Roblox portu**: ana oyundan tamamen ayrı kod tabanı (Lua). Ana plan PC/Steam.
- Multi-user / online özellikler: ana plan single-player; sonra düşünülür.

---

## 11. Teknik Mimari Notları (Web-native TypeScript)

> **Motor revizyonu (2026-06-16):** Godot 4 + C# yerine **web-native TypeScript** seçildi —
> bedava tarayıcı demosu + Cloudflare backend için. İstemci: TS + Vite (DOM/Canvas).
> Backend: Cloudflare Workers + R2/KV. Steam'e ileride Electron/Tauri sarmalıyla geçilir
> (Melvor Idle örneği). Aşağıdaki kavramlar web karşılıklarına eşlenir: Resource→JSON,
> Signal→event-emitter, save→`localStorage`.

- **Tick sistemi**: tek bir `GameClock` (örn. 0.1s tick, `setInterval`/rAF) tüm idle birikimini sürer; UI ondan ayrık güncellenir.
- **Data-driven tasarım**: skiller, evrimler, ırklar, düşmanlar **kodda hardcode değil**, JSON/Resource dosyalarında tanımlı → yeni içerik = yeni veri, kod değişmez. *("hiçbir şeyi hardcode etme" prensibi.)*
- **Save sistemi**: JSON serialize; offline progress için son kayıt zamanı (timestamp) tutulur.
- **Event/Signal mimarisi**: "skill level up", "evolution available" gibi olaylar sinyalle yayılır, UI dinler (sinyal/observer deseni).
- **Lokalizasyon hazır**: tüm metin (skill adı, açıklama, bildirim) çeviri tablosundan gelir, hiçbir dil hardcode edilmez → çok dilli destek baştan açık.

---

## 12. İlk Milestone Önerisi (Doküman sonrası)

1. **Prototip core loop**: 1 ırk, 3-4 skill, 1 resistance tipi, 1 zon, manuel savaş + skill LV → evrim.
2. **Idle katmanı**: auto-battle + offline progress.
3. **Evolution ağacı**: 1 ırk için 3-4 adımlık dallanan ağaç.
4. **Rebirth iskeleti**: gatekeeper boss + sistem mesajı + sıfırlama/kilit açma döngüsü. (Gizli meditasyon hattının altyapısı da burada kurulur.)
5. **Data-driven refactor**: her şeyi JSON'a taşı.
6. **UI cila** + Steam entegrasyonu.

---

*Bu doküman canlı bir taslaktır — sistemler netleştikçe güncellenecek.*
