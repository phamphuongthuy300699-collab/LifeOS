import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../config/db';
import { inboxItems, tasks, notes } from '@lifeos/db';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { InboxStatus, TriageTargetType } from '@lifeos/shared';
import { resolveStrictRequestContext } from './_request-context';

export const inboxRoutes = new Hono();

const createInboxItemSchema = z.object({
  rawText: z.string().min(1).max(5000),
  captureChannel: z.enum(['quick_add', 'voice', 'email_forward', 'api']).optional().default('quick_add'),
});

const updateInboxItemSchema = z.object({
  status: z.enum(InboxStatus).optional(),
  title: z.string().optional(),
  rawText: z.string().optional(),
});

const triageInboxItemSchema = z.object({
  targetType: z.enum(TriageTargetType),
  title: z.string().min(1),
  body: z.string().optional(),
});

// GET /inbox-items — list pending inbox items
inboxRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const items = await db
    .select()
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.workspaceId, context.workspaceId),
        eq(inboxItems.userId, context.userId),
        eq(inboxItems.status, 'pending'),
      ),
    )
    .orderBy(desc(inboxItems.capturedAt));
  
  return c.json({ items });
});

// POST /inbox-items — create an inbox item
inboxRoutes.post('/', zValidator('json', createInboxItemSchema), async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const data = c.req.valid('json');

  const [newItem] = await db.insert(inboxItems).values({
    workspaceId: context.workspaceId,
    userId: context.userId,
    rawText: data.rawText,
    captureChannel: data.captureChannel,
  }).returning();

  return c.json(newItem, 201);
});

// PATCH /inbox-items/:id - generic update
inboxRoutes.patch('/:id', zValidator('json', updateInboxItemSchema), async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updatedItem] = await db.update(inboxItems)
    .set(data)
    .where(
      and(
        eq(inboxItems.id, id),
        eq(inboxItems.workspaceId, context.workspaceId),
        eq(inboxItems.userId, context.userId),
      ),
    )
    .returning();

  if (!updatedItem) return c.json({ code: 'NOT_FOUND', message: 'Item not found' }, 404);
  return c.json(updatedItem);
});

// POST /inbox-items/:id/triage — convert inbox item
inboxRoutes.post('/:id/triage', zValidator('json', triageInboxItemSchema), async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const { targetType, title, body } = c.req.valid('json');

  // Verify item exists
  const [item] = await db
    .select()
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.id, id),
        eq(inboxItems.workspaceId, context.workspaceId),
        eq(inboxItems.userId, context.userId),
      ),
    );
  if (!item) return c.json({ code: 'NOT_FOUND', message: 'Item not found' }, 404);
  if (item.status !== 'pending') return c.json({ code: 'ALREADY_TRIAGED', message: 'Item is already triaged or archived' }, 400);

  let createdEntityId: string;

  // Implement simple switch for task / note
  // Later we'll integrate the domain layer triage use-case with ITriageHandler
  if (targetType === 'task') {
    const [newTask] = await db.insert(tasks).values({
      workspaceId: item.workspaceId,
      userId: item.userId,
      title: title,
      description: body || null,
      createdFromInboxItemId: id,
    }).returning();
    if (!newTask) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create task from inbox item' }, 500);
    }
    createdEntityId = newTask.id;
  } else if (targetType === 'note') {
    const [newNote] = await db.insert(notes).values({
      workspaceId: item.workspaceId,
      userId: item.userId,
      title: title,
      bodyMarkdown: body || '',
      createdFromInboxItemId: id,
    }).returning();
    if (!newNote) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create note from inbox item' }, 500);
    }
    createdEntityId = newNote.id;
  } else {
    // Unsupported type fallback
    // Could just mark as triaged without linking or return error
    return c.json({ code: 'NOT_IMPLEMENTED', message: `Target type ${targetType} handler not yet implemented` }, 501);
  }

  // Update original inbox item
  const [updatedItem] = await db.update(inboxItems).set({
    status: 'triaged',
    triagedAt: new Date(),
    createdEntityType: targetType,
    createdEntityId: createdEntityId,
  }).where(
    and(
      eq(inboxItems.id, id),
      eq(inboxItems.workspaceId, context.workspaceId),
      eq(inboxItems.userId, context.userId),
    ),
  ).returning();

  return c.json({
    inboxItem: updatedItem,
    createdEntityType: targetType,
    createdEntityId: createdEntityId,
  });
});
