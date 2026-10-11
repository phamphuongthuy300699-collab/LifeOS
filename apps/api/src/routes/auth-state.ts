import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** OAuth CSRF nonce. One-time validation uses an HttpOnly Lax cookie in the callback. */
export function createOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function validateOAuthState(received?: string, expected?: string): boolean {
  if (!received || !expected || received.length < 32 || expected.length < 32) return false;
  const a = new TextEncoder().encode(received);
  const b = new TextEncoder().encode(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** S256 PKCE pair to bind a Google authorization code to its initiator. */
export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}
