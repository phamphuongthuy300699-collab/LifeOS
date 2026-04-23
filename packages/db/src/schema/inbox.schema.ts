/**
 * Phase B — Inbox Tables
 *
 * inbox_items — raw captured inputs that need triage
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import {
  InboxSourceType,
  InboxStatus,
  CaptureChannel,
  TriageTargetType,
} from '@lifeos/shared';

// ── Enums ──────────────────────────────────────────────

export const inboxSourceTypeEnum = pgEnum('inbox_source_type', InboxSourceType);
export const inboxStatusEnum = pgEnum('inbox_status', InboxStatus);
export const captureChannelEnum = pgEnum('capture_channel', CaptureChannel);
export const triageTargetTypeEnum = pgEnum('triage_target_type', TriageTargetType);

// ── Inbox Items ────────────────────────────────────────

export const inboxItems = pgTable(
  'inbox_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Source tracking
    sourceType: inboxSourceTypeEnum('source_type').notNull().default('manual'),
    sourceRefType: varchar('source_ref_type', { length: 50 }),
    sourceRefId: uuid('source_ref_id'),

    // Content
    title: varchar('title', { length: 500 }),
    rawText: text('raw_text'),
    normalizedText: text('normalized_text'),

    // State
    status: inboxStatusEnum('status').notNull().default('pending'),
    captureChannel: captureChannelEnum('capture_channel')
      .notNull()
      .default('quick_add'),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    triagedAt: timestamp('triaged_at', { withTimezone: true }),

    // Result of triage
    createdEntityType: triageTargetTypeEnum('created_entity_type'),
    createdEntityId: uuid('created_entity_id'),

    // Flexible metadata
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
  },
  (table) => ({
    wsStatusCapturedIdx: index('idx_inbox_items_ws_status').on(
      table.workspaceId,
      table.userId,
      table.status,
      table.capturedAt,
    ),
  }),
);

// ── Relations ──────────────────────────────────────────

export const inboxItemsRelations = relations(inboxItems, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [inboxItems.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [inboxItems.userId],
    references: [users.id],
  }),
}));
