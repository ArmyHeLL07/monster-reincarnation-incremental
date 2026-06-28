import type { StatKey, FusionResult, ComboAttempt, EyeMode, DamageType, Difficulty, LootItem, EquipSlot, EnemyBehavior } from '@mri/shared';
import type { AutoCombatConfig } from './autocombat';
import { defaultAutoCombatConfig } from './autocombat';
import type { CombatEncounterLog } from './analytics';

/** Bag capacity for humanoid races (slot-based; materials/stacks are a future extension). */
export const MAX_INVENTORY = 20;

/** A fresh, all-empty paper-doll (9 slots). */
export function emptyEquipment(): Record<EquipSlot, LootItem | null> {
  return { weapon: null, offhand: null, head: null, body: null, hands: null, legs: null, feet: null, acc1: null, acc2: null };
}

/** A zeroed per-stat allocation map. */
export function emptyAllocated(): Record<StatKey, number> {
  return { STR: 0, VIT: 0, AGI: 0, INT: 0, WIS: 0, LUCK: 0 };
}

export interface EyeAssignment {
  abilityId: string;
  mode: EyeMode;
  /** Eye fusion: a second ability fused into this slot — a hybrid eye (GDD §5.0.7). */
  fusedId?: string;
  /** True when the two fused eyes share one exclusive mode → "blindness" penalty. */
  blind?: boolean;
}

/** Sin↔Virtue ruler axis + Taboo (GDD §C). Sin/virtue/taboo persist across rebirth. */
export interface RulerState {
  /** Dark axis — grows from kills, risk and Gluttony feeding. */
  sin: number;
  /** Light axis — grows from meditation and patient rest. */
  virtue: number;
  /** The dark-path key; unlocks ruler authority, never reset (top of the persistence hierarchy). */
  taboo: number;
  /** Ruler skill ids already granted (so we grant each once). */
  powers: string[];
}

/** A stored corpse in the larder. `decay` rises each tick (unless refrigerated). */
export interface FoodItem {
  enemyId: string;
  satiety: number;
  decay: number;
}

export interface SkillSlot {
  id: string;
  level: number;
  exp: number;
  /** Evolution tier (1 = base). T2 Lv1 reads as the "11th level" of mastery, and so on. */
  tier?: number;
}

export interface ResistSlot {
  id: string;
  level: number;
  exp: number;
  nullified: boolean;
}

export interface DungeonPos {
  layer: number;
  floor: number;
  room: number;
}

/** A lingering damage-over-time status on the player (poison/fire/acid/…) — GDD status effects. */
export interface StatusEffect {
  type: DamageType;
  /** Remaining ticks (≈ seconds). */
  ticksLeft: number;
  /** HP lost per tick (already scaled by the inflicting hit and the player's resistance). */
  dmgPerTick: number;
  /** Control condition (petrify/stun): the player cannot act while this is active (Kumo). */
  control?: boolean;
}

/** A spawned enemy — stats are snapshot here (scaled by dungeon depth) so combat is data-free. */
export interface EnemyInstance {
  id: string;
  locKey: string;
  hp: number;
  maxHp: number;
  attack: number;
  damageType: DamageType;
  damageType2?: DamageType;
  ep: number;
  satiety: number;
  isBoss: boolean;
  /** Enemy attack cooldown (ticks) — paces incoming hits in both auto & manual combat. */
  atkCd: number;
  /** Set by a deep-read (Analyze) — reveals fuller detail on the enemy panel, one tier deeper. */
  analyzed?: boolean;
  /** Kin race id — killing your own race feeds Sin (carried from the Enemy archetype). */
  race?: string;
  /** Visual skin (emoji/glyph) for the enemy portrait. */
  icon?: string;
  /** Optional portrait image path (relative to asset base) — used over the emoji when present. */
  image?: string;
  /** Spawned by a wrong boss-riddle guess — its death returns to the riddle, doesn't advance. */
  riddleGuard?: boolean;
  /** Special combat behaviour copied from the archetype (regen/double-strike/enrage/armour/…). */
  behavior?: EnemyBehavior;
  /** A rare elite variant — tougher (more HP/ATK) but drops far more EP/XP. Marked with a star badge. */
  elite?: boolean;
}

export const MAX_HUNGER = 100;
/** Character level cap per evolution tier — reach it, then evolve to advance to the next tier. */
export const LEVEL_CAP = 10;
/** Meditation gauge needed to unlock the hidden zen skill (GDD §7.6). */
export const MEDITATION_MAX = 600;

/** What the player is doing. `idle` freezes the world; `meditate` is the hidden zen state. */
export type ActionMode = 'idle' | 'combat' | 'rest' | 'meditate';

export interface GameState {
  stats: Record<StatKey, number>;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  /** Passive growth from sustained play — raises SP *regen*, not max SP. */
  spRegenBonus: number;
  level: number;
  /** Evolution tier; starts at 0 (hidden) and shows from T1 after the first evolution. */
  tier: number;
  xp: number;
  statPoints: number;
  /** Autosave interval in minutes (player choice). */
  autosaveMin: number;
  /** Chosen language ('tr' | 'en'); undefined = auto-detect. */
  lang?: 'tr' | 'en' | 'ru';
  /** 0 = full, MAX_HUNGER = starving. */
  hunger: number;
  /** Stored corpses (from kills) — auto-eaten when hunger crosses the threshold; they decay. */
  inventory: FoodItem[];
  ep: number;
  pos: DungeonPos;
  raceId: string;
  formId: string;
  /** slotId → assigned eye ability + mode (or null/absent = empty). */
  eyeAssignments: Record<string, EyeAssignment | null>;
  /** Current action: idle = time frozen (nothing progresses); combat / rest run the clock. */
  action: ActionMode;
  /** true when combat auto-paused at low HP — auto-resumes when HP recovers (AFK loop). */
  autoResume: boolean;
  /** Discovered ability: when SP is empty, burn MP before HP. */
  mpTransferUnlocked: boolean;
  /** Attack cooldown counter (legacy; per-skill cooldowns now pace attacks). */
  atkCd: number;
  /** Equipped active-skill ids — only these are used in combat (limited by skillSlots). */
  equipped: string[];
  /** Saved equipped-skill presets (loadouts) — quickly swap builds. Up to LOADOUT_SLOTS slots. */
  loadouts: string[][];
  /** Combat control: `auto` fires ready equipped skills; `manual` waits for taps. */
  combatMode: 'auto' | 'manual';
  /** Per-skill cooldown timers (ticks remaining), keyed by skill id. */
  cooldowns: Record<string, number>;
  /** Auto-eat stored corpses when hungry. Off = eat manually (discover Gluttony at your own pace). */
  autoEat: boolean;
  /** Pos key ("L.F.R") where the player last searched — one search per room until they move on. */
  lastSearchPos: string;
  /** Fusion lab is a discovery — locked until found (no longer free from the start). */
  fusionUnlocked: boolean;
  /** Count of incompatible (backfire) fusions carried — the 4th overloads and kills the host. */
  badFusions: number;
  skills: SkillSlot[];
  resistances: ResistSlot[];
  enemy: EnemyInstance | null;
  /** Active damage-over-time statuses on the player (poison/fire/…), ticking during combat. */
  statusEffects: StatusEffect[];
  /** Global discovery pool skeleton — a combo is produced once (local for now). */
  fusionCache: Record<string, FusionResult>;
  /** Local telemetry outbox — session combo attempts, ready to send. */
  outbox: ComboAttempt[];
  lastSeen: number;

  // --- difficulty (GDD §8.5) -------------------------------------------------
  difficulty: Difficulty;
  /** Hell-only: death is a true wipe. */
  permadeath: boolean;
  /** Settings toggle: allow modifier-free rooms (base 10% + LUCK×0.5% chance). Default off. */
  modifierFreeRooms: boolean;
  /** Race ids that have cleared Hell with permadeath — permanent, race-specific reward. */
  hellClears: string[];

  // --- achievements / lifetime counters (never reset by rebirth/race change) -
  /** Unlocked achievement ids (permanent across lives). */
  achievements: string[];
  /** Lore-mastery passive ids earned (permanent; drives the once-only celebration). */
  loreMasteries: string[];
  /** Active repeatable quests: template id + the metric value when it was assigned (delta = progress). */
  activeQuests: { id: string; base: number }[];
  /** Lifetime quests completed (a small bragging counter). */
  questsDone: number;
  /** Lifetime fusion discoveries — feeds the fusion achievement. */
  fusionCount: number;
  /** Lifetime branch switches — feeds the branch-switch achievement. */
  branchSwitchCount: number;
  /** Lifetime deaths — feeds the survivor achievement. */
  deaths: number;
  /** Race ids the player has ever played (per-race achievements). */
  racesPlayed: string[];
  /** Race ids whose gatekeeper the player has cleared at least once. */
  gatekeepersByRace: string[];
  /** Race ids whose evolution tree the player has completed (reached a terminal form). */
  treesCompleted: string[];

  // --- rebirth / prestige (GDD §7.5) ----------------------------------------
  rebirthCount: number;
  /** Content unlocked by rebirths/secret rooms (skill ids, layer keys…) — persists. */
  unlocks: string[];
  /** Total kills this life — feeds Sin and gatekeeper pacing. */
  kills: number;
  /** Set when the Gatekeeper boss falls — Rebirth becomes available (cleared on rebirth). */
  gatekeeperCleared: boolean;
  /** Permanent starting-stat boon accumulated across rebirths (the small kindness, §7.5.4). */
  rebirthBoon: number;
  /** Spendable Soul currency, earned at rebirth based on that run's depth/kills (prestige meta). */
  souls: number;
  /** Permanent Soul-tree upgrade levels (id → level). Bought with souls, persist forever. */
  soulUpgrades: Record<string, number>;

  // --- ruler axis + taboo (GDD §C) ------------------------------------------
  ruler: RulerState;

  // --- meditation (GDD §7.6) -------------------------------------------------
  /** Hidden gauge; fills only while meditating. */
  meditation: number;
  meditationUnlocked: boolean;

  // --- discovery: books, secret rooms, fragments, scars (GDD §7.7/§8.2/§5.0.4)
  /** Sacrifice-book ids found (carried, may be unread). */
  booksFound: string[];
  /** Book/room ids whose lore or reward has been consumed. */
  discoveries: string[];
  mapFragments: number;
  loreFragments: number;
  /** A perceived-but-unsolved secret room awaiting its riddle answer. */
  pendingRoom: string | null;
  /** Accumulated fusion "scar" penalty (GDD §5.0.4) — flat stat drain until repaired. */
  scars: number;
  /** Furthest room reached on each floor (exploredMax[layerId][floor-1]) → drives the map's fog-of-war reveal. */
  exploredMax: Record<number, number[]>;
  /** Per-player random rooms-per-floor: layerRooms[layerId][floor-1] (each floor rolls 12–20 independently). */
  layerRooms: Record<number, number[]>;
  /** Per-player random floor count per layer id (12–20), rolled once and saved. */
  layerFloors: Record<number, number>;
  /** Görülen evrim formları (ağaç reveal kalıcılığı) — bir kez görülen isim gizlenmez. */
  seenForms: string[];
  /** Geçilen formların sırası (lineage) — past/missed ayrımı için. İlk eleman = başlangıç formu. */
  formHistory: string[];
  /** Manual map progression: when false, a cleared room waits for the "Advance" tap. */
  autoAdvance: boolean;
  /** True when the current room is cleared/explored and the player may advance. */
  roomCleared: boolean;
  /** Unresolved map event (blocks combat/advance until a choice is made). */
  pendingEvent: { id: string; roomKey: string } | null;
  /** Room keys (layer.floor.room) of resolved events — won't re-trigger when farming. */
  resolvedEvents: string[];

  // --- adaptive resistance + death report (Bilgi = Hayatta Kalma) -------------
  /** The damage element you've been attacking with in a row (enemies adapt to it). */
  dmgStreakType?: DamageType;
  /** How many consecutive hits with the same element — drives the adaptation penalty. */
  dmgStreak?: number;
  /** What last damaged the player — used to write the death-analysis report. */
  lastHit?: { enemyKey: string; type: DamageType };
  /** Active boss riddle (attempts: 0-2 wrong so far; -1 = solved, awaiting skip/fight choice). */
  bossRiddle: { roomKey: string; riddleId: string; attempts: number } | null;
  /** Secret-room riddle attempt limits: roomId → counter/lock. */
  riddleLimits: Record<string, { attempts: number; lockUntil: number; lockTier: number }>;

  // --- race selection ---------------------------------------------------------
  /** False on a fresh game — shows the race selection screen before play begins. */
  raceConfirmed: boolean;
  /** Which game mode this save belongs to. Story mode persists to its own slot (save.ts). */
  mode: 'normal' | 'story';
  /** Story mode: current chapter id ('' when not in a story run). */
  storyChapter: string;
  /** Story mode: cleared chapter ids. */
  storyCleared: string[];
  /** Story mode: campaign finished (final chapter cleared). */
  storyEnded: boolean;
  /** Suppresses repeated "larder full" log spam — set when first notified, cleared when inventory drops below cap. */
  larderFullNotified?: boolean;

  // --- loot / equipment (humanoid races only) --------------------------------
  /** Carried (un-equipped) loot — the bag. Empty for monster races (they never receive gear). */
  inventoryItems: LootItem[];
  /** Equipped loot per slot (paper-doll). Slots map: weapon/offhand/head/body/hands/legs/feet/acc1/acc2. */
  equipment: Record<EquipSlot, LootItem | null>;
  /** Stat points the player has manually allocated this life (per stat) — refunded on respec. */
  allocated: Record<StatKey, number>;

  // --- bestiary ---------------------------------------------------------------
  /** Kill count per enemy archetype — unlocks the Bestiary reveal ladder. */
  killedEnemies: Record<string, number>;

  // --- race signature mechanic ------------------------------------------------
  /** Race-specific gauge: spider=web(0-100), wyrmling=heat(0-10), skeleton=bone(0-20), golem=stone(0-5). */
  sig: number;
  /** Slime elemental absorption — active element + remaining ticks (null = no absorb active). */
  sigAbsorb: { type: DamageType; ticks: number } | null;

  // --- Human Path (Tier-0 LV10 specialisation) ------------------------------
  /** Chosen path id ('tank'|'mage'|'assassin'|'healer'); undefined until chosen. */
  humanPath?: string;
  /** True when the human player hit LV10 T0 and must choose a path before continuing. */
  pendingHumanPath: boolean;
  /** How many evolution branches at the CURRENT node the player has already acknowledged via
   *  "keep growing". Auto-tier-advance stops whenever more branches are open than this, so a
   *  staggered node (e.g. demon_slime T5 shortcut vs T10 siblings) lets the player grab an early
   *  branch OR climb past it. Reset to 0 on evolve / rebirth / race change. */
  evolveAckCount: number;

  // --- Room progression (10-kill quota before advance) -----------------------
  /** Enemies killed in the current room; resets on room advance. */
  roomKillCount: number;
  /** Enemy archetype locked for this room on first spawn; null in boss rooms, cleared on advance. */
  roomEnemyId: string | null;

  // --- Skill tree reveal (progressive discovery) ------------------------------
  /** Skill IDs seen by the player — names stay visible once revealed. Resets on race change. */
  seenSkillIds: string[];

  // --- Threshold Endurance (SS rank secret skill) ----------------------------
  /** How many times the player has survived an otherwise-lethal hit this race life. Resets on race change. */
  nearDeathCount: number;
  /** Accumulated VIT endurance XP (each near-death adds skill_lv × 3). Resets on race change. */
  vitEnduranceXP: number;
  /** Permanent VIT bonus earned from Threshold Endurance this race life. Cap = tier × 2. Resets on race change. */
  vitEndurancePerm: number;
  /** Permanent VIT a slime has absorbed (biomass growth). Cap = (tier+1) × 2. Resets on race change. */
  absorbVit: number;

  // --- Yemek Ara (forage mechanic) -------------------------------------------
  /** Cooldown remaining in ms before the forage button is usable again (0 = ready). */
  forageCD: number;
  /** Found food waiting for player decision (eat or discard). Null if nothing pending. */
  pendingForage: { foodId: string } | null;

  // --- tutorial sistemi (Faz 5) -----------------------------------------------
  /** Tutorial sihirbazı mevcut adım. 0 = henüz başlamadı, 'done' = tamamlandı, 'skipped' = atlandı. */
  tutorialStep: number | 'done' | 'skipped';
  /** Gösterilmiş hint ID'leri — aynı hint tekrar çıkmaz. */
  seenHints: string[];

  // --- Auto-Search & Auto-Event -------------------------------------------
  /** Cumulative manual search count (forage + explore). Never resets on rebirth. */
  totalSearchCount: number;
  /** Unlocked when totalSearchCount >= 100. Stays unlocked through rebirth. */
  autoSearchUnlocked: boolean;
  /** Taboo rank 4 unlock: enemies are auto-appraised on encounter. */
  autoAppraise: boolean;
  /** Auto-forage toggle (requires autoSearchUnlocked). */
  autoSearchFood: boolean;
  /** Auto-explore toggle (requires autoSearchUnlocked). */
  autoSearchExplore: boolean;
  /** CD in ms before next auto/manual explore (shared with forage's forageCD pattern). */
  searchCD: number;
  /** Auto-choose event choices when INT >= 50. */
  autoEventDecision: boolean;
  /** Puzzle behaviour when autoEventDecision is on: skip combat | solve (INT >= 100). */
  autoEventPuzzleMode: 'skip' | 'solve';
  /** Moral encounter handling: 'ask' pauses for a choice; 'spare'/'devour' auto-resolve (so AFK play
   *  never locks on the prompt). */
  moralAutoMode: 'ask' | 'spare' | 'devour';

  // --- EP Shop ----------------------------------------------------------------
  /** How many stat points have been bought with EP this life (cost doubles each purchase; resets on rebirth). */
  epStatsBought: number;
  /** Active temporary buffs: buffId → real-time expiry timestamp (ms since epoch). */
  tempBuffs: Record<string, number>;

  // --- Save versiyonu -------------------------------------------------------
  /** Incremented when the save schema changes; used by migrate() to patch old saves. */
  saveVersion: number;

  // --- İstatistik paneli ---------------------------------------------------
  /** Non-idle ticks elapsed ≈ active seconds played. Never resets on rebirth. */
  totalTicks: number;
  /** Furthest layer/floor/room ever reached across all runs. Never resets. */
  deepestLayer: number;
  deepestFloor: number;
  deepestRoom: number;
  minions: {
    dps: number;
    tank: number;
    utility: number;
    tankHp: number;
    tankMaxHp: number;
  };

  // --- Idle Web Hunting ---
  webRoom: DungeonPos | null;
  webTicks: number;
  webAccEp: number;
  webAccFood: FoodItem[];
  webAccLoot: LootItem[];

  // --- Evolution Mutations ---
  mutations: string[];

  // --- Rebirth Teachings ---
  rebirthPerks: string[];
  pendingRebirthPerk: boolean;
  rebirthPerkChoices: string[];

  // --- Auto-Combat Macros (QoL) ---
  autoCombatConfig: AutoCombatConfig;

  // --- Combat Analytics ---
  combatAnalytics: CombatEncounterLog[];
  /** Tracks in-progress fight stats (damage dealt, ticks, healed, etc.) */
  combatTracker: { damage: number; ticks: number; healed: number; foodEaten: number; epStart: number } | null;

  // --- Floating Combat Text queue (visual feedback) ---
  floatingTexts: { text: string; color: string; target: 'player' | 'enemy'; ts: number }[];
  /** Screen shake intensity (0 = none, decays each frame) */
  screenShake: number;
}

/** lvLabel localization key reused across log lines. */
export interface LogEvent {
  key: string;
  params?: Record<string, string | number>;
}

export interface GameEvents extends Record<string, unknown> {
  log: LogEvent;
  changed: undefined;
}

/** Flat stat bonuses from all equipped loot (empty for monster races / before equipment exists). */
export function equipStatBonus(state: GameState): Record<StatKey, number> {
  const out: Record<StatKey, number> = { STR: 0, VIT: 0, AGI: 0, INT: 0, WIS: 0, LUCK: 0 };
  if (!state.equipment) return out;
  for (const it of Object.values(state.equipment)) {
    if (!it) continue;
    for (const k of Object.keys(it.statBonus) as StatKey[]) out[k] += it.statBonus[k] ?? 0;
  }
  return out;
}

/** Effective value of one stat = allocated base + equipment bonus + rebirth perks. */
export function effStat(state: GameState, k: StatKey): number {
  let val = state.stats[k] + equipStatBonus(state)[k];
  if (state.rebirthPerks) {
    for (const p of state.rebirthPerks) {
      if (p === 'lucky_charm' && k === 'LUCK') val += 1;
      else if (p === 'brute_strength' && k === 'STR') val += 1;
      else if (p === 'inner_peace' && k === 'WIS') val += 1;
      else if (p === 'quick_feet' && k === 'AGI') val += 1;
      else if (p === 'sharp_mind' && k === 'INT') val += 1;
    }
  }
  return val;
}

/** Recompute max HP/MP/SP from effective stats (base + equipment) and clamp current values. */
export function recomputeMaxes(state: GameState): void {
  const effLvl = state.tier * LEVEL_CAP + state.level; // auto growth: a small max bump per level
  const VIT = effStat(state, 'VIT');
  const INT = effStat(state, 'INT');
  const AGI = effStat(state, 'AGI');
  state.maxHp = 20 + VIT * 4 + effLvl * 2; // VIT → HP (+2/level)
  state.maxMp = 10 + INT * 3 + effLvl; // INT → MP (+1/level)
  state.maxSp = 10 + VIT * 2 + AGI * 2 + effLvl; // grows with VIT/AGI (+1/level)

  // Stat spec: VIT×1.5 maxHp, INT×1.5 maxMp — only when exactly one stat is at ≥100 allocated.
  const _alloc = state.allocated ?? {};
  const _specKeys = (Object.keys(_alloc) as StatKey[]).filter((k) => (_alloc[k] ?? 0) >= 100);
  if (_specKeys.length === 1) {
    if (_specKeys[0] === 'VIT') state.maxHp = Math.round(state.maxHp * 1.5);
    if (_specKeys[0] === 'INT') state.maxMp = Math.round(state.maxMp * 1.5);
  }

  if (state.rebirthPerks) {
    for (const p of state.rebirthPerks) {
      if (p === 'vital_force') state.maxHp += 5;
    }
  }

  state.hp = Math.min(state.hp, state.maxHp);
  state.mp = Math.min(state.mp, state.maxMp);
  state.sp = Math.min(state.sp, state.maxSp);
}

export function newGame(): GameState {
  const stats: Record<StatKey, number> = { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 };
  const state: GameState = {
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
    evolveAckCount: 0,
    autosaveMin: 5,
    hunger: 0,
    inventory: [],
    ep: 0,
    pos: { layer: 1, floor: 1, room: 1 },
    raceId: 'spider',
    formId: 'hatchling_spider',
    eyeAssignments: { e1: null }, // Appraisal is no longer free — it must be discovered, then slotted.
    action: 'idle',
    autoResume: false,
    mpTransferUnlocked: false,
    atkCd: 0,
    equipped: ['venom_bite', 'sharp_claw', 'silk_thread'],
    loadouts: [],
    combatMode: 'auto',
    cooldowns: {},
    autoEat: true,
    lastSearchPos: '',
    fusionUnlocked: false,
    badFusions: 0,
    skills: [
      { id: 'venom_bite', level: 1, exp: 0 },
      { id: 'sharp_claw', level: 1, exp: 0 },
      { id: 'silk_thread', level: 1, exp: 0 },
      { id: 'quick_thought', level: 1, exp: 0 },
      { id: 'chitin_hide', level: 1, exp: 0 },
      { id: 'many_legged_gait', level: 1, exp: 0 },
    ],
    resistances: [
      { id: 'physical_res', level: 0, exp: 0, nullified: false },
      { id: 'pierce_res', level: 0, exp: 0, nullified: false },
      { id: 'poison_res', level: 0, exp: 0, nullified: false },
      { id: 'fire_res', level: 0, exp: 0, nullified: false },
    ],
    enemy: null,
    statusEffects: [],
    fusionCache: {},
    outbox: [],
    lastSeen: Date.now(),
    difficulty: 'normal',
    permadeath: false,
    modifierFreeRooms: false,
    hellClears: [],
    achievements: [],
    loreMasteries: [],
    mode: 'normal',
    storyChapter: '',
    storyCleared: [],
    storyEnded: false,
    activeQuests: [],
    questsDone: 0,
    fusionCount: 0,
    branchSwitchCount: 0,
    deaths: 0,
    racesPlayed: [],
    gatekeepersByRace: [],
    treesCompleted: [],
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
    formHistory: ['hatchling_spider'],
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
    humanPath: undefined,
    pendingHumanPath: false,
    roomKillCount: 0,
    roomEnemyId: null,
    seenSkillIds: [],
    nearDeathCount: 0,
    vitEnduranceXP: 0,
    vitEndurancePerm: 0,
    absorbVit: 0,
    forageCD: 0,
    pendingForage: null,
    tutorialStep: 0,
    seenHints: [],
    totalSearchCount: 0,
    autoSearchUnlocked: false,
    autoAppraise: false,
    autoSearchFood: false,
    autoSearchExplore: false,
    searchCD: 0,
    autoEventDecision: false,
    autoEventPuzzleMode: 'skip',
    moralAutoMode: 'ask',
    epStatsBought: 0,
    tempBuffs: {},
    saveVersion: 1,
    totalTicks: 0,
    deepestLayer: 1,
    deepestFloor: 1,
    deepestRoom: 1,
    minions: {
      dps: 0,
      tank: 0,
      utility: 0,
      tankHp: 0,
      tankMaxHp: 0,
    },
    webRoom: null,
    webTicks: 0,
    webAccEp: 0,
    webAccFood: [],
    webAccLoot: [],
    mutations: [],
    rebirthPerks: [],
    pendingRebirthPerk: false,
    rebirthPerkChoices: [],
    autoCombatConfig: defaultAutoCombatConfig(),
    combatAnalytics: [],
    combatTracker: null,
    floatingTexts: [],
    screenShake: 0,
  };
  recomputeMaxes(state);
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.sp = state.maxSp;
  return state;
}
