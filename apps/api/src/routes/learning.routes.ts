import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  and,
  asc,
  desc,
  eq,
  learningMaterials,
  learningSessions,
  learningTracks,
} from '@lifeos/db';
import {
  createLearningMaterialSchema,
  createLearningSessionSchema,
  createLearningTrackSchema,
  updateLearningTrackSchema,
} from '@lifeos/domain-learning';
import { db } from '../config/db';
import { resolveGrowthContext } from './_growth-context';

export const learningRoutes = new Hono();

type LearningTrackInsert = typeof learningTracks.$inferInsert;
type LearningMaterialInsert = typeof learningMaterials.$inferInsert;
type LearningSessionInsert = typeof learningSessions.$inferInsert;

learningRoutes.get('/tracks', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ items: [] });

  const { workspaceId, userId } = context;
  const items = await db
    .select()
    .from(learningTracks)
    .where(and(eq(learningTracks.workspaceId, workspaceId), eq(learningTracks.userId, userId)))
    .orderBy(desc(learningTracks.updatedAt));

  return c.json({ items });
});

learningRoutes.post('/tracks', zValidator('json', createLearningTrackSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const [created] = await db
    .insert(learningTracks)
    .values({
      workspaceId,
      userId,
      name: data.name,
      description: data.description,
      status: data.status,
      goal: data.goal,
    } as LearningTrackInsert)
    .returning();

  return c.json(created, 201);
});

learningRoutes.patch('/tracks/:id', zValidator('json', updateLearningTrackSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updated] = await db
    .update(learningTracks)
    .set({
      name: data.name,
      description: data.description,
      status: data.status,
      goal: data.goal,
      updatedAt: new Date(),
    } as Partial<LearningTrackInsert>)
    .where(
      and(
        eq(learningTracks.id, id),
        eq(learningTracks.workspaceId, workspaceId),
        eq(learningTracks.userId, userId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: 'Learning track not found' }, 404);
  return c.json(updated);
});

learningRoutes.get('/materials', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ items: [] });

  const { workspaceId, userId } = context;
  const items = await db
    .select()
    .from(learningMaterials)
    .where(
      and(eq(learningMaterials.workspaceId, workspaceId), eq(learningMaterials.userId, userId)),
    )
    .orderBy(desc(learningMaterials.updatedAt));

  return c.json({ items });
});

learningRoutes.post(
  '/materials',
  zValidator('json', createLearningMaterialSchema),
  async (c) => {
    const context = await resolveGrowthContext(c.req.raw);
    if (!context) return c.json({ error: 'No workspace membership found' }, 403);

    const { workspaceId, userId } = context;
    const data = c.req.valid('json');

    const [created] = await db
      .insert(learningMaterials)
      .values({
        workspaceId,
        userId,
        learningTrackId: data.learningTrackId,
        topicId: data.topicId,
        title: data.title,
        materialType: data.materialType,
        url: data.url,
        status: data.status,
        estimateMinutes: data.estimateMinutes,
        metadataJson: data.metadataJson,
      } as LearningMaterialInsert)
      .returning();

    return c.json(created, 201);
  },
);

learningRoutes.post('/sessions', zValidator('json', createLearningSessionSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const [created] = await db
    .insert(learningSessions)
    .values({
      workspaceId,
      userId,
      learningTrackId: data.learningTrackId,
      materialId: data.materialId,
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      durationMinutes: data.durationMinutes,
      notes: data.notes,
    } as LearningSessionInsert)
    .returning();

  return c.json(created, 201);
});

learningRoutes.get('/sessions', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ items: [] });

  const { workspaceId, userId } = context;
  const items = await db
    .select()
    .from(learningSessions)
    .where(
      and(eq(learningSessions.workspaceId, workspaceId), eq(learningSessions.userId, userId)),
    )
    .orderBy(desc(learningSessions.startedAt), asc(learningSessions.createdAt));

  return c.json({ items });
});
