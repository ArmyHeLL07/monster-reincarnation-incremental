import { comboKey, fnv1a } from '@mri/shared';
import type { FusionClass, FusionResult, Skill } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';
import { recomputeMaxes } from './state';

type Log = (e: LogEvent) => void;

/** Eye-kind skills have their own dedicated fusion system and cannot enter the skill fusion lab. */
export function canFuse(content: Content, id: string): boolean {
  const def = content.skills.get(id);
  return !!def && def.kind !== 'eye';
}

const CLASSES: FusionClass[] = ['synergy', 'quirk', 'backfire'];

// Coined names for procedural ("mix") fusions so they aren't all called the same thing.
const NAME_PRE = ['Gloom', 'Rift', 'Bane', 'Thorn', 'Ash', 'Mire', 'Dusk', 'Venom', 'Hex', 'Grave', 'Spire', 'Murk', 'Snare', 'Wraith'];
const NAME_SUF = ['fang', 'coil', 'lash', 'surge', 'veil', 'rend', 'bite', 'shroud', 'spike', 'grasp', 'husk', 'bloom', 'maw', 'warden'];
function coinName(h: number): string {
  return NAME_PRE[h % NAME_PRE.length] + NAME_SUF[Math.floor(h / 16) % NAME_SUF.length];
}

function elementOf(content: Content, id: string): string | undefined {
  return content.skills.get(id)?.element;
}

/**
 * Deterministic fusion — special pairs (by id) and the element matrix decide effect+class;
 * the hash picks a magnitude from the class pool. Same combo always yields the same result.
 */
export function resolveFusion(aId: string, bId: string, content: Content): FusionResult {
  const key = comboKey(aId, bId);
  const h = fnv1a(key);
  const elA = elementOf(content, aId);
  const elB = elementOf(content, bId);

  const special = content.fusionRules.special?.find(
    (r) => (r.a === aId && r.b === bId) || (r.a === bId && r.b === aId),
  );
  const rule =
    !special && elA && elB
      ? content.fusionRules.matrix.find(
          (r) => (r.a === elA && r.b === elB) || (r.a === elB && r.b === elA),
        )
      : undefined;

  let cls: FusionClass;
  let effect: string;
  if (special) {
    cls = special.cls;
    effect = special.effect;
  } else if (rule) {
    cls = rule.cls;
    effect = rule.effect;
  } else if (elA && elB && elA === elB) {
    cls = 'synergy';
    effect = 'reinforce';
  } else {
    cls = CLASSES[h % CLASSES.length];
    effect = 'mix';
  }

  const pool = content.fusionRules.magnitudePools[cls];
  const magnitude = pool[0] + (h % (pool[1] - pool[0] + 1));
  // Curated effects get a localized name; generic fallbacks ('mix' and same-element 'reinforce')
  // get a unique coined name — otherwise every same-element fusion was identically named "Reinforced".
  const locKeyName = effect === 'mix' || effect === 'reinforce' ? coinName(h) : `fusion.effect.${effect}`;
  return { id: `fz_${key}`, aId, bId, locKeyName, cls, effectType: effect, magnitude };
}

/** Maps a curated fusion effect to a real game element (for matrix matching) and damage type. */
const EFFECT_TYPE_MAP: Record<string, { element: string; damageType: string }> = {
  // new special rules
  dragon_inferno:  { element: 'fire',     damageType: 'fire'     },
  earthquake:      { element: 'earth',    damageType: 'physical' },
  void_web:        { element: 'void',     damageType: 'magic'    },
  soul_chaos:      { element: 'soul',     damageType: 'soul'     },
  primal_apex:     { element: 'physical', damageType: 'physical' },
  forbidden_soul:  { element: 'dark',     damageType: 'dark'     },
  toxic_deluge:    { element: 'poison',   damageType: 'acid'     },
  living_fortress: { element: 'physical', damageType: 'physical' },
  shadow_web:      { element: 'silk',     damageType: 'pierce'   },
  mud_surge:       { element: 'water',    damageType: 'physical' },
  terror_shadow:   { element: 'dark',     damageType: 'fear'     },
  abyss:           { element: 'void',     damageType: 'soul'     },
  cursed_strike:   { element: 'dark',     damageType: 'dark'     },
  annihilation:    { element: 'void',     damageType: 'magic'    },
  paradox:         { element: 'dark',     damageType: 'dark'     },
  holy_fire:       { element: 'fire',     damageType: 'fire'     },
  hurricane:       { element: 'wind',     damageType: 'wind'     },
  absolute_zero:   { element: 'frost',    damageType: 'frost'    },
  // existing matrix effects
  poison_web:         { element: 'poison',    damageType: 'poison'    },
  tainted_strike:     { element: 'poison',    damageType: 'physical'  },
  snare_strike:       { element: 'silk',      damageType: 'physical'  },
  rend:               { element: 'physical',  damageType: 'physical'  },
  flame_storm:        { element: 'fire',      damageType: 'fire'      },
  steam:              { element: 'water',     damageType: 'magic'     },
  thermal_shock:      { element: 'fire',      damageType: 'fire'      },
  conductive_shock:   { element: 'lightning', damageType: 'lightning' },
  mud:                { element: 'water',     damageType: 'physical'  },
  corrode:            { element: 'acid',      damageType: 'acid'      },
  dissolve_web:       { element: 'acid',      damageType: 'acid'      },
  necrosis:           { element: 'acid',      damageType: 'acid'      },
  blizzard:           { element: 'frost',     damageType: 'frost'     },
  tempest:            { element: 'lightning', damageType: 'lightning' },
  magma:              { element: 'fire',      damageType: 'fire'      },
  superconductor:     { element: 'frost',     damageType: 'lightning' },
  envenom_pierce:     { element: 'poison',    damageType: 'pierce'    },
  oblivion:           { element: 'void',      damageType: 'soul'      },
  despair:            { element: 'fear',      damageType: 'fear'      },
  phase_rend:         { element: 'void',      damageType: 'physical'  },
  // special pairs
  precise_strike:     { element: 'physical',  damageType: 'physical'  },
  toxic_blood:        { element: 'poison',    damageType: 'poison'    },
  omniscience:        { element: 'soul',      damageType: 'soul'      },
  mana_singularity:   { element: 'soul',      damageType: 'magic'     },
  apex_soul:          { element: 'soul',      damageType: 'soul'      },
  perfect_predator:   { element: 'physical',  damageType: 'physical'  },
};

/** Build a usable active skill from a fusion result (damage = magnitude → class drives power). */
function fusionSkillDef(content: Content, result: FusionResult): Skill {
  const skA = content.skills.get(result.aId);
  const skB = content.skills.get(result.bId);
  // Inherit stats from both parents (union, max 2 unique entries).
  const statsA = skA?.stats ?? ['STR'];
  const statsB = skB?.stats ?? ['STR'];
  const stats = [...new Set([...statsA, ...statsB])].slice(0, 2) as Skill['stats'];
  // Resolve a real element and damage type from the curated effect map, else fall back to parents.
  const mapped = EFFECT_TYPE_MAP[result.effectType];
  const element   = mapped?.element   ?? skA?.element ?? skB?.element ?? 'physical';
  const damageType = (mapped?.damageType ?? skA?.damageType ?? skB?.damageType ?? 'physical') as Skill['damageType'];
  // If BOTH parents are magic the fusion stays magic → scales off INT (not STR); else active (STR).
  const kind: Skill['kind'] = skA?.kind === 'magic' && skB?.kind === 'magic' ? 'magic' : 'active';
  return {
    id: result.id,
    locKeyName: result.locKeyName,
    locKeyDesc: `fusion.effect.${result.effectType}.desc`,
    kind,
    stats,
    lvMax: 10,
    evolvesTo: [],
    damage: result.magnitude,
    damageType,
    element,
  };
}

/** Register a fused skill's definition into the runtime content map (idempotent). */
export function registerFusionSkill(content: Content, result: FusionResult): void {
  if (!content.skills.has(result.id)) content.skills.set(result.id, fusionSkillDef(content, result));
}

/**
 * Produce a fusion: caches the combo (global-pool skeleton), registers a usable skill,
 * grants it to the player, and records a telemetry attempt to the local outbox.
 */
export function fuse(
  state: GameState,
  content: Content,
  aId: string,
  bId: string,
  log: Log,
): FusionResult | null {
  if (!state.fusionUnlocked) {
    log({ key: 'log.fuse_locked' });
    return null;
  }
  // Sensible inputs only — fusing non-attack skills produced nonsense results.
  if (aId === bId || !canFuse(content, aId) || !canFuse(content, bId)) {
    log({ key: 'log.fuse_invalid' });
    return null;
  }
  const key = comboKey(aId, bId);
  const cached = state.fusionCache[key];
  const result = cached ?? resolveFusion(aId, bId, content);
  const discovered = !cached;
  if (discovered) {
    state.fusionCache[key] = result;
    state.fusionCount = (state.fusionCount ?? 0) + 1; // lifetime — feeds the fusion achievement
  }

  registerFusionSkill(content, result);
  if (!state.skills.some((s) => s.id === result.id)) {
    state.skills.push({ id: result.id, level: 1, exp: 0 });
  }

  state.outbox.push({ aId, bId, resultId: result.id, cls: result.cls, ts: Date.now() });
  if (state.outbox.length > 200) state.outbox = state.outbox.slice(-200); // cap local telemetry (no drain yet) so the save can't bloat over a very long session
  log({
    key: discovered ? 'log.fuse_new' : 'log.fuse_cached',
    params: { cls: `fusion.${result.cls}`, mag: result.magnitude },
  });
  // Backfire = an incompatible combo. It scars, and stacking them is lethal.
  if (result.cls === 'backfire') {
    state.scars += 1;
    state.badFusions += 1;
    log({ key: 'log.fuse_scar', params: { scars: state.scars } });
    if (state.badFusions >= 4) {
      // The 4th incompatible fusion overloads and tears the host apart — death.
      state.skills = state.skills.filter((s) => !s.id.startsWith('fz_'));
      state.equipped = state.equipped.filter((id) => !id.startsWith('fz_'));
      state.badFusions = 0;
      state.enemy = null;
      state.pos = { layer: state.pos.layer, floor: 1, room: 1 };
      recomputeMaxes(state);
      state.hp = state.maxHp;
      state.sp = state.maxSp;
      log({ key: 'log.fusion_death' });
    } else if (state.badFusions >= 3) {
      log({ key: 'log.fusion_warn', params: { n: state.badFusions } });
    }
  }
  return result;
}
