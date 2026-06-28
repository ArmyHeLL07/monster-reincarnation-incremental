var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/run_tests.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_assert = __toESM(require("assert"), 1);

// packages/client/src/game/state.ts
var MAX_INVENTORY = 20;
function emptyEquipment() {
  return { weapon: null, offhand: null, head: null, body: null, hands: null, legs: null, feet: null, acc1: null, acc2: null };
}
function emptyAllocated() {
  return { STR: 0, VIT: 0, AGI: 0, INT: 0, WIS: 0, LUCK: 0 };
}
var LEVEL_CAP = 10;
function equipStatBonus(state) {
  const out = { STR: 0, VIT: 0, AGI: 0, INT: 0, WIS: 0, LUCK: 0 };
  if (!state.equipment) return out;
  for (const it of Object.values(state.equipment)) {
    if (!it) continue;
    for (const k of Object.keys(it.statBonus)) out[k] += it.statBonus[k] ?? 0;
  }
  return out;
}
function effStat(state, k) {
  let val = state.stats[k] + equipStatBonus(state)[k];
  if (k === "AGI" && state.raceId === "beastkin" && state.hp < state.maxHp * 0.35) {
    val = Math.round(val * 1.4);
  }
  return val;
}
function recomputeMaxes(state) {
  const effLvl = state.tier * LEVEL_CAP + state.level;
  const eq = equipStatBonus(state);
  const VIT = state.stats.VIT + eq.VIT;
  const INT = state.stats.INT + eq.INT;
  const AGI = state.stats.AGI + eq.AGI;
  state.maxHp = 20 + VIT * 4 + effLvl * 2;
  state.maxMp = 10 + INT * 3 + effLvl;
  state.maxSp = 10 + VIT * 2 + AGI * 2 + effLvl;
  state.hp = Math.min(state.hp, state.maxHp);
  state.mp = Math.min(state.mp, state.maxMp);
  state.sp = Math.min(state.sp, state.maxSp);
}
function newGame() {
  const stats = { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 };
  const state = {
    stats,
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    sp: 0,
    maxSp: 0,
    spRegenBonus: 0,
    level: 1,
    tier: 0,
    xp: 0,
    statPoints: 0,
    autosaveMin: 5,
    hunger: 0,
    inventory: [],
    ep: 0,
    pos: { layer: 1, floor: 1, room: 1 },
    raceId: "spider",
    formId: "cave_spiderling",
    eyeAssignments: { e1: null },
    // Appraisal is no longer free — it must be discovered, then slotted.
    action: "idle",
    autoResume: false,
    mpTransferUnlocked: false,
    atkCd: 0,
    equipped: ["venom_bite", "sharp_claw", "silk_thread"],
    combatMode: "auto",
    cooldowns: {},
    autoEat: true,
    lastSearchPos: "",
    fusionUnlocked: false,
    badFusions: 0,
    skills: [
      { id: "venom_bite", level: 1, exp: 0 },
      { id: "sharp_claw", level: 1, exp: 0 },
      { id: "silk_thread", level: 1, exp: 0 },
      { id: "quick_thought", level: 1, exp: 0 },
      { id: "chitin_hide", level: 1, exp: 0 },
      { id: "many_legged_gait", level: 1, exp: 0 }
    ],
    resistances: [
      { id: "physical_res", level: 0, exp: 0, nullified: false },
      { id: "pierce_res", level: 0, exp: 0, nullified: false },
      { id: "poison_res", level: 0, exp: 0, nullified: false },
      { id: "fire_res", level: 0, exp: 0, nullified: false }
    ],
    enemy: null,
    statusEffects: [],
    fusionCache: {},
    outbox: [],
    lastSeen: Date.now(),
    difficulty: "normal",
    permadeath: false,
    hellClears: [],
    rebirthCount: 0,
    unlocks: [],
    kills: 0,
    gatekeeperCleared: false,
    rebirthBoon: 0,
    souls: 0,
    soulUpgrades: {},
    ruler: { sin: 0, virtue: 0, taboo: 0, powers: [] },
    meditation: 0,
    meditationUnlocked: false,
    booksFound: [],
    discoveries: [],
    mapFragments: 0,
    loreFragments: 0,
    pendingRoom: null,
    scars: 0,
    exploredMax: {},
    layerRooms: {},
    layerFloors: {},
    seenForms: [],
    formHistory: ["hatchling_spider"],
    autoAdvance: false,
    roomCleared: false,
    pendingEvent: null,
    resolvedEvents: [],
    bossRiddle: null,
    riddleLimits: {},
    raceConfirmed: false,
    inventoryItems: [],
    equipment: emptyEquipment(),
    killedEnemies: {},
    sig: 0,
    sigAbsorb: null,
    allocated: emptyAllocated(),
    humanPath: void 0,
    pendingHumanPath: false,
    roomKillCount: 0,
    roomEnemyId: null,
    seenSkillIds: [],
    nearDeathCount: 0,
    vitEnduranceXP: 0,
    vitEndurancePerm: 0,
    forageCD: 0,
    pendingForage: null,
    tutorialStep: 0,
    seenHints: [],
    totalSearchCount: 0,
    autoSearchUnlocked: false,
    autoSearchFood: false,
    autoSearchExplore: false,
    searchCD: 0,
    autoEventDecision: false,
    autoEventPuzzleMode: "skip",
    spiderlings: 0,
    enemyStunTicks: 0
  };
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  return state;
}

// packages/client/src/game/difficulty.ts
var FALLBACK = {
  id: "normal",
  locKey: "diff.normal.name",
  startLayer: 1,
  enemyMult: 1,
  playerMult: 1,
  deathPenalty: 0.3
};
function diffDef(state, content2) {
  return content2.difficulties.get(state.difficulty) ?? FALLBACK;
}
function applyDifficultyStart(state, content2, id) {
  state.difficulty = id;
  const def = content2.difficulties.get(id) ?? FALLBACK;
  const layer = content2.dungeon.layers.find((l) => l.id === def.startLayer);
  state.pos = { layer: def.startLayer, floor: 1, room: 1 };
  state.enemy = null;
  if (layer && state.tier < layer.tierReq) {
  }
}

// packages/client/src/game/race.ts
function applyRace(state, raceId, content2) {
  const race = content2.races.get(raceId);
  if (!race) return;
  state.raceId = raceId;
  if (race.startStats) {
    state.stats = { ...race.startStats };
  }
  const startForm = [...content2.forms.values()].find((f) => f.raceId === raceId && f.levelReq === 1);
  if (startForm) state.formId = startForm.id;
  if (race.startSkills?.length) {
    state.skills = race.startSkills.map((id) => ({ id, level: 1, exp: 0 }));
    state.equipped = race.startSkills.filter((id) => content2.skills.get(id)?.damage !== void 0).slice(0, 3);
  }
  if (race.startResistances?.length) {
    state.resistances = race.startResistances.map((id) => ({ id, level: 0, exp: 0, nullified: false }));
  }
  state.eyeAssignments = {};
  for (const eye of race.head.eyes) state.eyeAssignments[eye.id] = null;
  state.humanPath = void 0;
  state.pendingHumanPath = false;
  state.roomKillCount = 0;
  state.roomEnemyId = null;
  state.seenSkillIds = [];
  state.nearDeathCount = 0;
  state.vitEnduranceXP = 0;
  state.vitEndurancePerm = 0;
  state.forageCD = 0;
  state.pendingForage = null;
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
}

// packages/client/src/game/soul.ts
var SOUL_UPGRADES = [
  { id: "predator_soul", locKey: "soul.predator_soul.name", locKeyDesc: "soul.predator_soul.desc", icon: "\u{1FA78}", baseCost: 2, costMult: 1.55, maxLevel: 20, per: 0.08 },
  { id: "ancient_armor", locKey: "soul.ancient_armor.name", locKeyDesc: "soul.ancient_armor.desc", icon: "\u{1F6E1}\uFE0F", baseCost: 2, costMult: 1.55, maxLevel: 20, per: 0.06 },
  { id: "greed_soul", locKey: "soul.greed_soul.name", locKeyDesc: "soul.greed_soul.desc", icon: "\u{1F4B0}", baseCost: 3, costMult: 1.6, maxLevel: 20, per: 0.1 },
  { id: "sleepless", locKey: "soul.sleepless.name", locKeyDesc: "soul.sleepless.desc", icon: "\u{1F319}", baseCost: 3, costMult: 1.6, maxLevel: 15, per: 0.12 },
  { id: "wisdom_soul", locKey: "soul.wisdom_soul.name", locKeyDesc: "soul.wisdom_soul.desc", icon: "\u{1F9E0}", baseCost: 4, costMult: 1.7, maxLevel: 12, per: 0.05 },
  { id: "soul_luck", locKey: "soul.soul_luck.name", locKeyDesc: "soul.soul_luck.desc", icon: "\u{1F340}", baseCost: 5, costMult: 1.8, maxLevel: 15, per: 0.06 },
  { id: "extra_slot", locKey: "soul.extra_slot.name", locKeyDesc: "soul.extra_slot.desc", icon: "\u2694\uFE0F", baseCost: 25, costMult: 4, maxLevel: 2, per: 1 }
];
var byId = new Map(SOUL_UPGRADES.map((u) => [u.id, u]));
function soulLevel(state, id) {
  return state.soulUpgrades?.[id] ?? 0;
}
function computeSoulGain(state) {
  const kills = Math.max(0, state.kills);
  const tier = Math.max(0, state.tier);
  const layer = Math.max(1, state.pos?.layer ?? 1);
  const base = Math.sqrt(kills / 8) + tier * 2 + layer * 3;
  const luck = 1 + soulLevel(state, "soul_luck") * byId.get("soul_luck").per;
  return Math.max(1, Math.floor(base * luck));
}

// packages/client/src/game/rebirth.ts
function canRebirth(state) {
  return state.gatekeeperCleared;
}
function rebirth(state, content2, log) {
  if (!canRebirth(state)) return false;
  const fresh = newGame();
  const boon = state.rebirthBoon + 1;
  const savedRaceId = state.raceId;
  const earnedSouls = computeSoulGain(state);
  state.souls = (state.souls ?? 0) + earnedSouls;
  state.skills = fresh.skills.map((s) => ({ ...s }));
  state.resistances = fresh.resistances.map((r) => ({ ...r }));
  state.formId = fresh.formId;
  state.tier = 0;
  state.level = 1;
  state.xp = 0;
  state.statPoints = boon * 3;
  state.ep = 0;
  state.hunger = 0;
  state.inventory = [];
  const keepLegendary = [
    ...(state.inventoryItems ?? []).filter((i) => i.rarity === "legendary"),
    ...Object.values(state.equipment ?? {}).filter((i) => !!i && i.rarity === "legendary")
  ];
  state.inventoryItems = keepLegendary;
  state.equipment = emptyEquipment();
  state.allocated = emptyAllocated();
  state.enemy = null;
  state.eyeAssignments = { ...fresh.eyeAssignments };
  state.kills = 0;
  state.scars = 0;
  state.pendingRoom = null;
  state.statusEffects = [];
  state.roomCleared = false;
  state.cooldowns = {};
  state.spiderlings = 0;
  state.enemyStunTicks = 0;
  state.pendingEvent = null;
  state.resolvedEvents = [];
  state.bossRiddle = null;
  state.riddleLimits = {};
  state.stats = { ...fresh.stats };
  state.rebirthCount += 1;
  state.rebirthBoon = boon;
  state.gatekeeperCleared = false;
  state.unlocks.push(`rebirth_${state.rebirthCount}`);
  applyDifficultyStart(state, content2, state.difficulty);
  applyRace(state, savedRaceId, content2);
  for (const k of Object.keys(state.stats)) {
    state.stats[k] += boon;
  }
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  state.formHistory = [state.formId];
  log({ key: "log.rebirth_msg" });
  log({ key: "log.rebirth_done", params: { n: state.rebirthCount } });
  log({ key: "log.soul_gain", params: { souls: earnedSouls, total: state.souls } });
  return true;
}

// packages/client/src/i18n.ts
var dict = {};
function t(key, params = {}) {
  let s = dict[key] ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

// packages/client/src/game/loot.ts
var REQ_STAT = {
  weapon: "STR",
  offhand: "VIT",
  head: "VIT",
  body: "VIT",
  hands: "STR",
  legs: "VIT",
  feet: "AGI",
  accessory: null
};
function lootDisplayName(it) {
  const parts = [it.prefixKey && t(it.prefixKey), t(it.baseKey), it.suffixKey && t(it.suffixKey)];
  return parts.filter(Boolean).join(" ");
}
var RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
var RARITY_MULT = { common: 1, uncommon: 1.25, rare: 1.6, epic: 2.1, legendary: 2.8 };
var RARITY_AFFIXES = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
var RARITY_VALUE = { common: 1, uncommon: 2.5, rare: 6, epic: 14, legendary: 40 };
var BASES = [
  { type: "weapon", baseKey: "loot.base.sword", icon: "\u{1F5E1}\uFE0F" },
  { type: "weapon", baseKey: "loot.base.axe", icon: "\u{1FA93}" },
  { type: "weapon", baseKey: "loot.base.mace", icon: "\u{1F528}" },
  { type: "weapon", baseKey: "loot.base.dagger", icon: "\u{1F52A}" },
  { type: "weapon", baseKey: "loot.base.staff", icon: "\u{1FA84}" },
  { type: "weapon", baseKey: "loot.base.bow", icon: "\u{1F3F9}" },
  { type: "offhand", baseKey: "loot.base.shield", icon: "\u{1F6E1}\uFE0F" },
  { type: "offhand", baseKey: "loot.base.orb", icon: "\u{1F52E}" },
  { type: "head", baseKey: "loot.base.helm", icon: "\u26D1\uFE0F" },
  { type: "body", baseKey: "loot.base.armor", icon: "\u{1F94B}" },
  { type: "hands", baseKey: "loot.base.gloves", icon: "\u{1F9E4}" },
  { type: "legs", baseKey: "loot.base.greaves", icon: "\u{1F456}" },
  { type: "feet", baseKey: "loot.base.boots", icon: "\u{1F97E}" },
  { type: "accessory", baseKey: "loot.base.ring", icon: "\u{1F48D}" },
  { type: "accessory", baseKey: "loot.base.amulet", icon: "\u{1F4FF}" }
];
var PREFIXES = [
  { key: "loot.prefix.sharp", field: "weaponPower", per: 0.45 },
  { key: "loot.prefix.heavy", field: "weaponPower", per: 0.55 },
  { key: "loot.prefix.sturdy", field: "armor", per: 0.5 },
  { key: "loot.prefix.guardian", field: "armor", per: 0.65 },
  { key: "loot.prefix.deadly", field: "dmgMult", per: 0.03 },
  { key: "loot.prefix.swift", field: "dodgeBonus", per: 0.02 },
  { key: "loot.prefix.arcane", field: "mpRegen", per: 0.5 },
  { key: "loot.prefix.vital", field: "regenMult", per: 0.1 }
];
var SUFFIXES = [
  { key: "loot.suffix.might", stat: "STR" },
  { key: "loot.suffix.bear", stat: "VIT" },
  { key: "loot.suffix.fox", stat: "AGI" },
  { key: "loot.suffix.owl", stat: "INT" },
  { key: "loot.suffix.sage", stat: "WIS" },
  { key: "loot.suffix.fortune", stat: "LUCK" }
];
var pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
var uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
function basePrimary(type, ilvl) {
  switch (type) {
    case "weapon":
      return { weaponPower: 2 + ilvl * 0.8 };
    case "body":
      return { armor: 2 + ilvl * 0.5 };
    case "offhand":
    case "legs":
      return { armor: 1 + ilvl * 0.4 };
    case "head":
    case "hands":
    case "feet":
      return { armor: 1 + ilvl * 0.3 };
    case "accessory":
      return { dmgMult: 0.02 + ilvl * 4e-3, mpRegen: 0.5 };
  }
}
function rollRarity(ilvl, luck) {
  const lift = ilvl * 0.4 + luck * 0.6;
  const w = {
    common: 60,
    uncommon: 25 + lift * 0.5,
    rare: 10 + lift * 0.4,
    epic: 4 + lift * 0.2,
    legendary: 1 + lift * 0.06
  };
  const total = RARITIES.reduce((s, r) => s + w[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) {
    roll -= w[r];
    if (roll <= 0) return r;
  }
  return "common";
}
function addField(it, field, amount) {
  it[field] = Math.round(((it[field] ?? 0) + amount) * 1e3) / 1e3;
}
function buildItem(base, lvl, rarity) {
  const mult = RARITY_MULT[rarity];
  const it = { uid: uid(), type: base.type, rarity, icon: base.icon, ilvl: lvl, baseKey: base.baseKey, statBonus: {}, value: 0 };
  const prim = basePrimary(base.type, lvl);
  if (prim.weaponPower) it.weaponPower = Math.max(1, Math.round(prim.weaponPower * mult));
  if (prim.armor) it.armor = Math.max(1, Math.round(prim.armor * mult));
  if (prim.dmgMult) it.dmgMult = Math.round(prim.dmgMult * mult * 1e3) / 1e3;
  if (prim.mpRegen && base.type === "accessory") it.mpRegen = prim.mpRegen;
  const affixes = RARITY_AFFIXES[rarity];
  const statMag = Math.max(1, Math.round((1 + lvl * 0.25) * mult));
  for (let i = 0; i < affixes; i++) {
    if (i % 2 === 0) {
      const s = pick(SUFFIXES);
      it.statBonus[s.stat] = (it.statBonus[s.stat] ?? 0) + statMag;
      if (!it.suffixKey) it.suffixKey = s.key;
    } else {
      const p = pick(PREFIXES);
      const mag = p.field === "dmgMult" || p.field === "dodgeBonus" || p.field === "regenMult" ? p.per * mult : Math.max(1, Math.round((1 + lvl * 0.4) * p.per * mult));
      addField(it, p.field, mag);
      if (!it.prefixKey) it.prefixKey = p.key;
    }
  }
  const rs = REQ_STAT[base.type];
  if (rs) {
    const req = Math.floor(3 + lvl * 0.25 + RARITY_RANK[rarity]);
    if (req > 0) it.statReq = { [rs]: req };
  }
  it.value = Math.max(1, Math.round((lvl + 5) * RARITY_VALUE[rarity]));
  return it;
}
var RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
function generateLoot(ilvl, luck, forceRarity) {
  const lvl = Math.max(1, Math.round(ilvl));
  const rarity = forceRarity ?? rollRarity(lvl, luck);
  return buildItem(pick(BASES), lvl, rarity);
}

// packages/client/src/game/evolution.ts
function availableEvolutions(state, content2) {
  const cur = content2.forms.get(state.formId);
  if (!cur) return [];
  return cur.evolvesTo.map((id) => content2.forms.get(id)).filter((f) => f !== void 0);
}
function secretMet(state, form) {
  if (!form.secret) return true;
  if (form.secret.kills && state.kills < form.secret.kills) return false;
  return true;
}
function canEvolve(state, form) {
  return secretMet(state, form) && state.level >= form.levelReq && state.tier >= (form.tierReq ?? 0);
}
function isHumanoidForm(state, content2) {
  return content2.races.get(state.raceId)?.humanoid === true || content2.forms.get(state.formId)?.humanoid === true;
}

// packages/client/src/game/eyes.ts
var BLIND_APPRAISAL_PENALTY = 2;
function appraisalTier(state) {
  let best = 0;
  for (const a of Object.values(state.eyeAssignments)) {
    if (!a) continue;
    for (const id of [a.abilityId, a.fusedId]) {
      if (id !== "appraisal" && id !== "insight" && id !== "all_sight") continue;
      const sk = state.skills.find((s) => s.id === id);
      const lvl = sk ? sk.level : 1;
      const offset = id === "all_sight" ? 20 : id === "insight" ? 10 : 0;
      let tier = lvl + offset;
      if (a.blind) tier = Math.max(0, tier - BLIND_APPRAISAL_PENALTY);
      if (tier > best) best = tier;
    }
  }
  return best;
}

// packages/client/src/game/inventory.ts
var BASE_SLOTS = 2;
function larderLevel(state) {
  const slot = state.skills.find((s) => s.id === "larder");
  return slot ? slot.level : 0;
}
function maxFoodSlots(state) {
  const lvl = larderLevel(state);
  return lvl > 0 ? BASE_SLOTS + Math.floor(lvl / 2) : 0;
}

// packages/client/src/game/signature.ts
var SIG_MAX = {
  spider: 100,
  // web gauge: fills at rest, discharges at combat start as a trap
  wyrmling: 10,
  // heat stacks: build on each attack, burst at max into bonus fire damage
  skeleton: 20,
  // bone stacks: +1 per kill, each gives +1 flat armor, decay slowly
  golem: 5,
  // stone layers (float 0–5): build at rest, ALL layers absorb the next hit then reset
  slime: 0,
  // uses sigAbsorb: absorbs the element of the last killed enemy (temp resistance)
  human: 0,
  // no gauge — humanoid equipment access is their signature advantage
  demon: 0,
  beastkin: 0
};
var GOLEM_BUILD_RATE = 1 / 60;
function effectiveRace(state) {
  return state.raceId === "slime" && state.replicatedRace ? state.replicatedRace : state.raceId;
}
function sigCur(state) {
  return Number.isFinite(state.sig) ? state.sig : 0;
}
function sigOnKill(state, enemyDmgType) {
  switch (effectiveRace(state)) {
    case "skeleton":
      state.sig = Math.min(SIG_MAX.skeleton ?? 20, sigCur(state) + 1);
      break;
    case "slime":
      if (enemyDmgType !== "physical") {
        state.sigAbsorb = { type: enemyDmgType, ticks: 120 };
      }
      break;
    case "golem":
      state.sig = Math.min(SIG_MAX.golem ?? 5, sigCur(state) + 0.1);
      break;
  }
}
function sigOnAttack(state) {
  if (effectiveRace(state) !== "wyrmling") return 0;
  state.sig = Math.min(SIG_MAX.wyrmling ?? 10, sigCur(state) + 1);
  if (state.sig >= (SIG_MAX.wyrmling ?? 10)) {
    state.sig = 0;
    return Math.round(state.stats.INT * 3 + state.level * 2);
  }
  return 0;
}
function sigBoneArmor(state) {
  return effectiveRace(state) === "skeleton" ? Math.floor(sigCur(state)) : 0;
}

// packages/client/src/game/effects.ts
function scale(level, lvMax) {
  return Math.min(1, level / Math.max(1, lvMax));
}
function aggregateBonuses(state, content2) {
  const b = {
    dmgMult: 1,
    xpMult: 1,
    lootMult: 1,
    regenMult: 1,
    idleMult: 1,
    dodgeBonus: 0,
    armor: 0,
    overdrawFrac: 0,
    hungerMult: 1,
    surviveChance: 0,
    mpRegen: 0,
    weaponPower: 0,
    painNull: 0,
    physNullReduction: 0,
    magicNullReduction: 0,
    statusNullReduction: 0,
    ultimateNullLv: 0
  };
  for (const slot of state.skills) {
    const def = content2.skills.get(slot.id);
    if (!def) continue;
    const s = scale(slot.level, def.lvMax);
    if (def.dmgMult) b.dmgMult += def.dmgMult * s;
    if (def.xpMult) b.xpMult += def.xpMult * s;
    if (def.lootMult) b.lootMult += def.lootMult * s;
    if (def.regenMult) b.regenMult += def.regenMult * s;
    if (def.idleMult) b.idleMult += def.idleMult * s;
    if (def.dodgeBonus) b.dodgeBonus += def.dodgeBonus * s;
    if (def.armor) b.armor += def.armor * s;
    if (def.overdrawFrac) b.overdrawFrac += def.overdrawFrac * s;
    if (def.mpRegen) b.mpRegen += def.mpRegen * s;
    if (def.hungerMult) b.hungerMult *= def.hungerMult;
    if (def.surviveChance) b.surviveChance = Math.max(b.surviveChance, def.surviveChance * s);
    if (def.painNull) b.painNull = Math.min(0.8, b.painNull + def.painNull * s);
    if (def.kind === "resistance") {
      if (slot.id === "physical_nullification") {
        b.physNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === "magic_nullification") {
        b.magicNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === "status_nullification") {
        b.statusNullReduction = Math.min(0.85, s * 0.85);
      } else if (slot.id === "ultimate_nullification") {
        b.ultimateNullLv = slot.level;
      }
    }
  }
  if (state.equipment) {
    for (const it of Object.values(state.equipment)) {
      if (!it) continue;
      if (it.armor) b.armor += it.armor;
      if (it.dmgMult) b.dmgMult += it.dmgMult;
      if (it.dodgeBonus) b.dodgeBonus += it.dodgeBonus;
      if (it.mpRegen) b.mpRegen += it.mpRegen;
      if (it.regenMult) b.regenMult += it.regenMult;
      if (it.weaponPower) b.weaponPower += it.weaponPower;
    }
    const tier = equipSetTier(state);
    if (tier >= 3) {
      b.dmgMult += 0.25;
      b.armor += 10;
      b.dodgeBonus += 0.08;
      b.regenMult += 0.2;
    } else if (tier >= 2) {
      b.dmgMult += 0.12;
      b.armor += 5;
      b.dodgeBonus += 0.03;
    } else if (tier >= 1) {
      b.dmgMult += 0.05;
      b.armor += 2;
    }
  }
  b.armor += sigBoneArmor(state);
  b.xpMult += soulLevel(state, "predator_soul") * 0.08;
  b.armor += soulLevel(state, "ancient_armor") * 3;
  b.regenMult += soulLevel(state, "ancient_armor") * 0.06;
  b.lootMult += soulLevel(state, "greed_soul") * 0.1;
  b.idleMult += soulLevel(state, "sleepless") * 0.12;
  for (const def of content2.ruler) {
    if (!state.ruler.powers.includes(def.id)) continue;
    if (def.dmgMult) b.dmgMult += def.dmgMult;
    if (def.xpMult) b.xpMult += def.xpMult;
    if (def.lootMult) b.lootMult += def.lootMult;
    if (def.regenMult) b.regenMult += def.regenMult;
    if (def.idleMult) b.idleMult += def.idleMult;
  }
  if (state.raceId === "beastkin" && state.hp < state.maxHp * 0.35) {
    b.dodgeBonus += 0.25;
  }
  return b;
}
function equipSetTier(state) {
  if (!state.equipment) return 0;
  let fine = 0;
  for (const it of Object.values(state.equipment)) {
    if (it && (it.rarity === "rare" || it.rarity === "epic" || it.rarity === "legendary")) fine++;
  }
  return fine >= 9 ? 3 : fine >= 6 ? 2 : fine >= 3 ? 1 : 0;
}

// packages/client/src/game/ruler.ts
var TABOO_PER_SIN = 300;
var TABOO_FORBIDDEN_RANK = 2;
function grantCrossed(state, content2, log) {
  for (const def of content2.ruler) {
    if (state.ruler.powers.includes(def.id)) continue;
    const axis = def.pole === "sin" ? state.ruler.sin : state.ruler.virtue;
    if (axis < def.threshold) continue;
    state.ruler.powers.push(def.id);
    if (def.statBonus) {
      for (const [k, v] of Object.entries(def.statBonus)) state.stats[k] += v ?? 0;
      recomputeMaxes(state);
    }
    log({ key: "log.ruler_unlock", params: { name: def.locKeyName } });
  }
}
function gainSin(state, content2, amount, log) {
  if (amount <= 0) return;
  state.ruler.sin += amount;
  grantCrossed(state, content2, log);
  const rank = Math.floor(state.ruler.sin / TABOO_PER_SIN);
  if (rank > state.ruler.taboo) {
    state.ruler.taboo = rank;
    log({ key: "log.taboo_rise", params: { rank } });
    if (rank >= TABOO_FORBIDDEN_RANK && !state.skills.some((s) => s.id === "forbidden_knowledge")) {
      state.skills.push({ id: "forbidden_knowledge", level: 1, exp: 0 });
      log({ key: "log.taboo_authority" });
    }
  }
}

// packages/client/src/game/roomevents.ts
function roomKeyOf(state) {
  return `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
}

// packages/client/src/game/riddles.ts
var LOCK_MS = [30 * 6e4, 60 * 6e4];

// packages/client/src/game/combat.ts
var LV_LABEL = "ui.lv";
var MP_TRANSFER_DISCOVER_CHANCE = 0.03;
var LARDER_DISCOVER_CHANCE = 0.04;
var SECRET_HARVEST_SOULS = 666;
var SECRET_LABYRINTH_KILLS = 500;
var EYE_DISCOVER_CHANCE = 0.03;
var EYE_DISCOVER_LEVEL = 5;
var APPRAISAL_DISCOVER_CHANCE = 0.05;
var FUSION_DISCOVER_CHANCE = 0.04;
var STAT_POINTS_PER_LEVEL = 3;
var XP_PER_EP = 8;
var SIN_PER_KILL = 1;
var AUTO_POWER_PER_LEVEL = 0.015;
function effectiveLevel(state) {
  return state.tier * LEVEL_CAP + state.level;
}
function levelPower(state) {
  return 1 + (effectiveLevel(state) - 1) * AUTO_POWER_PER_LEVEL;
}
function skillExpToNext(level) {
  return 15 + level * 10;
}
function resistChainExpToNext(tier) {
  const totals = [0, 200, 400, 700, 1200, 2e3];
  return (totals[Math.min(tier, 4)] ?? 1200) / 5;
}
function nullExpToNext(level) {
  return 2e3 + (level - 1) * 800;
}
function xpToNext(level) {
  return level * 50;
}
function dmgTypeKey(type) {
  return `dmgtype.${type ?? "physical"}`;
}
function elementMultiplier(content2, atk, enemyType) {
  const c = content2.elements;
  if (!c?.strongVs) return 1;
  if (c.strongVs[atk] === enemyType) return c.advantage;
  if (c.strongVs[enemyType] === atk) return c.disadvantage;
  return 1;
}
function hungerStage(state) {
  const h = state.hunger;
  if (h < 50) return 0;
  if (h < 75) return 1;
  if (h < 90) return 2;
  return 3;
}
function damageMult(state) {
  const hunger = [1, 1, 0.8, 0.6][hungerStage(state)];
  const fatigue = state.sp <= 0 ? 0.5 : 1;
  return hunger * fatigue;
}
var ROOM_KILL_QUOTA = 10;
function clearRoom(state, content2, log) {
  state.enemy = null;
  const layer = currentLayer(state, content2);
  const isBossRoom = !!layer && state.pos.room >= roomsOf(state, layer, state.pos.floor);
  if (isBossRoom) {
    state.roomKillCount = 0;
    state.roomEnemyId = null;
    if (state.autoAdvance) advancePosition(state, content2, log);
    else state.roomCleared = true;
    return;
  }
  state.roomKillCount = (state.roomKillCount ?? 0) + 1;
  if (state.roomKillCount >= ROOM_KILL_QUOTA && state.autoAdvance) {
    state.roomKillCount = 0;
    state.roomEnemyId = null;
    advancePosition(state, content2, log);
  }
}
function skillCooldown(def, state, lv) {
  const lvMax = def.lvMax ?? 10;
  const baseCd = 3 + Math.round(7 * (lvMax - lv) / Math.max(1, lvMax - 1));
  const agiReduce = Math.floor(state.stats.AGI / 30);
  const intReduce = def.kind === "magic" ? Math.floor(state.stats.INT / 30) : 0;
  return Math.max(1, baseCd - agiReduce - intReduce);
}
function currentLayer(state, content2) {
  return content2.dungeon.layers.find((l) => l.id === state.pos.layer);
}
function ensureFloorRooms(state, layer) {
  const floors = floorsOf(state, layer);
  let arr = state.layerRooms[layer.id];
  if (!Array.isArray(arr) || arr.length !== floors) {
    const min = layer.minRooms ?? 12;
    const max = Math.max(min, layer.maxRooms ?? 20);
    arr = Array.from({ length: floors }, () => min + Math.floor(Math.random() * (max - min + 1)));
    state.layerRooms[layer.id] = arr;
  }
  return arr;
}
function roomsOf(state, layer, floor) {
  const arr = ensureFloorRooms(state, layer);
  return arr[floor - 1] ?? arr[arr.length - 1] ?? 12;
}
function floorsOf(_state, layer) {
  return layer.floors;
}
function trySenseRoom(state, content2, log) {
  if (state.pendingRoom) return;
  const tier = appraisalTier(state);
  const room = [...content2.rooms.values()].find((r) => tier >= r.appraisalReq && !state.discoveries.includes(r.id));
  if (!room) return;
  const chance = Math.min(0.5, 0.04 + state.stats.LUCK * 0.01);
  if (Math.random() < chance) {
    state.pendingRoom = room.id;
    log({ key: "log.search_room", params: { room: room.locKey } });
  }
}
function castSkill(state, content2, id, log, b, isOffline = false, ignoreCd = false) {
  const enemy = state.enemy;
  if (!enemy) return false;
  const slot = state.skills.find((s) => s.id === id);
  const def = content2.skills.get(id);
  if (!slot || !def || def.damage === void 0) return false;
  if (!ignoreCd && (state.cooldowns[id] ?? 0) > 0) return false;
  const mpBase = def.mpCost ?? 0;
  let effectiveMp = 0;
  if (mpBase > 0) {
    const lv = slot.level;
    const lvMax = def.lvMax ?? 10;
    const mpFloor = def.mpFloor ?? 5;
    effectiveMp = mpFloor + Math.round((mpBase - mpFloor) * (lvMax - lv) / Math.max(1, lvMax - 1));
  }
  let consumedHp = 0;
  if (state.raceId === "demon") {
    if (effectiveMp > 0) {
      if (effectiveMp >= state.hp) return false;
      state.hp = Math.max(1, state.hp - effectiveMp);
    }
    const hpCostFrac = def.hpCost ?? def.hpCostPct ?? 0;
    if (hpCostFrac > 0) {
      consumedHp = Math.round(state.hp * hpCostFrac);
      state.hp = Math.max(1, state.hp - consumedHp);
    }
  } else {
    if (effectiveMp > 0) {
      if (effectiveMp > state.mp) return false;
      state.mp = Math.max(0, state.mp - effectiveMp);
    }
  }
  const diff = diffDef(state, content2);
  let raw;
  if (id === "demonic_obliteration") {
    raw = consumedHp * 4 + effStat(state, "INT") * 1.5;
  } else if (def.kind === "magic") {
    raw = (def.damage ?? 0) + effStat(state, "INT") * 0.6;
  } else {
    raw = (def.damage ?? 0) + Math.floor(effStat(state, "STR") / 3);
  }
  raw += b.weaponPower;
  raw += b.overdrawFrac * (state.maxHp - state.hp);
  if (state.skills.some((s) => s.id === "unmovable_core")) {
    raw += Math.round((b.armor ?? 0) * 0.15);
  }
  raw *= b.dmgMult * diff.playerMult * levelPower(state);
  let elemMult = elementMultiplier(content2, def.damageType ?? "physical", enemy.damageType);
  if (state.raceId === "wyrmling" && (def.damageType ?? "physical") === "fire" && elemMult < 1) {
    elemMult = 1 - (1 - elemMult) * 0.5;
  }
  raw *= elemMult;
  const atkElem = def.damageType ?? "physical";
  if (state.dmgStreakType === atkElem) {
    state.dmgStreak = (state.dmgStreak ?? 0) + 1;
  } else {
    state.dmgStreakType = atkElem;
    state.dmgStreak = 1;
  }
  const ADAPT_THRESHOLD = 5;
  const streakPenalty = (state.dmgStreak ?? 0) >= ADAPT_THRESHOLD ? Math.min(0.6, ((state.dmgStreak ?? 0) - ADAPT_THRESHOLD + 1) * 0.1) : 0;
  if (streakPenalty > 0) {
    raw *= 1 - streakPenalty;
    if (state.dmgStreak === ADAPT_THRESHOLD) log({ key: "log.enemy_adapts", params: { type: dmgTypeKey(atkElem) } });
  }
  let dmg = Math.max(1, Math.round(raw * damageMult(state)) - state.scars);
  if (enemy.behavior?.armorPct) dmg = Math.max(1, Math.round(dmg * (1 - enemy.behavior.armorPct)));
  enemy.hp -= dmg;
  log({ key: "log.attack", params: { skill: def.locKeyName, dmg, type: dmgTypeKey(def.damageType) } });
  const breathDmg = sigOnAttack(state);
  if (breathDmg > 0 && enemy.hp > 0) {
    enemy.hp = Math.max(0, enemy.hp - breathDmg);
    log({ key: "log.sig_heat_breath", params: { dmg: breathDmg } });
  }
  if (!ignoreCd) state.cooldowns[id] = skillCooldown(def, state, slot.level);
  if (id === "sovereign_cocoon") {
    state.enemyStunTicks = 3;
    log({ key: "log.cocoon_enemy" });
  }
  if (id === "summon_spiderling") {
    const isSovereign = state.formId === "arachnid_sovereign";
    const limit = isSovereign ? 6 : 3;
    if (state.spiderlings === void 0) state.spiderlings = 0;
    if (state.spiderlings < limit) {
      state.spiderlings += 1;
      log({ key: "log.summon_spiderling", params: { count: state.spiderlings } });
    }
  }
  const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.3)) * b.xpMult));
  addSkillExp(state, content2, slot, gain, log, b.xpMult, isOffline);
  return true;
}
function useSkillManual(state, content2, id, log) {
  if (state.action !== "combat" || !state.enemy || !state.equipped.includes(id)) return;
  if (isControlled(state)) {
    log({ key: "log.controlled" });
    return;
  }
  const b = aggregateBonuses(state, content2);
  if (castSkill(state, content2, id, log, b) && state.enemy && state.enemy.hp <= 0) {
    onKill(state, content2, log, b);
  }
}
function isControlled(state) {
  if (state.skills.some((s) => s.id === "unmovable_core")) return false;
  return state.statusEffects.some((s) => s.control && s.ticksLeft > 0);
}
function tryAutoTierAdvance(state, content2, log) {
  const avail = availableEvolutions(state, content2);
  if (avail.length === 0) return false;
  if (avail.some((f) => canEvolve(state, f))) return false;
  if (state.tier >= 10) return false;
  state.tier = Math.min(10, state.tier + 1);
  state.level = 1;
  state.xp = 0;
  state.statPoints += 1;
  log({ key: "log.tier_advance", params: { tier: state.tier } });
  recomputeMaxes(state);
  return true;
}
function gainXp(state, content2, amount, log) {
  if (state.level >= LEVEL_CAP) {
    tryAutoTierAdvance(state, content2, log);
    return;
  }
  state.xp += amount;
  while (state.level < LEVEL_CAP && state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level += 1;
    state.statPoints += STAT_POINTS_PER_LEVEL;
    log({ key: "log.levelup", params: { lv: state.level, pts: STAT_POINTS_PER_LEVEL } });
  }
  if (state.level >= LEVEL_CAP) {
    state.xp = 0;
    const advanced = tryAutoTierAdvance(state, content2, log);
    if (!advanced) {
      log({ key: "log.cap", params: { lv: LEVEL_CAP } });
      if (state.raceId === "human" && state.tier === 0 && !state.humanPath) {
        state.pendingHumanPath = true;
        state.action = "idle";
        log({ key: "log.human_path_choose" });
      }
    }
  }
  recomputeMaxes(state);
}
function applyBossClear(state, content2, log) {
  const layer = currentLayer(state, content2);
  if (layer?.gatekeeper && state.pos.floor >= floorsOf(state, layer)) {
    state.gatekeeperCleared = true;
    log({ key: "log.gatekeeper_down" });
    const diff = diffDef(state, content2);
    if (diff.brutal && state.permadeath && !state.hellClears.includes(state.raceId)) {
      state.hellClears.push(state.raceId);
      state.statPoints += 15;
      log({ key: "log.hell_clear", params: { race: `race.${state.raceId}.name` } });
    }
  }
}
var RARITY_RANK2 = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
function maybeDropLoot(state, content2, enemy, b, log) {
  if (!isHumanoidForm(state, content2)) return;
  const chance = 0.08 * b.lootMult;
  if (!enemy.isBoss && Math.random() > chance) return;
  const ilvl = state.tier * LEVEL_CAP + state.level + state.pos.layer * 2;
  const luck = effStat(state, "LUCK");
  let item = generateLoot(enemy.isBoss ? ilvl + 5 : ilvl, luck);
  if (enemy.isBoss) {
    const alt = generateLoot(ilvl + 5, luck);
    if (RARITY_RANK2[alt.rarity] > RARITY_RANK2[item.rarity]) item = alt;
  }
  if (state.inventoryItems.length >= MAX_INVENTORY) {
    state.ep += item.value;
    log({ key: "log.loot_full", params: { item: lootDisplayName(item), ep: item.value } });
    return;
  }
  state.inventoryItems.push(item);
  log({ key: "log.loot_drop", params: { item: lootDisplayName(item), rarity: `rarity.${item.rarity}` } });
}
function onKill(state, content2, log, b, isOffline = false) {
  const enemy = state.enemy;
  if (!enemy) return;
  const reward = diffDef(state, content2).rewardMult ?? 1;
  const ep = Math.max(1, Math.round(enemy.ep * b.lootMult * reward));
  state.ep += ep;
  state.kills += 1;
  state.killedEnemies = state.killedEnemies ?? {};
  state.killedEnemies[enemy.id] = (state.killedEnemies[enemy.id] ?? 0) + 1;
  sigOnKill(state, enemy.damageType);
  if (state.raceId === "slime" && state.skills.some((s) => s.id === "absorption_replication")) {
    if (enemy.race) {
      state.replicatedRace = enemy.race;
      state.sig = 0;
    }
  }
  if (state.kills === SECRET_HARVEST_SOULS && state.raceId === "slime") log({ key: "log.harvest_festival" });
  if (state.kills === SECRET_LABYRINTH_KILLS && state.raceId === "spider") log({ key: "log.labyrinth_awakening" });
  gainXp(state, content2, ep * XP_PER_EP, log);
  for (const slot of state.skills) {
    const def = content2.skills.get(slot.id);
    if (def && (def.kind === "passive" || def.kind === "util" || def.kind === "eye")) {
      const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.15)) * b.xpMult * 0.5));
      addSkillExp(state, content2, slot, gain, log, b.xpMult, isOffline);
    }
  }
  if (enemy.race && enemy.race === state.raceId) {
    gainSin(state, content2, SIN_PER_KILL * (enemy.isBoss ? 5 : 1), log);
    log({ key: "log.sin_kill", params: { enemy: enemy.locKey } });
  }
  const satiety = Math.round(enemy.satiety * b.lootMult);
  if (state.inventory.length < maxFoodSlots(state)) {
    state.inventory.push({ enemyId: enemy.id, satiety, decay: 0 });
    state.larderFullNotified = false;
  } else {
    state.hunger = Math.max(0, state.hunger - satiety);
    if (!state.larderFullNotified) {
      log({ key: "log.larder_full" });
      state.larderFullNotified = true;
    }
  }
  log({ key: enemy.isBoss ? "log.boss_kill" : "log.kill", params: { enemy: enemy.locKey, ep } });
  maybeDropLoot(state, content2, enemy, b, log);
  const wasBoss = enemy.isBoss;
  const wasRiddleGuard = enemy.riddleGuard;
  state.enemy = null;
  if (wasRiddleGuard && state.bossRiddle) return;
  if (wasBoss) {
    applyBossClear(state, content2, log);
    if (!state.resolvedEvents.includes(roomKeyOf(state))) state.resolvedEvents.push(roomKeyOf(state));
  }
  clearRoom(state, content2, log);
  if (!state.mpTransferUnlocked && Math.random() < MP_TRANSFER_DISCOVER_CHANCE) {
    state.mpTransferUnlocked = true;
    log({ key: "log.discover_mp_transfer" });
  }
  if (!hasSkillLine(state, content2, "larder") && Math.random() < LARDER_DISCOVER_CHANCE) {
    state.skills.push({ id: "larder", level: 1, exp: 0 });
    log({ key: "log.discover_larder" });
  }
  if (!hasSkillLine(state, content2, "appraisal") && Math.random() < APPRAISAL_DISCOVER_CHANCE) {
    state.skills.push({ id: "appraisal", level: 1, exp: 0 });
    log({ key: "log.discover_appraisal" });
  }
  if (!state.fusionUnlocked && state.skills.filter((s) => content2.skills.get(s.id)?.damage !== void 0).length >= 2 && Math.random() < FUSION_DISCOVER_CHANCE) {
    state.fusionUnlocked = true;
    log({ key: "log.discover_fusion" });
  }
  if (state.level >= EYE_DISCOVER_LEVEL && !hasSkillLine(state, content2, "dread_gaze") && Math.random() < EYE_DISCOVER_CHANCE) {
    state.skills.push({ id: "dread_gaze", level: 1, exp: 0 });
    log({ key: "log.discover_dread" });
  }
}
function advancePosition(state, content2, log) {
  const layer = currentLayer(state, content2);
  if (!layer) return;
  const R = roomsOf(state, layer, state.pos.floor);
  const wasBoss = state.pos.room >= R;
  if (!wasBoss) {
    state.pos.room += 1;
    return;
  }
  if (state.pos.floor < floorsOf(state, layer)) {
    state.pos.floor += 1;
    state.pos.room = 1;
    log({ key: "log.floor_cleared", params: { pos: `${state.pos.layer}.${state.pos.floor}` } });
    trySenseRoom(state, content2, log);
    return;
  }
  const next = content2.dungeon.layers.find((l) => l.id === state.pos.layer + 1);
  if (next && state.tier >= next.tierReq) {
    state.pos = { layer: next.id, floor: 1, room: 1 };
    log({ key: "log.layer_cleared", params: { layer: next.id } });
  } else if (next) {
    state.pos.room = 1;
    log({ key: "log.layer_locked", params: { tier: next.tierReq } });
  } else {
    state.pos.room = 1;
    log({ key: "log.dungeon_end" });
  }
}
var RANK_XP_MULT = {
  F: 0.8,
  E: 1,
  D: 1.2,
  C: 1.5,
  B: 2,
  A: 3,
  S: 5,
  SS: 10
};
function parseDeriveToken(token) {
  const [skillId, lvStr] = token.split(":");
  return { skillId: skillId ?? token, minLevel: parseInt(lvStr ?? "1", 10) };
}
function checkDerivations(state, content2, log) {
  for (const slot of state.skills) {
    const def = content2.skills.get(slot.id);
    if (!def?.derivesTo || !def.deriveCondition) continue;
    const targetId = def.derivesTo;
    if (state.skills.some((s) => s.id === targetId)) continue;
    const allMet = def.deriveCondition.requiresAll.map(parseDeriveToken).every((c) => {
      const s = state.skills.find((sk) => sk.id === c.skillId);
      return s !== void 0 && s.level >= c.minLevel;
    });
    if (!allMet) continue;
    const derivedDef = content2.skills.get(targetId);
    if (!derivedDef) continue;
    state.skills.push({ id: targetId, level: 1, exp: 0 });
    log({ key: "log.skill_derived", params: { skill: derivedDef.locKeyName } });
  }
}
function skillLevelUp(slot, state, content2, log, isOffline) {
  const def = content2.skills.get(slot.id);
  if (!def) return;
  const isResChain = def.kind === "resistance" && !!def.resistType;
  const isNullSkill = def.kind === "resistance" && !def.resistType;
  const xpFn = isResChain ? () => resistChainExpToNext(slot.tier ?? 1) : isNullSkill ? () => nullExpToNext(slot.level) : () => skillExpToNext(slot.level);
  while (slot.level < def.lvMax && slot.exp >= xpFn()) {
    slot.exp -= xpFn();
    slot.level += 1;
    log({ key: "log.skill_up", params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
  }
  if (isOffline) {
    if (slot.level >= def.lvMax) slot.exp = Math.min(slot.exp, xpFn());
    return;
  }
  if (slot.level >= def.lvMax && def.evolvesTo.length > 0) {
    const nextId = def.evolvesTo[0];
    const next = content2.skills.get(nextId);
    if (next) {
      log({ key: "log.evolve", params: { from: def.locKeyName, to: next.locKeyName } });
      slot.id = nextId;
      slot.tier = (slot.tier ?? 1) + 1;
      slot.level = 1;
      slot.exp = 0;
    }
  }
  if (def.kind === "resistance") {
    checkMergerConditions(state, content2, log);
  }
  checkDerivations(state, content2, log);
}
function addSkillExp(state, content2, slot, amount, log, xpMult, isOffline = false) {
  const def = content2.skills.get(slot.id);
  if (!def) return;
  const rankMult = RANK_XP_MULT[def.rank ?? "E"] ?? 1;
  slot.exp += slot.id === "larder" ? amount : Math.max(1, Math.round(amount * xpMult / rankMult));
  skillLevelUp(slot, state, content2, log, isOffline);
}
function skillForwardLine(content2, baseId) {
  const out = /* @__PURE__ */ new Set();
  const stack = [baseId];
  while (stack.length) {
    const id = stack.pop();
    if (out.has(id)) continue;
    out.add(id);
    for (const n of content2.skills.get(id)?.evolvesTo ?? []) stack.push(n);
  }
  return out;
}
function hasSkillLine(state, content2, baseId) {
  const line = skillForwardLine(content2, baseId);
  return state.skills.some((s) => line.has(s.id));
}
function checkMergerConditions(state, content2, log) {
  for (const merger of content2.resistanceMergers.values()) {
    if (state.skills.some((s) => s.id === merger.id)) continue;
    const satisfied = merger.requires.every((req) => {
      const slot = state.skills.find((s) => s.id === req.skillId);
      if (!slot) return false;
      if (req.minLevel !== void 0 && slot.level < req.minLevel) return false;
      return true;
    });
    if (satisfied) applyMerger(state, content2, merger, log);
  }
}
function applyMerger(state, content2, merger, log) {
  const mergerDef = content2.skills.get(merger.id);
  if (!mergerDef) return;
  const toRemove = new Set(merger.requires.map((r) => r.skillId));
  state.skills = state.skills.filter((s) => !toRemove.has(s.id));
  state.skills.push({ id: merger.id, level: 1, exp: 0 });
  log({ key: "log.merger_unlocked", params: { merger: merger.locKey } });
}

// scripts/run_tests.ts
function loadContentSync() {
  const base = import_path.default.resolve("data");
  const read = (file) => JSON.parse(import_fs.default.readFileSync(import_path.default.join(base, file), "utf-8"));
  const byId2 = (arr) => new Map(arr.map((x) => [x.id, x]));
  return {
    skills: byId2(read("skills.json")),
    resistances: byId2(read("resistances.json")),
    enemies: byId2(read("enemies.json")),
    races: byId2(read("races.json")),
    forms: byId2(read("evolutions.json")),
    fusionRules: read("fusion_rules.json"),
    dungeon: read("dungeon.json"),
    books: byId2(read("books.json")),
    rooms: byId2(read("secret_rooms.json")),
    ruler: read("ruler.json"),
    difficulties: byId2(read("difficulty.json")),
    elements: read("elements.json"),
    events: byId2(read("events.json")),
    bossRiddles: new Map(read("boss_riddles.json").map((r) => [r.id, r])),
    forageableFoods: byId2(read("forageable_foods.json")),
    resistanceMergers: new Map(read("resistance_mergers.json").map((m) => [m.id, m]))
  };
}
var content = loadContentSync();
console.log("Running run_tests.ts...");
{
  const state = newGame();
  state.action = "combat";
  state.enemy = { hp: 1e3, maxHp: 1e3, ep: 10, damageType: "physical", locKey: "enemy" };
  state.equipped = ["summon_spiderling"];
  state.skills = [{ id: "summon_spiderling", level: 1, exp: 0 }];
  state.formId = "cave_spiderling";
  state.spiderlings = 0;
  for (let i = 0; i < 10; i++) {
    state.cooldowns = {};
    state.mp = 1e3;
    useSkillManual(state, content, "summon_spiderling", () => {
    });
  }
  console.log(`Spiderlings after 10 summons (standard): ${state.spiderlings} (Expected: 3)`);
  import_assert.default.strictEqual(state.spiderlings, 3, "Standard form spiderlings limit should be 3");
}
{
  const state = newGame();
  state.action = "combat";
  state.enemy = { hp: 1e3, maxHp: 1e3, ep: 10, damageType: "physical", locKey: "enemy" };
  state.equipped = ["summon_spiderling"];
  state.skills = [{ id: "summon_spiderling", level: 1, exp: 0 }];
  state.formId = "arachnid_sovereign";
  state.spiderlings = 0;
  for (let i = 0; i < 10; i++) {
    state.cooldowns = {};
    state.mp = 1e3;
    useSkillManual(state, content, "summon_spiderling", () => {
    });
  }
  console.log(`Spiderlings after 10 summons (sovereign): ${state.spiderlings} (Expected: 6)`);
  import_assert.default.strictEqual(state.spiderlings, 6, "Arachnid Sovereign form spiderlings limit should be 6");
}
{
  const state = newGame();
  state.spiderlings = 5;
  state.enemyStunTicks = 3;
  state.gatekeeperCleared = true;
  rebirth(state, content, () => {
  });
  console.log(`After rebirth - spiderlings: ${state.spiderlings} (Expected: 0), enemyStunTicks: ${state.enemyStunTicks} (Expected: 0)`);
  import_assert.default.strictEqual(state.spiderlings, 0, "Rebirth should reset spiderlings to 0");
  import_assert.default.strictEqual(state.enemyStunTicks, 0, "Rebirth should reset enemyStunTicks to 0");
}
console.log("All run_tests.ts tests passed successfully!");
