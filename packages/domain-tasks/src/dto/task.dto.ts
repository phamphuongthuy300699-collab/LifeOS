/**
 * Task DTOs — Zod schemas for validation.
 */
import { z } from 'zod';
import { TaskStatus, TaskPriority, SourceType } from '@lifeos/shared';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  status: z.enum(TaskStatus).optional().default('todo'),
  priority: z.enum(TaskPriority).optional().default('none'),
  dueAt: z.string().datetime().optional(),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  estimateMinutes: z.number().int().positive().optional(),
  projectId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  sourceType: z.enum(SourceType).optional(),
  createdFromInboxItemId: z.string().uuid().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  scheduledStartAt: z.string().datetime().optional().nullable(),
  scheduledEndAt: z.string().datetime().optional().nullable(),
  estimateMinutes: z.number().int().positive().optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  sourceType: z.enum(SourceType).optional(),
  sourceRefType: z.string().max(50).optional().nullable(),
  sourceRefId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const taskFilterSchema = z.object({
  status: z.string().optional(), // comma-separated
  priority: z.string().optional(), // comma-separated
  projectId: z.string().uuid().optional(),
  dueBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;
