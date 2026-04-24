/**
 * Phase B — Reminders Baseline (Sprint 2)
 */
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { tasks } from './tasks.schema';
import { events } from './events.schema';

export const reminderStatusEnum = pgEnum('reminder_status', [
  'pending',
  'sent',
  'dismissed',
  'cancelled',
]);

export const reminderChannelEnum = pgEnum('reminder_channel', [
  'in_app',
  'email',
]);

export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 500 }),
    note: text('note'),
    remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
    status: reminderStatusEnum('status').notNull().default('pending'),
    channel: reminderChannelEnum('channel').notNull().default('in_app'),
    isSnoozed: boolean('is_snoozed').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserRemindAtIdx: index('idx_reminders_ws_user_remind_at').on(
      table.workspaceId,
      table.userId,
      table.remindAt,
    ),
    wsUserStatusIdx: index('idx_reminders_ws_user_status').on(
      table.workspaceId,
      table.userId,
      table.status,
    ),
  }),
);

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [reminders.workspaceId],
    references: [workspaces.id],
  }),
  task: one(tasks, {
    fields: [reminders.taskId],
    references: [tasks.id],
  }),
  event: one(events, {
    fields: [reminders.eventId],
    references: [events.id],
  }),
}));
