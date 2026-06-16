import type { TelemetrySessionSummary } from '@mri/shared';

export interface Env {
  /** R2 bucket — the telemetry mailbox (posta-kutusu deseni). Bind in wrangler.toml when ready. */
  MAILBOX?: R2Bucket;
  /** KV namespace — the global fusion cache (a combo is produced once, universe-wide). */
  FUSION_CACHE?: KVNamespace;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);

    if (pathname === '/ping') {
      return json({ ok: true, ts: Date.now() });
    }

    // Mailbox: client drops a session summary (no personal data — behavior only).
    if (pathname === '/mailbox' && req.method === 'POST') {
      const body = (await req.json()) as TelemetrySessionSummary;
      const id = `${body.sessionId ?? crypto.randomUUID()}.json`;
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
        if (env.FUSION_CACHE) await env.FUSION_CACHE.put(key, val);
        return json({ ok: true, cached: Boolean(env.FUSION_CACHE) });
      }
    }

    return json({ error: 'not_found' }, 404);
  },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
