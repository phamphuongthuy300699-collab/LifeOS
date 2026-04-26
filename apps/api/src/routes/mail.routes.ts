import { Hono } from 'hono';
import { db } from '../config/db';
import {
  syncJobs,
  mailMessages,
  mailActionStates,
  externalAccounts,
  tasks,
} from '@lifeos/db';
import { eq, and, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { decryptToken } from '@lifeos/auth';
import { getMessageBody } from '@lifeos/integrations-google';
import { resolveStrictRequestContext } from './_request-context';

type MailRouteEnv = {
  Variables: {
    userId: string;
    workspaceId: string;
  };
};

const MAIL_TRIAGE_STATUSES = [
  'new',
  'needs_action',
  'converted_to_task',
  'waiting',
  'done',
  'ignored',
  'snoozed',
] as const;

type MailTriageStatus = (typeof MAIL_TRIAGE_STATUSES)[number];

function isMailTriageStatus(value: unknown): value is MailTriageStatus {
  return (
    typeof value === 'string' &&
    (MAIL_TRIAGE_STATUSES as readonly string[]).includes(value)
  );
}

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};

const mailSyncQueue = new Queue('mail-sync', { connection });

export const mailRoutes = new Hono<MailRouteEnv>();

mailRoutes.use('*', async (c, next) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', context.userId);
  c.set('workspaceId', context.workspaceId);
  await next();
});

/**
 * POST /api/v1/mail/sync
 * Creates a sync_job and enqueues a Gmail sync worker job.
 */
mailRoutes.post('/sync', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.get('workspaceId');

  const extAccount = await db.query.externalAccounts.findFirst({
    where: and(
      eq(externalAccounts.userId, userId),
      eq(externalAccounts.provider, 'google'),
    ),
  });

  if (!extAccount || !extAccount.syncEnabled) {
    return c.json({ error: 'Gmail sync not configured or disabled' }, 400);
  }

  const [jobRecord] = await db
    .insert(syncJobs)
    .values({
      workspaceId,
      userId,
      integrationType: 'google',
      entityScope: 'mail',
      status: 'pending',
      runMode: 'manual',
    })
    .returning();

  if (!jobRecord) {
    return c.json({ error: 'Failed to create sync job' }, 500);
  }

  await mailSyncQueue.add(
    'sync-gmail',
    {
      syncJobId: jobRecord.id,
      userId,
      workspaceId,
      externalAccountId: extAccount.id,
    },
    {
      jobId: jobRecord.id,
    },
  );

  return c.json({ message: 'Sync job enqueued', jobId: jobRecord.id }, 202);
});

/**
 * GET /api/v1/mail/threads
 * Returns latest imported messages with triage state.
 */
mailRoutes.get('/threads', async (c) => {
  const userId = c.get('userId');

  const messages = await db.query.mailMessages.findMany({
    where: eq(mailMessages.userId, userId),
    orderBy: [desc(mailMessages.sentAt)],
    limit: 50,
    with: {
      actionStates: true,
    },
  });

  return c.json({ messages });
});

/**
 * GET /api/v1/mail/messages/:id
 * Returns message details and lazily fetches body from Gmail if missing.
 */
mailRoutes.get('/messages/:id', async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('id');

  const message = await db.query.mailMessages.findFirst({
    where: and(eq(mailMessages.userId, userId), eq(mailMessages.id, messageId)),
    with: {
      actionStates: true,
    },
  });

  if (!message) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (!message.bodyHtml && !message.bodyText) {
    const extAccount = await db.query.externalAccounts.findFirst({
      where: and(
        eq(externalAccounts.userId, userId),
        eq(externalAccounts.provider, 'google'),
      ),
    });

    if (extAccount?.accessTokenEncrypted) {
      const accessToken = decryptToken(extAccount.accessTokenEncrypted);
      try {
        const body = await getMessageBody(accessToken, message.providerMessageId);

        await db
          .update(mailMessages)
          .set({
            bodyHtml: body.html,
            bodyText: body.text,
          })
          .where(eq(mailMessages.id, messageId));

        message.bodyHtml = body.html;
        message.bodyText = body.text;
      } catch (error) {
        console.error('Failed to fetch message body on demand', error);
      }
    }
  }

  return c.json({ message });
});

/**
 * PATCH /api/v1/mail/messages/:id/action-state
 * Creates/updates triage state for a message.
 */
mailRoutes.patch('/messages/:id/action-state', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.get('workspaceId');
  const messageId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const triageStatus = body?.triageStatus;

  if (!isMailTriageStatus(triageStatus)) {
    return c.json({ error: 'Invalid triageStatus' }, 400);
  }

  const message = await db.query.mailMessages.findFirst({
    where: and(eq(mailMessages.id, messageId), eq(mailMessages.userId, userId)),
  });

  if (!message) {
    return c.json({ error: 'Message not found' }, 404);
  }

  const existing = await db.query.mailActionStates.findFirst({
    where: and(
      eq(mailActionStates.userId, userId),
      eq(mailActionStates.mailMessageId, messageId),
    ),
  });

  let state;
  if (existing) {
    [state] = await db
      .update(mailActionStates)
      .set({ triageStatus, updatedAt: new Date() })
      .where(eq(mailActionStates.id, existing.id))
      .returning();
  } else {
    [state] = await db
      .insert(mailActionStates)
      .values({
        workspaceId,
        userId,
        mailMessageId: messageId,
        triageStatus,
      })
      .returning();
  }

  return c.json({ state });
});

/**
 * POST /api/v1/mail/messages/:id/create-task
 * Converts an email into a task and links it via MailActionState.
 */
mailRoutes.post('/messages/:id/create-task', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.get('workspaceId');
  const messageId = c.req.param('id');

  const message = await db.query.mailMessages.findFirst({
    where: and(eq(mailMessages.id, messageId), eq(mailMessages.userId, userId)),
  });

  if (!message) {
    return c.json({ error: 'Message not found' }, 404);
  }

  const existingState = await db.query.mailActionStates.findFirst({
    where: and(
      eq(mailActionStates.userId, userId),
      eq(mailActionStates.mailMessageId, messageId),
    ),
  });

  if (existingState?.linkedTaskId) {
    return c.json({
      message: 'Message already linked to a task',
      linkedTaskId: existingState.linkedTaskId,
      state: existingState,
    });
  }

  const taskTitle =
    message.subject?.trim() ||
    message.snippet?.trim().slice(0, 120) ||
    'Follow up email';
  const sender = message.fromJson?.email || 'unknown sender';
  const taskDescription = [
    `Created from email`,
    `From: ${sender}`,
    message.snippet ? `Snippet: ${message.snippet}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const [createdTask] = await db
    .insert(tasks)
    .values({
      workspaceId,
      userId,
      title: taskTitle,
      description: taskDescription,
      status: 'todo',
      priority: 'none',
      sourceType: 'email',
      sourceRefType: 'mail_message',
      sourceRefId: message.id,
    })
    .returning();

  if (!createdTask) {
    return c.json({ error: 'Failed to create task' }, 500);
  }

  let state;
  if (existingState) {
    [state] = await db
      .update(mailActionStates)
      .set({
        triageStatus: 'converted_to_task',
        linkedTaskId: createdTask.id,
        updatedAt: new Date(),
      })
      .where(eq(mailActionStates.id, existingState.id))
      .returning();
  } else {
    [state] = await db
      .insert(mailActionStates)
      .values({
        workspaceId,
        userId,
        mailMessageId: messageId,
        triageStatus: 'converted_to_task',
        linkedTaskId: createdTask.id,
      })
      .returning();
  }

  return c.json({ message: 'Converted to task', task: createdTask, state });
});
