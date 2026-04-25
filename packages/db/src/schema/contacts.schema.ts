import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users, workspaces } from './auth.schema';
import { sourceTypeEnum } from './tasks.schema';

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    firstName: varchar('first_name', { length: 160 }),
    lastName: varchar('last_name', { length: 160 }),
    displayName: varchar('display_name', { length: 300 }).notNull(),
    company: varchar('company', { length: 300 }),
    roleTitle: varchar('role_title', { length: 300 }),
    primaryEmail: varchar('primary_email', { length: 320 }),
    primaryPhone: varchar('primary_phone', { length: 80 }),
    shortProfile: text('short_profile'),
    notesMarkdown: text('notes_markdown'),
    lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true }),
    sourceType: sourceTypeEnum('source_type').default('manual'),
    externalProviderId: varchar('external_provider_id', { length: 200 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserDisplayNameIdx: index('idx_contacts_ws_user_display_name').on(
      table.workspaceId,
      table.userId,
      table.displayName,
    ),
    wsUserLastInteractionIdx: index('idx_contacts_ws_user_last_interaction').on(
      table.workspaceId,
      table.userId,
      table.lastInteractionAt,
    ),
  }),
);
