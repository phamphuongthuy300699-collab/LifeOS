import { Hono } from 'hono';

import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
  signAccessToken,
  signRefreshToken,
  encryptToken,
  GOOGLE_SCOPES,
} from '@lifeos/auth';
import { db } from '../config/db';
import { users, workspaces, memberships, externalAccounts } from '@lifeos/db';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserProfile, resolveStrictRequestContext } from './_request-context';

export const authRoutes = new Hono();

/**
 * GET /api/v1/auth/google
 * Redirect to Google OAuth consent screen.
 * Optional query param: `scopes=gmail` to request additional scopes.
 */
authRoutes.get('/google', (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return c.json(
      { code: 'CONFIG_ERROR', message: 'Google OAuth not configured' },
      500,
    );
  }

  // Base profile scopes
  let requestedScopes: string[] = [...GOOGLE_SCOPES.profile];
  
  // Scope upgrade
  const requestedAdditionalScopes = c.req.query('scopes');
  if (requestedAdditionalScopes?.includes('gmail')) {
    requestedScopes = [...requestedScopes, ...GOOGLE_SCOPES.gmail];
  }

  const url = buildGoogleAuthUrl({
    clientId,
    redirectUri,
    scopes: requestedScopes,
    accessType: 'offline', // Always ask for offline access for refresh token
    prompt: 'consent',     // Force consent to ensure refresh token is returned
  });

  return c.redirect(url);
});

/**
 * GET /api/v1/auth/google/callback
 * Handle Google OAuth callback — exchange code for tokens,
 * find or create user, issue JWT.
 */
authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json({ code: 'AUTH_ERROR', message: 'Missing code' }, 400);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  try {
    // Exchange code for Google tokens
    const tokens = await exchangeGoogleCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    // Get Google user profile
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // DB Transaction: Find or Create User & External Account
    let internalUserId: string;
    let internalWorkspaceId: string;

    await db.transaction(async (tx) => {
      // Check if external account exists
      const existingExt = await tx.query.externalAccounts.findFirst({
        where: and(
          eq(externalAccounts.provider, 'google'),
          eq(externalAccounts.providerAccountId, googleUser.sub)
        ),
      });

      if (existingExt) {
        internalUserId = existingExt.userId;
        
        // Update tokens
        await tx.update(externalAccounts).set({
          accessTokenEncrypted: encryptToken(tokens.access_token),
          ...(tokens.refresh_token ? { refreshTokenEncrypted: encryptToken(tokens.refresh_token) } : {}),
          scopesJson: tokens.scope.split(' '),
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        }).where(eq(externalAccounts.id, existingExt.id));

        // Get default workspace
        const existingMembership = await tx.query.memberships.findFirst({
          where: eq(memberships.userId, internalUserId),
        });
        if (!existingMembership) {
          throw new Error('User membership not found for existing external account');
        }
        internalWorkspaceId = existingMembership.workspaceId;
      } else {
        // Create new user
        const [newUser] = await tx.insert(users).values({
          email: googleUser.email,
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
        }).returning();
        if (!newUser) {
          throw new Error('Failed to create user');
        }
        internalUserId = newUser.id;

        // Create default workspace
        const [newWorkspace] = await tx.insert(workspaces).values({
          ownerUserId: internalUserId,
          name: `Workspace - ${googleUser.name}`,
          slug: `ws-${googleUser.sub.substring(0, 8)}`,
        }).returning();
        if (!newWorkspace) {
          throw new Error('Failed to create workspace');
        }
        internalWorkspaceId = newWorkspace.id;

        // Create membership
        await tx.insert(memberships).values({
          workspaceId: internalWorkspaceId,
          userId: internalUserId,
          role: 'owner',
        });

        // Create external account
        await tx.insert(externalAccounts).values({
          userId: internalUserId,
          provider: 'google',
          providerAccountId: googleUser.sub,
          email: googleUser.email,
          scopesJson: tokens.scope.split(' '),
          accessTokenEncrypted: encryptToken(tokens.access_token),
          refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          syncEnabled: true,
        });
      }
    });

    const jwtSecret = process.env.JWT_SECRET!;
    const accessToken = await signAccessToken(
      {
        sub: internalUserId!,
        email: googleUser.email,
        workspaceId: internalWorkspaceId!,
      },
      jwtSecret,
    );
    const refreshToken = await signRefreshToken(
      { sub: internalUserId! },
      jwtSecret,
    );

    return c.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: internalUserId!,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json(
      { code: 'AUTH_ERROR', message: 'Google authentication failed' },
      401,
    );
  }
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
 * Invalidate refresh token.
 */
authRoutes.post('/logout', (c) => {
  // Placeholder — will clear httpOnly cookie / invalidate token
  return c.json({ status: 'ok' });
});
