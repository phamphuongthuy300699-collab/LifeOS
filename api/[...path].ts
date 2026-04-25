import { handle } from '@hono/node-server/vercel';
import type { Hono } from 'hono';

let cached: ReturnType<typeof handle> | null = null;

async function getHandler() {
  if (cached) return cached;
  const mod = await import('../apps/api/src/app.js');
  const app = mod.createApp() as Hono;
  cached = handle(app);
  return cached;
}

export default async function vercelHandler(
  req: Parameters<ReturnType<typeof handle>>[0],
  res: Parameters<ReturnType<typeof handle>>[1],
) {
  const runner = await getHandler();
  return runner(req, res);
}
