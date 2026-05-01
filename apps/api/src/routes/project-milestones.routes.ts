import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { projectMilestones, projects } from '@lifeos/db';
import { resolveStrictRequestContext } from './_request-context';
import { readJsonBodySafe } from './_safe-body';
import { z } from 'zod';

export const projectMilestoneRoutes = new Hono();

type ProjectMilestoneInsert = typeof projectMilestones.$inferInsert;

const updateProjectMilestoneSchema = z.object({
  title: z.string().min(1).max(400).optional(),
  description: z.string().max(10000).optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  status: z
    .enum(['idea', 'active', 'paused', 'completed', 'archived', 'planned', 'done', 'canceled'])
    .optional(),
  orderIndex: z.number().int().min(0).optional(),
});

function normalizeMilestoneStatus(
  status: z.infer<typeof updateProjectMilestoneSchema>['status'],
): 'idea' | 'active' | 'paused' | 'completed' | 'archived' | undefined {
  if (!status) return undefined;
  if (status === 'planned') return 'idea';
  if (status === 'done') return 'completed';
  if (status === 'canceled') return 'archived';
  return status;
}

projectMilestoneRoutes.patch('/:id', async (c) => {
  const context = await resolveStrictRequestContext(c.req.raw);
  if (!context) {
    return c.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const bodyRead = await readJsonBodySafe(c.req.raw);
  const parsedPayload = updateProjectMilestoneSchema.safeParse(bodyRead.body);
  if (!parsedPayload.success) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid milestone update payload',
        details: parsedPayload.error.issues,
      },
      400,
    );
  }

  const [existingMilestone] = await db
    .select({
      id: projectMilestones.id,
      projectId: projectMilestones.projectId,
    })
    .from(projectMilestones)
    .where(eq(projectMilestones.id, id))
    .limit(1);

  if (!existingMilestone) {
    return c.json({ code: 'NOT_FOUND', message: 'Milestone not found' }, 404);
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, existingMilestone.projectId),
        eq(projects.workspaceId, context.workspaceId),
        eq(projects.userId, context.userId),
      ),
    )
    .limit(1);

  if (!project) {
    return c.json({ code: 'FORBIDDEN', message: 'Milestone access denied' }, 403);
  }

  const data = parsedPayload.data;
  const [updatedMilestone] = await db
    .update(projectMilestones)
    .set({
      title: data.title,
      description: data.description === null ? null : data.description,
      targetDate:
        data.targetDate === null
          ? null
          : data.targetDate
            ? new Date(data.targetDate)
            : undefined,
      status: normalizeMilestoneStatus(data.status),
      orderIndex: data.orderIndex,
      updatedAt: new Date(),
    } as Partial<ProjectMilestoneInsert>)
    .where(eq(projectMilestones.id, id))
    .returning();

  return c.json(updatedMilestone);
});
