import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { exerciseRoutes } from './routes/exercises.routes';
import { workoutPlanRoutes } from './routes/workout-plans.routes';
import { workoutSessionRoutes } from './routes/workout-sessions.routes';
import { workoutSetRoutes } from './routes/workout-sets.routes';

/**
 * Create the Hono application with all middleware and routes.
 */
export function createApp() {
  const app = new Hono().basePath('/api/v1');

  // ── Global middleware ──
  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use(
    '*',
    cors({
      origin: (origin) => origin, // Allow configured origins in production
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Routes ──
  app.route('/', healthRoutes);
  app.route('/auth', authRoutes);
  // Sprint 4 production scope
  app.route('/exercises', exerciseRoutes);
  app.route('/workout-plans', workoutPlanRoutes);
  app.route('/workout-sessions', workoutSessionRoutes);
  app.route('/workout-sets', workoutSetRoutes);
  // app.route('/nutrition', nutritionRoutes);
  // app.route('/learning', learningRoutes);
  // app.route('/contacts', contactRoutes);
  // app.route('/projects', projectRoutes);
  // app.route('/transactions', financeRoutes);
  // app.route('/exports', exportRoutes);
  // app.route('/ai', aiRoutes);
  // app.route('/speech', speechRoutes);

  // ── Global error handler ──
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error',
      },
      500,
    );
  });

  // ── 404 ──
  app.notFound((c) => {
    return c.json({ code: 'NOT_FOUND', message: 'Route not found' }, 404);
  });

  return app;
}
