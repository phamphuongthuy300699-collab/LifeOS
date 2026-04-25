import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { LearningStatus, MaterialType } from '@lifeos/shared';

export const learningStatusEnum = pgEnum('learning_status', LearningStatus);
export const materialTypeEnum = pgEnum('material_type', MaterialType);

export const learningTracks = pgTable(
  'learning_tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 300 }).notNull(),
    description: text('description'),
    status: learningStatusEnum('status').notNull().default('active'),
    goal: text('goal'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserStatusIdx: index('idx_learning_tracks_ws_user_status').on(
      table.workspaceId,
      table.userId,
      table.status,
    ),
  }),
);

export const learningTopics = pgTable(
  'learning_topics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    learningTrackId: uuid('learning_track_id')
      .notNull()
      .references(() => learningTracks.id, { onDelete: 'cascade' }),
    parentTopicId: uuid('parent_topic_id'),

    name: varchar('name', { length: 300 }).notNull(),
    description: text('description'),
    status: learningStatusEnum('status').notNull().default('active'),
    orderIndex: integer('order_index').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    trackOrderIdx: index('idx_learning_topics_track_order').on(
      table.learningTrackId,
      table.orderIndex,
    ),
  }),
);

export const learningMaterials = pgTable(
  'learning_materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    learningTrackId: uuid('learning_track_id').references(() => learningTracks.id, {
      onDelete: 'set null',
    }),
    topicId: uuid('topic_id').references(() => learningTopics.id, {
      onDelete: 'set null',
    }),

    title: varchar('title', { length: 400 }).notNull(),
    materialType: materialTypeEnum('material_type').notNull().default('article'),
    url: text('url'),
    status: learningStatusEnum('status').notNull().default('active'),
    estimateMinutes: integer('estimate_minutes'),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserStatusIdx: index('idx_learning_materials_ws_user_status').on(
      table.workspaceId,
      table.userId,
      table.status,
    ),
  }),
);

export const learningSessions = pgTable(
  'learning_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    learningTrackId: uuid('learning_track_id').references(() => learningTracks.id, {
      onDelete: 'set null',
    }),
    materialId: uuid('material_id').references(() => learningMaterials.id, {
      onDelete: 'set null',
    }),

    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserStartedIdx: index('idx_learning_sessions_ws_user_started').on(
      table.workspaceId,
      table.userId,
      table.startedAt,
    ),
  }),
);

export const learningTracksRelations = relations(learningTracks, ({ many }) => ({
  topics: many(learningTopics),
  materials: many(learningMaterials),
  sessions: many(learningSessions),
}));

export const learningTopicsRelations = relations(learningTopics, ({ one }) => ({
  track: one(learningTracks, {
    fields: [learningTopics.learningTrackId],
    references: [learningTracks.id],
  }),
}));

export const learningMaterialsRelations = relations(learningMaterials, ({ one }) => ({
  track: one(learningTracks, {
    fields: [learningMaterials.learningTrackId],
    references: [learningTracks.id],
  }),
  topic: one(learningTopics, {
    fields: [learningMaterials.topicId],
    references: [learningTopics.id],
  }),
}));

export const learningSessionsRelations = relations(learningSessions, ({ one }) => ({
  track: one(learningTracks, {
    fields: [learningSessions.learningTrackId],
    references: [learningTracks.id],
  }),
  material: one(learningMaterials, {
    fields: [learningSessions.materialId],
    references: [learningMaterials.id],
  }),
}));
