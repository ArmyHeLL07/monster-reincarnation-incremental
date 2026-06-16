// Deterministic fusion helpers. The SAME combo must always produce the SAME result,
// on the client (instant, offline) and on the server (pre-generation / cache key).

/** Order-independent key for a skill pair: `comboKey("b","a") === comboKey("a","b")`. */
export function comboKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}

/** FNV-1a 32-bit hash → stable seed for picking effect/number from data pools. */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
