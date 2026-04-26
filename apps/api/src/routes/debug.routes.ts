import { Hono } from 'hono';
import {
  eq,
  and,
  exercises,
  externalAccounts,
  mailActionStates,
  mailMessages,
  mailThreads,
  meals,
  syncJobs,
  workoutPlanExercises,
  workoutPlans,
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
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const { userId, workspaceId } = context;

  const [
    exercisesResult,
    workoutPlansResult,
    workoutPlanExercisesResult,
    mailAccountsResult,
    mailThreadsResult,
    mailMessagesResult,
    mailActionStatesResult,
    syncJobsResult,
    mealsResult,
    workoutSessionsResult,
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
      .select({ value: count(meals.id) })
      .from(meals)
      .where(and(eq(meals.workspaceId, workspaceId), eq(meals.userId, userId))),
    db
      .select({ value: count(workoutSessions.id) })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.workspaceId, workspaceId), eq(workoutSessions.userId, userId))),
  ]);

  return c.json({
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
      meals: Number(mealsResult[0]?.value ?? 0),
      workoutSessions: Number(workoutSessionsResult[0]?.value ?? 0),
    },
  });
});
