import { Worker } from 'bullmq';
import { createDb } from '@lifeos/db';
import {
  externalAccounts,
  syncJobs,
  mailThreads,
  mailMessages,
  mailActionStates,
} from '@lifeos/db';
import { and, eq } from 'drizzle-orm';
import { decryptToken } from '@lifeos/auth';
import { getRecentMessagesMetadata } from '@lifeos/integrations-google';

const db = createDb(process.env.DATABASE_URL!);

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};

console.log('LifeOS Worker starting...');

const mailSyncWorker = new Worker(
  'mail-sync',
  async (job) => {
    const { syncJobId, userId, workspaceId, externalAccountId } = job.data as {
      syncJobId: string;
      userId: string;
      workspaceId: string;
      externalAccountId: string;
    };

    console.log(`Processing mail-sync job ${job.id} for user ${userId}`);

    try {
      const extAccount = await db.query.externalAccounts.findFirst({
        where: eq(externalAccounts.id, externalAccountId),
      });

      if (!extAccount?.accessTokenEncrypted) {
        throw new Error('External account or token missing');
      }

      await db
        .update(syncJobs)
        .set({ status: 'processing', startedAt: new Date() })
        .where(eq(syncJobs.id, syncJobId));

      const accessToken = decryptToken(extAccount.accessTokenEncrypted);
      const messages = await getRecentMessagesMetadata(accessToken, 30, 'in:inbox');

      console.log(`Fetched ${messages.length} messages for user ${userId}. Saving...`);

      for (const msg of messages) {
        const existingThread = await db.query.mailThreads.findFirst({
          where: and(
            eq(mailThreads.userId, userId),
            eq(mailThreads.providerThreadId, msg.threadId),
          ),
        });

        let threadId: string;
        if (existingThread) {
          threadId = existingThread.id;
          await db
            .update(mailThreads)
            .set({
              subject: msg.subject,
              updatedAt: new Date(),
            })
            .where(eq(mailThreads.id, existingThread.id));
        } else {
          const [thread] = await db
            .insert(mailThreads)
            .values({
              workspaceId,
              userId,
              providerThreadId: msg.threadId,
              subject: msg.subject,
            })
            .returning();

          if (!thread) {
            throw new Error(`Failed to create thread ${msg.threadId}`);
          }
          threadId = thread.id;
        }

        const existingMessage = await db.query.mailMessages.findFirst({
          where: and(
            eq(mailMessages.userId, userId),
            eq(mailMessages.providerMessageId, msg.id),
          ),
        });

        let messageId: string;
        if (existingMessage) {
          messageId = existingMessage.id;
          await db
            .update(mailMessages)
            .set({
              mailThreadId: threadId,
              fromJson: msg.from,
              toJson: msg.to,
              ccJson: msg.cc,
              subject: msg.subject,
              snippet: msg.snippet,
              isUnread: msg.isUnread,
              hasAttachments: msg.hasAttachments,
              labelsJson: msg.labels,
              webUrl: msg.webUrl,
              sentAt: msg.sentAt,
            })
            .where(eq(mailMessages.id, existingMessage.id));
        } else {
          const [createdMessage] = await db
            .insert(mailMessages)
            .values({
              workspaceId,
              userId,
              mailThreadId: threadId,
              providerMessageId: msg.id,
              fromJson: msg.from,
              toJson: msg.to,
              ccJson: msg.cc,
              subject: msg.subject,
              snippet: msg.snippet,
              isUnread: msg.isUnread,
              hasAttachments: msg.hasAttachments,
              labelsJson: msg.labels,
              webUrl: msg.webUrl,
              sentAt: msg.sentAt,
            })
            .returning();

          if (!createdMessage) {
            throw new Error(`Failed to create message ${msg.id}`);
          }
          messageId = createdMessage.id;
        }

        const actionState = await db.query.mailActionStates.findFirst({
          where: and(
            eq(mailActionStates.userId, userId),
            eq(mailActionStates.mailMessageId, messageId),
          ),
        });

        if (!actionState) {
          await db.insert(mailActionStates).values({
            workspaceId,
            userId,
            mailMessageId: messageId,
            triageStatus: 'new',
          });
        }
      }

      await db
        .update(syncJobs)
        .set({ status: 'success', finishedAt: new Date() })
        .where(eq(syncJobs.id, syncJobId));

      console.log(`Successfully synced mail for user ${userId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail sync error';
      console.error(`Mail sync failed for user ${userId}: ${message}`);

      await db
        .update(syncJobs)
        .set({ status: 'failed', errorMessage: message, finishedAt: new Date() })
        .where(eq(syncJobs.id, syncJobId));

      throw error;
    }
  },
  { connection },
);

mailSyncWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

console.log('Mail Sync Worker is listening for jobs.');
