export type CalendarProvider = 'manual' | 'google' | 'yandex';

export function parseIsoOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function isCalendarProvider(
  value: string | null | undefined,
): value is CalendarProvider {
  return value === 'manual' || value === 'google' || value === 'yandex';
}

export function resolveCalendarProvider(
  calendarRef: string | null | undefined,
): CalendarProvider {
  if (!calendarRef) return 'manual';
  if (calendarRef.startsWith('google:')) return 'google';
  if (calendarRef.startsWith('yandex:')) return 'yandex';
  return 'manual';
}

export function extractMeetingUrlFromText(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const meetingPrefix = 'Meeting: ';
  if (value.includes(meetingPrefix)) {
    const line = value
      .split('\n')
      .find((row) => row.trimStart().startsWith(meetingPrefix));
    if (line) {
      const candidate = line.replace(meetingPrefix, '').trim();
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        return candidate;
      }
    }
  }

  const urlMatch = value.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

export function isTokenExpired(tokenExpiresAt: Date | null | undefined): boolean {
  if (!tokenExpiresAt) return true;
  return tokenExpiresAt.getTime() <= Date.now() + 30_000;
}

export function toIsoOrNow(value: string | undefined | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export function mapCalendarStatus(
  status: string | undefined,
): 'tentative' | 'confirmed' | 'cancelled' {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'tentative') return 'tentative';
  return 'confirmed';
}
