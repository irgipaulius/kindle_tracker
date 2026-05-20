const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

type OAuthState = { n: string; exp: number };

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(message, secret);
  return expected === signature;
}

function b64urlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(value: string): string {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return atob(b64);
}

export async function createOAuthState(sessionSecret: string): Promise<string> {
  const payload: OAuthState = {
    n: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 600,
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await hmacSign(body, sessionSecret);
  return `${body}.${sig}`;
}

export async function verifyOAuthState(state: string, sessionSecret: string): Promise<boolean> {
  const [body, sig] = state.split('.');
  if (!body || !sig) return false;
  if (!(await hmacVerify(body, sig, sessionSecret))) return false;
  try {
    const payload = JSON.parse(b64urlDecode(body)) as OAuthState;
    return typeof payload.exp === 'number' && payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function buildGoogleAuthUrl(env: {
  GOOGLE_CLIENT_ID: string;
  APP_URL: string;
  SESSION_SECRET: string;
}): Promise<string> {
  return createOAuthState(env.SESSION_SECRET).then((state) => {
    const redirectUri = `${env.APP_URL}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `${GOOGLE_AUTH}?${params.toString()}`;
  });
}

export async function exchangeCodeForProfile(
  code: string,
  env: { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string; APP_URL: string }
): Promise<{ googleId: string; email: string | null; name: string; picture: string | null }> {
  const redirectUri = `${env.APP_URL}/auth/google/callback`;
  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) throw new Error('token_exchange_failed');
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error('missing_access_token');

  const profileRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileRes.ok) throw new Error('userinfo_failed');

  const profile = (await profileRes.json()) as {
    sub?: string;
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  const googleId = profile.sub ?? profile.id;
  if (!googleId) throw new Error('missing_google_id');

  return {
    googleId,
    email: profile.email ?? null,
    name: profile.name || profile.email || 'User',
    picture: profile.picture ?? null,
  };
}
