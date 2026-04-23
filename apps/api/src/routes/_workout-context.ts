import { eq } from 'drizzle-orm';
import { memberships } from '@lifeos/db';
import { db } from '../config/db';

export type WorkoutRouteContext = {
  userId: string;
  workspaceId: string;
};

/**
 * Resolves user/workspace context from x-user-id (preferred) or first membership.
 * This supports single-user MVP flows while auth is still incremental.
 */
export async function resolveWorkoutContext(
  requestUserId?: string,
): Promise<WorkoutRouteContext | null> {
  if (requestUserId) {
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, requestUserId),
    });

    if (membership) {
      return {
        userId: requestUserId,
        workspaceId: membership.workspaceId,
      };
    }
  }

  const fallbackMembership = await db.query.memberships.findFirst();
  if (!fallbackMembership) {
    return null;
  }

  return {
    userId: fallbackMembership.userId,
    workspaceId: fallbackMembership.workspaceId,
  };
}
