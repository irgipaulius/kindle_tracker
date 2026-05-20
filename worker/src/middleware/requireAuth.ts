import { createMiddleware } from 'hono/factory';

import { readSessionCookie, verifySessionToken } from '../auth/session';
import type { AppVariables, Env } from '../env';

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const token = readSessionCookie(c.req.header('Cookie'));
    if (!token) return c.json({ error: 'unauthorized' }, 401);

    const userId = await verifySessionToken(token, c.env.SESSION_SECRET);
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    c.set('userId', userId);
    await next();
  }
);
