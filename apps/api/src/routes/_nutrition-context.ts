import { resolveRequestContext } from './_request-context';

export type NutritionRouteContext = {
  userId: string;
  workspaceId: string;
};

/**
 * Resolves user/workspace context for nutrition endpoints.
 * Single-user MVP behavior: allow fallback membership.
 */
export async function resolveNutritionContext(
  request: Request,
): Promise<NutritionRouteContext | null> {
  const context = await resolveRequestContext(request, { allowFallback: true });
  if (!context) return null;

  return {
    userId: context.userId,
    workspaceId: context.workspaceId,
  };
}
