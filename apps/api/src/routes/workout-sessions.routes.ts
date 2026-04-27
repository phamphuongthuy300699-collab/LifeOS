import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import {
  and,
  asc,
  desc,
  eq,
  exercises,
  inArray,
  workoutPlanExercises,
  workoutPlans,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@lifeos/db';
import {
  createWorkoutSessionSchema,
  createWorkoutSetSchema,
  type CreateWorkoutSessionExerciseDto,
  updateWorkoutSessionSchema,
} from '@lifeos/domain-workouts';
import { db } from '../config/db';
import { resolveWorkoutContext } from './_workout-context';

export const workoutSessionRoutes = new Hono();
type WorkoutSessionInsert = typeof workoutSessions.$inferInsert;
type WorkoutSessionExerciseInsert = typeof workoutSessionExercises.$inferInsert;
type WorkoutSetInsert = typeof workoutSets.$inferInsert;

/**
 * POST /api/v1/workout-sessions
 * Starts a workout session and optionally seeds session exercises.
 */
workoutSessionRoutes.post(
  '/',
  async (c) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    c.header('x-request-id', requestId);
    console.info('[workout-sessions.create] request started', { requestId });

    try {
      const context = await resolveWorkoutContext(c.req.raw);
      if (!context) {
        console.info('[workout-sessions.create] context missing', { requestId });
        return c.json({ error: 'No workspace membership found', requestId }, 403);
      }

      const { workspaceId, userId } = context;
      const payload = await c.req.json().catch(() => ({}));
      const parsedPayload = createWorkoutSessionSchema.safeParse(payload);
      if (!parsedPayload.success) {
        console.info('[workout-sessions.create] invalid payload', {
          requestId,
          issues: parsedPayload.error.issues,
          elapsedMs: Date.now() - startedAt,
        });
        return c.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid workout session payload',
            details: parsedPayload.error.issues,
            requestId,
          },
          400,
        );
      }
      const data = parsedPayload.data;
      console.info('[workout-sessions.create] context resolved', {
        requestId,
        userId,
        workspaceId,
        workoutPlanId: data.workoutPlanId ?? null,
      });

      const sessionPayload = {
        workspaceId,
        userId,
        workoutPlanId: data.workoutPlanId,
        startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
        sessionStatus: 'active',
        notes: data.notes,
        perceivedIntensity: data.perceivedIntensity,
      } as WorkoutSessionInsert;

      let seedExercises: CreateWorkoutSessionExerciseDto[] = data.exercises;

      if (data.workoutPlanId) {
        const [plan] = await db
          .select()
          .from(workoutPlans)
          .where(
            and(
              eq(workoutPlans.id, data.workoutPlanId),
              eq(workoutPlans.workspaceId, workspaceId),
              eq(workoutPlans.userId, userId),
            ),
          )
          .limit(1);

        console.info('[workout-sessions.create] plan lookup', {
          requestId,
          workoutPlanId: data.workoutPlanId,
          planFound: Boolean(plan),
        });

        if (!plan) {
          console.info('[workout-sessions.create] response sent', {
            requestId,
            status: 404,
            elapsedMs: Date.now() - startedAt,
          });
          return c.json({ error: 'Workout plan not found', requestId }, 404);
        }

        if (seedExercises.length === 0) {
          const planExercises = await db
            .select()
            .from(workoutPlanExercises)
            .where(eq(workoutPlanExercises.workoutPlanId, data.workoutPlanId))
            .orderBy(asc(workoutPlanExercises.orderIndex));

          console.info('[workout-sessions.create] plan exercises loaded', {
            requestId,
            count: planExercises.length,
          });

          seedExercises = planExercises.map((item) => ({
            exerciseId: item.exerciseId,
            orderIndex: item.orderIndex,
            targetSchemeJson: {
              targetSets: item.targetSets,
              targetReps: item.targetReps,
              targetWeight: item.targetWeight,
              targetRestSeconds: item.targetRestSeconds,
            },
          }));
        } else {
          console.info('[workout-sessions.create] seed exercises from payload', {
            requestId,
            count: seedExercises.length,
          });
        }
      }

      const createResult = await db.transaction(async (tx) => {
        const [session] = await tx
          .insert(workoutSessions)
          .values(sessionPayload)
          .returning();

        if (!session) {
          throw new Error('Failed to create workout session');
        }
        console.info('[workout-sessions.create] session inserted', {
          requestId,
          sessionId: session.id,
        });

        let sessionExercises: (typeof workoutSessionExercises.$inferSelect)[] = [];
        if (seedExercises.length > 0) {
          sessionExercises = await tx
            .insert(workoutSessionExercises)
            .values(
              seedExercises.map(
                (exercise, index) =>
                  ({
                    workoutSessionId: session.id,
                    exerciseId: exercise.exerciseId,
                    orderIndex: exercise.orderIndex ?? index,
                    targetSchemeJson: exercise.targetSchemeJson,
                    previousResultJson: exercise.previousResultJson,
                  }) as WorkoutSessionExerciseInsert,
              ),
            )
            .returning();
          console.info('[workout-sessions.create] session exercises inserted', {
            requestId,
            count: sessionExercises.length,
          });
        }

        return { session, sessionExercises };
      });

      console.info('[workout-sessions.create] response sent', {
        requestId,
        status: 201,
        elapsedMs: Date.now() - startedAt,
      });
      return c.json(
        {
          ...createResult.session,
          exercises: createResult.sessionExercises,
          requestId,
        },
        201,
      );
    } catch (error) {
      console.error('[workout-sessions.create] failed', {
        requestId,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(
        {
          code: 'WORKOUT_SESSION_CREATE_FAILED',
          message: 'Failed to start workout session',
          requestId,
        },
        500,
      );
    }
  },
);

/**
 * GET /api/v1/workout-sessions/:id
 * Returns a session with exercises and sets.
 */
workoutSessionRoutes.get('/:id', async (c) => {
  const context = await resolveWorkoutContext(c.req.raw);
  if (!context) {
    return c.json({ error: 'No workspace membership found' }, 403);
  }

  const { workspaceId, userId } = context;
  const sessionId = c.req.param('id');

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.workspaceId, workspaceId),
        eq(workoutSessions.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    return c.json({ error: 'Workout session not found' }, 404);
  }

  const sessionExerciseRows = await db
    .select()
    .from(workoutSessionExercises)
    .where(eq(workoutSessionExercises.workoutSessionId, session.id))
    .orderBy(asc(workoutSessionExercises.orderIndex));

  const sessionExerciseIds = sessionExerciseRows.map((item) => item.id);

  let setRows: (typeof workoutSets.$inferSelect)[] = [];
  if (sessionExerciseIds.length > 0) {
    setRows = await db
      .select()
      .from(workoutSets)
      .where(inArray(workoutSets.workoutSessionExerciseId, sessionExerciseIds))
      .orderBy(
        asc(workoutSets.workoutSessionExerciseId),
        asc(workoutSets.setNumber),
      );
  }

  const exerciseIds = Array.from(
    new Set(sessionExerciseRows.map((item) => item.exerciseId)),
  );

  let exerciseRows: (typeof exercises.$inferSelect)[] = [];
  if (exerciseIds.length > 0) {
    exerciseRows = await db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.workspaceId, workspaceId),
          eq(exercises.userId, userId),
          inArray(exercises.id, exerciseIds),
        ),
      );
  }

  const exerciseById = new Map(exerciseRows.map((item) => [item.id, item]));

  const setsBySessionExerciseId = new Map<
    string,
    (typeof workoutSets.$inferSelect)[]
  >();
  for (const setRow of setRows) {
    const existing = setsBySessionExerciseId.get(setRow.workoutSessionExerciseId) ?? [];
    existing.push(setRow);
    setsBySessionExerciseId.set(setRow.workoutSessionExerciseId, existing);
  }

  const sessionExercises = sessionExerciseRows.map((item) => ({
    ...item,
    exercise: exerciseById.get(item.exerciseId) ?? null,
    sets: setsBySessionExerciseId.get(item.id) ?? [],
  }));

  return c.json({
    ...session,
    exercises: sessionExercises,
  });
});

/**
 * PATCH /api/v1/workout-sessions/:id
 * Updates session state.
 */
workoutSessionRoutes.patch(
  '/:id',
  zValidator('json', updateWorkoutSessionSchema),
  async (c) => {
    const context = await resolveWorkoutContext(c.req.raw);
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const sessionId = c.req.param('id');
    const data = c.req.valid('json');

    const hasUpdates =
      data.endedAt !== undefined ||
      data.sessionStatus !== undefined ||
      data.notes !== undefined ||
      data.perceivedIntensity !== undefined;

    if (!hasUpdates) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    const autoEndedAt =
      data.sessionStatus === 'completed' && data.endedAt === undefined
        ? new Date()
        : undefined;

    const [updatedSession] = await db
      .update(workoutSessions)
      .set(
        {
          endedAt:
            data.endedAt === null
              ? null
              : data.endedAt
                ? new Date(data.endedAt)
                : autoEndedAt,
          sessionStatus: data.sessionStatus,
          notes: data.notes === null ? null : data.notes,
          perceivedIntensity:
            data.perceivedIntensity === null ? null : data.perceivedIntensity,
          updatedAt: new Date(),
        } as Partial<WorkoutSessionInsert>,
      )
      .where(
        and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.workspaceId, workspaceId),
          eq(workoutSessions.userId, userId),
        ),
      )
      .returning();

    if (!updatedSession) {
      return c.json({ error: 'Workout session not found' }, 404);
    }

    return c.json(updatedSession);
  },
);

/**
 * POST /api/v1/workout-sessions/:id/sets
 * Adds a set to an exercise in an existing session.
 */
workoutSessionRoutes.post(
  '/:id/sets',
  zValidator('json', createWorkoutSetSchema),
  async (c) => {
    const context = await resolveWorkoutContext(c.req.raw);
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const sessionId = c.req.param('id');
    const data = c.req.valid('json');

    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.workspaceId, workspaceId),
          eq(workoutSessions.userId, userId),
        ),
      )
      .limit(1);

    if (!session) {
      return c.json({ error: 'Workout session not found' }, 404);
    }

    const [sessionExercise] = await db
      .select()
      .from(workoutSessionExercises)
      .where(
        and(
          eq(workoutSessionExercises.id, data.workoutSessionExerciseId),
          eq(workoutSessionExercises.workoutSessionId, sessionId),
        ),
      )
      .limit(1);

    if (!sessionExercise) {
      return c.json(
        {
          error: 'Workout session exercise not found for this session',
        },
        404,
      );
    }

    let setNumber = data.setNumber;
    if (!setNumber) {
      const [lastSet] = await db
        .select({ setNumber: workoutSets.setNumber })
        .from(workoutSets)
        .where(
          eq(workoutSets.workoutSessionExerciseId, data.workoutSessionExerciseId),
        )
        .orderBy(desc(workoutSets.setNumber))
        .limit(1);
      setNumber = (lastSet?.setNumber ?? 0) + 1;
    }

    const [existingSet] = await db
      .select({ id: workoutSets.id })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.workoutSessionExerciseId, data.workoutSessionExerciseId),
          eq(workoutSets.setNumber, setNumber),
        ),
      )
      .limit(1);

    if (existingSet) {
      return c.json(
        { error: `Set #${setNumber} already exists for this exercise` },
        409,
      );
    }

    const [createdSet] = await db
      .insert(workoutSets)
      .values(
        {
          workoutSessionExerciseId: data.workoutSessionExerciseId,
          setNumber,
          weightValue:
            data.weightValue !== undefined ? data.weightValue.toString() : null,
          repsCount: data.repsCount,
          durationSeconds: data.durationSeconds,
          distanceMeters: data.distanceMeters,
          rpe: data.rpe,
          rir: data.rir,
          isWarmup: data.isWarmup,
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? new Date() : null,
        } as WorkoutSetInsert,
      )
      .returning();

    await db
      .update(workoutSessions)
      .set({ updatedAt: new Date() } as Partial<WorkoutSessionInsert>)
      .where(eq(workoutSessions.id, sessionId));

    return c.json(createdSet, 201);
  },
);
