/**
 * Phase B - Events Schema (Sprint 2)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';

export const eventStatusEnum = pgEnum('event_status', ['tentative', 'confirmed', 'cancelled']);

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // External sync
    sourceProvider: varchar('source_provider', { length: 30 }).notNull().default('manual'),
    calendarRef: varchar('calendar_ref', { length: 255 }), // e.g. google_calendar_id
    externalId: varchar('external_id', { length: 500 }),
    externalCalendarId: varchar('external_calendar_id', { length: 255 }),
    externalEventId: varchar('external_event_id', { length: 500 }),
    timezone: varchar('timezone', { length: 100 }),
    meetingUrl: text('meeting_url'),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),

    // Content
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 500 }),

    // Timeframe
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    isAllDay: boolean('is_all_day').default(false).notNull(),

    // Status
    status: eventStatusEnum('status').default('confirmed').notNull(),

    // Audit
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userTimeIdx: index('idx_events_user_time').on(
      table.userId,
      table.workspaceId,
      table.startAt,
      table.endAt
    ),
    wsProviderExternalEventIdx: uniqueIndex('uidx_events_ws_provider_external_event').on(
      table.workspaceId,
      table.sourceProvider,
      table.externalEventId,
    ),
  })
);

// ── Drizzle Relations ──────────────────────────────────

export const eventsRelations = relations(events, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [events.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));
