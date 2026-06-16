// Tiny localization layer. No language is hardcoded — strings come from /data/i18n.

type Params = Record<string, string | number>;

let dict: Record<string, string> = {};

export async function loadI18n(base: string, lang: string): Promise<void> {
  dict = await fetch(`${base}i18n/${lang}.json`).then((r) => r.json());
}

/** Translate a key, substituting `{name}` placeholders. Unknown keys return themselves. */
export function t(key: string, params: Params = {}): string {
  let s = dict[key] ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/**
 * Translate a log message. String params are themselves run through `t`, so callers
 * can pass localization keys (e.g. skill names, damage types) and stay language-free.
 */
export function tmsg(key: string, params: Params = {}): string {
  const resolved: Params = {};
  for (const [k, v] of Object.entries(params)) resolved[k] = typeof v === 'string' ? t(v) : v;
  return t(key, resolved);
}
