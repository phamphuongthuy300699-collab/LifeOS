import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, eq } from 'drizzle-orm';
import { exercises } from '@lifeos/db';
import {
  createExerciseSchema,
  updateExerciseSchema,
} from '@lifeos/domain-workouts';
import { db } from '../config/db';
import { resolveWorkoutContext } from './_workout-context';

export const exerciseRoutes = new Hono();

/**
 * GET /api/v1/exercises
 * Returns exercise library for current user/workspace.
 */
exerciseRoutes.get('/', async (c) => {
  const context = await resolveWorkoutContext(c.req.header('x-user-id'));
  if (!context) {
    return c.json({ items: [] });
  }

  const { workspaceId, userId } = context;

  const items = await db
    .select()
    .from(exercises)
    .where(
      and(eq(exercises.workspaceId, workspaceId), eq(exercises.userId, userId)),
    )
    .orderBy(asc(exercises.name));

  return c.json({ items });
});

/**
 * POST /api/v1/exercises
 * Creates an exercise for the current user/workspace.
 */
exerciseRoutes.post('/', zValidator('json', createExerciseSchema), async (c) => {
  const context = await resolveWorkoutContext(c.req.header('x-user-id'));
  if (!context) {
    return c.json({ error: 'No workspace membership found' }, 403);
  }

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const [createdExercise] = await db
    .insert(exercises)
    .values({
      workspaceId,
      userId,
      name: data.name,
      slug: data.slug,
      descriptionShort: data.descriptionShort,
      descriptionMarkdown: data.descriptionMarkdown,
      muscleGroupsJson: data.muscleGroups,
      equipmentJson: data.equipment,
      difficulty: data.difficulty,
      defaultVideoUrl: data.defaultVideoUrl,
      defaultRestSeconds: data.defaultRestSeconds,
      isCustom: data.isCustom,
    })
    .returning();

  return c.json(createdExercise, 201);
});

/**
 * PATCH /api/v1/exercises/:id
 * Updates an exercise in user/workspace scope.
 */
exerciseRoutes.patch(
  '/:id',
  zValidator('json', updateExerciseSchema),
  async (c) => {
    const context = await resolveWorkoutContext(c.req.header('x-user-id'));
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const exerciseId = c.req.param('id');
    const data = c.req.valid('json');

    const hasUpdates =
      data.name !== undefined ||
      data.slug !== undefined ||
      data.descriptionShort !== undefined ||
      data.descriptionMarkdown !== undefined ||
      data.muscleGroups !== undefined ||
      data.equipment !== undefined ||
      data.difficulty !== undefined ||
      data.defaultVideoUrl !== undefined ||
      data.defaultRestSeconds !== undefined ||
      data.isCustom !== undefined;

    if (!hasUpdates) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    const [updatedExercise] = await db
      .update(exercises)
      .set({
        name: data.name,
        slug: data.slug,
        descriptionShort: data.descriptionShort,
        descriptionMarkdown: data.descriptionMarkdown,
        muscleGroupsJson: data.muscleGroups,
        equipmentJson: data.equipment,
        difficulty: data.difficulty,
        defaultVideoUrl: data.defaultVideoUrl,
        defaultRestSeconds: data.defaultRestSeconds,
        isCustom: data.isCustom,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(exercises.id, exerciseId),
          eq(exercises.workspaceId, workspaceId),
          eq(exercises.userId, userId),
        ),
      )
      .returning();

    if (!updatedExercise) {
      return c.json({ error: 'Exercise not found' }, 404);
    }

    return c.json(updatedExercise);
  },
);
