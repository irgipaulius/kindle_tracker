import { Hono } from 'hono';

import { buildGoogleAuthUrl, exchangeCodeForProfile, verifyOAuthState } from '../auth/google';
import {
  clearSessionCookieHeader,
  sessionCookieHeader,
  signSessionToken,
} from '../auth/session';
import { upsertUserFromGoogle } from '../db';
import type { Env } from '../env';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get('/auth/google', async (c) => {
  const url = await buildGoogleAuthUrl(c.env);
  return c.redirect(url, 302);
});

authRoutes.get('/auth/google/callback', async (c) => {
  const loginUrl = `${c.env.APP_URL}/login`;
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state || !(await verifyOAuthState(state, c.env.SESSION_SECRET))) {
    return c.redirect(loginUrl, 302);
  }

  try {
    const profile = await exchangeCodeForProfile(code, c.env);
    const user = await upsertUserFromGoogle(c.env.DB, profile);
    const token = await signSessionToken(user.id, c.env.SESSION_SECRET);
    c.header('Set-Cookie', sessionCookieHeader(token, c.env.APP_URL));
    return c.redirect(`${c.env.APP_URL}/app`, 302);
  } catch {
    return c.redirect(loginUrl, 302);
  }
});

authRoutes.post('/auth/logout', (c) => {
  return c.json(
    { ok: true },
    200,
    { 'Set-Cookie': clearSessionCookieHeader(c.env.APP_URL) }
  );
});
