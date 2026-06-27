// Language-NATIVE content (riddles + lore). Unlike i18n (one source → translated), these are written
// per language with their own wordplay; the active language's file is loaded and swapped on switch.
// Ids are shared across languages (r1.., lore_1..) so a pending riddle/lore still resolves after a switch.
import type { NativeRiddle, NativeLore } from '@mri/shared';

let _riddles: NativeRiddle[] = [];
let _lore: NativeLore[] = [];

/** Load (or reload) the native riddle + lore pools for a language. Called at startup and on lang switch. */
export async function loadLangContent(base: string, lang: string): Promise<void> {
  const [riddles, lore] = await Promise.all([
    fetch(`${base}riddles/${lang}.json`).then((r) => r.json()).catch(() => [] as NativeRiddle[]),
    fetch(`${base}lore/${lang}.json`).then((r) => r.json()).catch(() => [] as NativeLore[]),
  ]);
  _riddles = Array.isArray(riddles) ? riddles : [];
  _lore = Array.isArray(lore) ? lore : [];
}

export function allRiddles(): NativeRiddle[] { return _riddles; }
export function allLore(): NativeLore[] { return _lore; }
export function riddleById(id: string): NativeRiddle | undefined { return _riddles.find((r) => r.id === id); }
export function loreById(id: string): NativeLore | undefined { return _lore.find((l) => l.id === id); }
