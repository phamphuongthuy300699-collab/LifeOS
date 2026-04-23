/**
 * Task entity — domain model.
 */
import { WorkspaceEntity } from '@lifeos/domain-core';
import type { WorkspaceEntityProps } from '@lifeos/domain-core';
import type { TaskStatus, TaskPriority, SourceType } from '@lifeos/shared';

export interface TaskEntityProps extends WorkspaceEntityProps {
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  estimateMinutes: number | null;
  sourceType: SourceType | null;
  createdFromInboxItemId: string | null;
  completedAt: Date | null;
  sortOrder: number;
  archivedAt: Date | null;
}

export class TaskEntity extends WorkspaceEntity {
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  estimateMinutes: number | null;
  sourceType: SourceType | null;
  createdFromInboxItemId: string | null;
  completedAt: Date | null;
  sortOrder: number;
  archivedAt: Date | null;

  constructor(props: TaskEntityProps) {
    super(props);
    this.projectId = props.projectId;
    this.parentTaskId = props.parentTaskId;
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.priority = props.priority;
    this.dueAt = props.dueAt;
    this.scheduledStartAt = props.scheduledStartAt;
    this.scheduledEndAt = props.scheduledEndAt;
    this.estimateMinutes = props.estimateMinutes;
    this.sourceType = props.sourceType;
    this.createdFromInboxItemId = props.createdFromInboxItemId;
    this.completedAt = props.completedAt;
    this.sortOrder = props.sortOrder;
    this.archivedAt = props.archivedAt;
  }

  complete(): void {
    this.status = 'done';
    this.completedAt = new Date();
    this.touch();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.touch();
  }

  reopen(): void {
    this.status = 'todo';
    this.completedAt = null;
    this.touch();
  }

  updatePriority(priority: TaskPriority): void {
    this.priority = priority;
    this.touch();
  }

  archive(): void {
    this.archivedAt = new Date();
    this.touch();
  }

  get isCompleted(): boolean {
    return this.status === 'done' || this.status === 'cancelled';
  }

  get isActive(): boolean {
    return this.status === 'todo' || this.status === 'in_progress';
  }
}
