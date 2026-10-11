import test from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthState, validateOAuthState } from './auth-state';

test('OAuth state is unpredictable, checked in constant time, and non-static', () => {
  const a = createOAuthState(), b = createOAuthState();
  assert.notEqual(a, b);
  assert.equal(validateOAuthState(a, a), true);
  assert.equal(validateOAuthState(a, b), false);
  assert.equal(validateOAuthState('google_oauth', 'google_oauth'), false);
  assert.equal(validateOAuthState(undefined, a), false);
});
