import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, eq, contacts } from '@lifeos/db';
import { createContactSchema, updateContactSchema } from '@lifeos/domain-contacts';
import { db } from '../config/db';
import { resolveGrowthContext } from './_growth-context';

export const contactRoutes = new Hono();
type ContactInsert = typeof contacts.$inferInsert;

contactRoutes.get('/', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ items: [] });

  const { workspaceId, userId } = context;
  const items = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.userId, userId)))
    .orderBy(asc(contacts.displayName));

  return c.json({ items });
});

contactRoutes.post('/', zValidator('json', createContactSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const [created] = await db
    .insert(contacts)
    .values({
      workspaceId,
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      company: data.company,
      roleTitle: data.roleTitle,
      primaryEmail: data.primaryEmail,
      primaryPhone: data.primaryPhone,
      shortProfile: data.shortProfile,
      notesMarkdown: data.notesMarkdown,
      lastInteractionAt: data.lastInteractionAt ? new Date(data.lastInteractionAt) : undefined,
      sourceType: data.sourceType,
      externalProviderId: data.externalProviderId,
    } as ContactInsert)
    .returning();

  return c.json(created, 201);
});

contactRoutes.get('/:id', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');

  const [item] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.workspaceId, workspaceId), eq(contacts.userId, userId)))
    .limit(1);

  if (!item) return c.json({ error: 'Contact not found' }, 404);
  return c.json(item);
});

contactRoutes.patch('/:id', zValidator('json', updateContactSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updated] = await db
    .update(contacts)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      company: data.company,
      roleTitle: data.roleTitle,
      primaryEmail: data.primaryEmail,
      primaryPhone: data.primaryPhone,
      shortProfile: data.shortProfile,
      notesMarkdown: data.notesMarkdown,
      lastInteractionAt:
        data.lastInteractionAt === undefined
          ? undefined
          : data.lastInteractionAt === null
            ? null
            : new Date(data.lastInteractionAt),
      sourceType: data.sourceType,
      externalProviderId: data.externalProviderId,
      updatedAt: new Date(),
    } as Partial<ContactInsert>)
    .where(and(eq(contacts.id, id), eq(contacts.workspaceId, workspaceId), eq(contacts.userId, userId)))
    .returning();

  if (!updated) return c.json({ error: 'Contact not found' }, 404);
  return c.json(updated);
});
