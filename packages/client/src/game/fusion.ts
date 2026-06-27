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
  // Curated effects get a localized name; procedural "mix" combos get a unique coined name.
  const locKeyName = effect === 'mix' ? coinName(h) : `fusion.effect.${effect}`;
  return { id: `fz_${key}`, aId, bId, locKeyName, cls, effectType: effect, magnitude };
}

/** Build a usable active skill from a fusion result (damage = magnitude → class drives power). */
function fusionSkillDef(content: Content, result: FusionResult): Skill {
  const parentType = content.skills.get(result.aId)?.damageType ?? content.skills.get(result.bId)?.damageType;
  return {
    id: result.id,
    locKeyName: result.locKeyName,
    locKeyDesc: `fusion.effect.${result.effectType}.desc`,
    kind: 'active',
    stats: ['STR'],
    lvMax: 10,
    evolvesTo: [],
    damage: result.magnitude,
    damageType: parentType ?? 'physical',
    element: result.effectType,
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
