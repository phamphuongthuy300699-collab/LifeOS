/**
 * Phase D — Workouts (Sprint 4)
 *
 * exercises, workout_plans, workout_plan_exercises,
 * workout_sessions, workout_session_exercises, workout_sets
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { Difficulty, SessionStatus } from '@lifeos/shared';

export const difficultyEnum = pgEnum('difficulty', Difficulty);
export const sessionStatusEnum = pgEnum('session_status', SessionStatus);

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull(),
    descriptionShort: text('description_short'),
    descriptionMarkdown: text('description_markdown'),
    muscleGroupsJson: jsonb('muscle_groups_json').$type<string[]>(),
    equipmentJson: jsonb('equipment_json').$type<string[]>(),
    difficulty: difficultyEnum('difficulty').default('intermediate'),
    defaultVideoUrl: text('default_video_url'),
    defaultRestSeconds: integer('default_rest_seconds'),
    isCustom: boolean('is_custom').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserNameIdx: index('idx_exercises_ws_user_name').on(
      table.workspaceId,
      table.userId,
      table.name,
    ),
    wsUserSlugUnique: uniqueIndex('uidx_exercises_ws_user_slug').on(
      table.workspaceId,
      table.userId,
      table.slug,
    ),
  }),
);

export const workoutPlans = pgTable(
  'workout_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 300 }).notNull(),
    goal: text('goal'),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    scheduleHintJson: jsonb('schedule_hint_json').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserActiveIdx: index('idx_workout_plans_ws_user_active').on(
      table.workspaceId,
      table.userId,
      table.isActive,
    ),
  }),
);

export const workoutPlanExercises = pgTable(
  'workout_plan_exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutPlanId: uuid('workout_plan_id')
      .notNull()
      .references(() => workoutPlans.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    targetSets: integer('target_sets'),
    targetReps: varchar('target_reps', { length: 100 }),
    targetWeight: varchar('target_weight', { length: 100 }),
    targetRestSeconds: integer('target_rest_seconds'),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    planOrderIdx: index('idx_workout_plan_exercises_plan_order').on(
      table.workoutPlanId,
      table.orderIndex,
    ),
  }),
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workoutPlanId: uuid('workout_plan_id').references(() => workoutPlans.id, {
      onDelete: 'set null',
    }),

    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    sessionStatus: sessionStatusEnum('session_status')
      .notNull()
      .default('active'),
    perceivedIntensity: integer('perceived_intensity'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserStartedIdx: index('idx_workout_sessions_ws_user_started').on(
      table.workspaceId,
      table.userId,
      table.startedAt,
    ),
  }),
);

export const workoutSessionExercises = pgTable(
  'workout_session_exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutSessionId: uuid('workout_session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    targetSchemeJson: jsonb('target_scheme_json').$type<Record<string, unknown>>(),
    previousResultJson: jsonb('previous_result_json').$type<
      Record<string, unknown>
    >(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionOrderIdx: index('idx_workout_session_exercises_session_order').on(
      table.workoutSessionId,
      table.orderIndex,
    ),
  }),
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutSessionExerciseId: uuid('workout_session_exercise_id')
      .notNull()
      .references(() => workoutSessionExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    weightValue: numeric('weight_value', { precision: 8, scale: 2 }),
    repsCount: integer('reps_count'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: integer('distance_meters'),
    rpe: integer('rpe'),
    rir: integer('rir'),
    isWarmup: boolean('is_warmup').notNull().default(false),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionExerciseSetUnique: uniqueIndex(
      'uidx_workout_sets_session_exercise_set',
    ).on(table.workoutSessionExerciseId, table.setNumber),
  }),
);

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [exercises.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
  workoutPlanExercises: many(workoutPlanExercises),
  workoutSessionExercises: many(workoutSessionExercises),
}));

export const workoutPlansRelations = relations(
  workoutPlans,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workoutPlans.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workoutPlans.userId],
      references: [users.id],
    }),
    exercises: many(workoutPlanExercises),
    sessions: many(workoutSessions),
  }),
);

export const workoutPlanExercisesRelations = relations(
  workoutPlanExercises,
  ({ one }) => ({
    plan: one(workoutPlans, {
      fields: [workoutPlanExercises.workoutPlanId],
      references: [workoutPlans.id],
    }),
    exercise: one(exercises, {
      fields: [workoutPlanExercises.exerciseId],
      references: [exercises.id],
    }),
  }),
);

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workoutSessions.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workoutSessions.userId],
      references: [users.id],
    }),
    workoutPlan: one(workoutPlans, {
      fields: [workoutSessions.workoutPlanId],
      references: [workoutPlans.id],
    }),
    exercises: many(workoutSessionExercises),
  }),
);

export const workoutSessionExercisesRelations = relations(
  workoutSessionExercises,
  ({ one, many }) => ({
    session: one(workoutSessions, {
      fields: [workoutSessionExercises.workoutSessionId],
      references: [workoutSessions.id],
    }),
    exercise: one(exercises, {
      fields: [workoutSessionExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(workoutSets),
  }),
);

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  sessionExercise: one(workoutSessionExercises, {
    fields: [workoutSets.workoutSessionExerciseId],
    references: [workoutSessionExercises.id],
  }),
}));
