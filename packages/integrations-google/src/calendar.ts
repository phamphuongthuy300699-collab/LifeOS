import { google } from 'googleapis';

export type GoogleCalendarEventItem = {
  provider: 'google';
  calendarId: string;
  externalEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  status: 'tentative' | 'confirmed' | 'cancelled';
  meetingUrl: string | null;
  isAllDay: boolean;
  metadata: Record<string, unknown>;
};

function toIsoOrNow(value: string | undefined | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function mapStatus(status: string | undefined): 'tentative' | 'confirmed' | 'cancelled' {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'tentative') return 'tentative';
  return 'confirmed';
}

export async function getGoogleCalendarEvents(params: {
  accessToken: string;
  calendarId?: string;
  timeMin: string;
  timeMax: string;
  limit?: number;
}): Promise<GoogleCalendarEventItem[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: params.accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const calendarId = params.calendarId ?? 'primary';
  const response = await calendar.events.list({
    calendarId,
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    maxResults: params.limit ?? 250,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = response.data.items ?? [];

  return items
    .filter((item) => Boolean(item.id && (item.start?.dateTime || item.start?.date)))
    .map((item) => {
      const startsAt = toIsoOrNow(item.start?.dateTime ?? item.start?.date);
      const endsAt = toIsoOrNow(item.end?.dateTime ?? item.end?.date);
      const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
      return {
        provider: 'google',
        calendarId,
        externalEventId: item.id as string,
        title: item.summary || 'Untitled event',
        description: item.description || null,
        location: item.location || null,
        startsAt,
        endsAt,
        timezone: item.start?.timeZone || item.end?.timeZone || null,
        status: mapStatus(item.status ?? undefined),
        meetingUrl: item.hangoutLink || null,
        isAllDay,
        metadata: {
          creatorEmail: item.creator?.email || null,
          organizerEmail: item.organizer?.email || null,
          htmlLink: item.htmlLink || null,
          iCalUID: item.iCalUID || null,
        },
      } satisfies GoogleCalendarEventItem;
    });
}
