const fs = require('fs');

const racesData = {
  spider: [
    { id: "cave_spiderling", name: "Cave Spiderling", stats: { AGI: 3, WIS: 1 }, skill: "venom_spit" },
    { id: "venom_weaver", name: "Venom Weaver", stats: { AGI: 5, LUCK: 3 }, skill: "silk_trap" },
    { id: "guard_spider", name: "Guard Spider", stats: { VIT: 6, STR: 4 }, skill: "chitin_skin" },
    { id: "great_taratect", name: "Great Taratect", stats: { STR: 10, VIT: 12 }, skill: "iron_carapace" },
    { id: "lesser_taratect_queen", name: "Lesser Taratect Queen", stats: { WIS: 12, INT: 12 }, skill: "summon_spiderling" },
    { id: "taratect_monarch", name: "Taratect Monarch", stats: { AGI: 15, STR: 15, WIS: 10 }, skill: "monarch_gaze" },
    { id: "abyssal_weaver", name: "Abyssal Weaver", stats: { INT: 20, AGI: 25 }, skill: "void_silk" },
    { id: "dread_arachnid", name: "Dread Arachnid", stats: { STR: 30, VIT: 30 }, skill: "venomous_strike_t8" },
    { id: "demon_spider_queen", name: "Demon Spider Queen", stats: { INT: 35, WIS: 35, AGI: 40 }, skill: "blood_silk_nest", humanoid: true },
    { id: "arachnid_sovereign", name: "Arachnid Sovereign", stats: { STR: 50, VIT: 50, AGI: 50, INT: 50, WIS: 50, LUCK: 50 }, skill: "sovereign_cocoon", humanoid: true }
  ],
  slime: [
    { id: "slimelet", name: "Slimelet", stats: { VIT: 4, LUCK: 2 }, skill: "acid_splash" },
    { id: "acid_slime", name: "Acid Slime", stats: { VIT: 6, INT: 4 }, skill: "digestive_acid" },
    { id: "iron_slime", name: "Iron Slime", stats: { VIT: 12, STR: 4 }, skill: "solidify" },
    { id: "mutated_slime", name: "Mutated Slime", stats: { VIT: 15, LUCK: 15 }, skill: "unstable_slime" },
    { id: "slime_scholar", name: "Slime Scholar", stats: { INT: 20, WIS: 20 }, skill: "mimic_form", humanoid: true },
    { id: "shimmering_gel", name: "Shimmering Gel", stats: { WIS: 25, AGI: 25 }, skill: "elemental_absorption" },
    { id: "arcane_slime_sage", name: "Arcane Slime Sage", stats: { INT: 35, WIS: 30 }, skill: "slime_magic_explosion", humanoid: true },
    { id: "gilded_slime_lord", name: "Gilded Slime Lord", stats: { VIT: 40, LUCK: 40 }, skill: "golden_touch", humanoid: true },
    { id: "abyssal_slime_sovereign", name: "Abyssal Slime Sovereign", stats: { VIT: 60, INT: 50 }, skill: "void_ingestion" },
    { id: "slime_emperor", name: "Slime Emperor / Empress", stats: { STR: 50, VIT: 50, AGI: 50, INT: 50, WIS: 50, LUCK: 50 }, skill: "absorption_replication", humanoid: true }
  ],
  skeleton: [
    { id: "reanimated_bones", name: "Reanimated Bones", stats: { STR: 2, VIT: 2 }, skill: "bone_strike", humanoid: true },
    { id: "skeleton_soldier", name: "Skeleton Soldier", stats: { STR: 5, VIT: 4 }, skill: "shield_block", humanoid: true },
    { id: "bone_guard", name: "Bone Guard", stats: { VIT: 10, STR: 8 }, skill: "fortress_stance", humanoid: true },
    { id: "skeletal_knight", name: "Skeletal Knight", stats: { STR: 15, AGI: 10 }, skill: "cleave", humanoid: true },
    { id: "death_knight", name: "Death Knight", stats: { STR: 20, VIT: 20 }, skill: "necromantic_strike", humanoid: true },
    { id: "bone_warden", name: "Bone Warden", stats: { VIT: 30, WIS: 20 }, skill: "soul_ward", humanoid: true },
    { id: "lich_apprentice", name: "Lich Apprentice", stats: { INT: 35, WIS: 30 }, skill: "dark_bolt", humanoid: true },
    { id: "skeletal_dreadnought", name: "Skeletal Dreadnought", stats: { STR: 45, VIT: 45 }, skill: "undying_resolve", humanoid: true },
    { id: "wraith_lord", name: "Wraith Lord", stats: { INT: 50, AGI: 40 }, skill: "spectral_slash", humanoid: true },
    { id: "lich_sovereign", name: "Lich Sovereign", stats: { STR: 50, VIT: 50, AGI: 50, INT: 50, WIS: 50, LUCK: 50 }, skill: "raise_dead", humanoid: true }
  ],
  wyrmling: [
    { id: "fire_wyrmling", name: "Fire Wyrmling", stats: { STR: 3, INT: 2 }, skill: "ember_breath" },
    { id: "flame_scale_drake", name: "Flame Scale Drake", stats: { VIT: 6, STR: 6 }, skill: "dragon_scale" },
    { id: "ember_dragon", name: "Ember Dragon", stats: { STR: 12, INT: 10 }, skill: "fire_fang" },
    { id: "volcano_drake", name: "Volcano Drake", stats: { STR: 18, VIT: 18 }, skill: "magma_splash" },
    { id: "elder_wyrm", name: "Elder Wyrm", stats: { STR: 25, WIS: 20 }, skill: "draconic_roar" },
    { id: "dragon_vanguard", name: "Dragon Vanguard", stats: { STR: 30, VIT: 30 }, skill: "dragon_slash", humanoid: true },
    { id: "obsidian_wyrm", name: "Obsidian Wyrm", stats: { VIT: 45, STR: 40 }, skill: "obsidian_scales" },
    { id: "cataclysm_drake", name: "Cataclysm Drake", stats: { INT: 50, STR: 50 }, skill: "apocalypse_breath" },
    { id: "dragon_lord", name: "Dragon Lord", stats: { STR: 45, VIT: 45, AGI: 45, INT: 45, WIS: 45, LUCK: 45 }, skill: "draconic_sovereignty", humanoid: true },
    { id: "primeval_dragon_sovereign", name: "Primeval Dragon Sovereign", stats: { STR: 60, VIT: 60, AGI: 60, INT: 60, WIS: 60, LUCK: 60 }, skill: "" }
  ],
  golem: [
    { id: "clay_pebble", name: "Clay Pebble", stats: { VIT: 5 }, skill: "dirt_throw" },
    { id: "earth_mud_golem", name: "Earth Mud Golem", stats: { VIT: 8, STR: 4 }, skill: "mud_slam" },
    { id: "stone_sentinel", name: "Stone Sentinel", stats: { VIT: 15, STR: 10 }, skill: "stone_fortress" },
    { id: "granite_titan", name: "Granite Titan", stats: { STR: 20, VIT: 25 }, skill: "quake_slam" },
    { id: "ironclad_golem", name: "Ironclad Golem", stats: { STR: 30, VIT: 30 }, skill: "iron_fist", humanoid: true },
    { id: "runic_protector", name: "Runic Protector", stats: { WIS: 35, VIT: 35 }, skill: "runic_barrier", humanoid: true },
    { id: "obsidian_colossus", name: "Obsidian Colossus", stats: { VIT: 50, STR: 45 }, skill: "lava_fists" },
    { id: "mythril_automaton", name: "Mythril Automaton", stats: { STR: 55, AGI: 35 }, skill: "overclock", humanoid: true },
    { id: "celestial_engine", name: "Celestial Engine", stats: { INT: 50, WIS: 55 }, skill: "celestial_beam", humanoid: true },
    { id: "terraforming_engine_sovereign", name: "Terraforming Engine Sovereign", stats: { VIT: 100, STR: 60 }, skill: "unmovable_core" }
  ],
  human: [
    { id: "lost_villager", name: "Lost Villager", stats: { STR: 2, VIT: 2, AGI: 2, INT: 2, WIS: 2, LUCK: 2 }, skill: "improvised_defense", humanoid: true },
    { id: "novice_squire", name: "Novice Squire", stats: { STR: 4, VIT: 4 }, skill: "sword_slash", humanoid: true },
    { id: "apprentice_mage", name: "Apprentice Mage", stats: { INT: 6, WIS: 6 }, skill: "mana_bolt", humanoid: true },
    { id: "royal_soldier", name: "Royal Soldier", stats: { STR: 12, AGI: 10 }, skill: "thrust", humanoid: true },
    { id: "vanguard_knight", name: "Vanguard Knight", stats: { STR: 20, VIT: 20 }, skill: "defensive_wall", humanoid: true },
    { id: "arcane_spellblade", name: "Arcane Spellblade", stats: { STR: 22, INT: 22 }, skill: "infused_slash", humanoid: true },
    { id: "templar_champion", name: "Templar Champion", stats: { VIT: 35, WIS: 30 }, skill: "divine_smite", humanoid: true },
    { id: "grand_archmage", name: "Grand Archmage", stats: { INT: 55, WIS: 45 }, skill: "meteor_strike", humanoid: true },
    { id: "divine_paladin", name: "Divine Paladin", stats: { STR: 50, VIT: 55 }, skill: "guardian_angel", humanoid: true },
    { id: "paragon_sovereign", name: "Paragon Sovereign", stats: { STR: 45, VIT: 45, AGI: 45, INT: 45, WIS: 45, LUCK: 45 }, skill: "", humanoid: true }
  ],
  demon: [
    { id: "lesser_imp", name: "Lesser Imp", stats: { INT: 3, AGI: 2 }, skill: "fire_pinch" },
    { id: "fire_imp", name: "Fire Imp", stats: { INT: 6, AGI: 4 }, skill: "imp_fire" },
    { id: "hellhound", name: "Hellhound", stats: { STR: 12, AGI: 10 }, skill: "flaming_bite" },
    { id: "horned_fiend", name: "Horned Fiend", stats: { STR: 18, VIT: 14 }, skill: "dark_strike" },
    { id: "blood_fiend", name: "Blood Fiend", stats: { INT: 24, VIT: 20 }, skill: "blood_well", humanoid: true },
    { id: "demon_blade_master", name: "Demon Blade-Master", stats: { STR: 30, AGI: 30 }, skill: "fiend_fury", humanoid: true },
    { id: "torment_bringer", name: "Torment Bringer", stats: { INT: 40, WIS: 35 }, skill: "agony_curse", humanoid: true },
    { id: "hellfire_overlord", name: "Hellfire Overlord", stats: { INT: 55, STR: 45 }, skill: "hellfire", humanoid: true },
    { id: "archdemon", name: "Archdemon", stats: { STR: 45, VIT: 45, AGI: 45, INT: 45, WIS: 45, LUCK: 45 }, skill: "abyssal_blaze", humanoid: true },
    { id: "abyssal_demon_lord", name: "Abyssal Demon Lord", stats: { STR: 55, VIT: 55, AGI: 55, INT: 55, WIS: 55, LUCK: 55 }, skill: "demonic_obliteration", humanoid: true }
  ],
  beastkin: [
    { id: "feral_pup", name: "Feral Pup", stats: { AGI: 3, STR: 2 }, skill: "scratch" },
    { id: "swift_claw", name: "Swift Claw", stats: { AGI: 7, STR: 4 }, skill: "beast_claw" },
    { id: "wolf_warrior", name: "Wolf Warrior", stats: { AGI: 12, STR: 10 }, skill: "feral_rend" },
    { id: "pride_chaser", name: "Pride Chaser", stats: { AGI: 18, LUCK: 12 }, skill: "dash_attack", humanoid: true },
    { id: "feral_berserker", name: "Feral Berserker", stats: { STR: 25, VIT: 20 }, skill: "bloody_rampage", humanoid: true },
    { id: "beastkin_vanguard", name: "Beastkin Vanguard", stats: { STR: 30, AGI: 30 }, skill: "battle_cry", humanoid: true },
    { id: "ursine_warden", name: "Ursine Warden", stats: { VIT: 45, STR: 35 }, skill: "bear_hug", humanoid: true },
    { id: "shadow_stalker", name: "Shadow Stalker", stats: { AGI: 55, LUCK: 40 }, skill: "wild_claws", humanoid: true },
    { id: "chimera_lord", name: "Chimera Lord", stats: { STR: 45, VIT: 45, AGI: 45, INT: 45, WIS: 45, LUCK: 45 }, skill: "elemental_claws", humanoid: true },
    { id: "primal_beast_sovereign", name: "Primal Beast Sovereign", stats: { STR: 50, VIT: 50, AGI: 50, INT: 50, WIS: 50, LUCK: 50 }, skill: "primal_shred", humanoid: true }
  ]
};

const evolutions = [];

for (const [raceId, forms] of Object.entries(racesData)) {
  for (let i = 0; i < forms.length; i++) {
    const f = forms[i];
    const isT1 = (i === 0);
    const isT10 = (i === forms.length - 1);
    
    const ev = {
      id: f.id,
      raceId: raceId,
      locKey: `form.${f.id}.name`,
      evolvesTo: isT10 ? [] : [forms[i + 1].id],
      levelReq: isT1 ? 1 : 10,
      statBonus: f.stats,
      grantSkills: f.skill ? [f.skill] : [],
      tierReq: i // T1 = 0, T2 = 1, T3 = 2, ..., T10 = 9
    };
    
    if (f.humanoid) {
      ev.humanoid = true;
    }
    
    evolutions.push(ev);
  }
}

fs.writeFileSync('data/evolutions.json', JSON.stringify(evolutions, null, 2), 'utf-8');
console.log(`Generated data/evolutions.json with ${evolutions.length} forms.`);
