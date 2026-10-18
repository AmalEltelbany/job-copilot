import type { CookieOptions } from 'express';

export const SESSION_COOKIE = 'copilot_session';

export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    // The browser only talks to the web app's domain (REST is proxied there), so the cookie is first-party.
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
