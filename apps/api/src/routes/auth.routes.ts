import { Hono } from 'hono';
import {
  GOOGLE_SCOPES,
  buildGoogleAuthUrl,
  encryptToken,
  exchangeGoogleCode,
  getGoogleUserInfo,
  signAccessToken,
  signRefreshToken,
} from '@lifeos/auth';
import {
  and,
  eq,
  externalAccounts,
  memberships,
  users,
  workspaces,
} from '@lifeos/db';
import { db } from '../config/db';
import { env } from '../config/env';
import { getCurrentUserProfile, resolveStrictRequestContext } from './_request-context';

export const authRoutes = new Hono();

function getGoogleEnv() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    return null;
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  };
}

function buildScopes() {
  return [...GOOGLE_SCOPES.profile, ...GOOGLE_SCOPES.gmail, ...GOOGLE_SCOPES.calendar];
}

function isTruthy(value: string | undefined) {
  return value === '1' || value === 'true' || value === 'yes';
}

authRoutes.get('/google', async (c) => {
  const googleEnv = getGoogleEnv();
  if (!googleEnv) {
    return c.json(
      {
        code: 'CONFIG_ERROR',
        message: 'Google OAuth is not configured on server',
      },
      500,
    );
  }

  const requestedUserId = c.req.query('userId');
  let state = 'google_oauth';

  if (requestedUserId) {
    const foundUser = await db.query.users.findFirst({
      where: eq(users.id, requestedUserId),
    });
    if (!foundUser) {
      return c.json({ code: 'BAD_REQUEST', message: 'Unknown userId for scope upgrade' }, 400);
    }
    state = `upgrade:${requestedUserId}`;
  }

  const forceConsent = isTruthy(c.req.query('upgrade')) || requestedUserId !== undefined;

  const url = buildGoogleAuthUrl({
    clientId: googleEnv.clientId,
    redirectUri: googleEnv.redirectUri,
    scopes: buildScopes(),
    state,
    accessType: 'offline',
    prompt: forceConsent ? 'consent' : 'select_account',
  });

  return c.redirect(url, 302);
});

authRoutes.get('/google/callback', async (c) => {
  const googleEnv = getGoogleEnv();
  if (!googleEnv) {
    return c.json(
      {
        code: 'CONFIG_ERROR',
        message: 'Google OAuth is not configured on server',
      },
      500,
    );
  }

  const error = c.req.query('error');
  if (error) {
    return c.json(
      {
        code: 'GOOGLE_AUTH_ERROR',
        message: `Google returned error: ${error}`,
      },
      400,
    );
  }

  const code = c.req.query('code');
  if (!code) {
    return c.json({ code: 'BAD_REQUEST', message: 'Missing OAuth code' }, 400);
  }

  const state = c.req.query('state') ?? '';
  const stateUserId = state.startsWith('upgrade:') ? state.replace('upgrade:', '') : undefined;

  const tokenResponse = await exchangeGoogleCode({
    code,
    clientId: googleEnv.clientId,
    clientSecret: googleEnv.clientSecret,
    redirectUri: googleEnv.redirectUri,
  });

  const userInfo = await getGoogleUserInfo(tokenResponse.access_token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000);
  const scopes = (tokenResponse.scope || '').split(' ').filter(Boolean);

  let user = await db.query.users.findFirst({
    where: eq(users.email, userInfo.email),
  });

  if (!user) {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: userInfo.email,
        displayName: userInfo.name || userInfo.email.split('@')[0] || 'LifeOS User',
      })
      .returning();
    if (!createdUser) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create user' }, 500);
    }
    user = createdUser;
  }

  let membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });

  if (!membership) {
    const slugBase = userInfo.email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'lifeos';
    const workspaceSlug = `${slugBase}-${user.id.slice(0, 8)}`;
    const [createdWorkspace] = await db
      .insert(workspaces)
      .values({
        ownerUserId: user.id,
        name: `${user.displayName} Workspace`,
        slug: workspaceSlug,
      })
      .returning();

    if (!createdWorkspace) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create workspace' }, 500);
    }

    const [createdMembership] = await db
      .insert(memberships)
      .values({
        workspaceId: createdWorkspace.id,
        userId: user.id,
      })
      .returning();

    if (!createdMembership) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create membership' }, 500);
    }
    membership = createdMembership;
  }

  const linkedUserId = stateUserId || user.id;
  const existingExternalAccount = await db.query.externalAccounts.findFirst({
    where: and(
      eq(externalAccounts.provider, 'google'),
      eq(externalAccounts.providerAccountId, userInfo.sub),
    ),
  });

  const encryptedAccessToken = encryptToken(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encryptToken(tokenResponse.refresh_token)
    : undefined;

  if (!existingExternalAccount) {
    const [createdExternal] = await db.insert(externalAccounts).values({
      userId: linkedUserId,
      provider: 'google',
      providerAccountId: userInfo.sub,
    }).returning({ id: externalAccounts.id });
    if (!createdExternal) {
      return c.json({ code: 'INTERNAL_ERROR', message: 'Failed to create external account' }, 500);
    }

    await db
      .update(externalAccounts)
      .set(
        {
          email: userInfo.email,
          scopesJson: scopes,
          accessTokenEncrypted: encryptedAccessToken,
          refreshTokenEncrypted: encryptedRefreshToken ?? null,
          tokenExpiresAt: expiresAt,
          syncEnabled: true,
          metadataJson: {
            googleName: userInfo.name,
            picture: userInfo.picture,
          },
          updatedAt: new Date(),
        } as any,
      )
      .where(eq(externalAccounts.id, createdExternal.id));
  } else {
    const metadata = {
      ...(existingExternalAccount.metadataJson ?? {}),
      googleName: userInfo.name,
      picture: userInfo.picture,
      scopesUpgradedAt: new Date().toISOString(),
    };

    await db
      .update(externalAccounts)
      .set(
        {
          userId: linkedUserId,
          email: userInfo.email,
          scopesJson: scopes,
          accessTokenEncrypted: encryptedAccessToken,
          refreshTokenEncrypted:
            encryptedRefreshToken ?? existingExternalAccount.refreshTokenEncrypted,
          tokenExpiresAt: expiresAt,
          syncEnabled: true,
          metadataJson: metadata,
          updatedAt: new Date(),
        } as any,
      )
      .where(eq(externalAccounts.id, existingExternalAccount.id));
  }

  const accessToken = await signAccessToken(
    {
      sub: user.id,
      email: user.email,
      workspaceId: membership.workspaceId,
    },
    env.JWT_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
  );
  const refreshToken = await signRefreshToken(
    { sub: user.id },
    env.JWT_SECRET,
    env.JWT_REFRESH_EXPIRES_IN,
  );

  const appUrl = env.APP_URL.replace(/\/$/, '');
  const redirectUrl = `${appUrl}/auth/google/callback#accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&userId=${encodeURIComponent(user.id)}&workspaceId=${encodeURIComponent(membership.workspaceId)}`;

  return c.redirect(redirectUrl, 302);
});

/**
 * GET /api/v1/auth/me
 * Get current user profile from JWT or x-user-id header.
 */
authRoutes.get('/me', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  return getCurrentUserProfile(c, context.userId);
});

/**
 * POST /api/v1/auth/logout
 */
authRoutes.post('/logout', (c) => {
  return c.json({ status: 'ok' });
});
