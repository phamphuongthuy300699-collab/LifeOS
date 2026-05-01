import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  taskRelations_table,
  tasks,
  projectMilestones,
  projects,
} from '@lifeos/db';
import {
  createProjectMilestoneSchema,
  createProjectSchema,
  updateProjectSchema,
} from '@lifeos/domain-projects';
import { db } from '../config/db';
import { resolveGrowthContext } from './_growth-context';

export const projectRoutes = new Hono();
type ProjectInsert = typeof projects.$inferInsert;
type ProjectMilestoneInsert = typeof projectMilestones.$inferInsert;

async function loadMilestonesWithTasks(params: {
  projectId: string;
  workspaceId: string;
  userId: string;
}) {
  const milestones = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, params.projectId))
    .orderBy(asc(projectMilestones.orderIndex), asc(projectMilestones.createdAt));

  const milestoneIds = milestones.map((item) => item.id);
  if (milestoneIds.length === 0) return [];

  const linkedTasks = await db
    .select({
      milestoneId: taskRelations_table.relatedEntityId,
      taskId: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      scheduledStartAt: tasks.scheduledStartAt,
      completedAt: tasks.completedAt,
    })
    .from(taskRelations_table)
    .innerJoin(tasks, eq(taskRelations_table.taskId, tasks.id))
    .where(
      and(
        eq(taskRelations_table.relatedEntityType, 'project_milestone'),
        inArray(taskRelations_table.relatedEntityId, milestoneIds),
        eq(tasks.workspaceId, params.workspaceId),
        eq(tasks.userId, params.userId),
      ),
    )
    .orderBy(desc(tasks.updatedAt));

  const tasksByMilestoneId = new Map<
    string,
    Array<{
      taskId: string;
      title: string;
      status: string;
      priority: string;
      dueAt: Date | null;
      scheduledStartAt: Date | null;
      completedAt: Date | null;
    }>
  >();

  for (const linked of linkedTasks) {
    const list = tasksByMilestoneId.get(linked.milestoneId) ?? [];
    list.push({
      taskId: linked.taskId,
      title: linked.title,
      status: linked.status,
      priority: linked.priority,
      dueAt: linked.dueAt,
      scheduledStartAt: linked.scheduledStartAt,
      completedAt: linked.completedAt,
    });
    tasksByMilestoneId.set(linked.milestoneId, list);
  }

  return milestones.map((milestone) => ({
    ...milestone,
    tasks: tasksByMilestoneId.get(milestone.id) ?? [],
  }));
}

projectRoutes.get('/', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ items: [] });

  const { workspaceId, userId } = context;
  const items = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.userId, userId)))
    .orderBy(desc(projects.updatedAt));

  return c.json({ items });
});

projectRoutes.post('/', zValidator('json', createProjectSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const [created] = await db
    .insert(projects)
    .values({
      workspaceId,
      userId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status,
      purpose: data.purpose,
      currentNextAction: data.currentNextAction,
      currentMilestone: data.currentMilestone,
      repoUrl: data.repoUrl,
      lastActivityAt: data.lastActivityAt ? new Date(data.lastActivityAt) : undefined,
    } as ProjectInsert)
    .returning();

  return c.json(created, 201);
});

projectRoutes.get('/:id', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: 'Project not found' }, 404);

  const milestones = await loadMilestonesWithTasks({
    projectId: id,
    workspaceId,
    userId,
  });

  return c.json({ ...project, milestones });
});

projectRoutes.get('/:id/milestones', async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: 'Project not found' }, 404);

  const milestones = await loadMilestonesWithTasks({
    projectId: id,
    workspaceId,
    userId,
  });

  return c.json({ items: milestones });
});

projectRoutes.patch('/:id', zValidator('json', updateProjectSchema), async (c) => {
  const context = await resolveGrowthContext(c.req.raw);
  if (!context) return c.json({ error: 'No workspace membership found' }, 403);

  const { workspaceId, userId } = context;
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [updated] = await db
    .update(projects)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status,
      purpose: data.purpose,
      currentNextAction: data.currentNextAction,
      currentMilestone: data.currentMilestone,
      repoUrl: data.repoUrl,
      lastActivityAt:
        data.lastActivityAt === undefined
          ? undefined
          : data.lastActivityAt === null
            ? null
            : new Date(data.lastActivityAt),
      updatedAt: new Date(),
    } as Partial<ProjectInsert>)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId), eq(projects.userId, userId)))
    .returning();

  if (!updated) return c.json({ error: 'Project not found' }, 404);
  return c.json(updated);
});

projectRoutes.post(
  '/:id/milestones',
  zValidator('json', createProjectMilestoneSchema),
  async (c) => {
    const context = await resolveGrowthContext(c.req.raw);
    if (!context) return c.json({ error: 'No workspace membership found' }, 403);

    const { workspaceId, userId } = context;
    const projectId = c.req.param('id');
    const data = c.req.valid('json');

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), eq(projects.userId, userId)),
      )
      .limit(1);

    if (!project) return c.json({ error: 'Project not found' }, 404);

    const [created] = await db
      .insert(projectMilestones)
      .values({
        projectId,
        title: data.title,
        description: data.description,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: data.status,
        orderIndex: data.orderIndex,
      } as ProjectMilestoneInsert)
      .returning();

    await db
      .update(projects)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() } as Partial<ProjectInsert>)
      .where(eq(projects.id, projectId));

    return c.json(created, 201);
  },
);
