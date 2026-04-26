import { resolveStrictRequestContext } from './_request-context';

export type NutritionRouteContext = {
  userId: string;
  workspaceId: string;
};

/**
 * Resolves user/workspace context for nutrition endpoints from strict JWT auth.
 */
export async function resolveNutritionContext(
  request: Request,
): Promise<NutritionRouteContext | null> {
  const context = await resolveStrictRequestContext(request);
  if (!context) return null;

  return {
    userId: context.userId,
    workspaceId: context.workspaceId,
  };
}
