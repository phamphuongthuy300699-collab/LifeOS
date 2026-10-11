import { resolveStrictRequestContext } from './_request-context';

export type GrowthRouteContext = {
  userId: string;
  workspaceId: string;
};

export async function resolveGrowthContext(request: Request): Promise<GrowthRouteContext | null> {
  const context = await resolveStrictRequestContext(request);
  if (!context) return null;

  return {
    userId: context.userId,
    workspaceId: context.workspaceId,
  };
}
