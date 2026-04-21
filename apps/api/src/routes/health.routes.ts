import { Hono } from 'hono';

export const healthRoutes = new Hono();

/**
 * GET /api/v1/health
 * Basic health check — returns 200 if API is running.
 */
healthRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lifeos-api',
    timestamp: new Date().toISOString(),
  });
});
