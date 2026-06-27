// Language-NATIVE content (riddles + lore + story text). Unlike i18n (one source → translated), these are
// written per language with their own wordplay; the active language's file is loaded and swapped on switch.
// Ids are shared across languages (r1.., lore_1.., story keys) so a pending item still resolves after a switch.
import type { NativeRiddle, NativeLore } from '@mri/shared';

let _riddles: NativeRiddle[] = [];
let _lore: NativeLore[] = [];
let _story: Record<string, string | string[]> = {};

/** Load (or reload) the native riddle + lore + story text for a language. Called at startup and on lang switch. */
export async function loadLangContent(base: string, lang: string): Promise<void> {
  const [riddles, lore, story] = await Promise.all([
    fetch(`${base}riddles/${lang}.json`).then((r) => r.json()).catch(() => [] as NativeRiddle[]),
    fetch(`${base}lore/${lang}.json`).then((r) => r.json()).catch(() => [] as NativeLore[]),
    fetch(`${base}story/${lang}.json`).then((r) => r.json()).catch(() => ({} as Record<string, string | string[]>)),
  ]);
  _riddles = Array.isArray(riddles) ? riddles : [];
  _lore = Array.isArray(lore) ? lore : [];
  _story = story && typeof story === 'object' && !Array.isArray(story) ? story : {};
}

export function allRiddles(): NativeRiddle[] { return _riddles; }
export function allLore(): NativeLore[] { return _lore; }
export function riddleById(id: string): NativeRiddle | undefined { return _riddles.find((r) => r.id === id); }
export function loreById(id: string): NativeLore | undefined { return _lore.find((l) => l.id === id); }

/** Native story text (single string) for the active language. Returns '' if missing. */
export function storyText(key: string): string {
  const v = _story[key];
  return typeof v === 'string' ? v : '';
}
/** Native story text that is a list of lines (e.g. the opening scene). Returns [] if missing. */
export function storyLines(key: string): string[] {
  const v = _story[key];
  return Array.isArray(v) ? v : [];
}
