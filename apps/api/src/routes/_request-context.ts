import type { Context } from 'hono';
import { and, eq, memberships, users } from '@lifeos/db';
import { verifyToken } from '@lifeos/auth';
import { db } from '../config/db';
import { env } from '../config/env';

export type RequestContext = {
  userId: string;
  workspaceId: string;
  authSource: 'jwt' | 'header' | 'fallback';
};

type ResolveOptions = {
  allowFallback?: boolean;
};

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

async function resolveMembershipByUserId(
  userId: string,
): Promise<{ userId: string; workspaceId: string } | null> {
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
  });

  if (!membership) return null;

  return {
    userId: membership.userId,
    workspaceId: membership.workspaceId,
  };
}

export async function resolveRequestContext(
  request: Request,
  options: ResolveOptions = {},
): Promise<RequestContext | null> {
  const allowFallback = options.allowFallback ?? true;

  const token = extractBearerToken(request.headers.get('authorization') ?? undefined);
  if (token) {
    const payload = await verifyToken(token, env.JWT_SECRET);
    if (payload?.sub && payload.workspaceId) {
      const membership = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.userId, payload.sub),
          eq(memberships.workspaceId, payload.workspaceId),
        ),
      });

      if (membership) {
        return {
          userId: membership.userId,
          workspaceId: membership.workspaceId,
          authSource: 'jwt',
        };
      }
    }
  }

  const requestedUserId = request.headers.get('x-user-id') ?? undefined;
  if (requestedUserId) {
    const membership = await resolveMembershipByUserId(requestedUserId);
    if (membership) {
      return {
        userId: membership.userId,
        workspaceId: membership.workspaceId,
        authSource: 'header',
      };
    }
  }

  if (!allowFallback) return null;

  const fallbackMembership = await db.query.memberships.findFirst();
  if (!fallbackMembership) {
    return null;
  }

  return {
    userId: String(fallbackMembership.userId),
    workspaceId: String(fallbackMembership.workspaceId),
    authSource: 'fallback',
  };
}

export async function resolveStrictRequestContext(
  request: Request,
): Promise<RequestContext | null> {
  return resolveRequestContext(request, { allowFallback: false });
}

export async function getCurrentUserProfile(c: Context, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ code: 'NOT_FOUND', message: 'User not found' }, 404);
  }

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
  });
}
