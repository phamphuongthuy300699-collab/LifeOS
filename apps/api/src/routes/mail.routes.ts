import { Hono } from 'hono';
import { db } from '../config/db';
import {
  syncJobs,
  mailThreads,
  mailMessages,
  mailActionStates,
  externalAccounts,
  tasks,
} from '@lifeos/db';
import { eq, and, desc, inArray, count } from 'drizzle-orm';
import {
  decryptToken,
  encryptToken,
  refreshGoogleToken,
} from '@lifeos/auth';
import {
  getMessageBody,
  getRecentMessagesMetadata,
  type GmailMessageMetadata,
} from '@lifeos/integrations-google';
import { resolveStrictRequestContext } from './_request-context';
import { env } from '../config/env';

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
 * Creates a sync_job and runs Gmail sync inline for MVP reliability.
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
    return c.json(
      {
        code: 'GMAIL_NOT_CONFIGURED',
        message: 'Gmail sync not configured or disabled',
      },
      400,
    );
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
    return c.json(
      { code: 'SYNC_JOB_CREATE_FAILED', message: 'Failed to create sync job' },
      500,
    );
  }

  const startedAt = new Date();
  await db
    .update(syncJobs)
    .set({ status: 'running', startedAt })
    .where(eq(syncJobs.id, jobRecord.id));

  try {
    const syncResult = await syncGmailInline({
      userId,
      workspaceId,
      externalAccountId: extAccount.id,
    });

    await db
      .update(syncJobs)
      .set({
        status: 'done',
        finishedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(syncJobs.id, jobRecord.id));

    return c.json(
      {
        message: 'Sync completed',
        jobId: jobRecord.id,
        ...syncResult,
      },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Gmail sync error';
    console.error('[mail/sync] inline sync failed', error);
    await db
      .update(syncJobs)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(syncJobs.id, jobRecord.id));
    return c.json(
      { code: 'SYNC_FAILED', message, jobId: jobRecord.id },
      500,
    );
  }
});

/**
 * GET /api/v1/mail/threads
 * Returns latest imported messages with triage state.
 */
mailRoutes.get('/threads', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.get('workspaceId');

  const messages = await db.query.mailMessages.findMany({
    where: and(
      eq(mailMessages.userId, userId),
      eq(mailMessages.workspaceId, workspaceId),
    ),
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
  const startedAt = Date.now();
  console.info('[mail.action-state] request started');

  try {
    const userId = c.get('userId');
    const workspaceId = c.get('workspaceId');
    const messageId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const triageStatus = body?.triageStatus;

    console.info('[mail.action-state] context resolved', {
      userId,
      workspaceId,
      messageId,
      triageStatus: triageStatus ?? null,
    });

    if (!isMailTriageStatus(triageStatus)) {
      console.info('[mail.action-state] invalid triage status', {
        triageStatus,
        elapsedMs: Date.now() - startedAt,
      });
      return c.json({ error: 'Invalid triageStatus' }, 400);
    }

    const message = await db.query.mailMessages.findFirst({
      where: and(eq(mailMessages.id, messageId), eq(mailMessages.userId, userId)),
    });
    console.info('[mail.action-state] message lookup', {
      messageFound: Boolean(message),
    });

    if (!message) {
      console.info('[mail.action-state] response sent', {
        status: 404,
        elapsedMs: Date.now() - startedAt,
      });
      return c.json({ error: 'Message not found' }, 404);
    }

    const existing = await db.query.mailActionStates.findFirst({
      where: and(
        eq(mailActionStates.userId, userId),
        eq(mailActionStates.mailMessageId, messageId),
      ),
    });
    console.info('[mail.action-state] existing state lookup', {
      found: Boolean(existing),
      stateId: existing?.id ?? null,
    });

    let state;
    if (existing) {
      console.info('[mail.action-state] update started', { stateId: existing.id });
      [state] = await db
        .update(mailActionStates)
        .set({ triageStatus, updatedAt: new Date() })
        .where(eq(mailActionStates.id, existing.id))
        .returning();
      console.info('[mail.action-state] update finished', { stateId: state?.id ?? null });
    } else {
      console.info('[mail.action-state] insert started');
      [state] = await db
        .insert(mailActionStates)
        .values({
          workspaceId,
          userId,
          mailMessageId: messageId,
          triageStatus,
        })
        .returning();
      console.info('[mail.action-state] insert finished', { stateId: state?.id ?? null });
    }

    console.info('[mail.action-state] response sent', {
      status: 200,
      elapsedMs: Date.now() - startedAt,
    });
    return c.json({ state });
  } catch (error) {
    console.error('[mail.action-state] failed', {
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      {
        code: 'MAIL_ACTION_STATE_FAILED',
        message: 'Failed to update mail action state',
      },
      500,
    );
  }
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

function isTokenExpired(tokenExpiresAt: Date | null | undefined): boolean {
  if (!tokenExpiresAt) return true;
  return tokenExpiresAt.getTime() <= Date.now() + 30_000;
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

async function syncGmailInline(params: {
  userId: string;
  workspaceId: string;
  externalAccountId: string;
}) {
  const extAccount = await db.query.externalAccounts.findFirst({
    where: and(
      eq(externalAccounts.id, params.externalAccountId),
      eq(externalAccounts.userId, params.userId),
      eq(externalAccounts.provider, 'google'),
    ),
  });

  if (!extAccount) {
    throw new Error('Google external account not found');
  }

  const accessToken = await ensureGoogleAccessToken({
    externalAccountId: extAccount.id,
    accessTokenEncrypted: extAccount.accessTokenEncrypted ?? null,
    refreshTokenEncrypted: extAccount.refreshTokenEncrypted ?? null,
    tokenExpiresAt: extAccount.tokenExpiresAt ?? null,
  });

  const metadata = await getRecentMessagesMetadata(accessToken, 30, 'in:inbox');
  if (metadata.length === 0) {
    const [threadsTotalResult] = await db
      .select({ value: count(mailThreads.id) })
      .from(mailThreads)
      .where(eq(mailThreads.workspaceId, params.workspaceId));
    const [messagesTotalResult] = await db
      .select({ value: count(mailMessages.id) })
      .from(mailMessages)
      .where(eq(mailMessages.workspaceId, params.workspaceId));
    return {
      importedCount: 0,
      updatedCount: 0,
      threadsCount: Number(threadsTotalResult?.value ?? 0),
      messagesCount: Number(messagesTotalResult?.value ?? 0),
    };
  }

  const threadIds = Array.from(new Set(metadata.map((item) => item.threadId)));
  const existingThreads = await db
    .select({
      id: mailThreads.id,
      providerThreadId: mailThreads.providerThreadId,
    })
    .from(mailThreads)
    .where(
      and(
        eq(mailThreads.workspaceId, params.workspaceId),
        eq(mailThreads.userId, params.userId),
        inArray(mailThreads.providerThreadId, threadIds),
      ),
    );
  const threadIdByProviderId = new Map(
    existingThreads.map((item) => [item.providerThreadId, item.id]),
  );

  const metadataByThread = new Map<string, GmailMessageMetadata>();
  for (const item of metadata) {
    if (!metadataByThread.has(item.threadId)) {
      metadataByThread.set(item.threadId, item);
    }
  }

  for (const providerThreadId of threadIds) {
    if (threadIdByProviderId.has(providerThreadId)) continue;
    const source = metadataByThread.get(providerThreadId);
    const [createdThread] = await db
      .insert(mailThreads)
      .values({
        workspaceId: params.workspaceId,
        userId: params.userId,
        providerThreadId,
        subject: source?.subject ?? null,
      })
      .returning({ id: mailThreads.id, providerThreadId: mailThreads.providerThreadId });
    if (createdThread) {
      threadIdByProviderId.set(createdThread.providerThreadId, createdThread.id);
    }
  }

  const messageIds = metadata.map((item) => item.id);
  const existingMessages = await db
    .select({
      id: mailMessages.id,
      providerMessageId: mailMessages.providerMessageId,
    })
    .from(mailMessages)
    .where(
      and(
        eq(mailMessages.workspaceId, params.workspaceId),
        eq(mailMessages.userId, params.userId),
        inArray(mailMessages.providerMessageId, messageIds),
      ),
    );
  const messageIdByProviderId = new Map(
    existingMessages.map((item) => [item.providerMessageId, item.id]),
  );

  let importedCount = 0;
  let updatedCount = 0;

  for (const item of metadata) {
    const threadDbId = threadIdByProviderId.get(item.threadId);
    if (!threadDbId) continue;

    const messagePayload = {
      workspaceId: params.workspaceId,
      userId: params.userId,
      mailThreadId: threadDbId,
      providerMessageId: item.id,
      fromJson: item.from,
      toJson: item.to,
      ccJson: item.cc,
      subject: item.subject,
      snippet: item.snippet,
      direction: 'inbound' as const,
      isUnread: item.isUnread,
      hasAttachments: item.hasAttachments,
      labelsJson: item.labels,
      webUrl: item.webUrl,
      sentAt: item.sentAt,
      importedAt: new Date(),
    };

    const existingMessageId = messageIdByProviderId.get(item.id);
    if (existingMessageId) {
      await db
        .update(mailMessages)
        .set(messagePayload)
        .where(eq(mailMessages.id, existingMessageId));
      updatedCount += 1;
      continue;
    }

    const [createdMessage] = await db
      .insert(mailMessages)
      .values(messagePayload)
      .returning({ id: mailMessages.id });
    if (createdMessage) {
      importedCount += 1;
      await db.insert(mailActionStates).values({
        workspaceId: params.workspaceId,
        userId: params.userId,
        mailMessageId: createdMessage.id,
        triageStatus: 'new',
      });
    }
  }

  const [threadsTotalResult] = await db
    .select({ value: count(mailThreads.id) })
    .from(mailThreads)
    .where(eq(mailThreads.workspaceId, params.workspaceId));
  const [messagesTotalResult] = await db
    .select({ value: count(mailMessages.id) })
    .from(mailMessages)
    .where(eq(mailMessages.workspaceId, params.workspaceId));

  return {
    importedCount,
    updatedCount,
    threadsCount: Number(threadsTotalResult?.value ?? 0),
    messagesCount: Number(messagesTotalResult?.value ?? 0),
  };
}
