import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users, workspaces } from './auth.schema';
import { ProjectStatus } from '@lifeos/shared';

export const projectStatusEnum = pgEnum('project_status', ProjectStatus);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 300 }).notNull(),
    slug: varchar('slug', { length: 320 }).notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('active'),
    purpose: text('purpose'),
    currentNextAction: text('current_next_action'),
    currentMilestone: text('current_milestone'),
    repoUrl: text('repo_url'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserStatusIdx: index('idx_projects_ws_user_status').on(
      table.workspaceId,
      table.userId,
      table.status,
    ),
    wsUserSlugIdx: index('idx_projects_ws_user_slug').on(
      table.workspaceId,
      table.userId,
      table.slug,
    ),
  }),
);

export const projectMilestones = pgTable(
  'project_milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 400 }).notNull(),
    description: text('description'),
    targetDate: timestamp('target_date', { withTimezone: true }),
    status: projectStatusEnum('status').notNull().default('active'),
    orderIndex: integer('order_index').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectOrderIdx: index('idx_project_milestones_project_order').on(
      table.projectId,
      table.orderIndex,
    ),
  }),
);

export const projectNotes = pgTable(
  'project_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 300 }),
    content: text('content').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index('idx_project_notes_project_created').on(
      table.projectId,
      table.createdAt,
    ),
  }),
);
