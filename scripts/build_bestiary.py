"""Rebuild the enemy roster from the 'So I'm a Spider, So What?' (Kumo desu ga) labyrinth bestiary.
4 strata (Upper/Middle/Lower/Bottom), authentic monster names, with behaviour variety.
Also rewires dungeon.json (4 layers, reachable tierReqs — binary trees cap at tier 5) and i18n names.
"""
import json

SKILLS = {s['id'] for s in json.load(open('data/skills.json', encoding='utf-8'))}

# Enemies with a hand-drawn portrait in data/monsters/<id>.png (else the emoji icon is used).
# All 26 enemies now have art.
IMAGE_IDS = {
    'system_guardian', 'cave_horror', 'abyss_horror', 'flame_jaw', 'shade_wraith', 'lesser_taratect',
    'small_lesser_taratect', 'venom_brute', 'earth_dragon_kaguna', 'earth_dragon_rendill',
    'small_poison_taratect', 'elroe_basilisk', 'greater_taratect', 'elroe_geafrog', 'magma_newt',
    'earth_dragon_araba',
    'elroe_frog', 'elroe_gunerave', 'elroe_cohgou', 'queen_taratect', 'elroe_pebbluck',
    'elroe_gunesohka', 'finjicote', 'elroe_gunerush', 'elroe_guneseven', 'abyss_stalker',
}

# (id, tr, en, hp, atk, dmg, dmg2|None, satiety, ep, icon, race|None, [skills], behavior|{})
E = [
  # --- UPPER STRATUM (Üst Kat) — weak, poison + status ---
  ('elroe_frog', 'Elroe Kurbağası', 'Elroe Frog', 10, 2, 'physical', None, 8, 1, '🐸', None, ['pounce'], {}),
  ('elroe_geafrog', 'Elroe Dev Kurbağası', 'Elroe Geafrog', 16, 3, 'poison', None, 12, 2, '🐸', None, ['venom_bite'], {'statusBoost': 1.6}),
  ('small_lesser_taratect', 'Küçük Alt Taratect', 'Small Lesser Taratect', 14, 3, 'poison', None, 10, 2, '🕷️', 'spider', ['venom_bite', 'silk_thread'], {}),
  ('small_poison_taratect', 'Küçük Zehir Taratect', 'Small Poison Taratect', 18, 3, 'poison', None, 12, 2, '🕷️', 'spider', ['venom_bite', 'sticky_coat'], {'statusBoost': 1.7}),
  ('elroe_basilisk', 'Elroe Basilisk', 'Elroe Basilisk', 22, 4, 'physical', 'petrify', 14, 3, '🦎', None, ['chitin_hide'], {'armorPct': 0.3, 'statusBoost': 1.4}),
  ('elroe_pebbluck', 'Elroe Kaya Kaplumbağası', 'Elroe Pebbluck', 30, 3, 'physical', None, 16, 3, '🐢', None, ['chitin_hide'], {'armorPct': 0.5}),
  ('lesser_taratect', 'Alt Taratect', 'Lesser Taratect', 42, 6, 'poison', None, 22, 6, '🕷️', 'spider', ['venom_bite', 'binding_silk'], {'regen': 0.03}),  # Upper boss
  # --- MIDDLE STRATUM (Orta Kat) — magma / fire ---
  ('elroe_gunerush', 'Elroe Gunerush', 'Elroe Gunerush', 45, 9, 'fire', None, 24, 5, '🐉', None, ['flame_bolt'], {}),
  ('elroe_gunerave', 'Elroe Gunerave', 'Elroe Gunerave', 50, 8, 'fire', None, 26, 5, '🐍', None, ['flame_bolt'], {'doubleStrike': True}),
  ('elroe_gunesohka', 'Elroe Gunesohka', 'Elroe Gunesohka', 55, 10, 'fire', None, 28, 6, '🔥', None, ['fire_breath'], {'enrage': 0.5}),
  ('elroe_guneseven', 'Elroe Guneseven', 'Elroe Guneseven', 60, 11, 'fire', 'physical', 30, 6, '🔥', None, ['fire_breath'], {'lifesteal': 0.2}),
  ('magma_newt', 'Magma Semenderi', 'Magma Newt', 48, 9, 'fire', None, 24, 5, '🦎', None, ['flame_bolt'], {'armorPct': 0.25}),
  ('elroe_cohgou', 'Elroe Mağara Maymunu', 'Elroe Cave Ape', 52, 10, 'physical', 'stun', 26, 5, '🐒', None, ['fist_strike', 'pounce'], {'doubleStrike': True}),
  ('flame_jaw', 'Alev Çene', 'Flame Jaw', 95, 16, 'fire', None, 34, 11, '🐲', None, ['fire_breath'], {'enrage': 0.6}),  # Middle boss
  # --- LOWER STRATUM (Alt Kat) — powerful swarms ---
  ('finjicote', 'Finjicote', 'Finjicote', 110, 20, 'pierce', None, 40, 12, '🐝', None, ['sharp_claw'], {'doubleStrike': True, 'statusBoost': 1.5}),
  ('greater_taratect', 'Büyük Taratect', 'Greater Taratect', 140, 22, 'poison', 'physical', 46, 14, '🕸️', 'spider', ['necro_toxin', 'cutting_wire'], {'regen': 0.04}),
  ('shade_wraith', 'Gölge Tayfı', 'Shade Wraith', 120, 24, 'soul', None, 42, 13, '👻', None, ['shadow_bolt', 'soul_gaze'], {'statusBoost': 1.5}),
  ('venom_brute', 'Zehir Devi', 'Venom Brute', 130, 21, 'poison', 'acid', 44, 13, '🦂', None, ['venom_bite', 'maul'], {'lifesteal': 0.15}),
  ('abyss_stalker', 'Uçurum Avcısı', 'Abyss Stalker', 125, 23, 'pierce', None, 42, 13, '🦂', None, ['reaper_edge'], {'doubleStrike': True}),
  ('cave_horror', 'Mağara Dehşeti', 'Cave Horror', 135, 25, 'fear', 'frost', 46, 14, '👹', None, ['shadow_bolt'], {'statusBoost': 1.8}),
  ('earth_dragon_araba', 'Toprak Ejderhası Araba', 'Earth Dragon Araba', 210, 30, 'physical', None, 60, 22, '🐲', None, ['heavy_slam', 'shattering_strike'], {'armorPct': 0.35, 'enrage': 0.5}),  # Lower boss
  # --- BOTTOM STRATUM (Dip Kat) — Earth Dragon guardians, System Core ---
  ('earth_dragon_kaguna', 'Toprak Ejderhası Kaguna', 'Earth Dragon Kaguna', 280, 38, 'physical', 'lightning', 70, 28, '🐉', None, ['shattering_strike'], {'armorPct': 0.4, 'regen': 0.03}),
  ('earth_dragon_rendill', 'Ateş Ejderhası Rendill', 'Fire Dragon Rendill', 300, 42, 'fire', None, 72, 30, '🐉', None, ['fire_breath', 'scorching_breath'], {'enrage': 0.6, 'lifesteal': 0.2}),
  ('queen_taratect', 'Kraliçe Taratect', 'Queen Taratect', 320, 40, 'magic', 'poison', 80, 32, '👑', 'spider', ['necro_toxin', 'spatial_web'], {'regen': 0.05, 'statusBoost': 1.6}),
  ('abyss_horror', 'Uçurum Kâbusu', 'Abyss Horror', 290, 44, 'soul', None, 74, 30, '👁️', None, ['shadow_bolt', 'soul_gaze'], {'statusBoost': 2.0}),
  ('system_guardian', 'Sistem Bekçisi', 'System Guardian', 460, 55, 'physical', 'soul', 100, 45, '🐲', None, ['shattering_strike', 'soul_gaze'], {'armorPct': 0.4, 'enrage': 0.5, 'regen': 0.04}),  # Bottom boss / GATEKEEPER
]

enemies = []
problems = []
tr_names, en_names = {}, {}
for (eid, tr, en, hp, atk, dmg, dmg2, sat, ep, icon, race, skills, beh) in E:
    for sk in skills:
        if sk not in SKILLS:
            problems.append(f'{eid}: bilinmeyen skill {sk}')
    obj = {'id': eid, 'locKey': f'enemy.{eid}.name', 'hp': hp, 'attack': atk, 'damageType': dmg,
           'satiety': sat, 'ep': ep, 'icon': icon, 'grantSkills': skills}
    if dmg2:
        obj['damageType2'] = dmg2
    if race:
        obj['race'] = race
    if beh:
        obj['behavior'] = beh
    if eid in IMAGE_IDS:  # hand-drawn portrait available (data/monsters/<id>.png)
        obj['image'] = f'monsters/{eid}.png'
    enemies.append(obj)
    tr_names[f'enemy.{eid}.name'] = tr
    en_names[f'enemy.{eid}.name'] = en

if problems:
    raise SystemExit('SKILL HATALARI:\n  ' + '\n  '.join(problems))

# dungeon: 4 strata with reachable tierReqs (binary trees cap at tier 5)
dungeon = {'layers': [
  {'id': 1, 'locKey': 'layer.1.name', 'tierReq': 0, 'floors': 7, 'roomsPerFloor': 16, 'minRooms': 12, 'maxRooms': 20, 'spDrainMult': 1,
   'enemyPool': ['elroe_frog', 'elroe_geafrog', 'small_lesser_taratect', 'small_poison_taratect', 'elroe_basilisk', 'elroe_pebbluck'], 'boss': 'lesser_taratect', 'element': 'poison', 'explorationRate': 0.15},
  {'id': 2, 'locKey': 'layer.2.name', 'tierReq': 2, 'floors': 7, 'roomsPerFloor': 16, 'minRooms': 12, 'maxRooms': 20, 'spDrainMult': 2,
   'enemyPool': ['elroe_gunerush', 'elroe_gunerave', 'elroe_gunesohka', 'elroe_guneseven', 'magma_newt', 'elroe_cohgou'], 'boss': 'flame_jaw', 'element': 'fire', 'ambient': {'drainPct': 0.004, 'resistBoost': 2.5}, 'explorationRate': 0.2},
  {'id': 3, 'locKey': 'layer.3.name', 'tierReq': 3, 'floors': 7, 'roomsPerFloor': 16, 'minRooms': 12, 'maxRooms': 20, 'spDrainMult': 3,
   'enemyPool': ['finjicote', 'greater_taratect', 'shade_wraith', 'venom_brute', 'abyss_stalker', 'cave_horror'], 'boss': 'earth_dragon_araba', 'element': 'physical', 'ambient': {'drainPct': 0.005, 'resistBoost': 2.5}, 'explorationRate': 0.2},
  {'id': 4, 'locKey': 'layer.4.name', 'tierReq': 4, 'floors': 7, 'roomsPerFloor': 16, 'minRooms': 12, 'maxRooms': 20, 'spDrainMult': 4,
   'enemyPool': ['earth_dragon_kaguna', 'earth_dragon_rendill', 'queen_taratect', 'abyss_horror'], 'boss': 'system_guardian', 'gatekeeper': True, 'element': 'soul', 'ambient': {'drainPct': 0.006, 'resistBoost': 3.0}, 'explorationRate': 0.25},
]}

json.dump(enemies, open('data/enemies.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.dump(dungeon, open('data/dungeon.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for lang, names in [('tr', tr_names), ('en', en_names)]:
    p = f'data/i18n/{lang}.json'
    d = json.load(open(p, encoding='utf-8'))
    # remove obsolete enemy.* names that are no longer used
    for k in [k for k in d if k.startswith('enemy.') and k.endswith('.name') and k not in names]:
        del d[k]
    d.update(names)
    # stratum (layer) names
    layer_tr = {'layer.1.name': 'Üst Kat', 'layer.2.name': 'Orta Kat (Magma)', 'layer.3.name': 'Alt Kat', 'layer.4.name': 'Dip Kat (Çekirdek)'}
    layer_en = {'layer.1.name': 'Upper Stratum', 'layer.2.name': 'Middle Stratum (Magma)', 'layer.3.name': 'Lower Stratum', 'layer.4.name': 'Bottom Stratum (Core)'}
    d.update(layer_tr if lang == 'tr' else layer_en)
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# behaviour distribution report
from collections import Counter
beh_count = Counter()
for o in enemies:
    for k in o.get('behavior', {}):
        beh_count[k] += 1
print(f'OK. {len(enemies)} düşman (4 strata). Davranış dağılımı: {dict(beh_count)}')
print(f'Boss/gatekeeper: lesser_taratect, flame_jaw, earth_dragon_araba, system_guardian(GK)')
