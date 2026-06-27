// Shared domain types — used by both the client and the Cloudflare worker.
// Keep this the single source of truth for the client↔server contract.

export type StatKey = 'STR' | 'VIT' | 'AGI' | 'INT' | 'WIS' | 'LUCK';

export type SkillKind = 'active' | 'passive' | 'resistance' | 'eye' | 'util' | 'magic' | 'ruler';

export type DamageType =
  | 'physical'
  | 'pierce'
  | 'fire'
  | 'poison'
  | 'acid'
  | 'lightning'
  | 'frost'
  | 'magic'
  | 'fear'
  | 'soul'
  | 'petrify'
  | 'stun'
  | 'wind'
  | 'earth'
  | 'dark'
  | 'light';

/** Game difficulty (GDD §8.5). Normal is the balance reference; others are deviations. */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'hell';

/** Sin (dark) vs Virtue (light) ruler axis (GDD §C). */
export type RulerPole = 'sin' | 'virtue';

/** Eye-slot mode — one mode per eye (GDD §5.0.5). */
export type EyeMode = 'passive' | 'active';

/** A clickable eye position on a race's head (data-driven SVG coordinates). */
export interface EyeSlotDef {
  id: string;
  x: number;
  y: number;
  r: number;
}

/** A race head: SVG viewBox + silhouette markup + the eye slots placed on it. */
export interface HeadDef {
  viewBox: string;
  silhouette: string;
  eyes: EyeSlotDef[];
}

/** A playable race. Eye-slot count/arrangement is the race identity (GDD §5.0.5). */
export interface Race {
  id: string;
  locKey: string;
  head: HeadDef;
  /** Starting skill ids (active + passive) granted at the start of a fresh run. */
  startSkills?: string[];
  /** Starting resistance ids granted at the start of a fresh run. */
  startResistances?: string[];
  /** Starting base stats for a fresh run of this race (overrides the default 5/5/5/5/5/5). */
  startStats?: Record<StatKey, number>;
  /** Humanoid races (human, skeleton, …) can carry an inventory and equip loot; monsters cannot. */
  humanoid?: boolean;
}

// ---- Loot / equipment (humanoid races only) --------------------------------

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Base category a generated item belongs to (drives which slot it occupies). */
export type LootType = 'weapon' | 'offhand' | 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'accessory';

/** The 9 equip slots on a humanoid paper-doll. `accessory` items fill acc1/acc2. */
export type EquipSlot = 'weapon' | 'offhand' | 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'acc1' | 'acc2';

/** A fully self-contained loot instance (procedurally generated; no external base table needed). */
export interface LootItem {
  uid: string;
  type: LootType;
  rarity: LootRarity;
  icon: string;
  /** Item level — drives the stat budget. */
  ilvl: number;
  /** Localisation keys for the display name parts: [prefix] base [suffix]. */
  baseKey: string;
  prefixKey?: string;
  suffixKey?: string;
  /** Flat stat bonuses applied while equipped. */
  statBonus: Partial<Record<StatKey, number>>;
  /** Minimum effective stats required to equip (heavy gear gates on STR/VIT/INT). */
  statReq?: Partial<Record<StatKey, number>>;
  /** Flat damage reduction (armour pieces / shields). */
  armor?: number;
  /** Multiplicative outgoing-damage bonus (Σ into Bonuses.dmgMult). */
  dmgMult?: number;
  /** Flat dodge chance added. */
  dodgeBonus?: number;
  /** Extra MP regen per round. */
  mpRegen?: number;
  /** Multiplicative HP-regen bonus. */
  regenMult?: number;
  /** Weapon: flat power added to attack damage. */
  weaponPower?: number;
  /** EP value — what scrapping/selling yields, and a rough power readout. */
  value: number;
}

/** A node in a race's (branching) evolution tree. Choosing a branch is permanent. */
export interface EvolutionForm {
  id: string;
  raceId: string;
  locKey: string;
  evolvesTo: string[];
  /** Minimum character level required to take this evolution. */
  levelReq: number;
  /** Minimum state.tier (evolution count) required to unlock this form. Computed from tree depth. */
  tierReq?: number;
  statBonus?: Partial<Record<StatKey, number>>;
  grantSkills?: string[];
  /** A hidden (easter-egg) form — only revealed/available once ALL of its secret conditions are met. */
  secret?: {
    kills?: number;
    sin?: number;
    virtue?: number;
    taboo?: number;
    rebirths?: number;
    hasSkill?: string;
  };
  /** This form is humanoid even if the race isn't (unlocks equipment — e.g. a slime's Rimuru form). */
  humanoid?: boolean;
  /** Optional portrait image path (relative to asset base, e.g. "forms/venom_weaver.png").
   *  Shown as the player's character in the rest/meditation stage; falls back to the race portrait. */
  image?: string;
}

export interface SkillRequirement {
  skillId: string;
  minLevel: number;
}

export interface DeriveCondition {
  /** Each token: "skillId:minLevel", e.g. "appraisal:10" */
  requiresAll: string[];
}

/** A data-driven skill. Player-facing text is referenced by localization key, never inlined. */
export interface Skill {
  id: string;
  locKeyName: string;
  locKeyDesc: string;
  kind: SkillKind;
  stats: StatKey[];
  lvMax: number;
  evolvesTo: string[];
  /** Active damage skills: base damage per use. */
  damage?: number;
  damageType?: DamageType;
  /** Attack cooldown in ticks (active skills). Lower = fires more often. Default ~3. */
  cooldown?: number;
  /** Passive regen contributions. */
  hpRegen?: number;
  spRegen?: number;
  mpRegen?: number;
  /** For `kind: 'eye'` abilities — which modes this eye ability allows. */
  eyeModes?: EyeMode[];
  /** Element tag used by the fusion reaction matrix (e.g. "poison", "physical", "silk"). */
  element?: string;
  // --- magic (kind: 'magic') -------------------------------------------------
  /** MP spent per cast; magic skills scale extra damage with INT. */
  mpCost?: number;
  /** Minimum MP cost at max level (proficiency floor). Default 5 for active, 0 if unset means magic-kind default. */
  mpFloor?: number;
  // --- passive / ruler / util effect modifiers (all optional, summed live) ---
  /** Flat damage multiplier added to the player's outgoing damage (e.g. Pride/Wrath). */
  dmgMult?: number;
  /** Skill/character XP gain multiplier (Diligence, Memory Palace). */
  xpMult?: number;
  /** Loot/EP/resource multiplier (Greed, Forage, Lucky Find). */
  lootMult?: number;
  /** Passive HP-regen multiplier (Kindness, Regenerative Core). */
  regenMult?: number;
  /** Flat stat multiplier applied to all six stats (Pride, Sovereign Form). */
  statMult?: number;
  /** Idle/offline yield multiplier (Sloth). */
  idleMult?: number;
  /** Dodge chance bonus (Stealth line, Many-Legged Gait). */
  dodgeBonus?: number;
  /** Flat physical damage reduction added like resistance (Carapace, Chitin Hide). */
  armor?: number;
  /** Bonus damage as a fraction of the player's *missing* HP (Overdraw — risk/reward). */
  overdrawFrac?: number;
  /** Hunger-rate multiplier while owned (<1 = slower; Cold Blood). */
  hungerMult?: number;
  /** Chance to survive an otherwise-lethal hit at 1 HP (Undying Husk). */
  surviveChance?: number;
  /** Pain Nullification (Kumo): fraction of incoming damage ignored while below half HP. */
  painNull?: number;
  /** Marks a hidden/meta skill discovered off the normal path (Stillness, Forbidden Knowledge). */
  hidden?: boolean;
  /** Localization key explaining HOW this skill is obtained (acquisition path), shown in the UI. */
  acquireKey?: string;
  /** Body-part category for the tidy grouped skills list (else derived from kind/effects). */
  part?: 'arm' | 'eye' | 'leg' | 'body';
  /** A slotted eye ability's combat effect, for gaze eyes (fear/charm/petrify…). */
  gaze?: GazeEffect;
  // --- Skill rank & progression gate (Faz 4) --------------------------------
  /** Mastery rank — higher = slower XP gain (F < E < D < C < B < A < S < SS). Default: E. */
  rank?: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
  /** Prerequisites: must own these skills at the given level before this skill can be naturally acquired. */
  requires?: SkillRequirement[];
  /** If set, when deriveCondition is fully met, automatically grant this skill (integration system). */
  derivesTo?: string;
  deriveCondition?: DeriveCondition;
  // --- Resistance chain fields (kind: 'resistance') ---
  /** Which resistance stat this chain skill boosts (e.g. 'fire_res'). */
  resistType?: string;
  /** Nullification merger group this chain belongs to. */
  chainGroup?: 'physical' | 'magic' | 'status' | 'ultimate';
  /** Max flat % bonus this tier adds to resistance reduction at full level (e.g. 5 = +5%). */
  tierStatBonus?: number;
}

/** Eye-gaze combat effect (GDD §B6). */
export interface GazeEffect {
  /** Chance per enemy turn to negate its attack (fear/charm/petrify share this). */
  negateChance?: number;
  /** Bonus flat damage dealt by the gaze each round (Piercing/Soul gaze). */
  damage?: number;
  /** Ignores resistance (Soul gaze hits the soul directly). */
  trueDamage?: boolean;
}

/** Damage-based resistance line — evolves to a Nullity (immunity) at lvMax. */
export interface Resistance {
  id: string;
  locKey: string;
  damageType: DamageType;
  lvMax: number;
  nullityKey: string;
}

/** Data-driven merger definition — when all required skill IDs appear in state.skills,
 *  the merger fires: components are deleted and the merger skill is added at Lv1. */
export interface ResistanceMerger {
  id: string;
  locKey: string;
  group: 'physical' | 'magic' | 'status' | 'ultimate';
  lvMax: number;
  /** Each entry: { skillId: T5 chain or group null id, minLevel?: required level (default any) } */
  requires: Array<{ skillId: string; minLevel?: number }>;
}

/** A data-driven enemy. */
export interface Enemy {
  id: string;
  locKey: string;
  hp: number;
  attack: number;
  damageType: DamageType;
  /** Optional second damage type — the attack is split and trains both resistances. */
  damageType2?: DamageType;
  /** Hunger value when eaten (used by the feeding system). */
  satiety: number;
  /** Evolution points granted on kill. */
  ep: number;
  /** Kin race id (e.g. "spider"). Killing your OWN race feeds Sin; others don't (GDD §C). */
  race?: string;
  /** Visual "skin" — an emoji/glyph shown as the enemy portrait (framed by its element colour). */
  icon?: string;
  /** Optional portrait image path (relative to the asset base, e.g. "monsters/venom_brute.png"). */
  image?: string;
  /** Skills that can be devoured/absorbed from this enemy. */
  grantSkills?: string[];
  /** Special combat behaviour — what makes this monster fight differently (not just element/stats). */
  behavior?: EnemyBehavior;
}

/** Optional behaviour modifiers that give monsters distinct fight patterns. */
export interface EnemyBehavior {
  /** Heals this fraction of max HP on each of its turns (sustain monster). */
  regen?: number;
  /** Strikes twice per turn (fast / multi-limbed). */
  doubleStrike?: boolean;
  /** Below 30% HP, its attack is multiplied by (1 + enrage). */
  enrage?: number;
  /** Reduces incoming player damage by this fraction (armoured / petrified hide). */
  armorPct?: number;
  /** Heals by this fraction of the damage it deals (lifesteal). */
  lifesteal?: number;
  /** Multiplies its chance to inflict a lingering status (poison/fire/…) — status specialist. */
  statusBoost?: number;
  /** If true, bypasses Ultimate Nullification Lv10 full immunity — capped at 60% instead. */
  nullifier?: boolean;
}

/** A content zone — a pool of enemies plus a stamina-drain multiplier. */
export interface Zone {
  id: string;
  locKey: string;
  enemyPool: string[];
  spDrainMult: number;
  /** Minimum character level to enter this zone (default 1). */
  levelReq?: number;
}

/** Ambient environmental hazard of an elemental layer (Atıl's design — heat/soul drain). */
export interface LayerAmbient {
  /** Per-combat-tick HP loss as a fraction of maxHP, before resistance/difficulty scaling. */
  drainPct: number;
  /** Multiplier on resistance-XP gain for the layer's element (matched zone trains faster). */
  resistBoost: number;
}

/** A dungeon layer (Katman): floors × rooms, last room = boss; gated by character tier. */
export interface DungeonLayer {
  id: number;
  locKey: string;
  tierReq: number;
  /** Legacy fixed floor count — superseded at runtime by a per-player random roll (12–20). */
  floors: number;
  /** Legacy fixed room count — kept only as a fallback; live rooms roll per floor (see minRooms/maxRooms). */
  roomsPerFloor: number;
  /** Per-floor random room-count range — each floor independently rolls in [minRooms, maxRooms]. */
  minRooms?: number;
  maxRooms?: number;
  spDrainMult: number;
  enemyPool: string[];
  boss: string;
  /** Clearing this layer's boss is a Gatekeeper kill — it enables Rebirth (GDD §7.5). */
  gatekeeper?: boolean;
  /** Environmental element theme (ambient hazard + the resistance the zone trains). */
  element?: DamageType;
  /** Ambient hazard config while fighting in this layer (absent = no environmental drain). */
  ambient?: LayerAmbient;
  /** Fraction of non-boss, non-entry rooms that are calm exploration rooms (no combat). */
  explorationRate?: number;
  /** Modifier IDs drawn randomly per-room (layer theme determines pool). */
  modifierPool?: string[];
}

export interface Dungeon {
  layers: DungeonLayer[];
}

/** Fusion outcome class — see GDD §5.0.3. */
export type FusionClass = 'synergy' | 'quirk' | 'backfire';

/** One element-reaction rule (order-independent on a/b). */
export interface FusionRule {
  a: string;
  b: string;
  effect: string;
  cls: FusionClass;
}

/** Data-driven fusion config: element matrix + per-class magnitude pools (GDD §5.0.3). */
export interface FusionRules {
  magnitudePools: Record<FusionClass, [number, number]>;
  matrix: FusionRule[];
  /** Hand-authored exceptions keyed by specific skill ids (a/b are skill ids, not elements). */
  special?: FusionRule[];
}

/** Deterministic fusion result. Numbers come from data pools, never from an LLM. */
export interface FusionResult {
  id: string;
  aId: string;
  bId: string;
  locKeyName: string;
  cls: FusionClass;
  effectType: string;
  magnitude: number;
}

/** One fusion attempt — the core creativity signal for telemetry. */
export interface ComboAttempt {
  aId: string;
  bId: string;
  resultId: string;
  cls: FusionClass;
  ts: number;
}

/** Session summary the client extracts locally (~5KB). No personal data — behavior only. */
export interface TelemetrySessionSummary {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  comboAttempts: ComboAttempt[];
  /** Combos newly added to the global pool this session. */
  discoveries: string[];
}

/** A sacrifice book / scroll — hidden lore that *implies* a mechanic, never states it (GDD §7.7). */
export interface Book {
  id: string;
  /** Surface story layer — always readable. */
  locKeyLore: string;
  /** Deep layer — only revealed at/above this INT (GDD §7.8.1). */
  locKeyDeep: string;
  intReq: number;
  /** Order in the chronological series (each book continues the last). */
  order: number;
  /** Which hidden path the book hints at (for the Discovery panel). */
  hints?: 'meditation' | 'brink' | 'taboo' | 'fusion' | 'regen' | 'element' | 'eyes' | 'appraisal' | 'evolution';
}

/** A bilingual riddle-gated secret room (GDD §8.2 — "open sesame"). */
export interface SecretRoom {
  id: string;
  locKey: string;
  locKeyClue: string;
  /** Accepted answers per language (lower-cased, language-aware check). */
  answers: { tr: string[]; en: string[] };
  /** Minimum Appraisal tier to even perceive the room (GDD §5.0.7, ~LV7+). */
  appraisalReq: number;
  /** Reward on solve. */
  reward: { kind: 'skill' | 'stat' | 'unlock' | 'ep'; value: string | number };
}

/** Knowledge condition gating an event choice (also drives foresight). */
export interface EventCond {
  appraisalTier?: number;
  int?: number;
  stat?: Partial<Record<StatKey, number>>;
  skill?: { id: string; level: number };
  unlock?: string;
}

export type EventOutcomeKind =
  | 'ep' | 'stat' | 'skill' | 'unlock' | 'fragment'
  | 'hp' | 'status' | 'scar' | 'hunger'
  | 'food' | 'sin' | 'virtue' | 'spawn' | 'none';

/** One effect applied when a choice is taken. `hp` with a negative amount deals damage. */
export interface EventOutcome {
  kind: EventOutcomeKind;
  value?: string | number;
  amount?: number;
  locKeyResult: string;
}

export interface EventChoice {
  locKey: string;
  /** Gate: choice is locked (disabled) until met. */
  requires?: EventCond;
  /** Fixed outcome(s), OR a weighted random branch (one is rolled). */
  outcomes?: EventOutcome[];
  random?: { weight: number; outcomes: EventOutcome[] }[];
}

/** A choice-based map event (GDD §8.2 — knowledge-gated room events). */
export interface EventDef {
  id: string;
  locKey: string;
  icon?: string;
  layers?: number[];
  weight?: number;
  /** Foresight: outcomes are previewed when appraisalTier/INT meets this. */
  revealReq?: { appraisalTier?: number; int?: number };
  /** A moral encounter (spare vs devour). Choice 0 = spare (virtue), choice 1 = devour (sin). These
   *  can auto-resolve per the player's `moralAutoMode` setting so AFK play never locks on the prompt. */
  moral?: boolean;
  choices: EventChoice[];
}

/** A hard riddle that may gate a boss room (GDD §8.2 — "knowledge defeats the boss"). */
export interface BossRiddle {
  id: string;
  /** Enemy archetype id of the boss this riddle gates (matched per layer). */
  bossId: string;
  locKey: string;
  locKeyClue: string;
  answers: { tr: string[]; en: string[] };
  /** Small guaranteed reward for the "skip" path after solving. */
  reward: { kind: 'skill' | 'stat' | 'unlock' | 'ep' | 'fragment'; value: string | number; amount?: number };
}

/** A forageable food item found via the "Yemek Ara" button (GDD survival mechanic). */
export interface ForageableFood {
  id: string;
  locKey: string;
  /** Layer element this food belongs to, or 'neutral' (appears in any layer). */
  element: DamageType | 'neutral';
  satiety: number;
  dangerLevel: 'safe' | 'risky' | 'toxic' | 'lethal';
  dangerEffect?: {
    type: DamageType | 'damage';
    dmg?: number;
    duration?: number;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
  /** Minimum layer depth required (default 1). very_rare items require >= 2. */
  minDepth?: number;
}

/** A repeatable quest template — track `metric` delta from when it was assigned; on reaching `target`
 *  grant the reward and roll a fresh quest. Metric names resolve against state (see achievements.ts). */
export interface Quest {
  id: string;
  locKey: string;
  icon: string;
  metric: string;
  target: number;
  reward: { ep?: number; statPoints?: number };
}

/** A milestone achievement — unlocked the moment `metric` reaches `threshold`, granting a small
 *  permanent reward. `metric` names are resolved against game state in code (see achievements.ts). */
export interface Achievement {
  id: string;
  /** Base loc key → `${locKey}.name` and `${locKey}.desc`. May contain a `{race}` placeholder. */
  locKey: string;
  icon: string;
  metric: string;
  threshold: number;
  reward: { ep?: number; statPoints?: number; souls?: number };
  /** Optional metric argument (e.g. a raceId for per-race metrics); also fills `{race}` in the name. */
  param?: string;
}

/** A ruler track entry — one sin or virtue, granted as the pole's axis crosses its threshold. */
export interface RulerDef {
  id: string;
  pole: RulerPole;
  locKeyName: string;
  locKeyDesc: string;
  /** Axis value at which this ruler skill is granted. */
  threshold: number;
  /** Flat stat bonus applied once on grant (mirrors EvolutionForm.statBonus). */
  statBonus?: Partial<Record<StatKey, number>>;
  /** Live multipliers, applied at point of use (mirror Skill's modifier fields). */
  dmgMult?: number;
  xpMult?: number;
  lootMult?: number;
  regenMult?: number;
  idleMult?: number;
}

/** Element type-chart (Atıl's design): attacking element vs enemy element advantage. */
export interface ElementChart {
  /** Multiplier when the attacker's element is strong vs the enemy's (e.g. 1.5). */
  advantage: number;
  /** Multiplier when the attacker's element is weak vs the enemy's (e.g. 0.7). */
  disadvantage: number;
  /** attackerType → the enemy type it is strong against. */
  strongVs: Record<string, string>;
}

/** Difficulty modifiers (GDD §8.5). Normal = all 1×/0, the balance reference. */
export interface DifficultyDef {
  id: Difficulty;
  locKey: string;
  /** Starting dungeon layer id. */
  startLayer: number;
  /** Enemy HP/ATK multiplier. */
  enemyMult: number;
  /** Player outgoing-damage multiplier (the "scissors" opens from both sides). */
  playerMult: number;
  /** Fraction of dungeon progress lost on death (0 = none, 1 = back to layer start). */
  deathPenalty: number;
  /** Resistance-XP gain multiplier (Easy trains resistances very slowly; default 1). */
  resistMult?: number;
  /** Reward multiplier on EP / XP / loot (Hell pays more; default 1). */
  rewardMult?: number;
  /** Environmental ambient-hazard multiplier (Easy is gentle, Hell sears; default 1). */
  envMult?: number;
  /** Hell-only: enemies hunt actively, hunger/exp are harsher. */
  brutal?: boolean;
}
