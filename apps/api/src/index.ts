import { serve } from '@hono/node-server';
import { createApp } from './app';

const app = createApp();
const port = Number(process.env.PORT) || 3001;

console.log(`🚀 LifeOS API starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ LifeOS API running on http://localhost:${port}/api/v1/health`);
