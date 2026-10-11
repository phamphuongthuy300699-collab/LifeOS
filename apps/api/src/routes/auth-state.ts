import { randomBytes, timingSafeEqual } from 'node:crypto';

/** OAuth CSRF nonce. One-time validation uses an HttpOnly Lax cookie in the callback. */
export function createOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function validateOAuthState(received?: string, expected?: string): boolean {
  if (!received || !expected || received.length < 32 || expected.length < 32) return false;
  const a = Buffer.from(received, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
