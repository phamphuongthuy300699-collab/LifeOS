/**
 * Phase A — Platform Tables
 *
 * tags, entity_tags, attachments, attachment_relations,
 * feature_flags, activity_logs
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';

// ── Tags ───────────────────────────────────────────────

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  colorToken: varchar('color_token', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Entity Tags (polymorphic) ──────────────────────────

export const entityTags = pgTable('entity_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Attachments ────────────────────────────────────────

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 200 }),
  sizeBytes: varchar('size_bytes', { length: 20 }),
  storageUrl: text('storage_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Attachment Relations (polymorphic) ──────────────────

export const attachmentRelations = pgTable('attachment_relations', {
  id: uuid('id').defaultRandom().primaryKey(),
  attachmentId: uuid('attachment_id')
    .notNull()
    .references(() => attachments.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Feature Flags ──────────────────────────────────────

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, {
    onDelete: 'cascade',
  }),
  flagKey: varchar('flag_key', { length: 100 }).notNull(),
  enabled: boolean('enabled').notNull().default(false),
  metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Activity Logs ──────────────────────────────────────

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    actionType: varchar('action_type', { length: 50 }).notNull(),
    payloadJson: jsonb('payload_json').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsCreatedIdx: index('idx_activity_log_ws').on(
      table.workspaceId,
      table.createdAt,
    ),
  }),
);

// ── Relations ──────────────────────────────────────────

export const tagsRelations = relations(tags, ({ many }) => ({
  entityTags: many(entityTags),
}));

export const entityTagsRelations = relations(entityTags, ({ one }) => ({
  tag: one(tags, {
    fields: [entityTags.tagId],
    references: [tags.id],
  }),
}));

// ── Sync Jobs ──────────────────────────────────────────

export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  integrationType: varchar('integration_type', { length: 50 }).notNull(),
  entityScope: varchar('entity_scope', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  runMode: varchar('run_mode', { length: 50 }).notNull().default('manual'),
  cursor: varchar('cursor', { length: 500 }),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

