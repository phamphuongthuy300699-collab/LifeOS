import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, describeApiError, getTimeoutForMethod } from './api';

test('getTimeoutForMethod uses split read/write defaults', () => {
  assert.equal(getTimeoutForMethod('GET', undefined), 10_000);
  assert.equal(getTimeoutForMethod(undefined, undefined), 10_000);
  assert.equal(getTimeoutForMethod('POST', undefined), 30_000);
  assert.equal(getTimeoutForMethod('PATCH', undefined), 30_000);
  assert.equal(getTimeoutForMethod('DELETE', undefined), 30_000);
});

test('getTimeoutForMethod respects explicit timeout override', () => {
  assert.equal(getTimeoutForMethod('GET', 12345), 12_345);
  assert.equal(getTimeoutForMethod('POST', 2500), 2_500);
});

test('describeApiError returns endpoint-aware debug payload for ApiError', () => {
  const apiError = new ApiError(
    'VALIDATION_ERROR',
    'Invalid payload',
    400,
    '/tasks',
    { field: 'title' },
  );

  const described = describeApiError(apiError);
  assert.equal(described.userMessage, 'Invalid payload');
  assert.match(
    described.debugMessage,
    /\[api:\/tasks\] status=400 code=VALIDATION_ERROR body=/,
  );
});

test('describeApiError supports generic Error and unknown values', () => {
  const genericError = describeApiError(new Error('Failed to fetch'), '/calendar/today');
  assert.equal(genericError.userMessage, 'Failed to fetch');
  assert.match(
    genericError.debugMessage,
    /\[api:\/calendar\/today\] non-api-error=Failed to fetch/,
  );

  const unknownError = describeApiError('boom', '/mail/messages');
  assert.equal(unknownError.userMessage, 'Request failed');
  assert.match(unknownError.debugMessage, /\[api:\/mail\/messages\] unknown-error=boom/);
});
