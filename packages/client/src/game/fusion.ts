import { comboKey, fnv1a } from '@mri/shared';
import type { FusionClass, FusionResult } from '@mri/shared';
import type { GameState, LogEvent } from './state';

type Log = (e: LogEvent) => void;

const CLASSES: FusionClass[] = ['synergy', 'quirk', 'backfire'];

/** Curated names for known combos; everything else gets a deterministic temp tag. */
const KNOWN: Record<string, string> = {
  [comboKey('venom_bite', 'silk_thread')]: 'fusion.poison_web',
};

/** Deterministic fusion — same combo always yields the same result (client-side, instant). */
export function resolveFusion(aId: string, bId: string): FusionResult {
  const key = comboKey(aId, bId);
  const h = fnv1a(key);
  const cls = CLASSES[h % CLASSES.length];
  const magnitude = 5 + (h % 20);
  const locKeyName = KNOWN[key] ?? 'fusion.temp';
  return { id: `fz_${key}`, aId, bId, locKeyName, cls, effectType: cls, magnitude };
}

/**
 * Produce a fusion: caches the combo (global-pool skeleton — produced once) and records
 * a telemetry attempt to the local outbox. Display name is localized by the UI layer.
 */
export function fuse(state: GameState, aId: string, bId: string, log: Log): FusionResult {
  const key = comboKey(aId, bId);
  const cached = state.fusionCache[key];
  const result = cached ?? resolveFusion(aId, bId);
  const discovered = !cached;
  if (discovered) state.fusionCache[key] = result;

  state.outbox.push({ aId, bId, resultId: result.id, cls: result.cls, ts: Date.now() });
  log({
    key: discovered ? 'log.fuse_new' : 'log.fuse_cached',
    params: { cls: `fusion.${result.cls}`, mag: result.magnitude },
  });
  return result;
}
