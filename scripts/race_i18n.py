"""Add tr/en names for the 68 new race forms; verify existing forms still have names."""
import json

# id -> (tr, en) for every NEW form id introduced by rebuild_race_trees.py
NEW = {
    # --- slime ---
    'toxic_ooze': ('Zehirli Sümük', 'Toxic Ooze'),
    'corrosive_horror': ('Aşındırıcı Dehşet', 'Corrosive Horror'),
    'plague_ooze': ('Veba Sümüğü', 'Plague Ooze'),
    'venom_ooze': ('Ağı Sümüğü', 'Venom Ooze'),
    'dissolver_ooze': ('Çözücü Sümük', 'Dissolver Ooze'),
    'prism_ooze': ('Prizma Sümük', 'Prism Ooze'),
    'reflector_ooze': ('Yansıtıcı Sümük', 'Reflector Ooze'),
    'diamond_ooze': ('Elmas Sümük', 'Diamond Ooze'),
    'shard_ooze': ('Kıymık Sümük', 'Shard Ooze'),
    'plague_god': ('Veba Tanrısı', 'Plague God'),
    'venom_overlord': ('Ağı Efendisi', 'Venom Overlord'),
    'acid_god': ('Asit Tanrısı', 'Acid God'),
    'void_devourer': ('Boşluk Yutucu', 'Void Devourer'),
    'crystal_god': ('Kristal Tanrı', 'Crystal God'),
    'primordial_god': ('İlksel Tanrı', 'Primordial God'),
    'mirror_god': ('Ayna Tanrısı', 'Mirror God'),
    'adamant_colossus': ('Çelik Devası', 'Adamant Colossus'),
    # --- skeleton ---
    'dread_reaver': ('Dehşet Yağmacısı', 'Dread Reaver'),
    'bone_sniper': ('Kemik Nişancı', 'Bone Sniper'),
    'bone_marksman': ('Kemik Avcı', 'Bone Marksman'),
    'soul_reaper': ('Ruh Biçen', 'Soul Reaper'),
    'death_knight': ('Ölüm Şövalyesi', 'Death Knight'),
    'wraith_lord': ('Tayf Lordu', 'Wraith Lord'),
    'bone_colossus': ('Kemik Devası', 'Bone Colossus'),
    'carnage_lord': ('Katliam Lordu', 'Carnage Lord'),
    'bone_artillery': ('Kemik Topçusu', 'Bone Artillery'),
    'death_archer_king': ('Ölüm Okçu Kralı', 'Death Archer King'),
    'soul_sniper': ('Ruh Nişancı', 'Soul Sniper'),
    'lich_god': ('Liç Tanrısı', 'Lich God'),
    'soul_sovereign_skel': ('Ruh Hükümdarı', 'Soul Sovereign'),
    'reaper_god': ('Biçen Tanrı', 'Reaper God'),
    'death_lord': ('Ölüm Lordu', 'Death Lord'),
    'doom_knight': ('Kıyamet Şövalyesi', 'Doom Knight'),
    'wraith_god': ('Tayf Tanrısı', 'Wraith God'),
    # --- wyrmling ---
    'magma_drake': ('Magma Ejderi', 'Magma Drake'),
    'inferno_wyrm': ('Cehennem Vyrmı', 'Inferno Wyrm'),
    'volcanic_dragon': ('Volkanik Ejderha', 'Volcanic Dragon'),
    'cinder_wyrm': ('Köz Vyrmı', 'Cinder Wyrm'),
    'storm_dragon': ('Fırtına Ejderhası', 'Storm Dragon'),
    'tempest_wyrm': ('Kasırga Vyrmı', 'Tempest Wyrm'),
    'nightmare_drake': ('Kâbus Ejderi', 'Nightmare Drake'),
    'flame_god_dragon': ('Alev Tanrı Ejderhası', 'Flame God Dragon'),
    'phoenix_wyrm': ('Anka Vyrmı', 'Phoenix Wyrm'),
    'magma_god': ('Magma Tanrısı', 'Magma God'),
    'ember_sovereign': ('Köz Hükümdarı', 'Ember Sovereign'),
    'ashfall_dragon': ('Kül Yağmuru Ejderhası', 'Ashfall Dragon'),
    'thunder_god_dragon': ('Şimşek Tanrı Ejderhası', 'Thunder God Dragon'),
    'storm_sovereign': ('Fırtına Hükümdarı', 'Storm Sovereign'),
    'gale_god': ('Bora Tanrısı', 'Gale God'),
    'void_god_dragon': ('Boşluk Tanrı Ejderhası', 'Void God Dragon'),
    'shadow_god_dragon': ('Gölge Tanrı Ejderhası', 'Shadow God Dragon'),
    # --- golem ---
    'steel_golem': ('Çelik Golem', 'Steel Golem'),
    'obsidian_golem': ('Obsidyen Golem', 'Obsidian Golem'),
    'prism_golem': ('Prizma Golem', 'Prism Golem'),
    'fortress_golem': ('Kale Golem', 'Fortress Golem'),
    'inferno_colossus': ('Cehennem Devası', 'Inferno Colossus'),
    'volcano_golem': ('Yanardağ Golem', 'Volcano Golem'),
    'basalt_titan': ('Bazalt Titan', 'Basalt Titan'),
    'onyx_colossus': ('Oniks Devası', 'Onyx Colossus'),
    'rune_colossus': ('Rün Devası', 'Rune Colossus'),
    'crystal_titan_golem': ('Kristal Titan', 'Crystal Titan'),
    'diamond_colossus': ('Elmas Devası', 'Diamond Colossus'),
    'world_golem': ('Dünya Golem', 'World Golem'),
    'bastion_colossus': ('Sur Devası', 'Bastion Colossus'),
    'magma_god_golem': ('Magma Tanrı Golem', 'Magma God Golem'),
    'lava_sovereign': ('Lav Hükümdarı', 'Lava Sovereign'),
    'cinder_titan': ('Köz Titanı', 'Cinder Titan'),
    'obsidian_god': ('Obsidyen Tanrı', 'Obsidian God'),
}

evos = json.load(open('data/evolutions.json', encoding='utf-8'))
all_form_ids = {e['id'] for e in evos}

for lang, idx in [('tr', 0), ('en', 1)]:
    path = f'data/i18n/{lang}.json'
    data = json.load(open(path, encoding='utf-8'))
    added = 0
    for fid, names in NEW.items():
        key = f'form.{fid}.name'
        if key not in data:
            added += 1
        data[key] = names[idx]
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    # report any form id with no name key at all (existing ones should already have names)
    missing = sorted(f for f in all_form_ids if f'form.{f}.name' not in data)
    print(f'{lang}.json: +{added} new keys. Forms with NO name key: {missing if missing else "none"}')
