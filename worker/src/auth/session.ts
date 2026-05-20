import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'session';
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string, sessionSecret: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey(sessionSecret));
}

export async function verifySessionToken(
  token: string,
  sessionSecret: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(sessionSecret));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function isSecureContext(appUrl: string) {
  return appUrl.startsWith('https://');
}

export function sessionCookieHeader(token: string, appUrl: string): string {
  const secure = isSecureContext(appUrl) ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookieHeader(appUrl: string): string {
  const secure = isSecureContext(appUrl) ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=') || null;
  }
  return null;
}
