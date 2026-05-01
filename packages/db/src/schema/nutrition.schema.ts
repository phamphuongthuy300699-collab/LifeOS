/**
 * Phase E — Nutrition (Sprint 5)
 *
 * nutrition_goals, food_items, meals, meal_entries, daily_nutrition_summaries
 */
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, workspaces } from './auth.schema';
import { EstimationMode, MealType } from '@lifeos/shared';
import { sourceTypeEnum } from './tasks.schema';

export const mealTypeEnum = pgEnum('meal_type', MealType);
export const estimationModeEnum = pgEnum('estimation_mode', EstimationMode);

export const nutritionGoals = pgTable(
  'nutrition_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    caloriesTarget: integer('calories_target'),
    proteinTargetG: numeric('protein_target_g', { precision: 8, scale: 2 }),
    fatTargetG: numeric('fat_target_g', { precision: 8, scale: 2 }),
    carbsTargetG: numeric('carbs_target_g', { precision: 8, scale: 2 }),

    effectiveFrom: timestamp('effective_from', { withTimezone: true })
      .notNull()
      .defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserEffectiveFromIdx: index('idx_nutrition_goals_ws_user_effective').on(
      table.workspaceId,
      table.userId,
      table.effectiveFrom,
    ),
  }),
);

export const foodItems = pgTable(
  'food_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 300 }).notNull(),
    brand: varchar('brand', { length: 250 }),
    caloriesPer100g: numeric('calories_per_100g', { precision: 8, scale: 2 }),
    proteinPer100g: numeric('protein_per_100g', { precision: 8, scale: 2 }),
    fatPer100g: numeric('fat_per_100g', { precision: 8, scale: 2 }),
    carbsPer100g: numeric('carbs_per_100g', { precision: 8, scale: 2 }),
    sourceType: sourceTypeEnum('source_type').notNull().default('manual'),
    isCustom: boolean('is_custom').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserNameIdx: index('idx_food_items_ws_user_name').on(
      table.workspaceId,
      table.userId,
      table.name,
    ),
  }),
);

export const meals = pgTable(
  'meals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    mealType: mealTypeEnum('meal_type').notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    sourceType: sourceTypeEnum('source_type').notNull().default('manual'),
    sourceRefType: varchar('source_ref_type', { length: 50 }),
    sourceRefId: uuid('source_ref_id'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserConsumedAtIdx: index('idx_meals_ws_user_consumed_at').on(
      table.workspaceId,
      table.userId,
      table.consumedAt,
    ),
  }),
);

export const mealEntries = pgTable(
  'meal_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mealId: uuid('meal_id')
      .notNull()
      .references(() => meals.id, { onDelete: 'cascade' }),
    foodItemId: uuid('food_item_id').references(() => foodItems.id, {
      onDelete: 'set null',
    }),

    rawName: varchar('raw_name', { length: 300 }).notNull(),
    grams: numeric('grams', { precision: 8, scale: 2 }),
    portionCount: numeric('portion_count', { precision: 8, scale: 2 }),
    calories: numeric('calories', { precision: 8, scale: 2 }),
    proteinG: numeric('protein_g', { precision: 8, scale: 2 }),
    fatG: numeric('fat_g', { precision: 8, scale: 2 }),
    carbsG: numeric('carbs_g', { precision: 8, scale: 2 }),
    estimationMode: estimationModeEnum('estimation_mode')
      .notNull()
      .default('manual'),
    confidence: integer('confidence'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    mealIdx: index('idx_meal_entries_meal').on(table.mealId),
  }),
);

export const dailyNutritionSummaries = pgTable(
  'daily_nutrition_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    summaryDate: date('summary_date').notNull(),
    caloriesConsumed: numeric('calories_consumed', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    proteinConsumedG: numeric('protein_consumed_g', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    fatConsumedG: numeric('fat_consumed_g', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    carbsConsumedG: numeric('carbs_consumed_g', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wsUserDateUnique: uniqueIndex('uidx_daily_nutrition_summary_ws_user_date').on(
      table.workspaceId,
      table.userId,
      table.summaryDate,
    ),
  }),
);

export const nutritionGoalsRelations = relations(nutritionGoals, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [nutritionGoals.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [nutritionGoals.userId],
    references: [users.id],
  }),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [foodItems.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [foodItems.userId],
    references: [users.id],
  }),
  mealEntries: many(mealEntries),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [meals.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  entries: many(mealEntries),
}));

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  meal: one(meals, {
    fields: [mealEntries.mealId],
    references: [meals.id],
  }),
  foodItem: one(foodItems, {
    fields: [mealEntries.foodItemId],
    references: [foodItems.id],
  }),
}));

export const dailyNutritionSummariesRelations = relations(
  dailyNutritionSummaries,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [dailyNutritionSummaries.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [dailyNutritionSummaries.userId],
      references: [users.id],
    }),
  }),
);
