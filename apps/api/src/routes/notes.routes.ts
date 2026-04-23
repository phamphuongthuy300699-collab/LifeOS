import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../config/db';
import { notes } from '@lifeos/db';
import { createNoteSchema, updateNoteSchema } from '@lifeos/domain-notes';
import { eq, desc } from 'drizzle-orm';

export const noteRoutes = new Hono();

// GET /notes — list notes
noteRoutes.get('/', async (c) => {
  const allNotes = await db
    .select()
    .from(notes)
    .orderBy(desc(notes.createdAt));
  
  return c.json({ items: allNotes });
});

// POST /notes — create a note
noteRoutes.post('/', zValidator('json', createNoteSchema), async (c) => {
  const data = c.req.valid('json');

  const [newNote] = await db.insert(notes).values({
    workspaceId: '00000000-0000-0000-0000-000000000000', // placeholder
    userId: '00000000-0000-0000-0000-000000000000', // placeholder
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
  const id = c.req.param('id');
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  
  if (!note) return c.json({ code: 'NOT_FOUND', message: 'Note not found' }, 404);
  
  return c.json(note);
});

// PATCH /notes/:id — update note
noteRoutes.patch('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updatedNote] = await db.update(notes).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(notes.id, id)).returning();

  if (!updatedNote) return c.json({ code: 'NOT_FOUND', message: 'Note not found' }, 404);

  return c.json(updatedNote);
});
