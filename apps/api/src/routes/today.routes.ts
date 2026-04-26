import { Hono } from 'hono';
import { db } from '../config/db';
import { inboxItems, tasks, events, mailMessages } from '@lifeos/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { resolveStrictRequestContext } from './_request-context';

export const todayRoutes = new Hono();

todayRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const { workspaceId, userId } = context;

  const items = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.workspaceId, workspaceId),
        eq(inboxItems.userId, userId),
        eq(inboxItems.status, 'pending'),
      ),
    );
  const pendingInboxCount = items.length;

  const todayTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.userId, userId),
        eq(tasks.status, 'todo'),
      ),
    )
    .limit(5);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayEvents = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.workspaceId, workspaceId),
        eq(events.userId, userId),
        gte(events.startAt, startOfDay),
        lte(events.startAt, endOfDay),
      ),
    );

  const emailsRequiringAction = await db
    .select({
      id: mailMessages.id,
      subject: mailMessages.subject,
      snippet: mailMessages.snippet,
      sentAt: mailMessages.sentAt,
      fromJson: mailMessages.fromJson,
    })
    .from(mailMessages)
    .where(
      and(
        eq(mailMessages.workspaceId, workspaceId),
        eq(mailMessages.userId, userId),
        eq(mailMessages.isUnread, true),
      ),
    )
    .orderBy(desc(mailMessages.sentAt))
    .limit(5);

  return c.json({
    focusBlock: 'Приоритет: Дизайн система Stitch',
    pendingInboxCount,
    topTasks: todayTasks,
    events: todayEvents,
    emailsRequiringAction,
  });
});
