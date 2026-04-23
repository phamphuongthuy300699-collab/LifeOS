import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../config/db';
import { tasks } from '@lifeos/db';
import { createTaskSchema, updateTaskSchema } from '@lifeos/domain-tasks';
import { eq, desc } from 'drizzle-orm';

export const taskRoutes = new Hono();

// GET /tasks — list tasks
taskRoutes.get('/', async (c) => {
  // TODO: Add actual user filtering based on auth
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt));
  
  return c.json({ items: allTasks });
});

// POST /tasks — create a task
taskRoutes.post('/', zValidator('json', createTaskSchema), async (c) => {
  const data = c.req.valid('json');

  const [newTask] = await db.insert(tasks).values({
    workspaceId: '00000000-0000-0000-0000-000000000000', // placeholder until auth is wired
    userId: '00000000-0000-0000-0000-000000000000', // placeholder
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt) : null,
    scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : null,
    estimateMinutes: data.estimateMinutes,
    projectId: data.projectId,
    parentTaskId: data.parentTaskId,
    sourceType: data.sourceType,
    createdFromInboxItemId: data.createdFromInboxItemId,
  }).returning();

  return c.json(newTask, 201);
});

// GET /tasks/:id — get single task
taskRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  
  if (!task) return c.json({ code: 'NOT_FOUND', message: 'Task not found' }, 404);
  
  return c.json(task);
});

// PATCH /tasks/:id — update task
taskRoutes.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updatedTask] = await db.update(tasks).set({
    ...data,
    dueAt: data.dueAt ? new Date(data.dueAt) : data.dueAt === null ? null : undefined,
    scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt) : data.scheduledStartAt === null ? null : undefined,
    scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : data.scheduledEndAt === null ? null : undefined,
    updatedAt: new Date(),
  }).where(eq(tasks.id, id)).returning();

  if (!updatedTask) return c.json({ code: 'NOT_FOUND', message: 'Task not found' }, 404);

  return c.json(updatedTask);
});

// POST /tasks/:id/complete — mark task as done
taskRoutes.post('/:id/complete', async (c) => {
  const id = c.req.param('id');
  
  const [updatedTask] = await db.update(tasks).set({
    status: 'done',
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(tasks.id, id)).returning();

  if (!updatedTask) return c.json({ code: 'NOT_FOUND', message: 'Task not found' }, 404);

  return c.json(updatedTask);
});
