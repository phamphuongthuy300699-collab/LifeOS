import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../config/db';
import { notes } from '@lifeos/db';
import { createNoteSchema, updateNoteSchema } from '@lifeos/domain-notes';
import { and, desc, eq } from 'drizzle-orm';
import { resolveStrictRequestContext } from './_request-context';

export const noteRoutes = new Hono();

// GET /notes — list notes
noteRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const allNotes = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.workspaceId, context.workspaceId),
        eq(notes.userId, context.userId),
      ),
    )
    .orderBy(desc(notes.createdAt));
  
  return c.json({ items: allNotes });
});

// POST /notes — create a note
noteRoutes.post('/', zValidator('json', createNoteSchema), async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const data = c.req.valid('json');

  const [newNote] = await db.insert(notes).values({
    workspaceId: context.workspaceId,
    userId: context.userId,
    title: data.title,
    bodyMarkdown: data.bodyMarkdown,
    noteType: data.noteType,
    sourceType: data.sourceType,
    createdFromInboxItemId: data.createdFromInboxItemId,
  }).returning();

  return c.json(newNote, 201);
});

// GET /notes/:id — get a single note
noteRoutes.get('/:id', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const [note] = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.id, id),
        eq(notes.workspaceId, context.workspaceId),
        eq(notes.userId, context.userId),
      ),
    );
  
  if (!note) return c.json({ code: 'NOT_FOUND', message: 'Note not found' }, 404);
  
  return c.json(note);
});

// PATCH /notes/:id — update note
noteRoutes.patch('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unable to resolve user context' }, 401);
  }

  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updatedNote] = await db.update(notes).set({
    ...data,
    updatedAt: new Date(),
  })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.workspaceId, context.workspaceId),
        eq(notes.userId, context.userId),
      ),
    )
    .returning();

  if (!updatedNote) return c.json({ code: 'NOT_FOUND', message: 'Note not found' }, 404);

  return c.json(updatedNote);
});
