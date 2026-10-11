import test from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthState, createPkcePair, validateOAuthState } from './auth-state';

test('OAuth state is unpredictable, checked in constant time, and non-static', () => {
  const a = createOAuthState(), b = createOAuthState();
  assert.notEqual(a, b);
  assert.equal(validateOAuthState(a, a), true);
  assert.equal(validateOAuthState(a, b), false);
  assert.equal(validateOAuthState('google_oauth', 'google_oauth'), false);
  assert.equal(validateOAuthState(undefined, a), false);
});

test('PKCE S256 creates unique verifier and challenge', () => {
  const a = createPkcePair(), b = createPkcePair();
  assert.notEqual(a.verifier, b.verifier);
  assert.notEqual(a.verifier, a.challenge);
  assert.equal(a.challenge.length, 43);
});
