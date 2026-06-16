import { comboKey, fnv1a } from '@mri/shared';
import type { FusionClass, FusionResult } from '@mri/shared';
import type { Content } from './content';
import type { GameState, LogEvent } from './state';

type Log = (e: LogEvent) => void;

const CLASSES: FusionClass[] = ['synergy', 'quirk', 'backfire'];

function elementOf(content: Content, id: string): string | undefined {
  return content.skills.get(id)?.element;
}

/**
 * Deterministic fusion — element reaction matrix decides effect+class; the hash picks a
 * magnitude from the class pool. Same combo always yields the same result (instant, offline).
 */
export function resolveFusion(aId: string, bId: string, content: Content): FusionResult {
  const key = comboKey(aId, bId);
  const h = fnv1a(key);
  const elA = elementOf(content, aId);
  const elB = elementOf(content, bId);

  // Hand-authored special pairs (by skill id) take priority over the element matrix.
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
  const locKeyName = effect === 'mix' ? 'fusion.temp' : `fusion.effect.${effect}`;
  return { id: `fz_${key}`, aId, bId, locKeyName, cls, effectType: effect, magnitude };
}

/**
 * Produce a fusion: caches the combo (global-pool skeleton — produced once) and records
 * a telemetry attempt to the local outbox. Display name is localized by the UI layer.
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

  state.outbox.push({ aId, bId, resultId: result.id, cls: result.cls, ts: Date.now() });
  log({
    key: discovered ? 'log.fuse_new' : 'log.fuse_cached',
    params: { cls: `fusion.${result.cls}`, mag: result.magnitude },
  });
  return result;
}
