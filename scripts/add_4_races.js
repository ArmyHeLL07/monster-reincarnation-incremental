// scripts/add_4_races.js — generate Vampire, Lycan, Fiend, Celestial races
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const races      = JSON.parse(fs.readFileSync(path.join(DATA, 'races.json'), 'utf8'));
const evolutions = JSON.parse(fs.readFileSync(path.join(DATA, 'evolutions.json'), 'utf8'));
const skills     = JSON.parse(fs.readFileSync(path.join(DATA, 'skills.json'), 'utf8'));
const tr = JSON.parse(fs.readFileSync(path.join(DATA, 'i18n', 'tr.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(DATA, 'i18n', 'en.json'), 'utf8'));
const ru = JSON.parse(fs.readFileSync(path.join(DATA, 'i18n', 'ru.json'), 'utf8'));

const existingEvoIds   = new Set(evolutions.map(e => e.id));
const existingSkillIds = new Set(skills.map(s => s.id));
const existingRaceIds  = new Set(races.map(r => r.id));

// ============================================================
// NEW SKILLS
// ============================================================
const NEW_SKILLS = [
  // --- VAMPIRE ---
  { id:'blood_drain', locKeyName:'skill.blood_drain.name', locKeyDesc:'skill.blood_drain.desc',
    kind:'active', stats:['STR','INT'], lvMax:10, evolvesTo:['crimson_feast'],
    damage:4, damageType:'physical', element:'physical', lifesteal:0.20 },
  { id:'night_veil', locKeyName:'skill.night_veil.name', locKeyDesc:'skill.night_veil.desc',
    kind:'passive', stats:['AGI'], lvMax:10, evolvesTo:[], dodgeBonus:0.12 },
  { id:'vampiric_aura', locKeyName:'skill.vampiric_aura.name', locKeyDesc:'skill.vampiric_aura.desc',
    kind:'passive', stats:['INT','VIT'], lvMax:10, evolvesTo:[], regenMult:0.20, lifesteal:0.10 },
  { id:'bat_swarm', locKeyName:'skill.bat_swarm.name', locKeyDesc:'skill.bat_swarm.desc',
    kind:'active', stats:['AGI','INT'], lvMax:10, evolvesTo:[],
    damage:3, damageType:'physical', element:'physical' },
  { id:'blood_lance', locKeyName:'skill.blood_lance.name', locKeyDesc:'skill.blood_lance.desc',
    kind:'magic', stats:['INT'], lvMax:10, evolvesTo:[],
    damage:9, damageType:'magic', element:'fire' },
  { id:'crimson_feast', locKeyName:'skill.crimson_feast.name', locKeyDesc:'skill.crimson_feast.desc',
    kind:'passive', stats:['VIT','INT'], lvMax:10, evolvesTo:[],
    surviveChance:0.25, hpRegen:5, lifesteal:0.12 },
  // --- LYCAN ---
  { id:'feral_claw', locKeyName:'skill.feral_claw.name', locKeyDesc:'skill.feral_claw.desc',
    kind:'active', stats:['STR','AGI'], lvMax:10, evolvesTo:['savage_bite'],
    damage:5, damageType:'physical', element:'physical' },
  { id:'savage_bite', locKeyName:'skill.savage_bite.name', locKeyDesc:'skill.savage_bite.desc',
    kind:'active', stats:['STR'], lvMax:10, evolvesTo:['apex_predator'],
    damage:7, damageType:'physical', element:'physical' },
  { id:'lunar_rage', locKeyName:'skill.lunar_rage.name', locKeyDesc:'skill.lunar_rage.desc',
    kind:'passive', stats:['STR','VIT'], lvMax:10, evolvesTo:[], dmgMult:0.25 },
  { id:'pack_howl', locKeyName:'skill.pack_howl.name', locKeyDesc:'skill.pack_howl.desc',
    kind:'passive', stats:['WIS','STR'], lvMax:10, evolvesTo:[], dmgMult:0.15, xpMult:0.10 },
  { id:'beast_form', locKeyName:'skill.beast_form.name', locKeyDesc:'skill.beast_form.desc',
    kind:'passive', stats:['STR','AGI'], lvMax:10, evolvesTo:['lunar_rage'], dmgMult:0.12 },
  // --- FIEND ---
  { id:'hellfire', locKeyName:'skill.hellfire.name', locKeyDesc:'skill.hellfire.desc',
    kind:'magic', stats:['INT'], lvMax:10, evolvesTo:['infernal_storm'],
    damage:10, damageType:'fire', element:'fire' },
  { id:'fel_armor', locKeyName:'skill.fel_armor.name', locKeyDesc:'skill.fel_armor.desc',
    kind:'passive', stats:['VIT','INT'], lvMax:10, evolvesTo:[], armor:10 },
  { id:'soul_pact', locKeyName:'skill.soul_pact.name', locKeyDesc:'skill.soul_pact.desc',
    kind:'active', stats:['INT'], lvMax:10, evolvesTo:['infernal_brand'],
    damage:14, damageType:'fire', element:'fire', hpCost:0.15 },
  { id:'infernal_brand', locKeyName:'skill.infernal_brand.name', locKeyDesc:'skill.infernal_brand.desc',
    kind:'passive', stats:['INT'], lvMax:10, evolvesTo:[], dmgMult:0.15 },
  { id:'infernal_storm', locKeyName:'skill.infernal_storm.name', locKeyDesc:'skill.infernal_storm.desc',
    kind:'magic', stats:['INT','STR'], lvMax:10, evolvesTo:[],
    damage:16, damageType:'fire', element:'fire' },
  // --- CELESTIAL ---
  { id:'healing_light', locKeyName:'skill.healing_light.name', locKeyDesc:'skill.healing_light.desc',
    kind:'passive', stats:['WIS','VIT'], lvMax:10, evolvesTo:['divine_recovery'], hpRegen:10 },
  { id:'guardian_aura', locKeyName:'skill.guardian_aura.name', locKeyDesc:'skill.guardian_aura.desc',
    kind:'passive', stats:['VIT','WIS'], lvMax:10, evolvesTo:[], regenMult:0.35 },
  { id:'radiant_burst', locKeyName:'skill.radiant_burst.name', locKeyDesc:'skill.radiant_burst.desc',
    kind:'magic', stats:['WIS','INT'], lvMax:10, evolvesTo:['judgment'],
    damage:8, damageType:'light', element:'light' },
  { id:'wings_of_light', locKeyName:'skill.wings_of_light.name', locKeyDesc:'skill.wings_of_light.desc',
    kind:'passive', stats:['AGI','WIS'], lvMax:10, evolvesTo:[], dodgeBonus:0.18 },
  { id:'judgment', locKeyName:'skill.judgment.name', locKeyDesc:'skill.judgment.desc',
    kind:'magic', stats:['WIS'], lvMax:10, evolvesTo:[],
    damage:13, damageType:'light', element:'light' },
];

// ============================================================
// NEW RACES
// ============================================================
const NEW_RACES = [
  {
    id:'vampire', locKey:'race.vampire.name', humanoid:true,
    startSkills:['blood_drain','sharp_claw','night_veil'],
    startResistances:['physical_res','poison_res'],
    startStats:{ STR:5, VIT:5, AGI:7, INT:6, WIS:3, LUCK:5 },
    head:{
      viewBox:'0 0 180 200',
      silhouette:"<ellipse cx='90' cy='106' rx='55' ry='72' fill='#1a0f1f' stroke='#6a2a8a' stroke-width='3'/><polygon points='42,50 22,4 64,34' fill='#120b17' stroke='#6a2a8a' stroke-width='2'/><polygon points='138,50 158,4 116,34' fill='#120b17' stroke='#6a2a8a' stroke-width='2'/><ellipse cx='90' cy='152' rx='20' ry='12' fill='#0d0810' stroke='#6a2a8a' stroke-width='2'/>",
      eyes:[{id:'e1',x:66,y:96,r:12},{id:'e2',x:114,y:96,r:12}],
    },
  },
  {
    id:'lycan', locKey:'race.lycan.name', humanoid:true,
    startSkills:['feral_claw','rend','regeneration'],
    startResistances:['physical_res','pierce_res'],
    startStats:{ STR:8, VIT:6, AGI:6, INT:3, WIS:3, LUCK:4 },
    head:{
      viewBox:'0 0 180 200',
      silhouette:"<ellipse cx='90' cy='108' rx='58' ry='68' fill='#1a1510' stroke='#8a6030' stroke-width='3'/><polygon points='48,52 26,6 68,38' fill='#13100c' stroke='#8a6030' stroke-width='2'/><polygon points='132,52 154,6 112,38' fill='#13100c' stroke='#8a6030' stroke-width='2'/><ellipse cx='90' cy='148' rx='22' ry='14' fill='#0e0b08' stroke='#8a6030' stroke-width='2'/>",
      eyes:[{id:'e1',x:66,y:96,r:13},{id:'e2',x:114,y:96,r:13}],
    },
  },
  {
    id:'fiend', locKey:'race.fiend.name', humanoid:true,
    startSkills:['hellfire','shadow_bolt','fel_armor'],
    startResistances:['fire_res','physical_res'],
    startStats:{ STR:6, VIT:5, AGI:4, INT:8, WIS:3, LUCK:4 },
    head:{
      viewBox:'0 0 180 200',
      silhouette:"<ellipse cx='90' cy='108' rx='54' ry='70' fill='#1f0a0a' stroke='#9a2020' stroke-width='3'/><polygon points='54,46 36,4 74,30' fill='#150606' stroke='#9a2020' stroke-width='2'/><polygon points='126,46 144,4 106,30' fill='#150606' stroke='#9a2020' stroke-width='2'/>",
      eyes:[{id:'e1',x:64,y:94,r:12},{id:'e2',x:116,y:94,r:12},{id:'e3',x:90,y:76,r:8}],
    },
  },
  {
    id:'celestial', locKey:'race.celestial.name', humanoid:true,
    startSkills:['holy_strike','healing_light','guardian_aura'],
    startResistances:['fear_res','soul_res'],
    startStats:{ STR:5, VIT:6, AGI:4, INT:5, WIS:7, LUCK:3 },
    head:{
      viewBox:'0 0 180 200',
      silhouette:"<ellipse cx='90' cy='106' rx='52' ry='68' fill='#0f141f' stroke='#6a8aaa' stroke-width='3'/><circle cx='90' cy='34' r='26' fill='none' stroke='#c0d0e0' stroke-width='2'/>",
      eyes:[{id:'e1',x:64,y:90,r:10},{id:'e2',x:116,y:90,r:10},{id:'e3',x:72,y:110,r:8},{id:'e4',x:108,y:110,r:8}],
    },
  },
];

// ============================================================
// EVOLUTION TREE HELPER
// ============================================================
function f(id, raceId, evolvesTo, levelReq, tierReq, statBonus, grantSkills, extra={}) {
  return { id, raceId, locKey:`form.${id}.name`, evolvesTo, levelReq, statBonus, grantSkills, tierReq, ...extra };
}

// ============================================================
// VAMPIRE EVOLUTIONS (33 forms)
// ============================================================
const VAMP_EVOS = [
  // T0
  f('vampire_spawn','vampire',['blood_fledgling'],1,0,{},[]),
  f('blood_fledgling','vampire',['blood_mage','night_hunter'],10,0,{},['blood_drain','night_veil']),
  // T4
  f('blood_mage','vampire',['blood_sorcerer','plague_vampire'],10,4,{INT:2,WIS:1},[],{humanoid:true}),
  f('night_hunter','vampire',['shadow_stalker','blood_charmer'],10,4,{AGI:2,STR:1},[],{humanoid:true}),
  // T6
  f('blood_sorcerer','vampire',['blood_archmage','crimson_witch'],10,6,{INT:3,WIS:1},['blood_lance'],{humanoid:true}),
  f('plague_vampire','vampire',['plague_lord','death_herald_v'],10,6,{INT:2,VIT:2},['bat_swarm'],{humanoid:true}),
  f('shadow_stalker','vampire',['phantom_stalker','dark_predator_v'],10,6,{AGI:3,LUCK:1},[],{humanoid:true}),
  f('blood_charmer','vampire',['charm_master','vampire_noble'],10,6,{INT:2,LUCK:2},['vampiric_aura'],{humanoid:true}),
  // T8
  f('blood_archmage','vampire',['blood_god_v','scarlet_sovereign'],10,8,{INT:4,WIS:2},['blood_lance'],{humanoid:true}),
  f('crimson_witch','vampire',['venom_witch','blood_empress'],10,8,{INT:3,VIT:3},['bat_swarm'],{humanoid:true}),
  f('plague_lord','vampire',['pestilence_god_v','undead_overlord_v'],10,8,{VIT:4,INT:2},['bat_swarm'],{humanoid:true}),
  f('death_herald_v','vampire',['night_sovereign_v','shadow_lord_v'],10,8,{AGI:3,INT:3},[],{humanoid:true}),
  f('phantom_stalker','vampire',['apex_vampire','night_king_v'],10,8,{AGI:4,LUCK:2},[],{humanoid:true}),
  f('dark_predator_v','vampire',['void_predator_v','blood_hunter_v'],10,8,{STR:3,AGI:3},[],{humanoid:true}),
  f('charm_master','vampire',['blood_countess','psychic_vampire'],10,8,{INT:4,WIS:3},['vampiric_aura'],{humanoid:true}),
  f('vampire_noble','vampire',['nosferatu_lord','eternal_vampire'],10,8,{INT:3,VIT:4},['vampiric_aura'],{humanoid:true}),
  // T10 (16 terminals → all lead to secret)
  f('blood_god_v','vampire',['dracula_lord'],10,10,{INT:6,WIS:4,VIT:2},['crimson_feast','sovereign_form'],{humanoid:true}),
  f('scarlet_sovereign','vampire',['dracula_lord'],10,10,{INT:5,WIS:5,LUCK:3},['crimson_feast','blood_lance'],{humanoid:true}),
  f('venom_witch','vampire',['dracula_lord'],10,10,{VIT:5,INT:5,WIS:2},['bat_swarm','crimson_feast'],{humanoid:true}),
  f('blood_empress','vampire',['dracula_lord'],10,10,{INT:6,WIS:4,AGI:2},['blood_lance','vampiric_aura'],{humanoid:true}),
  f('pestilence_god_v','vampire',['dracula_lord'],10,10,{VIT:6,INT:4,WIS:2},['bat_swarm','sovereign_form'],{humanoid:true}),
  f('undead_overlord_v','vampire',['dracula_lord'],10,10,{VIT:5,STR:4,INT:3},['vampiric_aura','sovereign_form'],{humanoid:true}),
  f('night_sovereign_v','vampire',['dracula_lord'],10,10,{AGI:6,INT:5,WIS:2},['crimson_feast','sovereign_form'],{humanoid:true}),
  f('shadow_lord_v','vampire',['dracula_lord'],10,10,{AGI:7,INT:4,LUCK:2},['night_veil','sovereign_form'],{humanoid:true}),
  f('apex_vampire','vampire',['dracula_lord'],10,10,{AGI:5,STR:5,LUCK:3},['crimson_feast','apex_predator'],{humanoid:true}),
  f('night_king_v','vampire',['dracula_lord'],10,10,{AGI:6,LUCK:4,INT:3},['night_veil','sovereign_form'],{humanoid:true}),
  f('void_predator_v','vampire',['dracula_lord'],10,10,{STR:6,AGI:4,INT:3},['sovereign_form','apex_predator'],{humanoid:true}),
  f('blood_hunter_v','vampire',['dracula_lord'],10,10,{STR:5,LUCK:5,AGI:3},['crimson_feast','apex_predator'],{humanoid:true}),
  f('blood_countess','vampire',['dracula_lord'],10,10,{INT:7,WIS:5,LUCK:3},['vampiric_aura','sovereign_form'],{humanoid:true}),
  f('psychic_vampire','vampire',['dracula_lord'],10,10,{INT:6,WIS:6,AGI:2},['vampiric_aura','blood_lance'],{humanoid:true}),
  f('nosferatu_lord','vampire',['dracula_lord'],10,10,{INT:6,VIT:5,WIS:3},['vampiric_aura','crimson_feast'],{humanoid:true}),
  f('eternal_vampire','vampire',['dracula_lord'],10,10,{INT:7,VIT:4,WIS:4},['vampiric_aura','sovereign_form'],{humanoid:true}),
  // Secret
  f('dracula_lord','vampire',[],10,10,{INT:8,STR:5,VIT:4,WIS:6,AGI:4,LUCK:3},
    ['vampiric_aura','blood_lance','crimson_feast','sovereign_form'],
    {humanoid:true,secret:{kills:500,rebirths:1}}),
];

// ============================================================
// LYCAN EVOLUTIONS (33 forms)
// ============================================================
const LYCAN_EVOS = [
  f('wolf_cub','lycan',['young_lycan'],1,0,{},[]),
  f('young_lycan','lycan',['feral_berserker_l','pack_wolf'],10,0,{STR:1,VIT:1},['feral_claw','rend']),
  // T4
  f('feral_berserker_l','lycan',['blood_wolf','war_wolf'],10,4,{STR:2,VIT:1},[],{humanoid:true}),
  f('pack_wolf','lycan',['alpha_wolf','spirit_wolf'],10,4,{VIT:2,WIS:1},['regeneration'],{humanoid:true}),
  // T6
  f('blood_wolf','lycan',['savage_lord','death_wolf'],10,6,{STR:3,AGI:1},['savage_bite'],{humanoid:true}),
  f('war_wolf','lycan',['blade_wolf','berserker_king'],10,6,{STR:2,AGI:2},['beast_form'],{humanoid:true}),
  f('alpha_wolf','lycan',['pack_alpha','great_wolf'],10,6,{STR:2,VIT:2},[],{humanoid:true}),
  f('spirit_wolf','lycan',['lunar_sage','moon_guardian'],10,6,{WIS:3,AGI:1},['pack_howl'],{humanoid:true}),
  // T8
  f('savage_lord','lycan',['slaughter_king','blood_reaver'],10,8,{STR:4,AGI:2},['lunar_rage'],{humanoid:true}),
  f('death_wolf','lycan',['grim_wolf','dread_wolf'],10,8,{STR:4,VIT:2},['savage_bite'],{humanoid:true}),
  f('blade_wolf','lycan',['shadow_wolf_lord','storm_wolf'],10,8,{AGI:4,STR:2},['beast_form'],{humanoid:true}),
  f('berserker_king','lycan',['berserk_god','warlord_lycan'],10,8,{STR:4,VIT:3},['lunar_rage'],{humanoid:true}),
  f('pack_alpha','lycan',['lycan_alpha_sovereign','primal_alpha_l'],10,8,{STR:3,VIT:4},['pack_howl'],{humanoid:true}),
  f('great_wolf','lycan',['ancient_wolf','wolf_titan'],10,8,{VIT:4,STR:3},['regeneration'],{humanoid:true}),
  f('lunar_sage','lycan',['moon_sage','moon_void_wolf'],10,8,{WIS:4,INT:3},['pack_howl'],{humanoid:true}),
  f('moon_guardian','lycan',['lunar_warden','celestial_wolf'],10,8,{VIT:4,WIS:3},['lunar_rage'],{humanoid:true}),
  // T10 (16)
  f('slaughter_king','lycan',['fenrir_ancient'],10,10,{STR:7,AGI:4,VIT:2},['lunar_rage','sovereign_form'],{humanoid:true}),
  f('blood_reaver','lycan',['fenrir_ancient'],10,10,{STR:6,VIT:4,LUCK:3},['savage_bite','apex_predator'],{humanoid:true}),
  f('grim_wolf','lycan',['fenrir_ancient'],10,10,{STR:6,VIT:5,AGI:2},['lunar_rage','sovereign_form'],{humanoid:true}),
  f('dread_wolf','lycan',['fenrir_ancient'],10,10,{STR:7,VIT:4,AGI:2},['beast_form','sovereign_form'],{humanoid:true}),
  f('shadow_wolf_lord','lycan',['fenrir_ancient'],10,10,{AGI:6,STR:4,LUCK:3},['sovereign_form','apex_predator'],{humanoid:true}),
  f('storm_wolf','lycan',['fenrir_ancient'],10,10,{AGI:7,STR:4,INT:2},['beast_form','sovereign_form'],{humanoid:true}),
  f('berserk_god','lycan',['fenrir_ancient'],10,10,{STR:8,VIT:3,AGI:2},['lunar_rage','apex_predator'],{humanoid:true}),
  f('warlord_lycan','lycan',['fenrir_ancient'],10,10,{STR:7,VIT:4,WIS:2},['pack_howl','sovereign_form'],{humanoid:true}),
  f('lycan_alpha_sovereign','lycan',['fenrir_ancient'],10,10,{STR:5,VIT:5,WIS:3},['pack_howl','sovereign_form'],{humanoid:true}),
  f('primal_alpha_l','lycan',['fenrir_ancient'],10,10,{STR:6,VIT:4,AGI:3},['lunar_rage','pack_howl'],{humanoid:true}),
  f('ancient_wolf','lycan',['fenrir_ancient'],10,10,{VIT:7,STR:4,WIS:2},['beast_form','sovereign_form'],{humanoid:true}),
  f('wolf_titan','lycan',['fenrir_ancient'],10,10,{VIT:6,STR:5,AGI:2},['lunar_rage','sovereign_form'],{humanoid:true}),
  f('moon_sage','lycan',['fenrir_ancient'],10,10,{WIS:6,INT:4,VIT:3},['pack_howl','sovereign_form'],{humanoid:true}),
  f('moon_void_wolf','lycan',['fenrir_ancient'],10,10,{WIS:5,INT:5,AGI:3},['lunar_rage','beast_form'],{humanoid:true}),
  f('lunar_warden','lycan',['fenrir_ancient'],10,10,{VIT:5,WIS:5,STR:3},['pack_howl','sovereign_form'],{humanoid:true}),
  f('celestial_wolf','lycan',['fenrir_ancient'],10,10,{WIS:6,VIT:4,AGI:3},['pack_howl','lunar_rage'],{humanoid:true}),
  // Secret
  f('fenrir_ancient','lycan',[],10,10,{STR:9,VIT:7,AGI:6,WIS:3,INT:2,LUCK:3},
    ['lunar_rage','sovereign_form','apex_predator'],
    {humanoid:true,secret:{kills:666}}),
];

// ============================================================
// FIEND EVOLUTIONS (33 forms)
// ============================================================
const FIEND_EVOS = [
  f('imp','fiend',['young_fiend'],1,0,{},[]),
  f('young_fiend','fiend',['flame_fiend_l','shadow_fiend_l'],10,0,{INT:1,STR:1},['hellfire','shadow_bolt']),
  // T4
  f('flame_fiend_l','fiend',['inferno_lord','pact_broker'],10,4,{INT:2,STR:1},[],{humanoid:true}),
  f('shadow_fiend_l','fiend',['shadow_devil','cursed_knight_f'],10,4,{INT:2,AGI:1},['fel_armor'],{humanoid:true}),
  // T6
  f('inferno_lord','fiend',['fire_archfiend','molten_devil'],10,6,{INT:3,STR:2},['hellfire'],{humanoid:true}),
  f('pact_broker','fiend',['soul_merchant','doom_broker'],10,6,{INT:3,WIS:1},['soul_pact'],{humanoid:true}),
  f('shadow_devil','fiend',['umbral_fiend','night_devil'],10,6,{AGI:3,INT:2},[],{humanoid:true}),
  f('cursed_knight_f','fiend',['hellknight','doom_crusader'],10,6,{STR:3,INT:2},['fel_armor'],{humanoid:true}),
  // T8
  f('fire_archfiend','fiend',['balrog_lord','infernal_god'],10,8,{INT:4,STR:3},['infernal_brand'],{humanoid:true}),
  f('molten_devil','fiend',['magma_sovereign','fire_tyrant_f'],10,8,{INT:4,VIT:2},['hellfire'],{humanoid:true}),
  f('soul_merchant','fiend',['dark_pact_lord','mephisto_lord'],10,8,{INT:4,WIS:3},['soul_pact','infernal_brand'],{humanoid:true}),
  f('doom_broker','fiend',['doom_sovereign','ruin_lord'],10,8,{INT:3,STR:3},['soul_pact'],{humanoid:true}),
  f('umbral_fiend','fiend',['void_shadow_fiend','abyssal_fiend'],10,8,{AGI:4,INT:3},[],{humanoid:true}),
  f('night_devil','fiend',['shadow_sovereign','dread_devil'],10,8,{AGI:3,INT:3},[],{humanoid:true}),
  f('hellknight','fiend',['fel_crusader','doom_knight_f'],10,8,{STR:4,VIT:3},['fel_armor'],{humanoid:true}),
  f('doom_crusader','fiend',['death_crusader','infernal_paladin'],10,8,{STR:4,INT:2},['fel_armor'],{humanoid:true}),
  // T10 (16)
  f('balrog_lord','fiend',['asmodeus_lord'],10,10,{INT:7,STR:5,VIT:2},['infernal_storm','sovereign_form'],{humanoid:true}),
  f('infernal_god','fiend',['asmodeus_lord'],10,10,{INT:8,VIT:3,STR:3},['infernal_storm','sovereign_form'],{humanoid:true}),
  f('magma_sovereign','fiend',['asmodeus_lord'],10,10,{INT:6,VIT:5,STR:3},['hellfire','sovereign_form'],{humanoid:true}),
  f('fire_tyrant_f','fiend',['asmodeus_lord'],10,10,{INT:7,STR:4,LUCK:3},['infernal_storm','sovereign_form'],{humanoid:true}),
  f('dark_pact_lord','fiend',['asmodeus_lord'],10,10,{INT:7,WIS:4,VIT:3},['soul_pact','infernal_brand','sovereign_form'],{humanoid:true}),
  f('mephisto_lord','fiend',['asmodeus_lord'],10,10,{INT:8,WIS:4,STR:2},['soul_pact','infernal_brand','sovereign_form'],{humanoid:true}),
  f('doom_sovereign','fiend',['asmodeus_lord'],10,10,{INT:6,STR:5,WIS:3},['infernal_brand','sovereign_form'],{humanoid:true}),
  f('ruin_lord','fiend',['asmodeus_lord'],10,10,{INT:7,STR:4,VIT:3},['hellfire','sovereign_form'],{humanoid:true}),
  f('void_shadow_fiend','fiend',['asmodeus_lord'],10,10,{AGI:6,INT:5,STR:3},['sovereign_form','infernal_brand'],{humanoid:true}),
  f('abyssal_fiend','fiend',['asmodeus_lord'],10,10,{AGI:5,INT:6,VIT:3},['sovereign_form','hellfire'],{humanoid:true}),
  f('shadow_sovereign','fiend',['asmodeus_lord'],10,10,{AGI:6,INT:5,WIS:3},['infernal_brand','sovereign_form'],{humanoid:true}),
  f('dread_devil','fiend',['asmodeus_lord'],10,10,{AGI:7,INT:4,LUCK:3},['sovereign_form'],{humanoid:true}),
  f('fel_crusader','fiend',['asmodeus_lord'],10,10,{STR:6,VIT:5,INT:3},['fel_armor','sovereign_form'],{humanoid:true}),
  f('doom_knight_f','fiend',['asmodeus_lord'],10,10,{STR:7,VIT:4,INT:3},['fel_armor','sovereign_form'],{humanoid:true}),
  f('death_crusader','fiend',['asmodeus_lord'],10,10,{STR:6,VIT:4,AGI:4},['sovereign_form','infernal_brand'],{humanoid:true}),
  f('infernal_paladin','fiend',['asmodeus_lord'],10,10,{STR:5,VIT:5,INT:4},['fel_armor','soul_pact','sovereign_form'],{humanoid:true}),
  // Secret
  f('asmodeus_lord','fiend',[],10,10,{INT:9,STR:5,VIT:4,WIS:4,AGI:3,LUCK:3},
    ['infernal_storm','soul_pact','sovereign_form','infernal_brand'],
    {humanoid:true,secret:{sin:8,rebirths:1}}),
];

// ============================================================
// CELESTIAL EVOLUTIONS (33 forms)
// ============================================================
const CELESTIAL_EVOS = [
  f('cherub','celestial',['young_celestial'],1,0,{},[]),
  f('young_celestial','celestial',['battle_angel','light_mage_angel'],10,0,{WIS:1,VIT:1},['holy_strike','healing_light']),
  // T4
  f('battle_angel','celestial',['seraphim_warrior','divine_knight_angel'],10,4,{STR:2,WIS:1},[],{humanoid:true}),
  f('light_mage_angel','celestial',['archangel_mage','radiant_sage'],10,4,{WIS:2,INT:1},['radiant_burst'],{humanoid:true}),
  // T6
  f('seraphim_warrior','celestial',['divine_warrior_a','holy_champion_angel'],10,6,{WIS:2,STR:3},['radiant_burst'],{humanoid:true}),
  f('divine_knight_angel','celestial',['crusader_angel','judgment_angel'],10,6,{STR:3,VIT:2},['guardian_aura'],{humanoid:true}),
  f('archangel_mage','celestial',['celestial_mage','holy_archmage_a'],10,6,{INT:3,WIS:2},['judgment'],{humanoid:true}),
  f('radiant_sage','celestial',['oracle_angel','seraphic_sage'],10,6,{WIS:3,INT:2},['healing_light'],{humanoid:true}),
  // T8
  f('divine_warrior_a','celestial',['divine_sovereign_angel','holy_sovereign'],10,8,{STR:4,WIS:3},['wings_of_light'],{humanoid:true}),
  f('holy_champion_angel','celestial',['celestial_champion','divine_warrior_god'],10,8,{STR:4,VIT:3},['guardian_aura'],{humanoid:true}),
  f('crusader_angel','celestial',['holy_paladin_god','guardian_angel_god'],10,8,{STR:3,VIT:4},['guardian_aura'],{humanoid:true}),
  f('judgment_angel','celestial',['judgment_god','divine_crusader_god'],10,8,{WIS:4,STR:3},['judgment','radiant_burst'],{humanoid:true}),
  f('celestial_mage','celestial',['celestial_archmage','holy_mage_god'],10,8,{INT:4,WIS:3},['radiant_burst','guardian_aura'],{humanoid:true}),
  f('holy_archmage_a','celestial',['radiant_sovereign','light_sovereign'],10,8,{WIS:4,INT:3},['judgment'],{humanoid:true}),
  f('oracle_angel','celestial',['oracle_god','prophet_angel'],10,8,{WIS:4,INT:2},['healing_light'],{humanoid:true}),
  f('seraphic_sage','celestial',['seraph_sovereign','divine_oracle'],10,8,{WIS:4,VIT:3},['healing_light','wings_of_light'],{humanoid:true}),
  // T10 (16)
  f('divine_sovereign_angel','celestial',['archangel_michael'],10,10,{WIS:6,STR:5,VIT:2},['sovereign_form','judgment'],{humanoid:true}),
  f('holy_sovereign','celestial',['archangel_michael'],10,10,{WIS:6,VIT:4,STR:3},['guardian_aura','sovereign_form'],{humanoid:true}),
  f('celestial_champion','celestial',['archangel_michael'],10,10,{STR:7,WIS:4,VIT:2},['wings_of_light','sovereign_form'],{humanoid:true}),
  f('divine_warrior_god','celestial',['archangel_michael'],10,10,{STR:8,VIT:3,WIS:3},['sovereign_form','radiant_burst'],{humanoid:true}),
  f('holy_paladin_god','celestial',['archangel_michael'],10,10,{STR:6,VIT:5,WIS:3},['guardian_aura','sovereign_form'],{humanoid:true}),
  f('guardian_angel_god','celestial',['archangel_michael'],10,10,{VIT:7,WIS:4,STR:2},['guardian_aura','sovereign_form'],{humanoid:true}),
  f('judgment_god','celestial',['archangel_michael'],10,10,{WIS:7,STR:4,INT:3},['judgment','divine_smite','sovereign_form'],{humanoid:true}),
  f('divine_crusader_god','celestial',['archangel_michael'],10,10,{STR:6,WIS:5,VIT:3},['judgment','sovereign_form'],{humanoid:true}),
  f('celestial_archmage','celestial',['archangel_michael'],10,10,{INT:6,WIS:6,VIT:2},['judgment','radiant_burst','sovereign_form'],{humanoid:true}),
  f('holy_mage_god','celestial',['archangel_michael'],10,10,{WIS:7,INT:5,VIT:2},['judgment','healing_light','sovereign_form'],{humanoid:true}),
  f('radiant_sovereign','celestial',['archangel_michael'],10,10,{WIS:6,INT:5,STR:3},['radiant_burst','sovereign_form'],{humanoid:true}),
  f('light_sovereign','celestial',['archangel_michael'],10,10,{WIS:7,INT:4,VIT:3},['judgment','sovereign_form'],{humanoid:true}),
  f('oracle_god','celestial',['archangel_michael'],10,10,{WIS:7,INT:4,LUCK:3},['healing_light','sovereign_form'],{humanoid:true}),
  f('prophet_angel','celestial',['archangel_michael'],10,10,{WIS:6,INT:4,VIT:3},['healing_light','guardian_aura','sovereign_form'],{humanoid:true}),
  f('seraph_sovereign','celestial',['archangel_michael'],10,10,{WIS:6,VIT:5,INT:3},['wings_of_light','sovereign_form'],{humanoid:true}),
  f('divine_oracle','celestial',['archangel_michael'],10,10,{WIS:7,INT:5,VIT:2},['healing_light','judgment','sovereign_form'],{humanoid:true}),
  // Secret
  f('archangel_michael','celestial',[],10,10,{WIS:9,STR:6,VIT:5,INT:5,AGI:3,LUCK:2},
    ['judgment','wings_of_light','sovereign_form','divine_recovery'],
    {humanoid:true,secret:{virtue:8,rebirths:1}}),
];

// ============================================================
// i18n STRINGS
// ============================================================
const TR = {
  'race.vampire.name':'Vampir','race.lycan.name':'Lycan',
  'race.fiend.name':'Şeytan','race.celestial.name':'Melek',
  'skill.blood_drain.name':'Kan Emme',
  'skill.blood_drain.desc':'Düşmana saldırırken hayat çalar; verilen hasarın %20si HP olarak geri döner.',
  'skill.night_veil.name':'Gece Perdesi',
  'skill.night_veil.desc':'Karanlıkla bütünleşir, kaçınma şansını artırır.',
  'skill.vampiric_aura.name':'Vampir Aurası',
  'skill.vampiric_aura.desc':'Pasif kan emme — tüm saldırılar hayat çalar ve yenilenmeyi artırır.',
  'skill.bat_swarm.name':'Yarasa Sürüsü',
  'skill.bat_swarm.desc':'Yarasa sürüsü gönderir; çoklu fiziksel hasar verir.',
  'skill.blood_lance.name':'Kan Mızrağı',
  'skill.blood_lance.desc':'Yoğun kan enerjisini ışın olarak fırlatır — güçlü büyü hasarı.',
  'skill.crimson_feast.name':'Kan Şöleni',
  'skill.crimson_feast.desc':'Hayat emmeyi güçlendirir; ölümcül darbeye karşı hayatta kalma şansı verir.',
  'skill.feral_claw.name':'Vahşi Pençe',
  'skill.feral_claw.desc':'Keskin hayvan pençesiyle saldırır.',
  'skill.savage_bite.name':'Vahşi Isırık',
  'skill.savage_bite.desc':'Ağır fiziksel hasar veren güçlü bir ısırık.',
  'skill.lunar_rage.name':'Ay Öfkesi',
  'skill.lunar_rage.desc':'Pasif içgüdü — tüm saldırı hasarını artırır.',
  'skill.pack_howl.name':'Sürü Uluması',
  'skill.pack_howl.desc':'Sürü bağını canlandırır; hasar ve deneyim kazanımını artırır.',
  'skill.beast_form.name':'Canavar Formu',
  'skill.beast_form.desc':'İçgüdüsel canavar gücünü açar — saldırı hasarını artırır.',
  'skill.hellfire.name':'Cehennem Ateşi',
  'skill.hellfire.desc':'Cehennemden gelen alevleri fırlatır — güçlü ateş hasarı.',
  'skill.fel_armor.name':'Şeytani Zırh',
  'skill.fel_armor.desc':'Cehennem enerjisiyle kaplanır — savunmayı artırır.',
  'skill.soul_pact.name':'Ruh Paktı',
  'skill.soul_pact.desc':'Mevcut HP\'nin %15\'ini harcayarak muazzam ateş hasarı verir.',
  'skill.infernal_brand.name':'Cehennem Mührü',
  'skill.infernal_brand.desc':'Pasif cehennem gücü — tüm saldırı hasarını artırır.',
  'skill.infernal_storm.name':'Cehennem Fırtınası',
  'skill.infernal_storm.desc':'Devasa alev fırtınası — en yüksek ateş büyüsü.',
  'skill.healing_light.name':'Şifa Işığı',
  'skill.healing_light.desc':'Pasif kutsal enerji — HP yenilenmesini artırır.',
  'skill.guardian_aura.name':'Koruyucu Aura',
  'skill.guardian_aura.desc':'Kutsal koruma — yenilenmeyi güçlü şekilde artırır.',
  'skill.radiant_burst.name':'Işık Patlaması',
  'skill.radiant_burst.desc':'Saf kutsal ışık dalgası — ışık büyü hasarı verir.',
  'skill.wings_of_light.name':'Işık Kanatları',
  'skill.wings_of_light.desc':'Kutsal kanatlar açar — kaçınma şansını büyük ölçüde artırır.',
  'skill.judgment.name':'İlahi Yargı',
  'skill.judgment.desc':'Güçlü kutsal yargı büyüsü — ışık hasarıyla düşmanları ezer.',
  // Vampire forms
  'form.vampire_spawn.name':'Vampir Larva','form.blood_fledgling.name':'Kan Yavrusu',
  'form.blood_mage.name':'Kan Büyücüsü','form.night_hunter.name':'Gece Avcısı',
  'form.blood_sorcerer.name':'Kan Sihirbazı','form.plague_vampire.name':'Veba Vampiri',
  'form.shadow_stalker.name':'Gölge Avcı','form.blood_charmer.name':'Kan Büyüleyici',
  'form.blood_archmage.name':'Kan Başbüyücüsü','form.crimson_witch.name':'Kızıl Cadı',
  'form.plague_lord.name':'Veba Lordu','form.death_herald_v.name':'Ölüm Habercisi',
  'form.phantom_stalker.name':'Hayalet Avcı','form.dark_predator_v.name':'Karanlık Avcı',
  'form.charm_master.name':'Büyü Ustası','form.vampire_noble.name':'Vampir Soyluu',
  'form.blood_god_v.name':'Kan Tanrısı','form.scarlet_sovereign.name':'Kızıl Hükümdar',
  'form.venom_witch.name':'Zehir Cadısı','form.blood_empress.name':'Kan İmparatoriçesi',
  'form.pestilence_god_v.name':'Salgın Tanrısı','form.undead_overlord_v.name':'Ölümsüz Efendi',
  'form.night_sovereign_v.name':'Gece Hükümdarı','form.shadow_lord_v.name':'Gölge Lordu',
  'form.apex_vampire.name':'Zirve Vampiri','form.night_king_v.name':'Gece Kralı',
  'form.void_predator_v.name':'Yokluk Avcısı','form.blood_hunter_v.name':'Kan Avcısı',
  'form.blood_countess.name':'Kan Kontesi','form.psychic_vampire.name':'Zihin Vampiri',
  'form.nosferatu_lord.name':'Nosferatu Lordu','form.eternal_vampire.name':'Ebedi Vampir',
  'form.dracula_lord.name':'Drakula',
  // Lycan forms
  'form.wolf_cub.name':'Kurt Yavrusu','form.young_lycan.name':'Genç Lycan',
  'form.feral_berserker_l.name':'Vahşi Berserk','form.pack_wolf.name':'Sürü Kurdu',
  'form.blood_wolf.name':'Kan Kurdu','form.war_wolf.name':'Savaş Kurdu',
  'form.alpha_wolf.name':'Alfa Kurt','form.spirit_wolf.name':'Ruh Kurdu',
  'form.savage_lord.name':'Vahşi Lord','form.death_wolf.name':'Ölüm Kurdu',
  'form.blade_wolf.name':'Bıçak Kurdu','form.berserker_king.name':'Berserk Kral',
  'form.pack_alpha.name':'Sürü Alfası','form.great_wolf.name':'Büyük Kurt',
  'form.lunar_sage.name':'Ay Bilgesi','form.moon_guardian.name':'Ay Bekçisi',
  'form.slaughter_king.name':'Katliam Kral','form.blood_reaver.name':'Kan Kasabı',
  'form.grim_wolf.name':'Kasvetli Kurt','form.dread_wolf.name':'Korku Kurdu',
  'form.shadow_wolf_lord.name':'Gölge Kurt Lordu','form.storm_wolf.name':'Fırtına Kurdu',
  'form.berserk_god.name':'Berserk Tanrısı','form.warlord_lycan.name':'Savaş Lordu',
  'form.lycan_alpha_sovereign.name':'Alfa Hükümdar','form.primal_alpha_l.name':'İlkel Alfa',
  'form.ancient_wolf.name':'Kadim Kurt','form.wolf_titan.name':'Kurt Titan',
  'form.moon_sage.name':'Ay Bilge','form.moon_void_wolf.name':'Ay Yokluk Kurdu',
  'form.lunar_warden.name':'Ay Muhafızı','form.celestial_wolf.name':'Göksel Kurt',
  'form.fenrir_ancient.name':'Kadim Fenrir',
  // Fiend forms
  'form.imp.name':'İblis','form.young_fiend.name':'Genç Şeytan',
  'form.flame_fiend_l.name':'Alev Şeytan','form.shadow_fiend_l.name':'Gölge Şeytan',
  'form.inferno_lord.name':'Cehennem Lordu','form.pact_broker.name':'Pakt Tellalı',
  'form.shadow_devil.name':'Gölge Şeytan Lordu','form.cursed_knight_f.name':'Lanetli Şövalye',
  'form.fire_archfiend.name':'Ateş Başşeytan','form.molten_devil.name':'Erimiş Şeytan',
  'form.soul_merchant.name':'Ruh Tüccarı','form.doom_broker.name':'Yıkım Tellalı',
  'form.umbral_fiend.name':'Umbral Şeytan','form.night_devil.name':'Gece Şeytan',
  'form.hellknight.name':'Cehennem Şövalyesi','form.doom_crusader.name':'Yıkım Haçlısı',
  'form.balrog_lord.name':'Balrog Lordu','form.infernal_god.name':'Cehennem Tanrısı',
  'form.magma_sovereign.name':'Magma Hükümdarı','form.fire_tyrant_f.name':'Ateş Tiranı',
  'form.dark_pact_lord.name':'Karanlık Pakt Lordu','form.mephisto_lord.name':'Mephisto',
  'form.doom_sovereign.name':'Yıkım Hükümdarı','form.ruin_lord.name':'Yıkıntı Lordu',
  'form.void_shadow_fiend.name':'Yokluk Gölge Şeytan','form.abyssal_fiend.name':'Uçurum Şeytanı',
  'form.shadow_sovereign.name':'Gölge Hükümdar','form.dread_devil.name':'Korku Şeytanı',
  'form.fel_crusader.name':'Şeytani Haçlı','form.doom_knight_f.name':'Yıkım Şövalyesi',
  'form.death_crusader.name':'Ölüm Haçlısı','form.infernal_paladin.name':'Cehennem Paladini',
  'form.asmodeus_lord.name':'Asmodeus',
  // Celestial forms
  'form.cherub.name':'Küçük Melek','form.young_celestial.name':'Genç Melek',
  'form.battle_angel.name':'Savaş Meleği','form.light_mage_angel.name':'Işık Büyücüsü',
  'form.seraphim_warrior.name':'Serafim Savaşçı','form.divine_knight_angel.name':'İlahi Şövalye',
  'form.archangel_mage.name':'Başmelek Büyücü','form.radiant_sage.name':'Işıltılı Bilge',
  'form.divine_warrior_a.name':'İlahi Savaşçı','form.holy_champion_angel.name':'Kutsal Şampiyon',
  'form.crusader_angel.name':'Haçlı Melek','form.judgment_angel.name':'Yargı Meleği',
  'form.celestial_mage.name':'Göksel Büyücü','form.holy_archmage_a.name':'Kutsal Başbüyücü',
  'form.oracle_angel.name':'Kahin Melek','form.seraphic_sage.name':'Serafik Bilge',
  'form.divine_sovereign_angel.name':'İlahi Hükümdar','form.holy_sovereign.name':'Kutsal Hükümdar',
  'form.celestial_champion.name':'Göksel Şampiyon','form.divine_warrior_god.name':'İlahi Savaşçı Tanrı',
  'form.holy_paladin_god.name':'Kutsal Paladin','form.guardian_angel_god.name':'Koruyucu Melek Tanrı',
  'form.judgment_god.name':'Yargı Tanrısı','form.divine_crusader_god.name':'İlahi Haçlı',
  'form.celestial_archmage.name':'Göksel Başbüyücü','form.holy_mage_god.name':'Kutsal Büyücü Tanrı',
  'form.radiant_sovereign.name':'Işıltılı Hükümdar','form.light_sovereign.name':'Işık Hükümdarı',
  'form.oracle_god.name':'Kahin Tanrı','form.prophet_angel.name':'Peygamber Melek',
  'form.seraph_sovereign.name':'Serafim Hükümdar','form.divine_oracle.name':'İlahi Kahin',
  'form.archangel_michael.name':'Başmelek Mikail',
};

const EN = {
  'race.vampire.name':'Vampire','race.lycan.name':'Lycan',
  'race.fiend.name':'Fiend','race.celestial.name':'Celestial',
  'skill.blood_drain.name':'Blood Drain',
  'skill.blood_drain.desc':'Attacks drain life; 20% of damage dealt is restored as HP.',
  'skill.night_veil.name':'Night Veil',
  'skill.night_veil.desc':'Merges with darkness to increase dodge chance.',
  'skill.vampiric_aura.name':'Vampiric Aura',
  'skill.vampiric_aura.desc':'Passive blood drain field — all attacks steal life and boost regeneration.',
  'skill.bat_swarm.name':'Bat Swarm',
  'skill.bat_swarm.desc':'Sends a swarm of bats dealing multiple physical hits.',
  'skill.blood_lance.name':'Blood Lance',
  'skill.blood_lance.desc':'Fires condensed blood energy as a beam — strong magic damage.',
  'skill.crimson_feast.name':'Crimson Feast',
  'skill.crimson_feast.desc':'Enhances lifesteal; provides survival chance against lethal strikes.',
  'skill.feral_claw.name':'Feral Claw',
  'skill.feral_claw.desc':'Strikes with sharp beast claws for heavy physical damage.',
  'skill.savage_bite.name':'Savage Bite',
  'skill.savage_bite.desc':'A powerful bite dealing massive physical damage.',
  'skill.lunar_rage.name':'Lunar Rage',
  'skill.lunar_rage.desc':'Passive instinct — amplifies all attack damage.',
  'skill.pack_howl.name':'Pack Howl',
  'skill.pack_howl.desc':'Activates pack bond — increases damage and XP gain.',
  'skill.beast_form.name':'Beast Form',
  'skill.beast_form.desc':'Unlocks primal beast power — increases attack strength.',
  'skill.hellfire.name':'Hellfire',
  'skill.hellfire.desc':'Hurls flames from the depths of hell — strong fire damage.',
  'skill.fel_armor.name':'Fel Armor',
  'skill.fel_armor.desc':'Wraps body in infernal energy — increases defense.',
  'skill.soul_pact.name':'Soul Pact',
  'skill.soul_pact.desc':'Spends 15% of current HP to deal massive fire damage.',
  'skill.infernal_brand.name':'Infernal Brand',
  'skill.infernal_brand.desc':'Passive infernal power — increases all outgoing damage.',
  'skill.infernal_storm.name':'Infernal Storm',
  'skill.infernal_storm.desc':'Massive inferno — the most powerful fire magic.',
  'skill.healing_light.name':'Healing Light',
  'skill.healing_light.desc':'Passive holy energy — continuously enhances HP regeneration.',
  'skill.guardian_aura.name':'Guardian Aura',
  'skill.guardian_aura.desc':'Holy protective energy — powerfully amplifies regeneration.',
  'skill.radiant_burst.name':'Radiant Burst',
  'skill.radiant_burst.desc':'Radiates pure holy light — deals light magic damage.',
  'skill.wings_of_light.name':'Wings of Light',
  'skill.wings_of_light.desc':'Spreads holy wings — greatly increases dodge chance.',
  'skill.judgment.name':'Judgment',
  'skill.judgment.desc':'Powerful holy judgment magic — crushes enemies with light damage.',
  'form.vampire_spawn.name':'Vampire Spawn','form.blood_fledgling.name':'Blood Fledgling',
  'form.blood_mage.name':'Blood Mage','form.night_hunter.name':'Night Hunter',
  'form.blood_sorcerer.name':'Blood Sorcerer','form.plague_vampire.name':'Plague Vampire',
  'form.shadow_stalker.name':'Shadow Stalker','form.blood_charmer.name':'Blood Charmer',
  'form.blood_archmage.name':'Blood Archmage','form.crimson_witch.name':'Crimson Witch',
  'form.plague_lord.name':'Plague Lord','form.death_herald_v.name':'Death Herald',
  'form.phantom_stalker.name':'Phantom Stalker','form.dark_predator_v.name':'Dark Predator',
  'form.charm_master.name':'Charm Master','form.vampire_noble.name':'Vampire Noble',
  'form.blood_god_v.name':'Blood God','form.scarlet_sovereign.name':'Scarlet Sovereign',
  'form.venom_witch.name':'Venom Witch','form.blood_empress.name':'Blood Empress',
  'form.pestilence_god_v.name':'Pestilence God','form.undead_overlord_v.name':'Undead Overlord',
  'form.night_sovereign_v.name':'Night Sovereign','form.shadow_lord_v.name':'Shadow Lord',
  'form.apex_vampire.name':'Apex Vampire','form.night_king_v.name':'Night King',
  'form.void_predator_v.name':'Void Predator','form.blood_hunter_v.name':'Blood Hunter',
  'form.blood_countess.name':'Blood Countess','form.psychic_vampire.name':'Psychic Vampire',
  'form.nosferatu_lord.name':'Nosferatu Lord','form.eternal_vampire.name':'Eternal Vampire',
  'form.dracula_lord.name':'Dracula',
  'form.wolf_cub.name':'Wolf Cub','form.young_lycan.name':'Young Lycan',
  'form.feral_berserker_l.name':'Feral Berserker','form.pack_wolf.name':'Pack Wolf',
  'form.blood_wolf.name':'Blood Wolf','form.war_wolf.name':'War Wolf',
  'form.alpha_wolf.name':'Alpha Wolf','form.spirit_wolf.name':'Spirit Wolf',
  'form.savage_lord.name':'Savage Lord','form.death_wolf.name':'Death Wolf',
  'form.blade_wolf.name':'Blade Wolf','form.berserker_king.name':'Berserker King',
  'form.pack_alpha.name':'Pack Alpha','form.great_wolf.name':'Great Wolf',
  'form.lunar_sage.name':'Lunar Sage','form.moon_guardian.name':'Moon Guardian',
  'form.slaughter_king.name':'Slaughter King','form.blood_reaver.name':'Blood Reaver',
  'form.grim_wolf.name':'Grim Wolf','form.dread_wolf.name':'Dread Wolf',
  'form.shadow_wolf_lord.name':'Shadow Wolf Lord','form.storm_wolf.name':'Storm Wolf',
  'form.berserk_god.name':'Berserk God','form.warlord_lycan.name':'Warlord Lycan',
  'form.lycan_alpha_sovereign.name':'Alpha Sovereign','form.primal_alpha_l.name':'Primal Alpha',
  'form.ancient_wolf.name':'Ancient Wolf','form.wolf_titan.name':'Wolf Titan',
  'form.moon_sage.name':'Moon Sage','form.moon_void_wolf.name':'Void Moon Wolf',
  'form.lunar_warden.name':'Lunar Warden','form.celestial_wolf.name':'Celestial Wolf',
  'form.fenrir_ancient.name':'Ancient Fenrir',
  'form.imp.name':'Imp','form.young_fiend.name':'Young Fiend',
  'form.flame_fiend_l.name':'Flame Fiend','form.shadow_fiend_l.name':'Shadow Fiend',
  'form.inferno_lord.name':'Inferno Lord','form.pact_broker.name':'Pact Broker',
  'form.shadow_devil.name':'Shadow Devil','form.cursed_knight_f.name':'Cursed Knight',
  'form.fire_archfiend.name':'Fire Archfiend','form.molten_devil.name':'Molten Devil',
  'form.soul_merchant.name':'Soul Merchant','form.doom_broker.name':'Doom Broker',
  'form.umbral_fiend.name':'Umbral Fiend','form.night_devil.name':'Night Devil',
  'form.hellknight.name':'Hellknight','form.doom_crusader.name':'Doom Crusader',
  'form.balrog_lord.name':'Balrog Lord','form.infernal_god.name':'Infernal God',
  'form.magma_sovereign.name':'Magma Sovereign','form.fire_tyrant_f.name':'Fire Tyrant',
  'form.dark_pact_lord.name':'Dark Pact Lord','form.mephisto_lord.name':'Mephisto',
  'form.doom_sovereign.name':'Doom Sovereign','form.ruin_lord.name':'Ruin Lord',
  'form.void_shadow_fiend.name':'Void Shadow Fiend','form.abyssal_fiend.name':'Abyssal Fiend',
  'form.shadow_sovereign.name':'Shadow Sovereign','form.dread_devil.name':'Dread Devil',
  'form.fel_crusader.name':'Fel Crusader','form.doom_knight_f.name':'Doom Knight',
  'form.death_crusader.name':'Death Crusader','form.infernal_paladin.name':'Infernal Paladin',
  'form.asmodeus_lord.name':'Asmodeus',
  'form.cherub.name':'Cherub','form.young_celestial.name':'Young Celestial',
  'form.battle_angel.name':'Battle Angel','form.light_mage_angel.name':'Light Mage',
  'form.seraphim_warrior.name':'Seraphim Warrior','form.divine_knight_angel.name':'Divine Knight',
  'form.archangel_mage.name':'Archangel Mage','form.radiant_sage.name':'Radiant Sage',
  'form.divine_warrior_a.name':'Divine Warrior','form.holy_champion_angel.name':'Holy Champion',
  'form.crusader_angel.name':'Crusader Angel','form.judgment_angel.name':'Judgment Angel',
  'form.celestial_mage.name':'Celestial Mage','form.holy_archmage_a.name':'Holy Archmage',
  'form.oracle_angel.name':'Oracle Angel','form.seraphic_sage.name':'Seraphic Sage',
  'form.divine_sovereign_angel.name':'Divine Sovereign','form.holy_sovereign.name':'Holy Sovereign',
  'form.celestial_champion.name':'Celestial Champion','form.divine_warrior_god.name':'Divine Warrior God',
  'form.holy_paladin_god.name':'Holy Paladin God','form.guardian_angel_god.name':'Guardian Angel God',
  'form.judgment_god.name':'Judgment God','form.divine_crusader_god.name':'Divine Crusader God',
  'form.celestial_archmage.name':'Celestial Archmage','form.holy_mage_god.name':'Holy Mage God',
  'form.radiant_sovereign.name':'Radiant Sovereign','form.light_sovereign.name':'Light Sovereign',
  'form.oracle_god.name':'Oracle God','form.prophet_angel.name':'Prophet Angel',
  'form.seraph_sovereign.name':'Seraph Sovereign','form.divine_oracle.name':'Divine Oracle',
  'form.archangel_michael.name':'Archangel Michael',
};

const RU = {
  'race.vampire.name':'Вампир','race.lycan.name':'Оборотень',
  'race.fiend.name':'Демон','race.celestial.name':'Небожитель',
  'skill.blood_drain.name':'Кровосос','skill.blood_drain.desc':'Высасывает жизнь — 20% урона восстанавливается как HP.',
  'skill.night_veil.name':'Ночной Покров','skill.night_veil.desc':'Увеличивает шанс уклонения.',
  'skill.vampiric_aura.name':'Вампирская Аура','skill.vampiric_aura.desc':'Пассивный кровосос — все атаки крадут жизнь.',
  'skill.bat_swarm.name':'Стая Летучих Мышей','skill.bat_swarm.desc':'Посылает стаю летучих мышей.',
  'skill.blood_lance.name':'Кровавое Копьё','skill.blood_lance.desc':'Луч крови — мощный магический урон.',
  'skill.crimson_feast.name':'Алый Пир','skill.crimson_feast.desc':'Усиливает кровосос; защищает от летальных ударов.',
  'skill.feral_claw.name':'Дикий Коготь','skill.feral_claw.desc':'Атакует острыми когтями.',
  'skill.savage_bite.name':'Свирепый Укус','skill.savage_bite.desc':'Мощный укус — огромный физический урон.',
  'skill.lunar_rage.name':'Лунная Ярость','skill.lunar_rage.desc':'Пассивный инстинкт — усиливает все атаки.',
  'skill.pack_howl.name':'Вой Стаи','skill.pack_howl.desc':'Увеличивает урон и получение опыта.',
  'skill.beast_form.name':'Звериная Форма','skill.beast_form.desc':'Раскрывает звериную силу — усиливает атаку.',
  'skill.hellfire.name':'Адский Огонь','skill.hellfire.desc':'Пламя из ада — сильный урон огнём.',
  'skill.fel_armor.name':'Адская Броня','skill.fel_armor.desc':'Инфернальная броня — усиливает защиту.',
  'skill.soul_pact.name':'Пакт Душ','skill.soul_pact.desc':'Тратит 15% HP для огромного урона огнём.',
  'skill.infernal_brand.name':'Инфернальная Метка','skill.infernal_brand.desc':'Пассивная сила — увеличивает весь урон.',
  'skill.infernal_storm.name':'Инфернальный Шторм','skill.infernal_storm.desc':'Огненный шторм — мощнейшая магия огня.',
  'skill.healing_light.name':'Исцеляющий Свет','skill.healing_light.desc':'Святая регенерация HP.',
  'skill.guardian_aura.name':'Защитная Аура','skill.guardian_aura.desc':'Мощно усиливает регенерацию.',
  'skill.radiant_burst.name':'Вспышка Сияния','skill.radiant_burst.desc':'Световой магический урон.',
  'skill.wings_of_light.name':'Крылья Света','skill.wings_of_light.desc':'Значительно увеличивает уклонение.',
  'skill.judgment.name':'Суд','skill.judgment.desc':'Мощная святая магия — световой урон.',
  'form.vampire_spawn.name':'Личинка Вампира','form.blood_fledgling.name':'Кровавый Птенец',
  'form.blood_mage.name':'Кровавый Маг','form.night_hunter.name':'Ночной Охотник',
  'form.blood_sorcerer.name':'Кровавый Чародей','form.plague_vampire.name':'Чумной Вампир',
  'form.shadow_stalker.name':'Теневой Охотник','form.blood_charmer.name':'Кровавый Чарователь',
  'form.blood_archmage.name':'Кровавый Архимаг','form.crimson_witch.name':'Багровая Ведьма',
  'form.plague_lord.name':'Лорд Чумы','form.death_herald_v.name':'Вестник Смерти',
  'form.phantom_stalker.name':'Призрачный Охотник','form.dark_predator_v.name':'Тёмный Хищник',
  'form.charm_master.name':'Мастер Чар','form.vampire_noble.name':'Дворянин Вампир',
  'form.blood_god_v.name':'Бог Крови','form.scarlet_sovereign.name':'Алый Владыка',
  'form.venom_witch.name':'Ядовитая Ведьма','form.blood_empress.name':'Кровавая Императрица',
  'form.pestilence_god_v.name':'Бог Мора','form.undead_overlord_v.name':'Владыка Нежити',
  'form.night_sovereign_v.name':'Ночной Владыка','form.shadow_lord_v.name':'Теневой Лорд',
  'form.apex_vampire.name':'Высший Вампир','form.night_king_v.name':'Ночной Король',
  'form.void_predator_v.name':'Пустотный Хищник','form.blood_hunter_v.name':'Охотник Крови',
  'form.blood_countess.name':'Кровавая Графиня','form.psychic_vampire.name':'Психический Вампир',
  'form.nosferatu_lord.name':'Лорд Носферату','form.eternal_vampire.name':'Вечный Вампир',
  'form.dracula_lord.name':'Дракула',
  'form.wolf_cub.name':'Волчонок','form.young_lycan.name':'Молодой Оборотень',
  'form.feral_berserker_l.name':'Дикий Берсерк','form.pack_wolf.name':'Стайный Волк',
  'form.blood_wolf.name':'Кровавый Волк','form.war_wolf.name':'Боевой Волк',
  'form.alpha_wolf.name':'Альфа-Волк','form.spirit_wolf.name':'Духовный Волк',
  'form.savage_lord.name':'Дикий Лорд','form.death_wolf.name':'Волк Смерти',
  'form.blade_wolf.name':'Волк-Клинок','form.berserker_king.name':'Король Берсерков',
  'form.pack_alpha.name':'Вожак Стаи','form.great_wolf.name':'Великий Волк',
  'form.lunar_sage.name':'Лунный Мудрец','form.moon_guardian.name':'Страж Луны',
  'form.slaughter_king.name':'Король Резни','form.blood_reaver.name':'Кровавый Опустошитель',
  'form.grim_wolf.name':'Мрачный Волк','form.dread_wolf.name':'Волк Ужаса',
  'form.shadow_wolf_lord.name':'Теневой Лорд Волков','form.storm_wolf.name':'Волк Бури',
  'form.berserk_god.name':'Бог Берсерков','form.warlord_lycan.name':'Военный Лорд',
  'form.lycan_alpha_sovereign.name':'Альфа-Владыка','form.primal_alpha_l.name':'Первобытный Альфа',
  'form.ancient_wolf.name':'Древний Волк','form.wolf_titan.name':'Волк-Титан',
  'form.moon_sage.name':'Лунный Мудрец','form.moon_void_wolf.name':'Лунный Пустотный Волк',
  'form.lunar_warden.name':'Лунный Страж','form.celestial_wolf.name':'Небесный Волк',
  'form.fenrir_ancient.name':'Древний Фенрир',
  'form.imp.name':'Бес','form.young_fiend.name':'Молодой Демон',
  'form.flame_fiend_l.name':'Огненный Демон','form.shadow_fiend_l.name':'Теневой Демон',
  'form.inferno_lord.name':'Лорд Инферно','form.pact_broker.name':'Брокер Пактов',
  'form.shadow_devil.name':'Теневой Дьявол','form.cursed_knight_f.name':'Проклятый Рыцарь',
  'form.fire_archfiend.name':'Огненный Архидемон','form.molten_devil.name':'Расплавленный Дьявол',
  'form.soul_merchant.name':'Торговец Душами','form.doom_broker.name':'Брокер Гибели',
  'form.umbral_fiend.name':'Умбральный Демон','form.night_devil.name':'Ночной Дьявол',
  'form.hellknight.name':'Адский Рыцарь','form.doom_crusader.name':'Крестоносец Гибели',
  'form.balrog_lord.name':'Лорд Балрог','form.infernal_god.name':'Инфернальный Бог',
  'form.magma_sovereign.name':'Владыка Магмы','form.fire_tyrant_f.name':'Тиран Огня',
  'form.dark_pact_lord.name':'Лорд Тёмного Пакта','form.mephisto_lord.name':'Мефисто',
  'form.doom_sovereign.name':'Владыка Гибели','form.ruin_lord.name':'Лорд Руин',
  'form.void_shadow_fiend.name':'Пустотно-Теневой Демон','form.abyssal_fiend.name':'Бездонный Демон',
  'form.shadow_sovereign.name':'Теневой Владыка','form.dread_devil.name':'Дьявол Ужаса',
  'form.fel_crusader.name':'Адский Крестоносец','form.doom_knight_f.name':'Рыцарь Гибели',
  'form.death_crusader.name':'Крестоносец Смерти','form.infernal_paladin.name':'Инфернальный Паладин',
  'form.asmodeus_lord.name':'Асмодей',
  'form.cherub.name':'Херувим','form.young_celestial.name':'Молодой Небожитель',
  'form.battle_angel.name':'Боевой Ангел','form.light_mage_angel.name':'Световой Маг',
  'form.seraphim_warrior.name':'Воин-Серафим','form.divine_knight_angel.name':'Божественный Рыцарь',
  'form.archangel_mage.name':'Архангел-Маг','form.radiant_sage.name':'Сияющий Мудрец',
  'form.divine_warrior_a.name':'Божественный Воин','form.holy_champion_angel.name':'Святой Чемпион',
  'form.crusader_angel.name':'Ангел-Крестоносец','form.judgment_angel.name':'Ангел Суда',
  'form.celestial_mage.name':'Небесный Маг','form.holy_archmage_a.name':'Святой Архимаг',
  'form.oracle_angel.name':'Ангел-Оракул','form.seraphic_sage.name':'Серафический Мудрец',
  'form.divine_sovereign_angel.name':'Божественный Владыка','form.holy_sovereign.name':'Святой Владыка',
  'form.celestial_champion.name':'Небесный Чемпион','form.divine_warrior_god.name':'Бог Воинов',
  'form.holy_paladin_god.name':'Бог Паладинов','form.guardian_angel_god.name':'Бог-Хранитель',
  'form.judgment_god.name':'Бог Суда','form.divine_crusader_god.name':'Бог Крестоносцев',
  'form.celestial_archmage.name':'Небесный Архимаг','form.holy_mage_god.name':'Бог Магов',
  'form.radiant_sovereign.name':'Сияющий Владыка','form.light_sovereign.name':'Владыка Света',
  'form.oracle_god.name':'Бог-Оракул','form.prophet_angel.name':'Ангел-Пророк',
  'form.seraph_sovereign.name':'Владыка Серафимов','form.divine_oracle.name':'Божественный Оракул',
  'form.archangel_michael.name':'Архангел Михаил',
};

// ============================================================
// WRITE EVERYTHING
// ============================================================
const allNewEvos = [...VAMP_EVOS,...LYCAN_EVOS,...FIEND_EVOS,...CELESTIAL_EVOS];
const filteredEvos  = allNewEvos.filter(e => !existingEvoIds.has(e.id));
const filteredSkills = NEW_SKILLS.filter(s => !existingSkillIds.has(s.id));
const filteredRaces  = NEW_RACES.filter(r => !existingRaceIds.has(r.id));

filteredSkills.forEach(s => skills.push(s));
fs.writeFileSync(path.join(DATA,'skills.json'), JSON.stringify(skills,null,2),'utf8');

filteredRaces.forEach(r => races.push(r));
fs.writeFileSync(path.join(DATA,'races.json'), JSON.stringify(races,null,2),'utf8');

filteredEvos.forEach(e => evolutions.push(e));
fs.writeFileSync(path.join(DATA,'evolutions.json'), JSON.stringify(evolutions,null,2),'utf8');

Object.assign(tr, TR);
Object.assign(en, EN);
Object.assign(ru, RU);
fs.writeFileSync(path.join(DATA,'i18n','tr.json'), JSON.stringify(tr,null,2),'utf8');
fs.writeFileSync(path.join(DATA,'i18n','en.json'), JSON.stringify(en,null,2),'utf8');
fs.writeFileSync(path.join(DATA,'i18n','ru.json'), JSON.stringify(ru,null,2),'utf8');

console.log(`skills.json  : +${filteredSkills.length} skills`);
console.log(`races.json   : +${filteredRaces.length} races`);
console.log(`evolutions.json: +${filteredEvos.length} forms`);
console.log(`i18n         : +${Object.keys(TR).length} keys / locale`);
console.log('Done!');
