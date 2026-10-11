import type { Context } from 'hono';
import { and, eq, externalAccounts, memberships, users } from '@lifeos/db';
import { verifyToken } from '@lifeos/auth';
import { db } from '../config/db';
import { env } from '../config/env';

export type RequestContext = {
  userId: string;
  workspaceId: string;
  authSource: 'jwt';
};

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Never trust x-user-id or a fallback membership; every request requires a JWT. */
export async function resolveRequestContext(request: Request): Promise<RequestContext | null> {
  const token = extractBearerToken(request.headers.get('authorization') ?? undefined);
  if (!token) return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload?.sub || !payload.workspaceId) return null;
  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, payload.sub), eq(memberships.workspaceId, payload.workspaceId)),
  });
  if (!membership) return null;
  return { userId: membership.userId, workspaceId: membership.workspaceId, authSource: 'jwt' };
}

export async function resolveStrictRequestContext(request: Request): Promise<RequestContext | null> {
  return resolveRequestContext(request);
}

export async function getCurrentUserProfile(
  c: Context,
  userId: string,
  workspaceId?: string,
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ code: 'NOT_FOUND', message: 'User not found' }, 404);
  }

  const googleAccount = await db.query.externalAccounts.findFirst({
    where: and(
      eq(externalAccounts.userId, userId),
      eq(externalAccounts.provider, 'google'),
    ),
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale,
      theme: user.theme,
      onboardingState: user.onboardingState,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    workspaceId: workspaceId ?? null,
    integrations: {
      google: {
        connected: Boolean(googleAccount),
        syncEnabled: Boolean(googleAccount?.syncEnabled),
      },
    },
  });
}
