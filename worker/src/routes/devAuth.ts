import { Hono } from 'hono';

import { findUserByEmail } from '../db';
import { sessionCookieHeader, signSessionToken } from '../auth/session';
import type { Env } from '../env';

export const devAuthRoutes = new Hono<{ Bindings: Env }>();

devAuthRoutes.get('/auth/dev-login', async (c) => {
  if (c.env.DEV_BYPASS_AUTH !== 'true') {
    return c.json({ error: 'dev_auth_disabled' }, 404);
  }

  const email = c.env.DEV_AUTH_EMAIL?.trim();
  if (!email) {
    return c.json({ error: 'missing_DEV_AUTH_EMAIL' }, 500);
  }

  const user = await findUserByEmail(c.env.DB, email);
  if (!user) {
    return c.text(
      `No user with email ${email}. Sign in with Google once, then retry dev login.`,
      404
    );
  }

  const token = await signSessionToken(user.id, c.env.SESSION_SECRET);
  c.header('Set-Cookie', sessionCookieHeader(token, c.env.APP_URL));
  return c.redirect(`${c.env.APP_URL}/app`, 302);
});
