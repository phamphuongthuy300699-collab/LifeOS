import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db';
import {
  mailMessages,
  projectMilestones,
  projects,
  taskRelations_table,
  tasks,
} from '@lifeos/db';
import { createTaskSchema, updateTaskSchema } from '@lifeos/domain-tasks';
import {
  and,
  desc,
  eq,
  inArray,
  notInArray,
} from 'drizzle-orm';
import { resolveStrictRequestContext } from './_request-context';
import { readJsonBodySafe } from './_safe-body';
import { z } from 'zod';

export const taskRoutes = new Hono();

type TaskInsert = typeof tasks.$inferInsert;
type TaskRelationInsert = typeof taskRelations_table.$inferInsert;

const snoozeTaskSchema = z.object({
  dueAt: z.string().datetime().optional(),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
});

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional(),
  dueAt: z.string().datetime().optional(),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
});

const createTaskLinkSchema = z.object({
  relatedEntityType: z.string().min(1).max(50),
  relatedEntityId: z.string().uuid(),
  relationKind: z.string().min(1).max(50).optional().default('link'),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

// GET /tasks — list tasks
// Supports query params: status=todo,in_progress, projectId=<uuid>, includeCompleted=true
// Also supports dueBefore=<iso>
taskRoutes.get('/', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const statusQuery = c.req.query('status');
  const includeCompleted = c.req.query('includeCompleted') === 'true';
  const projectId = c.req.query('projectId');
  const dueBefore = c.req.query('dueBefore');

  const whereParts = [
    eq(tasks.workspaceId, context.workspaceId),
    eq(tasks.userId, context.userId),
  ];

  if (statusQuery) {
    const requested = statusQuery
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean) as Array<(typeof tasks.$inferSelect)['status']>;
    if (requested.length > 0) {
      whereParts.push(inArray(tasks.status, requested));
    }
  } else if (!includeCompleted) {
    whereParts.push(notInArray(tasks.status, ['done', 'cancelled']));
  }

  if (projectId) {
    whereParts.push(eq(tasks.projectId, projectId));
  }

  // dueBefore is applied after query to keep the query branch simple.
  let taskItems = await db
    .select()
    .from(tasks)
    .where(and(...whereParts))
    .orderBy(desc(tasks.createdAt));

  if (dueBefore) {
    const parsed = new Date(dueBefore);
    if (!Number.isNaN(parsed.getTime())) {
      taskItems = taskItems.filter((task) => {
        if (!task.dueAt) return false;
        return new Date(task.dueAt).getTime() <= parsed.getTime();
      });
    }
  }

  return c.json({ items: taskItems });
});

// POST /tasks — create a task
taskRoutes.post('/', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  try {
    const context = await resolveStrictRequestContext(c.req.raw);
    if (!context) {
      return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
    }

    const bodyRead = await readJsonBodySafe(c.req.raw);
    const parsedPayload = createTaskSchema.safeParse(bodyRead.body);
    if (!parsedPayload.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid task payload',
          details: parsedPayload.error.issues,
          requestId,
        },
        400,
      );
    }

    const data = parsedPayload.data;
    const [newTask] = await db
      .insert(tasks)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
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
      } as TaskInsert)
      .returning();

    return c.json({ ...newTask, requestId }, 201);
  } catch (error) {
    console.error('[tasks.create] failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      { code: 'TASK_CREATE_FAILED', message: 'Failed to create task', requestId },
      500,
    );
  }
});

// GET /tasks/:id — get single task details with subtasks, relations and source links
taskRoutes.get('/:id', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
      ),
    )
    .limit(1);

  if (!task) return c.json({ code: 'NOT_FOUND', message: 'Task not found' }, 404);

  const subtasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
        eq(tasks.parentTaskId, id),
      ),
    )
    .orderBy(desc(tasks.createdAt));

  const relations = await db
    .select()
    .from(taskRelations_table)
    .where(eq(taskRelations_table.taskId, id));

  const milestoneRelationIds = relations
    .filter((relation) => relation.relatedEntityType === 'project_milestone')
    .map((relation) => relation.relatedEntityId);

  const milestones =
    milestoneRelationIds.length > 0
      ? await db
          .select()
          .from(projectMilestones)
          .where(inArray(projectMilestones.id, milestoneRelationIds))
      : [];

  let sourceEmail: {
    id: string;
    subject: string | null;
    snippet: string | null;
    sentAt: Date;
    fromJson: unknown;
    webUrl: string | null;
  } | null = null;

  if (task.sourceRefType === 'mail_message' && task.sourceRefId) {
    const [message] = await db
      .select({
        id: mailMessages.id,
        subject: mailMessages.subject,
        snippet: mailMessages.snippet,
        sentAt: mailMessages.sentAt,
        fromJson: mailMessages.fromJson,
        webUrl: mailMessages.webUrl,
      })
      .from(mailMessages)
      .where(
        and(
          eq(mailMessages.id, task.sourceRefId),
          eq(mailMessages.workspaceId, context.workspaceId),
          eq(mailMessages.userId, context.userId),
        ),
      )
      .limit(1);
    sourceEmail = message ?? null;
  }

  return c.json({
    ...task,
    subtasks,
    relations,
    milestones,
    sourceEmail,
  });
});

// PATCH /tasks/:id — update task
taskRoutes.patch('/:id', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  try {
    const context = await resolveStrictRequestContext(c.req.raw);
    if (!context) {
      return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
    }

    const id = c.req.param('id');
    const bodyRead = await readJsonBodySafe(c.req.raw);
    const parsedPayload = updateTaskSchema.safeParse(bodyRead.body);
    if (!parsedPayload.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid task update payload',
          details: parsedPayload.error.issues,
          requestId,
        },
        400,
      );
    }

    const data = parsedPayload.data;

    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : data.dueAt === null ? null : undefined,
        scheduledStartAt: data.scheduledStartAt
          ? new Date(data.scheduledStartAt)
          : data.scheduledStartAt === null
            ? null
            : undefined,
        scheduledEndAt: data.scheduledEndAt
          ? new Date(data.scheduledEndAt)
          : data.scheduledEndAt === null
            ? null
            : undefined,
        updatedAt: new Date(),
      } as Partial<TaskInsert>)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.userId, context.userId),
        ),
      )
      .returning();

    if (!updatedTask) {
      return c.json({ code: 'NOT_FOUND', message: 'Task not found', requestId }, 404);
    }

    return c.json({ ...updatedTask, requestId });
  } catch (error) {
    console.error('[tasks.update] failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      { code: 'TASK_UPDATE_FAILED', message: 'Failed to update task', requestId },
      500,
    );
  }
});

// POST /tasks/:id/complete — mark task as done
taskRoutes.post('/:id/complete', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const id = c.req.param('id');

  const [updatedTask] = await db
    .update(tasks)
    .set({
      status: 'done',
      completedAt: new Date(),
      updatedAt: new Date(),
    } as Partial<TaskInsert>)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
      ),
    )
    .returning();

  if (!updatedTask)
    return c.json({ code: 'NOT_FOUND', message: 'Task not found', requestId }, 404);

  return c.json({ ...updatedTask, requestId });
});

// POST /tasks/:id/snooze — reschedule task
taskRoutes.post('/:id/snooze', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const bodyRead = await readJsonBodySafe(c.req.raw);
  const payload = {
    ...bodyRead.body,
    ...(c.req.query('dueAt') !== undefined ? { dueAt: c.req.query('dueAt') } : {}),
    ...(c.req.query('scheduledStartAt') !== undefined
      ? { scheduledStartAt: c.req.query('scheduledStartAt') }
      : {}),
    ...(c.req.query('scheduledEndAt') !== undefined
      ? { scheduledEndAt: c.req.query('scheduledEndAt') }
      : {}),
  };

  const parsedPayload = snoozeTaskSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid snooze payload',
        details: parsedPayload.error.issues,
        requestId,
      },
      400,
    );
  }

  const data = parsedPayload.data;
  if (!data.dueAt && !data.scheduledStartAt) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'dueAt or scheduledStartAt is required',
        requestId,
      },
      400,
    );
  }

  const id = c.req.param('id');
  const [updatedTask] = await db
    .update(tasks)
    .set({
      status: 'todo',
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      scheduledStartAt: data.scheduledStartAt
        ? new Date(data.scheduledStartAt)
        : undefined,
      scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : undefined,
      updatedAt: new Date(),
    } as Partial<TaskInsert>)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
      ),
    )
    .returning();

  if (!updatedTask) {
    return c.json({ code: 'NOT_FOUND', message: 'Task not found', requestId }, 404);
  }

  return c.json({ ...updatedTask, requestId });
});

// POST /tasks/:id/subtasks — add child task
taskRoutes.post('/:id/subtasks', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const id = c.req.param('id');
  const [parentTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
      ),
    )
    .limit(1);

  if (!parentTask) {
    return c.json({ code: 'NOT_FOUND', message: 'Parent task not found', requestId }, 404);
  }

  const bodyRead = await readJsonBodySafe(c.req.raw);
  const parsedPayload = createSubtaskSchema.safeParse(bodyRead.body);
  if (!parsedPayload.success) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid subtask payload',
        details: parsedPayload.error.issues,
        requestId,
      },
      400,
    );
  }

  const data = parsedPayload.data;

  const [createdSubtask] = await db
    .insert(tasks)
    .values({
      workspaceId: context.workspaceId,
      userId: context.userId,
      parentTaskId: id,
      title: data.title,
      description: data.description,
      status: 'todo',
      priority: data.priority ?? 'none',
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt) : null,
      scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : null,
      sourceType: 'manual',
    } as TaskInsert)
    .returning();

  return c.json({ ...createdSubtask, requestId }, 201);
});

// POST /tasks/:id/link — create relation to external entity (project milestone, contact, etc.)
taskRoutes.post('/:id/link', async (c) => {
  const requestId = randomUUID();
  c.header('x-request-id', requestId);

  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized', requestId }, 401);
  }

  const taskId = c.req.param('id');
  const [existingTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.workspaceId, context.workspaceId),
        eq(tasks.userId, context.userId),
      ),
    )
    .limit(1);

  if (!existingTask) {
    return c.json({ code: 'NOT_FOUND', message: 'Task not found', requestId }, 404);
  }

  const bodyRead = await readJsonBodySafe(c.req.raw);
  const payload = {
    ...bodyRead.body,
    ...(c.req.query('relatedEntityType') !== undefined
      ? { relatedEntityType: c.req.query('relatedEntityType') }
      : {}),
    ...(c.req.query('relatedEntityId') !== undefined
      ? { relatedEntityId: c.req.query('relatedEntityId') }
      : {}),
    ...(c.req.query('relationKind') !== undefined
      ? { relationKind: c.req.query('relationKind') }
      : {}),
  };

  const parsedPayload = createTaskLinkSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid task link payload',
        details: parsedPayload.error.issues,
        requestId,
      },
      400,
    );
  }

  const data = parsedPayload.data;

  if (data.relatedEntityType === 'project_milestone') {
    const [milestone] = await db
      .select({ id: projectMilestones.id, projectId: projectMilestones.projectId })
      .from(projectMilestones)
      .where(eq(projectMilestones.id, data.relatedEntityId))
      .limit(1);

    if (!milestone) {
      return c.json({ code: 'NOT_FOUND', message: 'Milestone not found', requestId }, 404);
    }

    const [owningProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, milestone.projectId),
          eq(projects.workspaceId, context.workspaceId),
          eq(projects.userId, context.userId),
        ),
      )
      .limit(1);

    if (!owningProject) {
      return c.json(
        {
          code: 'FORBIDDEN',
          message: 'Milestone does not belong to current workspace',
          requestId,
        },
        403,
      );
    }
  }

  const [existingRelation] = await db
    .select()
    .from(taskRelations_table)
    .where(
      and(
        eq(taskRelations_table.taskId, taskId),
        eq(taskRelations_table.relatedEntityType, data.relatedEntityType),
        eq(taskRelations_table.relatedEntityId, data.relatedEntityId),
        eq(taskRelations_table.relationKind, data.relationKind),
      ),
    )
    .limit(1);

  if (existingRelation) {
    return c.json({ ...existingRelation, requestId });
  }

  const [createdRelation] = await db
    .insert(taskRelations_table)
    .values({
      taskId,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      relationKind: data.relationKind,
      metadataJson: data.metadataJson,
    } as TaskRelationInsert)
    .returning();

  return c.json({ ...createdRelation, requestId }, 201);
});
