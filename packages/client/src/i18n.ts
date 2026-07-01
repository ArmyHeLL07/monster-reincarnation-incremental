// Tiny localization layer. No language is hardcoded — strings come from /data/i18n.

type Params = Record<string, string | number>;

let dict: Record<string, string> = {};

export async function loadI18n(base: string, lang: string): Promise<void> {
  dict = await fetch(`${base}i18n/${lang}.json`).then((r) => r.json());
}

/** HTML-escape the chars that break out of text / double-quoted attributes. i18n values are plain
 *  text (verified: zero markup across tr/en/ru), so escaping here makes every t()→innerHTML render
 *  XSS-safe — including the unknown-key passthrough (coined fusion names) and any untrusted param.
 *  We deliberately skip & and ' to avoid cosmetic noise in confirm()/prompt() dialogs; <>" alone
 *  prevent tag injection and double-quoted-attribute breakout (the templates use double quotes). */
const HTML_ESC: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Translate a key, substituting `{name}` placeholders. Unknown keys return themselves (escaped). */
export function t(key: string, params: Params = {}): string {
  let s = dict[key] ?? key;
  // split/join instead of replaceAll: Samsung Internet ≤13 (Chromium ≤84) lacks replaceAll → boot crash
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s.replace(/[<>"]/g, (c) => HTML_ESC[c] ?? c);
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
