import { resolveRequestContext } from './_request-context';

export type WorkoutRouteContext = {
  userId: string;
  workspaceId: string;
};

/**
 * Resolves user/workspace context from x-user-id (preferred) or first membership.
 * This supports single-user MVP flows while auth is still incremental.
 */
export async function resolveWorkoutContext(request: Request): Promise<WorkoutRouteContext | null> {
  const context = await resolveRequestContext(request, { allowFallback: true });
  if (!context) return null;

  return {
    userId: context.userId,
    workspaceId: context.workspaceId,
  };
}
