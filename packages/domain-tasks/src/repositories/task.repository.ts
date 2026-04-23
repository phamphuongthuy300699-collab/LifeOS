/**
 * Task repository interface — defines persistence contract.
 * Concrete implementation lives in the API layer.
 */
import type { TaskEntity } from '../entities/task.entity';
import type { TaskStatus, TaskPriority } from '@lifeos/shared';
import type { PaginatedResponse } from '@lifeos/shared';

export interface TaskFilter {
  workspaceId: string;
  userId: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: string;
  dueBeforeOrAt?: Date;
  scheduledDate?: Date; // tasks scheduled for a specific day
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface ITaskRepository {
  findById(id: string): Promise<TaskEntity | null>;
  findMany(filter: TaskFilter): Promise<PaginatedResponse<TaskEntity>>;
  findTodayTasks(workspaceId: string, userId: string): Promise<TaskEntity[]>;
  create(entity: TaskEntity): Promise<TaskEntity>;
  update(entity: TaskEntity): Promise<TaskEntity>;
  delete(id: string): Promise<void>;
}
