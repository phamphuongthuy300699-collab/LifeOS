import { Hono } from 'hono';
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  notInArray,
  or,
} from 'drizzle-orm';
import {
  events,
  inboxItems,
  mailMessages,
  notes,
  taskRelations_table,
  tasks,
} from '@lifeos/db';
import { db } from '../config/db';
import { resolveStrictRequestContext } from './_request-context';

export type InboxUnifiedItemType = 'email' | 'task' | 'capture' | 'note' | 'event';

export type InboxSourceProvider =
  | 'google'
  | 'gmail'
  | 'yandex'
  | 'manual'
  | 'voice'
  | 'note'
  | 'inbox'
  | 'calendar'
  | 'unknown';

export type InboxUnifiedItem = {
  id: string;
  type: InboxUnifiedItemType;
  title: string;
  subtitle?: string;
  snippet?: string;
  sourceProvider?: InboxSourceProvider;
  status: string;
  priority?: string;
  dueAt?: string;
  scheduledAt?: string;
  createdAt: string;
  receivedAt?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  linkedMilestoneId?: string;
  sourceRefType?: string;
  sourceRefId?: string;
  metadata?: Record<string, unknown>;
};

export const inboxHubRoutes = new Hono();

const SEGMENT_TO_TYPE = ['all', 'email', 'task', 'note', 'event', 'capture', 'snoozed'] as const;
type InboxQueryType = (typeof SEGMENT_TO_TYPE)[number];

function isInboxQueryType(value: string | undefined): value is InboxQueryType {
  return Boolean(value && SEGMENT_TO_TYPE.includes(value as InboxQueryType));
}

function parseCursor(cursor: string | undefined): number | null {
  if (!cursor) return null;
  const parsed = new Date(cursor).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function sortTimestamp(item: InboxUnifiedItem): number {
  const primary = item.receivedAt ?? item.createdAt;
  const parsed = new Date(primary).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function mapTaskSourceProvider(sourceType: string | null | undefined): InboxSourceProvider {
  if (!sourceType) return 'manual';
  if (sourceType === 'email') return 'gmail';
  if (sourceType === 'voice') return 'voice';
  if (sourceType === 'inbox') return 'inbox';
  if (sourceType === 'manual') return 'manual';
  return 'unknown';
}

function mapEventProvider(calendarRef: string | null | undefined): InboxSourceProvider {
  if (!calendarRef) return 'calendar';
  const lowered = calendarRef.toLowerCase();
  if (lowered.includes('google')) return 'google';
  if (lowered.includes('yandex')) return 'yandex';
  return 'calendar';
}

inboxHubRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const { workspaceId, userId } = context;

  const requestedTypeRaw = c.req.query('type');
  const requestedType: InboxQueryType = isInboxQueryType(requestedTypeRaw)
    ? requestedTypeRaw
    : 'all';
  const requestedStatus = c.req.query('status') ?? null;
  const requestedSourceProvider = (c.req.query('sourceProvider') ?? null) as
    | InboxSourceProvider
    | null;

  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 30) || 30, 1), 100);
  const cursorMillis = parseCursor(c.req.query('cursor'));

  const candidateLimit = Math.min(Math.max(limit * 4, 60), 240);

  const [mailRows, taskRows, captureRows, noteRows, eventRows] = await Promise.all([
    db.query.mailMessages.findMany({
      where: and(
        eq(mailMessages.workspaceId, workspaceId),
        eq(mailMessages.userId, userId),
      ),
      with: { actionStates: true },
      orderBy: [desc(mailMessages.sentAt)],
      limit: candidateLimit,
    }),
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.userId, userId),
          notInArray(tasks.status, ['done', 'cancelled']),
          or(
            eq(tasks.status, 'inbox'),
            and(
              isNull(tasks.dueAt),
              isNull(tasks.scheduledStartAt),
              isNull(tasks.projectId),
            ),
            and(
              inArray(tasks.sourceType, ['inbox', 'email', 'voice']),
              isNull(tasks.dueAt),
              isNull(tasks.scheduledStartAt),
            ),
          ),
        ),
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(candidateLimit),
    db
      .select()
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.workspaceId, workspaceId),
          eq(inboxItems.userId, userId),
          eq(inboxItems.status, 'pending'),
        ),
      )
      .orderBy(desc(inboxItems.capturedAt))
      .limit(candidateLimit),
    db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.workspaceId, workspaceId),
          eq(notes.userId, userId),
          isNull(notes.archivedAt),
          or(
            eq(notes.sourceType, 'voice'),
            eq(notes.sourceType, 'manual'),
            eq(notes.sourceType, 'inbox'),
          ),
        ),
      )
      .orderBy(desc(notes.updatedAt))
      .limit(candidateLimit),
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.workspaceId, workspaceId),
          eq(events.userId, userId),
          eq(events.status, 'tentative'),
        ),
      )
      .orderBy(desc(events.startAt))
      .limit(candidateLimit),
  ]);

  const noteIds = noteRows.map((note) => note.id);
  const linkedTaskSourceRows =
    noteIds.length > 0
      ? await db
          .select({ sourceRefId: tasks.sourceRefId })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.userId, userId),
              eq(tasks.sourceRefType, 'note'),
              inArray(tasks.sourceRefId, noteIds),
            ),
          )
      : [];

  const linkedTaskRelationRows =
    noteIds.length > 0
      ? await db
          .select({ relatedEntityId: taskRelations_table.relatedEntityId })
          .from(taskRelations_table)
          .innerJoin(tasks, eq(taskRelations_table.taskId, tasks.id))
          .where(
            and(
              eq(taskRelations_table.relatedEntityType, 'note'),
              inArray(taskRelations_table.relatedEntityId, noteIds),
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.userId, userId),
            ),
          )
      : [];

  const noteIdsWithLinkedTasks = new Set(
    linkedTaskSourceRows
      .map((row) => row.sourceRefId)
      .filter((id): id is string => Boolean(id)),
  );
  for (const row of linkedTaskRelationRows) {
    if (row.relatedEntityId) {
      noteIdsWithLinkedTasks.add(row.relatedEntityId);
    }
  }

  const emailItems = mailRows
    .map((message) => {
      const latestState = message.actionStates[0];
      const triageStatus = latestState?.triageStatus ?? (message.isUnread ? 'new' : 'reference');

      if (['done', 'ignored'].includes(triageStatus)) return null;

      return {
        id: message.id,
        type: 'email',
        title: message.subject || '(No subject)',
        subtitle:
          (message.fromJson as { name?: string; email?: string } | null)?.name ||
          (message.fromJson as { email?: string } | null)?.email ||
          'Unknown sender',
        snippet: message.snippet ?? undefined,
        sourceProvider: 'gmail',
        status: triageStatus,
        createdAt: toIso(message.importedAt),
        receivedAt: toIso(message.sentAt),
        linkedTaskId: latestState?.linkedTaskId ?? undefined,
        sourceRefType: 'mail_message',
        sourceRefId: message.id,
        metadata: {
          isUnread: message.isUnread,
          webUrl: message.webUrl,
        },
      } satisfies InboxUnifiedItem;
    })
    .filter((item) => item !== null) as InboxUnifiedItem[];

  const taskItems: InboxUnifiedItem[] = taskRows.map((task) => ({
    id: task.id,
    type: 'task',
    title: task.title,
    subtitle: task.description?.slice(0, 120) || undefined,
    snippet: task.description?.slice(0, 200) || undefined,
    sourceProvider: mapTaskSourceProvider(task.sourceType),
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt ? toIso(task.dueAt) : undefined,
    scheduledAt: task.scheduledStartAt ? toIso(task.scheduledStartAt) : undefined,
    createdAt: toIso(task.createdAt),
    linkedProjectId: task.projectId ?? undefined,
    sourceRefType: task.sourceRefType ?? undefined,
    sourceRefId: task.sourceRefId ?? undefined,
    metadata: {
      sourceType: task.sourceType,
      parentTaskId: task.parentTaskId,
    },
  }));

  const captureItems: InboxUnifiedItem[] = captureRows.map((capture) => ({
    id: capture.id,
    type: 'capture',
    title: capture.title || 'Quick capture',
    subtitle: capture.captureChannel,
    snippet: capture.rawText || capture.normalizedText || undefined,
    sourceProvider:
      capture.sourceType === 'voice'
        ? 'voice'
        : capture.sourceType === 'manual'
          ? 'manual'
          : capture.sourceType === 'email'
            ? 'gmail'
            : 'inbox',
    status: capture.status,
    createdAt: toIso(capture.capturedAt),
    sourceRefType: capture.sourceRefType ?? undefined,
    sourceRefId: capture.sourceRefId ?? undefined,
    metadata: {
      captureChannel: capture.captureChannel,
      createdEntityType: capture.createdEntityType,
      createdEntityId: capture.createdEntityId,
    },
  }));

  const noteItems: InboxUnifiedItem[] = noteRows
    .filter((note) => !noteIdsWithLinkedTasks.has(note.id))
    .map((note) => ({
      id: note.id,
      type: 'note',
      title: note.title || 'Untitled note',
      subtitle: note.noteType,
      snippet: note.bodyMarkdown?.slice(0, 200) || undefined,
      sourceProvider:
        note.sourceType === 'voice'
          ? 'voice'
          : note.sourceType === 'inbox'
            ? 'inbox'
            : note.sourceType === 'manual'
              ? 'note'
              : 'note',
      status: 'needs_action',
      createdAt: toIso(note.createdAt),
      sourceRefType: note.sourceRefType ?? undefined,
      sourceRefId: note.sourceRefId ?? undefined,
      metadata: {
        noteType: note.noteType,
        createdFromInboxItemId: note.createdFromInboxItemId,
      },
    }));

  const eventItems: InboxUnifiedItem[] = eventRows.map((event) => ({
    id: event.id,
    type: 'event',
    title: event.title,
    subtitle: event.location || undefined,
    snippet: event.description || undefined,
    sourceProvider: mapEventProvider(event.calendarRef),
    status: event.status,
    scheduledAt: toIso(event.startAt),
    createdAt: toIso(event.createdAt),
    sourceRefType: 'event',
    sourceRefId: event.id,
  }));

  const allItemsRaw = [
    ...emailItems,
    ...taskItems,
    ...captureItems,
    ...noteItems,
    ...eventItems,
  ];

  const counts = {
    all: allItemsRaw.length,
    email: emailItems.length,
    task: taskItems.length,
    capture: captureItems.length,
    note: noteItems.length,
    event: eventItems.length,
    snoozed: allItemsRaw.filter((item) => item.status === 'snoozed').length,
  };

  const filteredByType = allItemsRaw.filter((item) => {
    if (requestedType === 'all') return true;
    if (requestedType === 'snoozed') return item.status === 'snoozed';
    return item.type === requestedType;
  });

  const filteredByStatus = requestedStatus
    ? filteredByType.filter((item) => item.status === requestedStatus)
    : filteredByType;

  const filteredByProvider = requestedSourceProvider
    ? filteredByStatus.filter((item) => item.sourceProvider === requestedSourceProvider)
    : filteredByStatus;

  const filteredByCursor =
    cursorMillis !== null
      ? filteredByProvider.filter((item) => sortTimestamp(item) < cursorMillis)
      : filteredByProvider;

  const sortedItems = filteredByCursor.sort((a, b) => sortTimestamp(b) - sortTimestamp(a));

  const pageItems = sortedItems.slice(0, limit);
  const hasMore = sortedItems.length > limit;
  const nextCursor = hasMore && pageItems.length > 0
    ? pageItems[pageItems.length - 1]?.receivedAt ?? pageItems[pageItems.length - 1]?.createdAt
    : null;

  return c.json({
    items: pageItems,
    counts,
    filters: {
      type: requestedType,
      status: requestedStatus,
      sourceProvider: requestedSourceProvider,
    },
    page: {
      limit,
      cursor: c.req.query('cursor') ?? null,
      hasMore,
      nextCursor,
    },
  });
});
