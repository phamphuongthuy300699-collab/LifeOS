import { Hono } from 'hono';

import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
  signAccessToken,
  signRefreshToken,
  GOOGLE_SCOPES,
} from '@lifeos/auth';

export const authRoutes = new Hono();

/**
 * GET /api/v1/auth/google
 * Redirect to Google OAuth consent screen.
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

  const url = buildGoogleAuthUrl({
    clientId,
    redirectUri,
    scopes: GOOGLE_SCOPES.profile,
    accessType: 'offline',
    prompt: 'consent',
  });

  return c.redirect(url);
});

/**
 * GET /api/v1/auth/google/callback
 * Handle Google OAuth callback — exchange code for tokens,
 * find or create user, issue JWT.
 *
 * NOTE: Full user creation logic will be added when DB is wired.
 * For now returns the Google profile + placeholder tokens.
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

    // TODO: Find or create user in DB, create workspace + membership
    // TODO: Store Google tokens in external_accounts (encrypted)

    // Placeholder: return profile and signed JWT
    const jwtSecret = process.env.JWT_SECRET!;
    const accessToken = await signAccessToken(
      {
        sub: googleUser.sub, // Will be replaced with internal user id
        email: googleUser.email,
        workspaceId: 'placeholder', // Will be replaced with real workspace id
      },
      jwtSecret,
    );
    const refreshToken = await signRefreshToken(
      { sub: googleUser.sub },
      jwtSecret,
    );

    return c.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        google_id: googleUser.sub,
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
 * Get current user profile.
 * TODO: Requires auth middleware (Sprint 0 completion).
 */
authRoutes.get('/me', (c) => {
  // Placeholder — will use auth middleware to extract user
  return c.json(
    { code: 'NOT_IMPLEMENTED', message: 'Auth middleware pending' },
    501,
  );
});

/**
 * POST /api/v1/auth/logout
 * Invalidate refresh token.
 */
authRoutes.post('/logout', (c) => {
  // Placeholder — will clear httpOnly cookie / invalidate token
  return c.json({ status: 'ok' });
});
