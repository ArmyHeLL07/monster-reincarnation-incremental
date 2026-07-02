import type { TelemetrySessionSummary, SupportersData } from '@mri/shared';

export interface Env {
  /** R2 bucket — the telemetry mailbox (posta-kutusu deseni). Bind in wrangler.toml when ready. */
  MAILBOX?: R2Bucket;
  /** KV namespace — the global fusion cache (a combo is produced once, universe-wide). */
  FUSION_CACHE?: KVNamespace;
  /** KV — cached supporters list + the rotating Patreon refresh token. */
  SUPPORTERS?: KVNamespace;
  /** KV — global leaderboard ("board" anahtarında top-100). Bind in wrangler.toml when ready. */
  SCORES?: KVNamespace;
  /** Patreon API client creds — set via `wrangler secret put` (never committed). */
  PATREON_CLIENT_ID?: string;
  PATREON_CLIENT_SECRET?: string;
  PATREON_REFRESH_TOKEN?: string;
}

const CORS = { 'access-control-allow-origin': '*' };
const EMPTY = '{"apex":[],"evolved":[],"spiderling":[]}';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);

    if (pathname === '/ping') return json({ ok: true, ts: Date.now() });

    // Public supporters list — read by the game (CORS-open, short cache).
    if (pathname === '/supporters' && req.method === 'GET') {
      const data = env.SUPPORTERS ? await env.SUPPORTERS.get('supporters') : null;
      return new Response(data || EMPTY, {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300', ...CORS },
      });
    }

    // Manual sync trigger — guarded by the Patreon client secret (for first run / testing).
    if (pathname === '/supporters/sync' && req.method === 'POST') {
      const syncKey = req.headers.get('x-sync-key') ?? '';
      if (!env.PATREON_CLIENT_SECRET || !timingSafeEqual(syncKey, env.PATREON_CLIENT_SECRET)) {
        return json({ error: 'forbidden' }, 403);
      }
      try {
        const r = await syncPatreon(env);
        return json({ ok: true, apex: r.apex.length, evolved: r.evolved.length, spiderling: r.spiderling.length });
      } catch (e) {
        return json({ ok: false, error: (e as Error).message }, 500);
      }
    }

    // --- Liderlik tablosu (v1.23.44, opt-in) --------------------------------------------------
    // Tek "board" anahtarında top-100; isim başına bir giriş, yüksek skor kazanır. KV
    // read-modify-write yarışı bu ölçekte kabul edilebilir. Rumuz SUNUCUDA da doğrulanır
    // (2-24, harf/rakam/boşluk/._- — <>" imkânsız; istemci yine de escape eder).
    if (pathname === '/score' && req.method === 'POST') {
      if (!env.SCORES) return json({ error: 'unavailable' }, 503);
      const raw = await req.text();
      if (raw.length > 1024) return json({ error: 'too_large' }, 413);
      let body: Record<string, unknown>;
      try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return json({ error: 'bad_json' }, 400); }
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!/^[\p{L}\p{N} ._-]{2,24}$/u.test(name)) return json({ error: 'bad_name' }, 400);
      const num = (v: unknown, max: number): number =>
        typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), max) : 0;
      const entry: ScoreEntry = {
        name,
        layer: num(body.layer, 99),
        floor: num(body.floor, 999),
        rebirths: num(body.rebirths, 99_999),
        form: typeof body.form === 'string' && /^[\w+-]{0,48}$/.test(body.form) ? body.form : '',
        ts: Date.now(),
      };
      if (entry.layer < 1) return json({ error: 'bad_score' }, 400);
      const board = JSON.parse((await env.SCORES.get('board')) ?? '[]') as ScoreEntry[];
      const key = name.toLocaleLowerCase();
      const i = board.findIndex((e) => e.name.toLocaleLowerCase() === key);
      if (i >= 0) {
        if (scoreOf(entry) <= scoreOf(board[i])) return json({ ok: true, kept: true });
        board[i] = entry;
      } else {
        board.push(entry);
      }
      board.sort((a, b) => scoreOf(b) - scoreOf(a));
      board.length = Math.min(board.length, 100);
      await env.SCORES.put('board', JSON.stringify(board));
      return json({ ok: true, rank: board.findIndex((e) => e.name.toLocaleLowerCase() === key) + 1 });
    }
    if (pathname === '/leaderboard' && req.method === 'GET') {
      const data = env.SCORES ? await env.SCORES.get('board') : null;
      return new Response(data ?? '[]', {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300', ...CORS },
      });
    }

    // Mailbox: client drops a session summary (no personal data — behavior only).
    if (pathname === '/mailbox' && req.method === 'POST') {
      const raw = await req.text();
      if (raw.length > 16_384) return json({ error: 'too_large' }, 413); // cap R2 storage/cost abuse
      let body: TelemetrySessionSummary;
      try { body = JSON.parse(raw) as TelemetrySessionSummary; } catch { return json({ error: 'bad_json' }, 400); }
      // Server-generated key ONLY — never trust a client sessionId as the R2 object key (key injection).
      const id = `${crypto.randomUUID()}.json`;
      if (env.MAILBOX) await env.MAILBOX.put(id, JSON.stringify(body));
      return json({ ok: true, stored: Boolean(env.MAILBOX), id });
    }

    // Global fusion cache: a combo is generated once and shared with everyone.
    const m = pathname.match(/^\/fusion\/([A-Za-z0-9_+-]+)$/);
    if (m) {
      const key = m[1];
      if (req.method === 'GET') {
        const hit = env.FUSION_CACHE ? await env.FUSION_CACHE.get(key) : null;
        return hit
          ? new Response(hit, { headers: { 'content-type': 'application/json' } })
          : json({ found: false }, 404);
      }
      if (req.method === 'PUT') {
        const val = await req.text();
        if (val.length > 8_192) return json({ error: 'too_large' }, 413);
        // The cache is shared with every player, so only store well-formed JSON — reject arbitrary
        // payloads that could smuggle a stored-XSS string into a future client build.
        try { JSON.parse(val); } catch { return json({ error: 'bad_json' }, 400); }
        if (env.FUSION_CACHE) await env.FUSION_CACHE.put(key, val);
        return json({ ok: true, cached: Boolean(env.FUSION_CACHE) });
      }
    }

    return json({ error: 'not_found' }, 404);
  },

  // Daily cron — refresh the supporters list from the Patreon API.
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(syncPatreon(env).catch((e) => console.error('patreon sync failed:', (e as Error).message)));
  },
};

/**
 * Pull active patrons from Patreon, bucket them by tier ($10→apex, $5→evolved, $2→spiderling),
 * and cache the result in KV. The refresh token rotates each call, so we persist the new one in KV.
 */
async function syncPatreon(env: Env): Promise<SupportersData> {
  if (!env.SUPPORTERS || !env.PATREON_CLIENT_ID || !env.PATREON_CLIENT_SECRET) {
    throw new Error('patreon/KV not configured');
  }
  const refresh = (await env.SUPPORTERS.get('refresh_token')) || env.PATREON_REFRESH_TOKEN;
  if (!refresh) throw new Error('no refresh token (set PATREON_REFRESH_TOKEN)');

  // 1) Refresh access token (and persist the rotated refresh token).
  const tokRes = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: env.PATREON_CLIENT_ID,
      client_secret: env.PATREON_CLIENT_SECRET,
    }),
  });
  if (!tokRes.ok) throw new Error('token refresh failed: ' + tokRes.status);
  const tok = (await tokRes.json()) as { access_token: string; refresh_token?: string };
  const access = tok.access_token;
  if (tok.refresh_token) await env.SUPPORTERS.put('refresh_token', tok.refresh_token);

  // 2) Find the creator's campaign id.
  const campRes = await fetch('https://www.patreon.com/api/oauth2/v2/campaigns', {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!campRes.ok) throw new Error('campaigns fetch: ' + campRes.status);
  const camp = (await campRes.json()) as { data?: { id: string }[] };
  const campaignId = camp.data?.[0]?.id;
  if (!campaignId) throw new Error('no campaign found');

  // 3) Page through active members + their entitled tiers.
  const out: SupportersData = { apex: [], evolved: [], spiderling: [] };
  const p = new URLSearchParams();
  p.set('include', 'currently_entitled_tiers');
  p.set('fields[member]', 'full_name,patron_status');
  p.set('fields[tier]', 'amount_cents,title');
  p.set('page[count]', '500');
  let url: string | undefined = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?${p}`;

  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
    if (!r.ok) throw new Error('members fetch: ' + r.status);
    const page = (await r.json()) as {
      data?: { attributes?: { full_name?: string; patron_status?: string }; relationships?: { currently_entitled_tiers?: { data?: { id: string }[] } } }[];
      included?: { type: string; id: string; attributes?: { amount_cents?: number } }[];
      links?: { next?: string };
    };
    const tierAmt = new Map<string, number>();
    for (const inc of page.included ?? []) {
      if (inc.type === 'tier') tierAmt.set(inc.id, inc.attributes?.amount_cents ?? 0);
    }
    for (const mem of page.data ?? []) {
      if (mem.attributes?.patron_status !== 'active_patron') continue;
      const name = (mem.attributes?.full_name ?? '').trim();
      if (!name) continue;
      let cents = 0;
      for (const t of mem.relationships?.currently_entitled_tiers?.data ?? []) {
        cents = Math.max(cents, tierAmt.get(t.id) ?? 0);
      }
      const bucket = cents >= 1000 ? 'apex' : cents >= 500 ? 'evolved' : cents >= 200 ? 'spiderling' : null;
      if (bucket) out[bucket].push(name);
    }
    url = page.links?.next;
  }

  await env.SUPPORTERS.put('supporters', JSON.stringify(out));
  return out;
}

/** Constant-time string compare so secret checks don't leak length/content via response timing. */
/** Liderlik girişi — istemciden gelen alanlar doğrulanmış/kelepçelenmiş halde saklanır. */
interface ScoreEntry {
  name: string;
  layer: number;
  floor: number;
  rebirths: number;
  form: string;
  ts: number;
}
/** Sıralama metriği: en derin kat baskın, kat içi ilerleme sonra, rebirth kırılım. */
function scoreOf(e: ScoreEntry): number {
  return e.layer * 1_000_000 + e.floor * 100 + Math.min(e.rebirths, 99);
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i % (b.length || 1));
  return diff === 0;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}
