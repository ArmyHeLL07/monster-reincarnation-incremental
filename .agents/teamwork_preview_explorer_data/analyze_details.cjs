const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const evolutions = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/evolutions.json'), 'utf8'));
const skills = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/skills.json'), 'utf8'));
const enI18n = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/i18n/en.json'), 'utf8'));

// Specify the GDD data structure
const gddData = {
  spider: {
    name: 'Spider (Arachnid)',
    jsonRaceId: 'spider',
    tiers: [
      { tier: 1, name: 'Cave Spiderling', skill: 'venom_spit' },
      { tier: 2, name: 'Venom Weaver', skill: 'silk_trap' },
      { tier: 3, name: 'Guard Spider', skill: 'chitin_skin' },
      { tier: 4, name: 'Great Taratect', skill: 'iron_carapace' },
      { tier: 5, name: 'Lesser Taratect Queen', skill: 'summon_spiderling' },
      { tier: 6, name: 'Taratect Monarch', skill: 'monarch_gaze' },
      { tier: 7, name: 'Abyssal Weaver', skill: 'void_silk' },
      { tier: 8, name: 'Dread Arachnid', skill: 'venomous_strike_t8' },
      { tier: 9, name: 'Demon Spider Queen', skill: 'blood_silk_nest' },
      { tier: 10, name: 'Arachnid Sovereign', skill: 'sovereign_cocoon' }
    ]
  },
  slime: {
    name: 'Slime',
    jsonRaceId: 'slime',
    tiers: [
      { tier: 1, name: 'Slimelet', skill: 'acid_splash' },
      { tier: 2, name: 'Acid Slime', skill: 'digestive_acid' },
      { tier: 3, name: 'Iron Slime', skill: 'solidify' },
      { tier: 4, name: 'Mutated Slime', skill: 'unstable_slime' },
      { tier: 5, name: 'Slime Scholar', skill: 'mimic_form' },
      { tier: 6, name: 'Shimmering Gel', skill: 'elemental_absorption' },
      { tier: 7, name: 'Arcane Slime Sage', skill: 'slime_magic_explosion' },
      { tier: 8, name: 'Gilded Slime Lord', skill: 'golden_touch' },
      { tier: 9, name: 'Abyssal Slime Sovereign', skill: 'void_ingestion' },
      { tier: 10, name: 'Slime Emperor / Empress', skill: 'absorption_and_replication' }
    ]
  },
  skeleton: {
    name: 'Skeleton (Undead)',
    jsonRaceId: 'skeleton',
    tiers: [
      { tier: 1, name: 'Reanimated Bones', skill: 'bone_strike' },
      { tier: 2, name: 'Skeleton Soldier', skill: 'shield_block' },
      { tier: 3, name: 'Bone Guard', skill: 'fortress_stance' },
      { tier: 4, name: 'Skeletal Knight', skill: 'cleave' },
      { tier: 5, name: 'Death Knight', skill: 'necromantic_strike' },
      { tier: 6, name: 'Bone Warden', skill: 'soul_ward' },
      { tier: 7, name: 'Lich Apprentice', skill: 'dark_bolt' },
      { tier: 8, name: 'Skeletal Dreadnought', skill: 'undying_resolve' },
      { tier: 9, name: 'Wraith Lord', skill: 'spectral_slash' },
      { tier: 10, name: 'Lich Sovereign', skill: 'raise_dead' }
    ]
  },
  wyrmling: {
    name: 'Wyrmling (Dragonkin)',
    jsonRaceId: 'wyrmling',
    tiers: [
      { tier: 1, name: 'Fire Wyrmling', skill: 'ember_breath' },
      { tier: 2, name: 'Flame Scale Drake', skill: 'dragon_scale' },
      { tier: 3, name: 'Ember Dragon', skill: 'fire_fang' },
      { tier: 4, name: 'Volcano Drake', skill: 'magma_splash' },
      { tier: 5, name: 'Elder Wyrm', skill: 'draconic_roar' },
      { tier: 6, name: 'Dragon Vanguard', skill: 'dragon_slash' },
      { tier: 7, name: 'Obsidian Wyrm', skill: 'obsidian_scales' },
      { tier: 8, name: 'Cataclysm Drake', skill: 'apocalypse_breath' },
      { tier: 9, name: 'Dragon Lord', skill: 'draconic_sovereignty' },
      { tier: 10, name: 'Primeval Dragon Sovereign', skill: 'primeval_heritage_and_cataclysm' }
    ]
  },
  golem: {
    name: 'Golem',
    jsonRaceId: 'golem',
    tiers: [
      { tier: 1, name: 'Clay Pebble', skill: 'dirt_throw' },
      { tier: 2, name: 'Earth Mud Golem', skill: 'mud_slam' },
      { tier: 3, name: 'Stone Sentinel', skill: 'stone_fortress' },
      { tier: 4, name: 'Granite Titan', skill: 'quake_slam' },
      { tier: 5, name: 'Ironclad Golem', skill: 'iron_fist' },
      { tier: 6, name: 'Runic Protector', skill: 'runic_barrier' },
      { tier: 7, name: 'Obsidian Colossus', skill: 'lava_fists' },
      { tier: 8, name: 'Mythril Automaton', skill: 'overclock' },
      { tier: 9, name: 'Celestial Engine', skill: 'celestial_beam' },
      { tier: 10, name: 'Terraforming Engine Sovereign', skill: 'unmovable_core' }
    ]
  },
  human: {
    name: 'Human',
    jsonRaceId: 'human',
    tiers: [
      { tier: 1, name: 'Lost Villager', skill: 'improvised_defense' },
      { tier: 2, name: 'Novice Squire', skill: 'sword_slash' },
      { tier: 3, name: 'Apprentice Mage', skill: 'mana_bolt' },
      { tier: 4, name: 'Royal Soldier', skill: 'thrust' },
      { tier: 5, name: 'Vanguard Knight', skill: 'defensive_wall' },
      { tier: 6, name: 'Arcane Spellblade', skill: 'infused_slash' },
      { tier: 7, name: 'Templar Champion', skill: 'divine_smite' },
      { tier: 8, name: 'Grand Archmage', skill: 'meteor_strike' },
      { tier: 9, name: 'Divine Paladin', skill: 'guardian_angel' },
      { tier: 10, name: 'Paragon Sovereign', skill: 'absolute_adaptability' }
    ]
  },
  demon: {
    name: 'Demon',
    jsonRaceId: 'fiend', // fiend in JSON
    tiers: [
      { tier: 1, name: 'Lesser Imp', skill: 'fire_pinch' },
      { tier: 2, name: 'Fire Imp', skill: 'imp_fire' },
      { tier: 3, name: 'Hellhound', skill: 'flaming_bite' },
      { tier: 4, name: 'Horned Fiend', skill: 'dark_strike' },
      { tier: 5, name: 'Blood Fiend', skill: 'blood_well' },
      { tier: 6, name: 'Demon Blade-Master', skill: 'fiend_fury' },
      { tier: 7, name: 'Torment Bringer', skill: 'agony_curse' },
      { tier: 8, name: 'Hellfire Overlord', skill: 'hellfire' },
      { tier: 9, name: 'Archdemon', skill: 'abyssal_blaze' },
      { tier: 10, name: 'Abyssal Demon Lord', skill: 'demonic_obliteration' }
    ]
  },
  beastkin: {
    name: 'Beastkin',
    jsonRaceId: 'beastman', // beastman in JSON
    tiers: [
      { tier: 1, name: 'Feral Pup', skill: 'scratch' },
      { tier: 2, name: 'Swift Claw', skill: 'beast_claw' },
      { tier: 3, name: 'Wolf Warrior', skill: 'feral_rend' },
      { tier: 4, name: 'Pride Chaser', skill: 'dash_attack' },
      { tier: 5, name: 'Feral Berserker', skill: 'bloody_rampage' },
      { tier: 6, name: 'Beastkin Vanguard', skill: 'battle_cry' },
      { tier: 7, name: 'Ursine Warden', skill: 'bear_hug' },
      { tier: 8, name: 'Shadow Stalker', skill: 'wild_claws' },
      { tier: 9, name: 'Chimera Lord', skill: 'elemental_claws' },
      { tier: 10, name: 'Primal Beast Sovereign', skill: 'primal_shred' }
    ]
  }
};

// Helper: check if a name matches any localized form name or form ID in JSON
function findFormMatch(gddFormName, raceId) {
  // Try matching directly against form ID or localized form name
  const candidates = evolutions.filter(e => e.raceId === raceId);
  
  // Clean name for ID matching (e.g. "Cave Spiderling" -> "cave_spiderling")
  const normName = gddFormName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  
  // 1. Direct ID match
  let match = candidates.find(c => c.id === normName || c.id.replace(/_sp$|_l$|_bm$/, '') === normName);
  if (match) return { type: 'ID Match', formId: match.id, locName: enI18n[match.locKey] };
  
  // 2. Localized name match
  match = candidates.find(c => {
    const locName = enI18n[c.locKey];
    return locName && locName.toLowerCase() === gddFormName.toLowerCase();
  });
  if (match) return { type: 'Name Match', formId: match.id, locName: enI18n[match.locKey] };

  // 3. Partial match (starts with or ends with)
  match = candidates.find(c => {
    const locName = enI18n[c.locKey];
    return locName && (locName.toLowerCase().includes(gddFormName.toLowerCase()) || gddFormName.toLowerCase().includes(locName.toLowerCase()));
  });
  if (match) return { type: 'Partial Match', formId: match.id, locName: enI18n[match.locKey] };

  return null;
}

// Helper: check if a skill exists in JSON
function findSkillMatch(gddSkillId) {
  // 1. Direct ID match
  let skill = skills.find(s => s.id === gddSkillId);
  if (skill) return { type: 'ID Match', skillId: skill.id, name: enI18n[skill.locKeyName] };
  
  // 2. Localized name match
  const normSkill = gddSkillId.replace(/_/g, ' ').toLowerCase();
  skill = skills.find(s => {
    const sName = enI18n[s.locKeyName];
    return sName && sName.toLowerCase() === normSkill;
  });
  if (skill) return { type: 'Name Match', skillId: skill.id, name: enI18n[skill.locKeyName] };

  return null;
}

// Run audit
Object.keys(gddData).forEach(key => {
  const data = gddData[key];
  console.log(`\n========================================`);
  console.log(`Race: ${data.name} (JSON ID: ${data.jsonRaceId})`);
  console.log(`========================================`);
  
  data.tiers.forEach(t => {
    const formMatch = findFormMatch(t.name, data.jsonRaceId);
    const skillMatch = findSkillMatch(t.skill);
    
    console.log(`Tier ${t.tier}: "${t.name}" -> Skill: "${t.skill}"`);
    if (formMatch) {
      console.log(`  - Form: OK [${formMatch.type}] -> ID: "${formMatch.formId}" (Localized: "${formMatch.locName}")`);
    } else {
      console.log(`  - Form: MISSING`);
    }
    if (skillMatch) {
      console.log(`  - Skill: OK [${skillMatch.type}] -> ID: "${skillMatch.skillId}" (Localized: "${skillMatch.name}")`);
    } else {
      console.log(`  - Skill: MISSING`);
    }
  });
});
