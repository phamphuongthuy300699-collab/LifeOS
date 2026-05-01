import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db';
import { events } from '@lifeos/db';
import { createEventSchema, updateEventSchema } from '@lifeos/domain-calendar';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { resolveStrictRequestContext } from './_request-context';
import { readJsonBodySafe } from './_safe-body';

export const eventRoutes = new Hono();

// GET /events — list events (supports optional date-range)
eventRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const fromQuery = c.req.query('from');
  const toQuery = c.req.query('to');

  const from = fromQuery ? new Date(fromQuery) : null;
  const to = toQuery ? new Date(toQuery) : null;

  const whereParts = [
    eq(events.workspaceId, context.workspaceId),
    eq(events.userId, context.userId),
  ];

  if (from && !Number.isNaN(from.getTime())) {
    whereParts.push(gte(events.startAt, from));
  }

  if (to && !Number.isNaN(to.getTime())) {
    whereParts.push(lte(events.startAt, to));
  }

  const allEvents = await db
    .select()
    .from(events)
    .where(and(...whereParts))
    .orderBy(asc(events.startAt), desc(events.createdAt));

  return c.json({ items: allEvents });
});

// POST /events — create event
eventRoutes.post('/', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  try {
    const context = await resolveStrictRequestContext(c.req.raw);
    if (!context) {
      return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context', requestId }, 401);
    }

    const bodyRead = await readJsonBodySafe(c.req.raw);
    const parsedPayload = createEventSchema.safeParse(bodyRead.body);

    if (!parsedPayload.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event payload',
          details: parsedPayload.error.issues,
          requestId,
        },
        400,
      );
    }

    const data = parsedPayload.data;

    const [newEvent] = await db
      .insert(events)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        title: data.title,
        description: data.description,
        location: data.location,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        isAllDay: data.isAllDay,
        status: data.status,
      })
      .returning();

    return c.json({ ...newEvent, requestId }, 201);
  } catch (error) {
    console.error('[events.create] failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      { code: 'EVENT_CREATE_FAILED', message: 'Failed to create event', requestId },
      500,
    );
  }
});

// GET /events/:id
eventRoutes.get('/:id', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.id, id),
        eq(events.workspaceId, context.workspaceId),
        eq(events.userId, context.userId),
      ),
    );
  if (!event) return c.json({ code: 'NOT_FOUND', message: 'Event not found' }, 404);
  return c.json(event);
});

// PATCH /events/:id
eventRoutes.patch('/:id', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  try {
    const context = await resolveStrictRequestContext(c.req.raw);
    if (!context) {
      return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context', requestId }, 401);
    }

    const id = c.req.param('id');
    const bodyRead = await readJsonBodySafe(c.req.raw);
    const parsedPayload = updateEventSchema.safeParse(bodyRead.body);

    if (!parsedPayload.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event update payload',
          details: parsedPayload.error.issues,
          requestId,
        },
        400,
      );
    }

    const data = parsedPayload.data;

    const [updatedEvent] = await db
      .update(events)
      .set({
        ...data,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(events.id, id),
          eq(events.workspaceId, context.workspaceId),
          eq(events.userId, context.userId),
        ),
      )
      .returning();

    if (!updatedEvent) {
      return c.json({ code: 'NOT_FOUND', message: 'Event not found', requestId }, 404);
    }

    return c.json({ ...updatedEvent, requestId });
  } catch (error) {
    console.error('[events.update] failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      { code: 'EVENT_UPDATE_FAILED', message: 'Failed to update event', requestId },
      500,
    );
  }
});
