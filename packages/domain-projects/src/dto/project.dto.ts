import { z } from 'zod';
import { ProjectStatus } from '@lifeos/shared';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(320),
  description: z.string().max(20000).optional(),
  status: z.enum(ProjectStatus).optional().default('active'),
  purpose: z.string().max(10000).optional(),
  currentNextAction: z.string().max(10000).optional(),
  currentMilestone: z.string().max(10000).optional(),
  repoUrl: z.string().url().optional(),
  lastActivityAt: z.string().datetime().optional(),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

export const createProjectMilestoneSchema = z.object({
  title: z.string().min(1).max(400),
  description: z.string().max(10000).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(ProjectStatus).optional().default('active'),
  orderIndex: z.number().int().min(0).optional().default(0),
});
export type CreateProjectMilestoneDto = z.infer<typeof createProjectMilestoneSchema>;
