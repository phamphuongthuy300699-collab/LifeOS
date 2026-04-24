import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../config/db';
import { resolveWorkoutContext } from './_workout-context';
import { exercises, workoutPlanExercises, workoutPlans } from '@lifeos/db';
import { createWorkoutPlanSchema } from '@lifeos/domain-workouts';

export const workoutPlanRoutes = new Hono();

/**
 * GET /api/v1/workout-plans
 * Returns workout plans with ordered exercises.
 */
workoutPlanRoutes.get('/', async (c) => {
  const context = await resolveWorkoutContext(c.req.raw);
  if (!context) {
    return c.json({ items: [] });
  }

  const { workspaceId, userId } = context;

  const plans = await db
    .select()
    .from(workoutPlans)
    .where(
      and(
        eq(workoutPlans.workspaceId, workspaceId),
        eq(workoutPlans.userId, userId),
      ),
    )
    .orderBy(desc(workoutPlans.updatedAt));

  if (!plans.length) {
    return c.json({ items: [] });
  }

  const planIds = plans.map((plan) => plan.id);

  const planExerciseRows = await db
    .select()
    .from(workoutPlanExercises)
    .where(inArray(workoutPlanExercises.workoutPlanId, planIds))
    .orderBy(
      asc(workoutPlanExercises.workoutPlanId),
      asc(workoutPlanExercises.orderIndex),
    );

  const exerciseIds = Array.from(
    new Set(planExerciseRows.map((row) => row.exerciseId)),
  );

  let exerciseRows: typeof exercises.$inferSelect[] = [];
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

  const planExercisesByPlanId = new Map<
    string,
    (typeof workoutPlanExercises.$inferSelect)[]
  >();

  for (const row of planExerciseRows) {
    const existing = planExercisesByPlanId.get(row.workoutPlanId) ?? [];
    existing.push(row);
    planExercisesByPlanId.set(row.workoutPlanId, existing);
  }

  const items = plans.map((plan) => {
    const planExercises = planExercisesByPlanId.get(plan.id) ?? [];

    return {
      ...plan,
      exercises: planExercises.map((item) => ({
        ...item,
        exercise: exerciseById.get(item.exerciseId) ?? null,
      })),
    };
  });

  return c.json({ items });
});

/**
 * POST /api/v1/workout-plans
 * Creates a workout plan and optional ordered exercise list.
 */
workoutPlanRoutes.post(
  '/',
  zValidator('json', createWorkoutPlanSchema),
  async (c) => {
    const context = await resolveWorkoutContext(c.req.raw);
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const data = c.req.valid('json');

    const createResult = await db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(workoutPlans)
        .values({
          workspaceId,
          userId,
          name: data.name,
          goal: data.goal,
          description: data.description,
          isActive: data.isActive,
          scheduleHintJson: data.scheduleHintJson,
        })
        .returning();

      if (!plan) {
        throw new Error('Failed to create workout plan');
      }

      let createdPlanExercises: (typeof workoutPlanExercises.$inferSelect)[] = [];
      if (data.exercises.length > 0) {
        createdPlanExercises = await tx
          .insert(workoutPlanExercises)
          .values(
            data.exercises.map((exercise, index) => ({
              workoutPlanId: plan.id,
              exerciseId: exercise.exerciseId,
              orderIndex: exercise.orderIndex ?? index,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeight: exercise.targetWeight,
              targetRestSeconds: exercise.targetRestSeconds,
            })),
          )
          .returning();
      }

      return { plan, createdPlanExercises };
    });

    const createdExerciseIds = Array.from(
      new Set(createResult.createdPlanExercises.map((item) => item.exerciseId)),
    );

    let exerciseRows: typeof exercises.$inferSelect[] = [];
    if (createdExerciseIds.length > 0) {
      exerciseRows = await db
        .select()
        .from(exercises)
        .where(
          and(
            eq(exercises.workspaceId, workspaceId),
            eq(exercises.userId, userId),
            inArray(exercises.id, createdExerciseIds),
          ),
        );
    }

    const exerciseById = new Map(exerciseRows.map((item) => [item.id, item]));

    return c.json(
      {
        ...createResult.plan,
        exercises: createResult.createdPlanExercises.map((item) => ({
          ...item,
          exercise: exerciseById.get(item.exerciseId) ?? null,
        })),
      },
      201,
    );
  },
);
