import type { Context } from 'hono';

import type { Env } from '../env';

/** Public origin for redirects and OAuth (matches the URL in the browser). */
export function requestAppUrl(c: Context<{ Bindings: Env }>): string {
  const origin = new URL(c.req.url).origin;

  // Vite proxies to wrangler on 8787; OAuth redirect must stay on 5173.
  if (origin === 'http://localhost:8787' || origin === 'https://localhost:8787') {
    return c.env.APP_URL || origin;
  }

  return origin;
}
