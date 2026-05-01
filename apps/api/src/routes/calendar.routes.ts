import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import {
  and,
  asc,
  count,
  eq,
  gte,
  inArray,
  lt,
  lte,
  notInArray,
  or,
} from 'drizzle-orm';
import { events, externalAccounts, tasks } from '@lifeos/db';
import { db } from '../config/db';
import { resolveStrictRequestContext } from './_request-context';
import { decryptToken, encryptToken, refreshGoogleToken } from '@lifeos/auth';
import { env } from '../config/env';

export const calendarRoutes = new Hono();

type CalendarProvider = 'manual' | 'google' | 'yandex';

type GoogleCalendarEvent = {
  externalId: string;
  calendarRef: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  status: 'tentative' | 'confirmed' | 'cancelled';
};

type EventRow = typeof events.$inferSelect;

function parseIsoOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isCalendarProvider(value: string | null | undefined): value is CalendarProvider {
  return value === 'manual' || value === 'google' || value === 'yandex';
}

function resolveCalendarProvider(calendarRef: string | null | undefined): CalendarProvider {
  if (!calendarRef) return 'manual';
  if (calendarRef.startsWith('google:')) return 'google';
  if (calendarRef.startsWith('yandex:')) return 'yandex';
  return 'manual';
}

function extractMeetingUrlFromText(value: string | null | undefined): string | null {
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

function decorateEventForResponse(event: EventRow) {
  return {
    ...event,
    sourceProvider: resolveCalendarProvider(event.calendarRef),
    meetingUrl: extractMeetingUrlFromText(event.description),
  };
}

function isTokenExpired(tokenExpiresAt: Date | null | undefined): boolean {
  if (!tokenExpiresAt) return true;
  return tokenExpiresAt.getTime() <= Date.now() + 30_000;
}

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

async function fetchGoogleCalendarEvents(params: {
  accessToken: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
  limit: number;
}): Promise<GoogleCalendarEvent[]> {
  const search = new URLSearchParams({
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    maxResults: String(params.limit),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events?${search.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar API failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      description?: string;
      location?: string;
      status?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      hangoutLink?: string;
    }>;
  };

  const calendarRef = `google:${params.calendarId}`;

  return (payload.items ?? [])
    .filter((item) => Boolean(item.id && (item.start?.dateTime || item.start?.date)))
    .map((item) => {
      const startsAt = toIsoOrNow(item.start?.dateTime ?? item.start?.date);
      const endsAt = toIsoOrNow(item.end?.dateTime ?? item.end?.date);
      const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
      const description = item.description ?? null;
      const enrichedDescription = item.hangoutLink
        ? [description, `Meeting: ${item.hangoutLink}`].filter(Boolean).join('\n')
        : description;

      return {
        externalId: item.id as string,
        calendarRef,
        title: item.summary || 'Untitled event',
        description: enrichedDescription,
        location: item.location || null,
        startAt: startsAt,
        endAt: endsAt,
        isAllDay,
        status: mapStatus(item.status ?? undefined),
      } satisfies GoogleCalendarEvent;
    });
}

async function ensureGoogleAccessToken(params: {
  externalAccountId: string;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
}) {
  const canUseAccessToken =
    params.accessTokenEncrypted && !isTokenExpired(params.tokenExpiresAt);

  if (canUseAccessToken) {
    return decryptToken(params.accessTokenEncrypted as string);
  }

  if (
    !params.refreshTokenEncrypted ||
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET
  ) {
    throw new Error(
      'Cannot refresh Google access token (missing refresh token or OAuth credentials)',
    );
  }

  const refreshToken = decryptToken(params.refreshTokenEncrypted);
  const refreshed = await refreshGoogleToken({
    refreshToken,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  });

  const newTokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await db
    .update(externalAccounts)
    .set({
      accessTokenEncrypted: encryptToken(refreshed.access_token),
      refreshTokenEncrypted: refreshed.refresh_token
        ? encryptToken(refreshed.refresh_token)
        : params.refreshTokenEncrypted,
      tokenExpiresAt: newTokenExpiresAt,
      scopesJson: refreshed.scope
        ? refreshed.scope.split(' ').filter(Boolean)
        : undefined,
      updatedAt: new Date(),
    } as any)
    .where(eq(externalAccounts.id, params.externalAccountId));

  return refreshed.access_token;
}

calendarRoutes.get('/today', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [dueToday, scheduledToday, eventsTodayRaw, overdue] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.userId, context.userId),
          notInArray(tasks.status, ['done', 'cancelled']),
          gte(tasks.dueAt, start),
          lte(tasks.dueAt, end),
        ),
      )
      .orderBy(asc(tasks.dueAt)),
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.userId, context.userId),
          notInArray(tasks.status, ['done', 'cancelled']),
          gte(tasks.scheduledStartAt, start),
          lte(tasks.scheduledStartAt, end),
        ),
      )
      .orderBy(asc(tasks.scheduledStartAt)),
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.workspaceId, context.workspaceId),
          eq(events.userId, context.userId),
          gte(events.startAt, start),
          lte(events.startAt, end),
        ),
      )
      .orderBy(asc(events.startAt)),
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.userId, context.userId),
          notInArray(tasks.status, ['done', 'cancelled']),
          lt(tasks.dueAt, start),
        ),
      )
      .orderBy(asc(tasks.dueAt)),
  ]);

  const eventsToday = eventsTodayRaw.map((event) => decorateEventForResponse(event));

  return c.json({
    dueToday,
    scheduledToday,
    events: eventsToday,
    overdue,
  });
});

calendarRoutes.get('/upcoming', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  const [upcomingTasks, upcomingEventsRaw] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.userId, context.userId),
          notInArray(tasks.status, ['done', 'cancelled']),
          or(
            and(gte(tasks.dueAt, now), lte(tasks.dueAt, end)),
            and(gte(tasks.scheduledStartAt, now), lte(tasks.scheduledStartAt, end)),
          ),
        ),
      )
      .orderBy(asc(tasks.dueAt), asc(tasks.scheduledStartAt)),
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.workspaceId, context.workspaceId),
          eq(events.userId, context.userId),
          gte(events.startAt, now),
          lte(events.startAt, end),
        ),
      )
      .orderBy(asc(events.startAt)),
  ]);

  const upcomingEvents = upcomingEventsRaw.map((event) => decorateEventForResponse(event));

  return c.json({
    rangeStart: now,
    rangeEnd: end,
    tasks: upcomingTasks,
    events: upcomingEvents,
  });
});

calendarRoutes.get('/overdue', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const now = new Date();
  const overdueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
        notInArray(tasks.status, ['done', 'cancelled']),
        lt(tasks.dueAt, now),
      ),
    )
    .orderBy(asc(tasks.dueAt));

  return c.json({ items: overdueTasks, total: overdueTasks.length });
});

calendarRoutes.get('/events', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const from = parseIsoOrNull(c.req.query('from'));
  const to = parseIsoOrNull(c.req.query('to'));
  const sourceProvider = c.req.query('sourceProvider');
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 200) || 200, 1), 1000);

  const whereParts = [
    eq(events.workspaceId, context.workspaceId),
    eq(events.userId, context.userId),
  ];

  if (from) {
    whereParts.push(gte(events.startAt, from));
  }

  if (to) {
    whereParts.push(lte(events.startAt, to));
  }

  const rows = await db
    .select()
    .from(events)
    .where(and(...whereParts))
    .orderBy(asc(events.startAt))
    .limit(limit);

  const items = rows
    .map((row) => decorateEventForResponse(row))
    .filter((row) => {
      if (!isCalendarProvider(sourceProvider)) return true;
      return row.sourceProvider === sourceProvider;
    });

  return c.json({
    items,
    filters: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      sourceProvider: sourceProvider ?? null,
      limit,
    },
  });
});

calendarRoutes.post('/google/sync', async (c) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  c.header('x-request-id', requestId);
  console.info('[calendar.google.sync] request started', { requestId });

  try {
    const context = await resolveStrictRequestContext(c.req.raw);
    if (!context) {
      return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
    }

    const from = parseIsoOrNull(c.req.query('from')) ?? new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const to = parseIsoOrNull(c.req.query('to')) ?? new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const calendarId = c.req.query('calendarId') ?? 'primary';
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 250) || 250, 1), 1000);
    const googleCalendarRef = `google:${calendarId}`;

    console.info('[calendar.google.sync] context resolved', {
      requestId,
      userId: context.userId,
      workspaceId: context.workspaceId,
      from: from.toISOString(),
      to: to.toISOString(),
      calendarId,
      limit,
    });

    const extAccount = await db.query.externalAccounts.findFirst({
      where: and(
        eq(externalAccounts.userId, context.userId),
        eq(externalAccounts.provider, 'google'),
      ),
    });

    if (!extAccount || !extAccount.syncEnabled) {
      return c.json(
        {
          code: 'GOOGLE_CALENDAR_NOT_CONFIGURED',
          message: 'Google Calendar sync not configured',
          requestId,
        },
        400,
      );
    }

    const accessToken = await ensureGoogleAccessToken({
      externalAccountId: extAccount.id,
      accessTokenEncrypted: extAccount.accessTokenEncrypted ?? null,
      refreshTokenEncrypted: extAccount.refreshTokenEncrypted ?? null,
      tokenExpiresAt: extAccount.tokenExpiresAt ?? null,
    });

    const externalItems = await fetchGoogleCalendarEvents({
      accessToken,
      calendarId,
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      limit,
    });

    const externalIds = Array.from(new Set(externalItems.map((item) => item.externalId)));

    const existingRows = externalIds.length
      ? await db
          .select({ id: events.id, externalId: events.externalId })
          .from(events)
          .where(
            and(
              eq(events.workspaceId, context.workspaceId),
              eq(events.userId, context.userId),
              eq(events.calendarRef, googleCalendarRef),
              inArray(events.externalId, externalIds),
            ),
          )
      : [];

    const existingMap = new Map(
      existingRows
        .filter((row) => row.externalId)
        .map((row) => [row.externalId as string, row.id]),
    );

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of externalItems) {
      const existingEventId = existingMap.get(item.externalId);

      if (existingEventId) {
        updatedCount += 1;
        await db
          .update(events)
          .set({
            title: item.title,
            description: item.description,
            location: item.location,
            startAt: new Date(item.startAt),
            endAt: new Date(item.endAt),
            isAllDay: item.isAllDay,
            status: item.status,
            updatedAt: new Date(),
          })
          .where(eq(events.id, existingEventId));
      } else {
        importedCount += 1;
        await db.insert(events).values({
          workspaceId: context.workspaceId,
          userId: context.userId,
          calendarRef: item.calendarRef,
          externalId: item.externalId,
          title: item.title,
          description: item.description,
          location: item.location,
          startAt: new Date(item.startAt),
          endAt: new Date(item.endAt),
          isAllDay: item.isAllDay,
          status: item.status,
        });
      }
    }

    const [googleEventsTotalRow] = await db
      .select({ value: count(events.id) })
      .from(events)
      .where(
        and(
          eq(events.workspaceId, context.workspaceId),
          eq(events.userId, context.userId),
          eq(events.calendarRef, googleCalendarRef),
        ),
      );

    const elapsedMs = Date.now() - startedAt;

    console.info('[calendar.google.sync] response sent', {
      requestId,
      importedCount,
      updatedCount,
      totalGoogleEvents: Number(googleEventsTotalRow?.value ?? 0),
      elapsedMs,
    });

    return c.json({
      requestId,
      importedCount,
      updatedCount,
      totalGoogleEvents: Number(googleEventsTotalRow?.value ?? 0),
      rangeStart: from.toISOString(),
      rangeEnd: to.toISOString(),
      provider: 'google',
      calendarRef: googleCalendarRef,
      elapsedMs,
    });
  } catch (error) {
    console.error('[calendar.google.sync] failed', {
      requestId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        code: 'CALENDAR_SYNC_FAILED',
        message: 'Failed to sync Google Calendar',
        requestId,
      },
      500,
    );
  }
});
