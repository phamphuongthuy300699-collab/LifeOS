import { Hono } from 'hono';
import { getCurrentUserProfile, resolveStrictRequestContext } from './_request-context';

export const authRoutes = new Hono();

/**
 * Sprint 4 focus: keep auth endpoints stable for profile/context checks,
 * while OAuth callback flows are handled outside this deployment.
 */
authRoutes.get('/google', (c) => {
  return c.json(
    {
      code: 'NOT_IMPLEMENTED',
      message:
        'Google OAuth callback flow is disabled in this deployment. Use existing token/session headers.',
    },
    501,
  );
});

authRoutes.get('/google/callback', (c) => {
  return c.json(
    {
      code: 'NOT_IMPLEMENTED',
      message:
        'Google OAuth callback flow is disabled in this deployment. Use existing token/session headers.',
    },
    501,
  );
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
