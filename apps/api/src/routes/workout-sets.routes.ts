import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import {
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@lifeos/db';
import { updateWorkoutSetSchema } from '@lifeos/domain-workouts';
import { db } from '../config/db';
import { resolveWorkoutContext } from './_workout-context';

export const workoutSetRoutes = new Hono();

/**
 * PATCH /api/v1/workout-sets/:id
 * Updates one set in scope of current user's workout sessions.
 */
workoutSetRoutes.patch(
  '/:id',
  zValidator('json', updateWorkoutSetSchema),
  async (c) => {
    const context = await resolveWorkoutContext(c.req.header('x-user-id'));
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const setId = c.req.param('id');
    const data = c.req.valid('json');

    const hasUpdates =
      data.weightValue !== undefined ||
      data.repsCount !== undefined ||
      data.durationSeconds !== undefined ||
      data.distanceMeters !== undefined ||
      data.rpe !== undefined ||
      data.rir !== undefined ||
      data.isWarmup !== undefined ||
      data.isCompleted !== undefined ||
      data.completedAt !== undefined;

    if (!hasUpdates) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    const [ownedSet] = await db
      .select({
        setId: workoutSets.id,
        sessionId: workoutSessions.id,
      })
      .from(workoutSets)
      .innerJoin(
        workoutSessionExercises,
        eq(workoutSets.workoutSessionExerciseId, workoutSessionExercises.id),
      )
      .innerJoin(
        workoutSessions,
        eq(workoutSessionExercises.workoutSessionId, workoutSessions.id),
      )
      .where(
        and(
          eq(workoutSets.id, setId),
          eq(workoutSessions.workspaceId, workspaceId),
          eq(workoutSessions.userId, userId),
        ),
      )
      .limit(1);

    if (!ownedSet) {
      return c.json({ error: 'Workout set not found' }, 404);
    }

    const computedCompletedAt =
      data.completedAt !== undefined
        ? data.completedAt === null
          ? null
          : new Date(data.completedAt)
        : data.isCompleted === true
          ? new Date()
          : data.isCompleted === false
            ? null
            : undefined;

    const [updatedSet] = await db
      .update(workoutSets)
      .set({
        weightValue:
          data.weightValue === undefined
            ? undefined
            : data.weightValue === null
              ? null
              : data.weightValue.toString(),
        repsCount:
          data.repsCount === undefined
            ? undefined
            : data.repsCount === null
              ? null
              : data.repsCount,
        durationSeconds:
          data.durationSeconds === undefined
            ? undefined
            : data.durationSeconds === null
              ? null
              : data.durationSeconds,
        distanceMeters:
          data.distanceMeters === undefined
            ? undefined
            : data.distanceMeters === null
              ? null
              : data.distanceMeters,
        rpe:
          data.rpe === undefined
            ? undefined
            : data.rpe === null
              ? null
              : data.rpe,
        rir:
          data.rir === undefined
            ? undefined
            : data.rir === null
              ? null
              : data.rir,
        isWarmup: data.isWarmup,
        isCompleted: data.isCompleted,
        completedAt: computedCompletedAt,
      })
      .where(eq(workoutSets.id, ownedSet.setId))
      .returning();

    await db
      .update(workoutSessions)
      .set({ updatedAt: new Date() })
      .where(eq(workoutSessions.id, ownedSet.sessionId));

    return c.json(updatedSet);
  },
);
