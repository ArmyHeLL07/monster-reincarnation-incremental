"""Add new human form i18n keys and remove obsolete ones."""
import json

OLD_FORM_IDS = {
    'swordmaster','battle_mage','guardian','stalwart','arcane_knight',
    'warlord','conqueror','war_incarnate','divine_warrior','sovereign_knight',
    'human_sovereign','arcane_lord','spell_binder','arcane_warlord','war_mage',
    'divine_mage','arcane_sage','arcane_sovereign','iron_guardian','fortress_knight',
    'bulwark','eternal_guardian','divine_shield','guardian_sovereign','iron_sovereign',
}

NEW_TR = {
    "form.warrior_path.name": "Savaşçı",
    "form.scholar_path.name": "Bilge",
    "form.shadow_warrior.name": "Gölge Savaşçı",
    "form.elemental_mage.name": "Elemental Büyücü",
    "form.dark_scholar.name": "Karanlık Bilge",
    "form.paladin.name": "Paladin",
    "form.assassin_human.name": "Suikastçı",
    "form.berserker_human.name": "Berserker",
    "form.pyromancer.name": "Piromancer",
    "form.cryomancer.name": "Kriyomancer",
    "form.necromancer_human.name": "Nekromanser",
    "form.void_seeker.name": "Boşluk Arayıcı",
    "form.divine_champion.name": "İlahi Şampiyon",
    "form.holy_crusader.name": "Kutsal Haçlı",
    "form.grand_champion.name": "Yüce Şampiyon",
    "form.blade_sovereign.name": "Kılıç Hükümdar",
    "form.shadow_lord.name": "Gölge Lordu",
    "form.phantom_lord.name": "Hayalet Lordu",
    "form.blood_warlord.name": "Kan Savaş Lordu",
    "form.war_deity.name": "Savaş Tanrısı",
    "form.flame_sovereign.name": "Alev Hükümdarı",
    "form.volcano_lord.name": "Yanardağ Lordu",
    "form.blizzard_sovereign.name": "Blizzard Hükümdarı",
    "form.frost_archmage.name": "Buz Arkaüstadı",
    "form.lich_master.name": "Liç Efendisi",
    "form.death_ascendant.name": "Ölüm Yücelişi",
    "form.void_herald.name": "Boşluk Habercisi",
    "form.chaos_archmage.name": "Kaos Arkaüstadı",
}

NEW_EN = {
    "form.warrior_path.name": "Warrior",
    "form.scholar_path.name": "Scholar",
    "form.shadow_warrior.name": "Shadow Warrior",
    "form.elemental_mage.name": "Elemental Mage",
    "form.dark_scholar.name": "Dark Scholar",
    "form.paladin.name": "Paladin",
    "form.assassin_human.name": "Assassin",
    "form.berserker_human.name": "Berserker",
    "form.pyromancer.name": "Pyromancer",
    "form.cryomancer.name": "Cryomancer",
    "form.necromancer_human.name": "Necromancer",
    "form.void_seeker.name": "Void Seeker",
    "form.divine_champion.name": "Divine Champion",
    "form.holy_crusader.name": "Holy Crusader",
    "form.grand_champion.name": "Grand Champion",
    "form.blade_sovereign.name": "Blade Sovereign",
    "form.shadow_lord.name": "Shadow Lord",
    "form.phantom_lord.name": "Phantom Lord",
    "form.blood_warlord.name": "Blood Warlord",
    "form.war_deity.name": "War Deity",
    "form.flame_sovereign.name": "Flame Sovereign",
    "form.volcano_lord.name": "Volcano Lord",
    "form.blizzard_sovereign.name": "Blizzard Sovereign",
    "form.frost_archmage.name": "Frost Archmage",
    "form.lich_master.name": "Lich Master",
    "form.death_ascendant.name": "Death Ascendant",
    "form.void_herald.name": "Void Herald",
    "form.chaos_archmage.name": "Chaos Archmage",
}

for lang, new_keys in [('tr', NEW_TR), ('en', NEW_EN)]:
    path = f'data/i18n/{lang}.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Remove obsolete old-human form keys
    for fid in OLD_FORM_IDS:
        data.pop(f'form.{fid}.name', None)
        data.pop(f'form.{fid}.desc', None)
    # Add new keys
    data.update(new_keys)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'{lang}.json updated: removed {len(OLD_FORM_IDS)} old keys, added {len(new_keys)} new keys')
