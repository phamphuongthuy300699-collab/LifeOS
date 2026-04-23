import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../config/db';
import { events } from '@lifeos/db';
import { createEventSchema, updateEventSchema } from '@lifeos/domain-calendar';
import { eq, desc } from 'drizzle-orm';

export const eventRoutes = new Hono();

// GET /events — list events (simple fetch all for now, in future add date range filters)
eventRoutes.get('/', async (c) => {
  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.startAt));
  
  return c.json({ items: allEvents });
});

// POST /events — create event
eventRoutes.post('/', zValidator('json', createEventSchema), async (c) => {
  const data = c.req.valid('json');

  const [newEvent] = await db.insert(events).values({
    workspaceId: '00000000-0000-0000-0000-000000000000', // placeholder
    userId: '00000000-0000-0000-0000-000000000000', // placeholder
    title: data.title,
    description: data.description,
    location: data.location,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    isAllDay: data.isAllDay,
    status: data.status,
  }).returning();

  return c.json(newEvent, 201);
});

// GET /events/:id
eventRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) return c.json({ code: 'NOT_FOUND', message: 'Event not found' }, 404);
  return c.json(event);
});

// PATCH /events/:id
eventRoutes.patch('/:id', zValidator('json', updateEventSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updatedEvent] = await db.update(events).set({
    ...data,
    startAt: data.startAt ? new Date(data.startAt) : undefined,
    endAt: data.endAt ? new Date(data.endAt) : undefined,
    updatedAt: new Date(),
  }).where(eq(events.id, id)).returning();

  if (!updatedEvent) return c.json({ code: 'NOT_FOUND', message: 'Event not found' }, 404);
  return c.json(updatedEvent);
});
