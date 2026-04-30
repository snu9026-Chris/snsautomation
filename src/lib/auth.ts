import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'loopdrop-session';
const SESSION_VALUE = 'authenticated';

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function requireAuth(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const OAUTH_STATE_COOKIE = 'loopdrop-oauth-state';
const OAUTH_STATE_MAX_AGE_SEC = 60 * 10;

export function buildOAuthStateCookie(state: string) {
  return {
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE_SEC,
  };
}

export async function readOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_STATE_COOKIE)?.value ?? null;
}

export const OAUTH_STATE_COOKIE_NAME = OAUTH_STATE_COOKIE;
