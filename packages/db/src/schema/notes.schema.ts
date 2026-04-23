/**
 * Phase B — Note Tables
 *
 * notes, note_relations
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { NoteType } from '@lifeos/shared';

// ── Enums ──────────────────────────────────────────────

export const noteTypeEnum = pgEnum('note_type', NoteType);

// Re-use source_type enum from tasks.schema if already created,
// otherwise we need a conditional. Since Drizzle deduplicates by name,
// we reference the same constant but only create it once in DB.
// We import SourceType for type safety but skip pgEnum here
// because tasks.schema.ts already defines source_type.

// ── Notes ──────────────────────────────────────────────

export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Content
  title: varchar('title', { length: 500 }),
  bodyMarkdown: text('body_markdown').notNull().default(''),
  noteType: noteTypeEnum('note_type').notNull().default('general'),

  // Source tracking
  sourceType: varchar('source_type', { length: 30 }).default('manual'),
  sourceRefType: varchar('source_ref_type', { length: 50 }),
  sourceRefId: uuid('source_ref_id'),
  createdFromInboxItemId: uuid('created_from_inbox_item_id'),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});

// ── Note Relations (polymorphic link) ──────────────────

export const noteRelations_table = pgTable('note_relations', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  relatedEntityType: varchar('related_entity_type', { length: 50 }).notNull(),
  relatedEntityId: uuid('related_entity_id').notNull(),
  relationKind: varchar('relation_kind', { length: 50 })
    .notNull()
    .default('link'),
  metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Drizzle Relations ──────────────────────────────────

export const notesRelations = relations(notes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [notes.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  relations: many(noteRelations_table),
}));

export const noteRelationsRelations = relations(
  noteRelations_table,
  ({ one }) => ({
    note: one(notes, {
      fields: [noteRelations_table.noteId],
      references: [notes.id],
    }),
  }),
);
