import { comboKey, fnv1a } from '@mri/shared';
import type { FusionClass, FusionResult, Skill } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';

type Log = (e: LogEvent) => void;

const CLASSES: FusionClass[] = ['synergy', 'quirk', 'backfire'];

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
  return { id: `fz_${key}`, aId, bId, locKeyName: `fusion.effect.${effect}`, cls, effectType: effect, magnitude };
}

/** Build a usable active skill from a fusion result (damage = magnitude → class drives power). */
function fusionSkillDef(content: Content, result: FusionResult): Skill {
  const parentType = content.skills.get(result.aId)?.damageType;
  return {
    id: result.id,
    locKeyName: result.locKeyName,
    locKeyDesc: result.locKeyName,
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
): FusionResult {
  const key = comboKey(aId, bId);
  const cached = state.fusionCache[key];
  const result = cached ?? resolveFusion(aId, bId, content);
  const discovered = !cached;
  if (discovered) state.fusionCache[key] = result;

  registerFusionSkill(content, result);
  if (!state.skills.some((s) => s.id === result.id)) {
    state.skills.push({ id: result.id, level: 1, exp: 0 });
  }

  state.outbox.push({ aId, bId, resultId: result.id, cls: result.cls, ts: Date.now() });
  log({
    key: discovered ? 'log.fuse_new' : 'log.fuse_cached',
    params: { cls: `fusion.${result.cls}`, mag: result.magnitude },
  });
  return result;
}
