import { Hono } from 'hono';

import { buildGoogleAuthUrl, exchangeCodeForProfile, verifyOAuthState } from '../auth/google';
import {
  clearSessionCookieHeader,
  sessionCookieHeader,
  signSessionToken,
} from '../auth/session';
import { upsertUserFromGoogle } from '../db';
import type { Env } from '../env';
import { requestAppUrl } from '../lib/appUrl';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get('/auth/google', async (c) => {
  const appUrl = requestAppUrl(c);
  const url = await buildGoogleAuthUrl({
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    SESSION_SECRET: c.env.SESSION_SECRET,
    appUrl,
  });
  return c.redirect(url, 302);
});

authRoutes.get('/auth/google/callback', async (c) => {
  const appUrl = requestAppUrl(c);
  const loginUrl = `${appUrl}/login`;
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state || !(await verifyOAuthState(state, c.env.SESSION_SECRET))) {
    return c.redirect(loginUrl, 302);
  }

  try {
    const profile = await exchangeCodeForProfile(code, {
      GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
      appUrl,
    });
    const user = await upsertUserFromGoogle(c.env.DB, profile);
    const token = await signSessionToken(user.id, c.env.SESSION_SECRET);
    c.header('Set-Cookie', sessionCookieHeader(token, appUrl));
    return c.redirect(`${appUrl}/app`, 302);
  } catch {
    return c.redirect(loginUrl, 302);
  }
});

authRoutes.post('/auth/logout', (c) => {
  const appUrl = requestAppUrl(c);
  return c.json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookieHeader(appUrl) });
});
