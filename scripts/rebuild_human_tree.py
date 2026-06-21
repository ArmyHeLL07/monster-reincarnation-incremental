"""Rebuild human evolution tree as a pure binary branching structure."""
import json

with open('data/evolutions.json', 'r', encoding='utf-8') as f:
    evos = json.load(f)

OLD_HUMAN = {
    'novice_human','fighter_apprentice','swordmaster','battle_mage','guardian',
    'crusader','arcane_knight','stalwart','champion_human','warlord','conqueror',
    'war_incarnate','divine_warrior','sovereign_knight','human_sovereign',
    'arcane_lord','spell_binder','arcane_warlord','war_mage','divine_mage',
    'arcane_sage','arcane_sovereign','iron_guardian','fortress_knight','bulwark',
    'eternal_guardian','divine_shield','guardian_sovereign','iron_sovereign'
}

evos = [e for e in evos if e.get('id') not in OLD_HUMAN]

NEW_HUMAN = [
  # T0 base
  {"id":"novice_human","raceId":"human","locKey":"form.novice_human.name",
   "evolvesTo":["fighter_apprentice"],"levelReq":1,"statBonus":{},"grantSkills":[]},
  # T1 gateway
  {"id":"fighter_apprentice","raceId":"human","locKey":"form.fighter_apprentice.name",
   "evolvesTo":["warrior_path","scholar_path"],"levelReq":10,
   "statBonus":{"STR":1,"VIT":2,"AGI":1},
   "grantSkills":["endurance","hp_regen","sword_slash","weapon_mastery"]},
  # T2 first real choice
  {"id":"warrior_path","raceId":"human","locKey":"form.warrior_path.name",
   "evolvesTo":["crusader","shadow_warrior"],"levelReq":10,
   "statBonus":{"STR":3,"VIT":2},"grantSkills":["blade_dance","parry"]},
  {"id":"scholar_path","raceId":"human","locKey":"form.scholar_path.name",
   "evolvesTo":["elemental_mage","dark_scholar"],"levelReq":10,
   "statBonus":{"INT":3,"WIS":2},"grantSkills":["mp_regen","mana_sense"]},
  # T3 second choice (4 forms)
  {"id":"crusader","raceId":"human","locKey":"form.crusader.name",
   "evolvesTo":["paladin","champion_human"],"levelReq":10,
   "statBonus":{"STR":4,"VIT":3},"grantSkills":["holy_strike","righteous_strike"]},
  {"id":"shadow_warrior","raceId":"human","locKey":"form.shadow_warrior.name",
   "evolvesTo":["assassin_human","berserker_human"],"levelReq":10,
   "statBonus":{"AGI":4,"STR":3},"grantSkills":["piercing_gaze","overdraw"]},
  {"id":"elemental_mage","raceId":"human","locKey":"form.elemental_mage.name",
   "evolvesTo":["pyromancer","cryomancer"],"levelReq":10,
   "statBonus":{"INT":4,"WIS":3},"grantSkills":["flame_bolt","spark"]},
  {"id":"dark_scholar","raceId":"human","locKey":"form.dark_scholar.name",
   "evolvesTo":["necromancer_human","void_seeker"],"levelReq":10,
   "statBonus":{"INT":4,"WIS":2,"VIT":1},"grantSkills":["soul_gaze","mana_sense"]},
  # T4 third choice (8 forms)
  {"id":"paladin","raceId":"human","locKey":"form.paladin.name",
   "evolvesTo":["divine_champion","holy_crusader"],"levelReq":10,
   "statBonus":{"VIT":5,"STR":3,"WIS":2},"grantSkills":["shield_guard","divine_recovery"]},
  {"id":"champion_human","raceId":"human","locKey":"form.champion_human.name",
   "evolvesTo":["grand_champion","blade_sovereign"],"levelReq":10,
   "statBonus":{"STR":5,"VIT":3,"AGI":2},"grantSkills":["blade_mastery","battle_cry"]},
  {"id":"assassin_human","raceId":"human","locKey":"form.assassin_human.name",
   "evolvesTo":["shadow_lord","phantom_lord"],"levelReq":10,
   "statBonus":{"AGI":6,"STR":3,"LUCK":2},"grantSkills":["piercing_gaze","blade_dance"]},
  {"id":"berserker_human","raceId":"human","locKey":"form.berserker_human.name",
   "evolvesTo":["blood_warlord","war_deity"],"levelReq":10,
   "statBonus":{"STR":7,"VIT":2,"AGI":2},"grantSkills":["overdraw","battle_cry"]},
  {"id":"pyromancer","raceId":"human","locKey":"form.pyromancer.name",
   "evolvesTo":["flame_sovereign","volcano_lord"],"levelReq":10,
   "statBonus":{"INT":6,"WIS":3,"STR":2},"grantSkills":["flame_bolt","lightning_strike"]},
  {"id":"cryomancer","raceId":"human","locKey":"form.cryomancer.name",
   "evolvesTo":["blizzard_sovereign","frost_archmage"],"levelReq":10,
   "statBonus":{"INT":5,"WIS":5,"AGI":2},"grantSkills":["mana_shield","mp_regen"]},
  {"id":"necromancer_human","raceId":"human","locKey":"form.necromancer_human.name",
   "evolvesTo":["lich_master","death_ascendant"],"levelReq":10,
   "statBonus":{"INT":6,"WIS":3,"VIT":2},"grantSkills":["soul_gaze","memory_palace"]},
  {"id":"void_seeker","raceId":"human","locKey":"form.void_seeker.name",
   "evolvesTo":["void_herald","chaos_archmage"],"levelReq":10,
   "statBonus":{"INT":7,"WIS":3},"grantSkills":["mana_shield","spatial_rift"]},
  # T5 pinnacle 16 forms (no children)
  {"id":"divine_champion","raceId":"human","locKey":"form.divine_champion.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"VIT":6,"STR":5,"WIS":5,"INT":3,"AGI":3,"LUCK":2},"grantSkills":["divine_recovery","sovereign_form","all_sight"]},
  {"id":"holy_crusader","raceId":"human","locKey":"form.holy_crusader.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"STR":7,"VIT":5,"WIS":4,"INT":3,"LUCK":3},"grantSkills":["sovereign_form","holy_strike","battle_cry"]},
  {"id":"grand_champion","raceId":"human","locKey":"form.grand_champion.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"STR":8,"VIT":5,"AGI":4,"LUCK":2,"WIS":3},"grantSkills":["sovereign_form","apex_predator","battle_cry"]},
  {"id":"blade_sovereign","raceId":"human","locKey":"form.blade_sovereign.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"STR":7,"AGI":6,"LUCK":4,"VIT":3,"INT":2},"grantSkills":["sovereign_form","blade_mastery","domination_gaze"]},
  {"id":"shadow_lord","raceId":"human","locKey":"form.shadow_lord.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"AGI":8,"LUCK":6,"STR":4,"INT":3,"VIT":2},"grantSkills":["sovereign_form","piercing_gaze","apex_predator"]},
  {"id":"phantom_lord","raceId":"human","locKey":"form.phantom_lord.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"AGI":7,"INT":5,"LUCK":5,"STR":3,"WIS":3},"grantSkills":["sovereign_form","domination_gaze","soul_gaze"]},
  {"id":"blood_warlord","raceId":"human","locKey":"form.blood_warlord.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"STR":9,"VIT":5,"AGI":3,"LUCK":2,"WIS":2},"grantSkills":["sovereign_form","overdraw","apex_predator"]},
  {"id":"war_deity","raceId":"human","locKey":"form.war_deity.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"STR":8,"VIT":6,"AGI":4,"INT":2,"LUCK":3},"grantSkills":["sovereign_form","battle_cry","domination_gaze"]},
  {"id":"flame_sovereign","raceId":"human","locKey":"form.flame_sovereign.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":8,"WIS":5,"STR":4,"VIT":2,"LUCK":3},"grantSkills":["sovereign_form","flame_bolt","all_sight"]},
  {"id":"volcano_lord","raceId":"human","locKey":"form.volcano_lord.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":7,"WIS":6,"STR":5,"VIT":3,"LUCK":2},"grantSkills":["sovereign_form","lightning_strike","domination_gaze"]},
  {"id":"blizzard_sovereign","raceId":"human","locKey":"form.blizzard_sovereign.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":7,"WIS":7,"AGI":4,"VIT":3,"LUCK":3},"grantSkills":["sovereign_form","mana_shield","parallel_minds"]},
  {"id":"frost_archmage","raceId":"human","locKey":"form.frost_archmage.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":8,"WIS":6,"AGI":3,"LUCK":4,"VIT":2},"grantSkills":["sovereign_form","mp_regen","spatial_rift"]},
  {"id":"lich_master","raceId":"human","locKey":"form.lich_master.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":8,"WIS":6,"VIT":4,"LUCK":3,"STR":2},"grantSkills":["sovereign_form","soul_gaze","memory_palace"]},
  {"id":"death_ascendant","raceId":"human","locKey":"form.death_ascendant.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":7,"WIS":5,"VIT":5,"AGI":3,"LUCK":4},"grantSkills":["sovereign_form","all_sight","divine_recovery"]},
  {"id":"void_herald","raceId":"human","locKey":"form.void_herald.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":9,"WIS":5,"LUCK":5,"AGI":3,"VIT":2},"grantSkills":["sovereign_form","spatial_rift","domination_gaze"]},
  {"id":"chaos_archmage","raceId":"human","locKey":"form.chaos_archmage.name","evolvesTo":[],"levelReq":10,
   "statBonus":{"INT":8,"WIS":6,"LUCK":4,"STR":3,"VIT":3},"grantSkills":["sovereign_form","parallel_minds","all_sight"]},
]

evos.extend(NEW_HUMAN)

with open('data/evolutions.json', 'w', encoding='utf-8') as f:
    json.dump(evos, f, ensure_ascii=False, indent=2)

print(f'Done. Total: {len(evos)}, Human added: {len(NEW_HUMAN)}')
