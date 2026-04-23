/**
 * @lifeos/domain-tasks
 * Task management domain
 */

// Entities
export { TaskEntity } from './entities/task.entity';
export type { TaskEntityProps } from './entities/task.entity';

// Repository interfaces
export type { ITaskRepository, TaskFilter } from './repositories/task.repository';

// DTOs
export {
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
} from './dto/task.dto';
export type {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
} from './dto/task.dto';
