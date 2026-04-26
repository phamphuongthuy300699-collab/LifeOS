import { resolveStrictRequestContext } from './_request-context';

export type WorkoutRouteContext = {
  userId: string;
  workspaceId: string;
};

/**
 * Resolves user/workspace context from strict JWT auth.
 */
export async function resolveWorkoutContext(request: Request): Promise<WorkoutRouteContext | null> {
  const context = await resolveStrictRequestContext(request);
  if (!context) return null;

  return {
    userId: context.userId,
    workspaceId: context.workspaceId,
  };
}
