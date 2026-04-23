/**
 * Phase B — Task Tables
 *
 * tasks, task_relations
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { TaskStatus, TaskPriority, SourceType } from '@lifeos/shared';

// ── Enums ──────────────────────────────────────────────

export const taskStatusEnum = pgEnum('task_status', TaskStatus);
export const taskPriorityEnum = pgEnum('task_priority', TaskPriority);
export const sourceTypeEnum = pgEnum('source_type', SourceType);

// ── Tasks ──────────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Hierarchy
    projectId: uuid('project_id'), // FK to projects added in later sprint
    parentTaskId: uuid('parent_task_id'), // self-ref

    // Content
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),

    // State
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: taskPriorityEnum('priority').notNull().default('none'),

    // Scheduling
    dueAt: timestamp('due_at', { withTimezone: true }),
    scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }),
    scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }),
    estimateMinutes: integer('estimate_minutes'),

    // Source tracking
    sourceType: sourceTypeEnum('source_type').default('manual'),
    sourceRefType: varchar('source_ref_type', { length: 50 }),
    sourceRefId: uuid('source_ref_id'),
    createdFromInboxItemId: uuid('created_from_inbox_item_id'),

    // Completion
    completedAt: timestamp('completed_at', { withTimezone: true }),
    sortOrder: integer('sort_order').default(0),

    // Audit
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => ({
    wsStatusDueIdx: index('idx_tasks_ws_status_due').on(
      table.workspaceId,
      table.userId,
      table.status,
      table.dueAt,
    ),
    wsScheduledIdx: index('idx_tasks_ws_scheduled').on(
      table.workspaceId,
      table.userId,
      table.scheduledStartAt,
    ),
  }),
);

// ── Task Relations (polymorphic link) ──────────────────

export const taskRelations_table = pgTable('task_relations', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  relatedEntityType: varchar('related_entity_type', { length: 50 }).notNull(),
  relatedEntityId: uuid('related_entity_id').notNull(),
  relationKind: varchar('relation_kind', { length: 50 }).notNull().default('link'),
  metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Drizzle Relations ──────────────────────────────────

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  relations: many(taskRelations_table),
}));

export const taskRelationsRelations = relations(
  taskRelations_table,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskRelations_table.taskId],
      references: [tasks.id],
    }),
  }),
);
