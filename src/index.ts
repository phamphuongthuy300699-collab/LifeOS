import { handle } from '@hono/node-server/vercel';
import { Hono } from 'hono';
import { createApp } from '../apps/api/src/app';

const app = createApp() as Hono;

export default handle(app);
