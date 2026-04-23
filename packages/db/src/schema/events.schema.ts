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
    calendarRef: varchar('calendar_ref', { length: 255 }), // e.g. google_calendar_id
    externalId: varchar('external_id', { length: 500 }),

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
