/**
 * Phase C — Mail
 *
 * mail_threads, mail_messages, mail_action_states
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { tasks } from './tasks.schema';

// ── Enums ──────────────────────────────────────────────

export const mailActionStatusEnum = pgEnum('mail_action_status', [
  'new',
  'needs_action',
  'converted_to_task',
  'waiting',
  'done',
  'ignored',
  'snoozed',
]);

export const mailDirectionEnum = pgEnum('mail_direction', ['inbound', 'outbound']);

// ── Mail Threads ───────────────────────────────────────

export const mailThreads = pgTable('mail_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerThreadId: varchar('provider_thread_id', { length: 500 }).notNull(),
  subject: varchar('subject', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Mail Messages ──────────────────────────────────────

export const mailMessages = pgTable('mail_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mailThreadId: uuid('mail_thread_id')
    .notNull()
    .references(() => mailThreads.id, { onDelete: 'cascade' }),
  providerMessageId: varchar('provider_message_id', { length: 500 }).notNull(),
  
  fromJson: jsonb('from_json').notNull().$type<{ name?: string; email: string }>(),
  toJson: jsonb('to_json').notNull().$type<Array<{ name?: string; email: string }>>(),
  ccJson: jsonb('cc_json').$type<Array<{ name?: string; email: string }>>(),
  
  subject: varchar('subject', { length: 1000 }),
  snippet: text('snippet'),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  
  direction: mailDirectionEnum('direction').notNull().default('inbound'),
  isUnread: boolean('is_unread').notNull().default(true),
  hasAttachments: boolean('has_attachments').notNull().default(false),
  labelsJson: jsonb('labels_json').$type<string[]>(),
  webUrl: text('web_url'),
  
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userSentIdx: index('idx_mail_messages_user_sent').on(table.userId, table.sentAt),
}));

// ── Mail Action States ─────────────────────────────────

export const mailActionStates = pgTable('mail_action_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mailMessageId: uuid('mail_message_id')
    .notNull()
    .references(() => mailMessages.id, { onDelete: 'cascade' }),
  
  triageStatus: mailActionStatusEnum('triage_status').notNull().default('new'),
  linkedTaskId: uuid('linked_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  actionNote: text('action_note'),
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userTriageIdx: index('idx_mail_action_states_user_triage').on(table.userId, table.triageStatus),
}));

// ── Relations ──────────────────────────────────────────

export const mailThreadsRelations = relations(mailThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [mailThreads.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [mailThreads.workspaceId],
    references: [workspaces.id],
  }),
  messages: many(mailMessages),
}));

export const mailMessagesRelations = relations(mailMessages, ({ one, many }) => ({
  thread: one(mailThreads, {
    fields: [mailMessages.mailThreadId],
    references: [mailThreads.id],
  }),
  user: one(users, {
    fields: [mailMessages.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [mailMessages.workspaceId],
    references: [workspaces.id],
  }),
  actionStates: many(mailActionStates),
}));

export const mailActionStatesRelations = relations(mailActionStates, ({ one }) => ({
  message: one(mailMessages, {
    fields: [mailActionStates.mailMessageId],
    references: [mailMessages.id],
  }),
  task: one(tasks, {
    fields: [mailActionStates.linkedTaskId],
    references: [tasks.id],
  }),
}));
