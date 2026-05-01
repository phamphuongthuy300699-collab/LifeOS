import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMeetingUrlFromText,
  isCalendarProvider,
  isTokenExpired,
  mapCalendarStatus,
  parseIsoOrNull,
  resolveCalendarProvider,
  toIsoOrNow,
} from './calendar.utils';

test('resolveCalendarProvider returns provider by prefix', () => {
  assert.equal(resolveCalendarProvider(null), 'manual');
  assert.equal(resolveCalendarProvider('google:primary'), 'google');
  assert.equal(resolveCalendarProvider('yandex:main'), 'yandex');
  assert.equal(resolveCalendarProvider('outlook:default'), 'manual');
});

test('isCalendarProvider validates supported providers only', () => {
  assert.equal(isCalendarProvider('manual'), true);
  assert.equal(isCalendarProvider('google'), true);
  assert.equal(isCalendarProvider('yandex'), true);
  assert.equal(isCalendarProvider('gmail'), false);
  assert.equal(isCalendarProvider(''), false);
});

test('extractMeetingUrlFromText prefers explicit Meeting: line', () => {
  const value = 'Standup\nMeeting: https://meet.google.com/abc-defg-hij\nNotes';
  assert.equal(extractMeetingUrlFromText(value), 'https://meet.google.com/abc-defg-hij');
});

test('extractMeetingUrlFromText falls back to first url in text', () => {
  const value = 'Join call at https://zoom.us/j/123456 and be on time';
  assert.equal(extractMeetingUrlFromText(value), 'https://zoom.us/j/123456');
});

test('extractMeetingUrlFromText returns null when no url exists', () => {
  assert.equal(extractMeetingUrlFromText('plain text only'), null);
  assert.equal(extractMeetingUrlFromText(null), null);
});

test('mapCalendarStatus maps unsupported statuses to confirmed', () => {
  assert.equal(mapCalendarStatus('tentative'), 'tentative');
  assert.equal(mapCalendarStatus('cancelled'), 'cancelled');
  assert.equal(mapCalendarStatus('confirmed'), 'confirmed');
  assert.equal(mapCalendarStatus('needsAction'), 'confirmed');
  assert.equal(mapCalendarStatus(undefined), 'confirmed');
});

test('parseIsoOrNull parses valid ISO and rejects invalid values', () => {
  const parsed = parseIsoOrNull('2026-05-01T12:00:00.000Z');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.toISOString(), '2026-05-01T12:00:00.000Z');

  assert.equal(parseIsoOrNull(undefined), null);
  assert.equal(parseIsoOrNull('not-a-date'), null);
});

test('toIsoOrNow returns deterministic ISO for valid values', () => {
  assert.equal(
    toIsoOrNow('2026-05-01T12:34:56.000Z'),
    '2026-05-01T12:34:56.000Z',
  );
  assert.match(toIsoOrNow('invalid'), /^\d{4}-\d{2}-\d{2}T/);
  assert.match(toIsoOrNow(null), /^\d{4}-\d{2}-\d{2}T/);
});

test('isTokenExpired marks missing and past tokens as expired', () => {
  assert.equal(isTokenExpired(null), true);

  const past = new Date(Date.now() - 60_000);
  assert.equal(isTokenExpired(past), true);

  const nearFuture = new Date(Date.now() + 10_000);
  assert.equal(isTokenExpired(nearFuture), true);

  const farFuture = new Date(Date.now() + 5 * 60_000);
  assert.equal(isTokenExpired(farFuture), false);
});
