import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db';
import {
  reminderChannelEnum,
  reminderStatusEnum,
  reminders,
} from '@lifeos/db';
import { resolveRequestContext } from './_request-context';

export const reminderRoutes = new Hono();

const createReminderSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    note: z.string().max(5000).optional(),
    remindAt: z.coerce.date(),
    taskId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    status: z.enum(reminderStatusEnum.enumValues).optional(),
    channel: z.enum(reminderChannelEnum.enumValues).optional(),
    isSnoozed: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.taskId || value.eventId), {
    message: 'Either taskId or eventId must be provided',
    path: ['taskId'],
  });

const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  note: z.string().max(5000).nullable().optional(),
  remindAt: z.coerce.date().optional(),
  status: z.enum(reminderStatusEnum.enumValues).optional(),
  channel: z.enum(reminderChannelEnum.enumValues).optional(),
  isSnoozed: z.boolean().optional(),
});

reminderRoutes.get('/', async (c) => {
  const context = await resolveRequestContext(c.req.raw, { allowFallback: true });
  if (!context) {
    return c.json({ items: [] });
  }

  const onlyUpcoming = c.req.query('upcoming') !== 'false';
  const now = new Date();

  const whereClause = onlyUpcoming
    ? and(
        eq(reminders.workspaceId, context.workspaceId),
        eq(reminders.userId, context.userId),
        gte(reminders.remindAt, now),
      )
    : and(
        eq(reminders.workspaceId, context.workspaceId),
        eq(reminders.userId, context.userId),
      );

  const items = await db
    .select()
    .from(reminders)
    .where(whereClause)
    .orderBy(onlyUpcoming ? asc(reminders.remindAt) : desc(reminders.createdAt))
    .limit(100);

  return c.json({ items });
});

reminderRoutes.post('/', zValidator('json', createReminderSchema), async (c) => {
  const context = await resolveRequestContext(c.req.raw, { allowFallback: true });
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const payload = c.req.valid('json');

  const [createdReminder] = await db
    .insert(reminders)
    .values({
      workspaceId: context.workspaceId,
      userId: context.userId,
      taskId: payload.taskId,
      eventId: payload.eventId,
      title: payload.title,
      note: payload.note,
      remindAt: payload.remindAt,
      status: payload.status ?? 'pending',
      channel: payload.channel ?? 'in_app',
      isSnoozed: payload.isSnoozed ?? false,
    })
    .returning();

  if (!createdReminder) {
    return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create reminder' }, 500);
  }

  return c.json(createdReminder, 201);
});

reminderRoutes.patch('/:id', zValidator('json', updateReminderSchema), async (c) => {
  const context = await resolveRequestContext(c.req.raw, { allowFallback: true });
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const payload = c.req.valid('json');

  const [updatedReminder] = await db
    .update(reminders)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(reminders.id, id),
        eq(reminders.workspaceId, context.workspaceId),
        eq(reminders.userId, context.userId),
      ),
    )
    .returning();

  if (!updatedReminder) {
    return c.json({ code: 'NOT_FOUND', message: 'Reminder not found' }, 404);
  }

  return c.json(updatedReminder);
});
