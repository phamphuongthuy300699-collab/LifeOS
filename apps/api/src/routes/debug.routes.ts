import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import {
  eq,
  and,
  exercises,
  externalAccounts,
  mailActionStates,
  mailMessages,
  mailThreads,
  mealEntries,
  meals,
  nutritionGoals,
  syncJobs,
  tasks,
  workoutPlanExercises,
  workoutPlans,
  workoutSessionExercises,
  workoutSessions,
} from '@lifeos/db';
import { count } from 'drizzle-orm';
import { db } from '../config/db';
import { resolveStrictRequestContext } from './_request-context';

export const debugRoutes = new Hono();

/**
 * GET /api/v1/debug/current-user-stats
 * Returns scoped counters for currently authenticated user/workspace.
 */
debugRoutes.get('/current-user-stats', async (c) => {
  const requestId = randomUUID();
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const { userId, workspaceId } = context;
  c.header('x-request-id', requestId);

  const [
    exercisesResult,
    workoutPlansResult,
    workoutPlanExercisesResult,
    mailAccountsResult,
    mailThreadsResult,
    mailMessagesResult,
    mailActionStatesResult,
    syncJobsResult,
    tasksResult,
    mealsResult,
    mealEntriesResult,
    nutritionGoalsResult,
    workoutSessionsResult,
    workoutSessionExercisesResult,
  ] = await Promise.all([
    db
      .select({ value: count(exercises.id) })
      .from(exercises)
      .where(and(eq(exercises.workspaceId, workspaceId), eq(exercises.userId, userId))),
    db
      .select({ value: count(workoutPlans.id) })
      .from(workoutPlans)
      .where(and(eq(workoutPlans.workspaceId, workspaceId), eq(workoutPlans.userId, userId))),
    db
      .select({ value: count(workoutPlanExercises.id) })
      .from(workoutPlanExercises)
      .leftJoin(workoutPlans, eq(workoutPlans.id, workoutPlanExercises.workoutPlanId))
      .where(and(eq(workoutPlans.workspaceId, workspaceId), eq(workoutPlans.userId, userId))),
    db
      .select({ value: count(externalAccounts.id) })
      .from(externalAccounts)
      .where(and(eq(externalAccounts.userId, userId), eq(externalAccounts.provider, 'google'))),
    db
      .select({ value: count(mailThreads.id) })
      .from(mailThreads)
      .where(and(eq(mailThreads.workspaceId, workspaceId), eq(mailThreads.userId, userId))),
    db
      .select({ value: count(mailMessages.id) })
      .from(mailMessages)
      .where(and(eq(mailMessages.workspaceId, workspaceId), eq(mailMessages.userId, userId))),
    db
      .select({ value: count(mailActionStates.id) })
      .from(mailActionStates)
      .where(
        and(
          eq(mailActionStates.workspaceId, workspaceId),
          eq(mailActionStates.userId, userId),
        ),
      ),
    db
      .select({ value: count(syncJobs.id) })
      .from(syncJobs)
      .where(and(eq(syncJobs.workspaceId, workspaceId), eq(syncJobs.userId, userId))),
    db
      .select({ value: count(tasks.id) })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.userId, userId))),
    db
      .select({ value: count(meals.id) })
      .from(meals)
      .where(and(eq(meals.workspaceId, workspaceId), eq(meals.userId, userId))),
    db
      .select({ value: count(mealEntries.id) })
      .from(mealEntries)
      .leftJoin(meals, eq(meals.id, mealEntries.mealId))
      .where(and(eq(meals.workspaceId, workspaceId), eq(meals.userId, userId))),
    db
      .select({ value: count(nutritionGoals.id) })
      .from(nutritionGoals)
      .where(
        and(
          eq(nutritionGoals.workspaceId, workspaceId),
          eq(nutritionGoals.userId, userId),
        ),
      ),
    db
      .select({ value: count(workoutSessions.id) })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.workspaceId, workspaceId), eq(workoutSessions.userId, userId))),
    db
      .select({ value: count(workoutSessionExercises.id) })
      .from(workoutSessionExercises)
      .leftJoin(
        workoutSessions,
        eq(workoutSessions.id, workoutSessionExercises.workoutSessionId),
      )
      .where(
        and(
          eq(workoutSessions.workspaceId, workspaceId),
          eq(workoutSessions.userId, userId),
        ),
      ),
  ]);

  return c.json({
    requestId,
    userId,
    workspaceId,
    gmailConnected: Number(mailAccountsResult[0]?.value ?? 0) > 0,
    counts: {
      exercises: Number(exercisesResult[0]?.value ?? 0),
      workoutPlans: Number(workoutPlansResult[0]?.value ?? 0),
      workoutPlanExercises: Number(workoutPlanExercisesResult[0]?.value ?? 0),
      mailAccounts: Number(mailAccountsResult[0]?.value ?? 0),
      mailThreads: Number(mailThreadsResult[0]?.value ?? 0),
      mailMessages: Number(mailMessagesResult[0]?.value ?? 0),
      mailActionStates: Number(mailActionStatesResult[0]?.value ?? 0),
      syncJobs: Number(syncJobsResult[0]?.value ?? 0),
      tasks: Number(tasksResult[0]?.value ?? 0),
      nutritionGoals: Number(nutritionGoalsResult[0]?.value ?? 0),
      meals: Number(mealsResult[0]?.value ?? 0),
      mealEntries: Number(mealEntriesResult[0]?.value ?? 0),
      workoutSessions: Number(workoutSessionsResult[0]?.value ?? 0),
      workoutSessionExercises: Number(
        workoutSessionExercisesResult[0]?.value ?? 0,
      ),
    },
  });
});

/**
 * GET /api/v1/debug/health-write
 * Lightweight write-read-delete check for current user/workspace.
 */
debugRoutes.get('/health-write', async (c) => {
  const requestId = randomUUID();
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const startedAt = Date.now();
  const { userId, workspaceId } = context;
  c.header('x-request-id', requestId);
  console.info('[debug.health-write] request started', { requestId, userId, workspaceId });

  try {
    const transactionResult = await db.transaction(async (tx) => {
      const [insertedGoal] = await tx
        .insert(nutritionGoals)
        .values({
          workspaceId,
          userId,
          caloriesTarget: 1,
          proteinTargetG: '1',
          fatTargetG: '1',
          carbsTargetG: '1',
          effectiveFrom: new Date(),
        } as any)
        .returning({
          id: nutritionGoals.id,
        });

      if (!insertedGoal) {
        throw new Error('Failed to insert health-write record');
      }

      const [readBack] = await tx
        .select({ id: nutritionGoals.id })
        .from(nutritionGoals)
        .where(eq(nutritionGoals.id, insertedGoal.id))
        .limit(1);

      await tx.delete(nutritionGoals).where(eq(nutritionGoals.id, insertedGoal.id));

      return {
        insertedId: insertedGoal.id,
        readBackFound: Boolean(readBack),
      };
    });

    return c.json({
      status: 'ok',
      requestId,
      userId,
      workspaceId,
      elapsedMs: Date.now() - startedAt,
      ...transactionResult,
    });
  } catch (error) {
    console.error('[debug.health-write] failed', {
      requestId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      {
        status: 'error',
        requestId,
        userId,
        workspaceId,
        elapsedMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
