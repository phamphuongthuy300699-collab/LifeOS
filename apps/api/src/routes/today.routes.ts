import { Hono } from 'hono';
import { db } from '../config/db';
import { events, inboxItems, mailMessages, tasks } from '@lifeos/db';
import { and, asc, desc, eq, gte, lt, lte, notInArray } from 'drizzle-orm';
import { resolveStrictRequestContext } from './_request-context';
import {
  extractMeetingUrlFromText,
  resolveCalendarProvider,
} from './calendar.utils';

export const todayRoutes = new Hono();

todayRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const { workspaceId, userId } = context;
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [pendingInboxItems, dueTodayTasks, overdueTasks, scheduledTasks, todayEvents, mailItems] =
    await Promise.all([
      db
        .select({ id: inboxItems.id })
        .from(inboxItems)
        .where(
          and(
            eq(inboxItems.workspaceId, workspaceId),
            eq(inboxItems.userId, userId),
            eq(inboxItems.status, 'pending'),
          ),
        ),
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.userId, userId),
            notInArray(tasks.status, ['done', 'cancelled']),
            gte(tasks.dueAt, startOfDay),
            lte(tasks.dueAt, endOfDay),
          ),
        )
        .orderBy(asc(tasks.dueAt))
        .limit(8),
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.userId, userId),
            notInArray(tasks.status, ['done', 'cancelled']),
            lt(tasks.dueAt, startOfDay),
          ),
        )
        .orderBy(asc(tasks.dueAt))
        .limit(8),
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.userId, userId),
            notInArray(tasks.status, ['done', 'cancelled']),
            gte(tasks.scheduledStartAt, startOfDay),
            lte(tasks.scheduledStartAt, endOfDay),
          ),
        )
        .orderBy(asc(tasks.scheduledStartAt))
        .limit(8),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.workspaceId, workspaceId),
            eq(events.userId, userId),
            gte(events.startAt, startOfDay),
            lte(events.startAt, endOfDay),
          ),
        )
        .orderBy(asc(events.startAt))
        .limit(8),
      db.query.mailMessages.findMany({
        where: and(
          eq(mailMessages.workspaceId, workspaceId),
          eq(mailMessages.userId, userId),
        ),
        with: {
          actionStates: true,
        },
        orderBy: [desc(mailMessages.sentAt)],
        limit: 15,
      }),
    ]);

  const emailsRequiringAction = mailItems
    .filter((message) => {
      const status = message.actionStates[0]?.triageStatus ?? 'new';
      return ['new', 'needs_action', 'waiting'].includes(status);
    })
    .slice(0, 5)
    .map((message) => ({
      id: message.id,
      subject: message.subject,
      snippet: message.snippet,
      sentAt: message.sentAt,
      fromJson: message.fromJson,
      triageStatus: message.actionStates[0]?.triageStatus ?? 'new',
      linkedTaskId: message.actionStates[0]?.linkedTaskId ?? null,
    }));

  const topTasks = [...overdueTasks, ...dueTodayTasks]
    .slice(0, 5)
    .map((task) => ({
      ...task,
      isOverdue: Boolean(task.dueAt && new Date(task.dueAt) < startOfDay),
      isDueToday: Boolean(task.dueAt && new Date(task.dueAt) >= startOfDay),
    }));

  const normalizedEvents = todayEvents.map((event) => ({
    ...event,
    sourceProvider: resolveCalendarProvider(event.calendarRef),
    meetingUrl: extractMeetingUrlFromText(event.description),
  }));

  return c.json({
    focusBlock: 'Главный блок дня: Inbox → Task → Deadline',
    pendingInboxCount: pendingInboxItems.length,
    topTasks,
    dueTodayTasks,
    overdueTasks,
    scheduledTasks,
    events: normalizedEvents,
    emailsRequiringAction,
  });
});
