import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import {
  and,
  asc,
  desc,
  eq,
  foodItems,
  gte,
  inArray,
  lte,
  mealEntries,
  meals,
  nutritionGoals,
} from '@lifeos/db';
import {
  createMealEntrySchema,
  createMealSchema,
  updateCurrentNutritionGoalSchema,
  updateMealEntrySchema,
  updateMealSchema,
} from '@lifeos/domain-nutrition';
import { db } from '../config/db';
import { resolveNutritionContext } from './_nutrition-context';

export const nutritionRoutes = new Hono();

type NutritionGoalInsert = typeof nutritionGoals.$inferInsert;
type MealInsert = typeof meals.$inferInsert;
type MealEntryInsert = typeof mealEntries.$inferInsert;

type DailyMacroTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

function asNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toNumericString(value: number | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.toString();
}

function startOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

function aggregateEntryTotals(
  items: Array<typeof mealEntries.$inferSelect>,
): DailyMacroTotals {
  return items.reduce<DailyMacroTotals>(
    (acc, item) => {
      acc.calories += asNumber(item.calories);
      acc.protein += asNumber(item.proteinG);
      acc.fat += asNumber(item.fatG);
      acc.carbs += asNumber(item.carbsG);
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

/**
 * GET /api/v1/nutrition/daily
 * Daily nutrition overview with meals, entries and target deltas.
 */
nutritionRoutes.get('/nutrition/daily', async (c) => {
  const context = await resolveNutritionContext(c.req.raw);
  if (!context) {
    return c.json({ error: 'No workspace membership found' }, 403);
  }

  const { workspaceId, userId } = context;
  const dateParam = c.req.query('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  const mealRows = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.workspaceId, workspaceId),
        eq(meals.userId, userId),
        gte(meals.consumedAt, dayStart),
        lte(meals.consumedAt, dayEnd),
      ),
    )
    .orderBy(asc(meals.consumedAt));

  const mealIds = mealRows.map((item) => item.id);
  const entryRows =
    mealIds.length > 0
      ? await db
          .select()
          .from(mealEntries)
          .where(inArray(mealEntries.mealId, mealIds))
          .orderBy(asc(mealEntries.createdAt))
      : [];

  const goals = await db
    .select()
    .from(nutritionGoals)
    .where(
      and(
        eq(nutritionGoals.workspaceId, workspaceId),
        eq(nutritionGoals.userId, userId),
        lte(nutritionGoals.effectiveFrom, dayEnd),
      ),
    )
    .orderBy(desc(nutritionGoals.effectiveFrom));

  const activeGoal =
    goals.find((goal) => {
      if (!goal.effectiveTo) return true;
      return new Date(goal.effectiveTo) >= dayStart;
    }) ?? null;

  const entriesByMealId = new Map<string, (typeof mealEntries.$inferSelect)[]>();
  for (const row of entryRows) {
    const existing = entriesByMealId.get(row.mealId) ?? [];
    existing.push(row);
    entriesByMealId.set(row.mealId, existing);
  }

  const totals = aggregateEntryTotals(entryRows);
  const targets = {
    calories: activeGoal?.caloriesTarget ?? null,
    protein: asNumber(activeGoal?.proteinTargetG),
    fat: asNumber(activeGoal?.fatTargetG),
    carbs: asNumber(activeGoal?.carbsTargetG),
  };

  return c.json({
    date: dayStart.toISOString(),
    goal: activeGoal,
    totals,
    targets,
    remaining: {
      calories:
        targets.calories === null
          ? null
          : Math.max(0, targets.calories - totals.calories),
      protein: Math.max(0, targets.protein - totals.protein),
      fat: Math.max(0, targets.fat - totals.fat),
      carbs: Math.max(0, targets.carbs - totals.carbs),
    },
    meals: mealRows.map((meal) => ({
      ...meal,
      entries: entriesByMealId.get(meal.id) ?? [],
    })),
  });
});

/**
 * GET /api/v1/food-items
 * Food library for current user/workspace.
 */
nutritionRoutes.get('/food-items', async (c) => {
  const context = await resolveNutritionContext(c.req.raw);
  if (!context) {
    return c.json({ items: [] });
  }

  const { workspaceId, userId } = context;
  const search = (c.req.query('q') ?? '').trim().toLowerCase();

  const rows = await db
    .select()
    .from(foodItems)
    .where(and(eq(foodItems.workspaceId, workspaceId), eq(foodItems.userId, userId)))
    .orderBy(asc(foodItems.name));

  const items = search
    ? rows.filter((item) => item.name.toLowerCase().includes(search))
    : rows;

  return c.json({ items });
});

/**
 * POST /api/v1/meals
 * Create a meal card.
 */
nutritionRoutes.post('/meals', zValidator('json', createMealSchema), async (c) => {
  const context = await resolveNutritionContext(c.req.raw);
  if (!context) {
    return c.json({ error: 'No workspace membership found' }, 403);
  }

  const { workspaceId, userId } = context;
  const data = c.req.valid('json');

  const mealPayload = {
    workspaceId,
    userId,
    mealType: data.mealType,
    consumedAt: data.consumedAt ? new Date(data.consumedAt) : new Date(),
    sourceType: data.sourceType,
    sourceRefType: data.sourceRefType,
    sourceRefId: data.sourceRefId,
    notes: data.notes,
  } as MealInsert;

  const [createdMeal] = await db.insert(meals).values(mealPayload).returning();
  return c.json(createdMeal, 201);
});

/**
 * PATCH /api/v1/meals/:id
 * Update meal card.
 */
nutritionRoutes.patch('/meals/:id', zValidator('json', updateMealSchema), async (c) => {
  const context = await resolveNutritionContext(c.req.raw);
  if (!context) {
    return c.json({ error: 'No workspace membership found' }, 403);
  }

  const { workspaceId, userId } = context;
  const mealId = c.req.param('id');
  const data = c.req.valid('json');

  const [ownedMeal] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(
      and(
        eq(meals.id, mealId),
        eq(meals.workspaceId, workspaceId),
        eq(meals.userId, userId),
      ),
    )
    .limit(1);

  if (!ownedMeal) {
    return c.json({ error: 'Meal not found' }, 404);
  }

  const updatePayload = {
    mealType: data.mealType,
    consumedAt: data.consumedAt ? new Date(data.consumedAt) : undefined,
    notes: data.notes === null ? null : data.notes,
    updatedAt: new Date(),
  } as Partial<MealInsert>;

  const [updatedMeal] = await db
    .update(meals)
    .set(updatePayload)
    .where(eq(meals.id, mealId))
    .returning();

  return c.json(updatedMeal);
});

/**
 * POST /api/v1/meals/:id/entries
 * Add meal entry.
 */
nutritionRoutes.post(
  '/meals/:id/entries',
  zValidator('json', createMealEntrySchema),
  async (c) => {
    const context = await resolveNutritionContext(c.req.raw);
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const mealId = c.req.param('id');
    const data = c.req.valid('json');

    const [ownedMeal] = await db
      .select({ id: meals.id })
      .from(meals)
      .where(
        and(
          eq(meals.id, mealId),
          eq(meals.workspaceId, workspaceId),
          eq(meals.userId, userId),
        ),
      )
      .limit(1);

    if (!ownedMeal) {
      return c.json({ error: 'Meal not found' }, 404);
    }

    const entryPayload = {
      mealId,
      foodItemId: data.foodItemId,
      rawName: data.rawName,
      grams: toNumericString(data.grams),
      portionCount: toNumericString(data.portionCount),
      calories: toNumericString(data.calories),
      proteinG: toNumericString(data.proteinG),
      fatG: toNumericString(data.fatG),
      carbsG: toNumericString(data.carbsG),
      estimationMode: data.estimationMode,
      confidence: data.confidence,
    } as MealEntryInsert;

    const [createdEntry] = await db
      .insert(mealEntries)
      .values(entryPayload)
      .returning();

    await db
      .update(meals)
      .set({ updatedAt: new Date() } as Partial<MealInsert>)
      .where(eq(meals.id, mealId));

    return c.json(createdEntry, 201);
  },
);

/**
 * PATCH /api/v1/meal-entries/:id
 * Update meal entry by id.
 */
nutritionRoutes.patch(
  '/meal-entries/:id',
  zValidator('json', updateMealEntrySchema),
  async (c) => {
    const context = await resolveNutritionContext(c.req.raw);
    if (!context) {
      return c.json({ error: 'No workspace membership found' }, 403);
    }

    const { workspaceId, userId } = context;
    const entryId = c.req.param('id');
    const data = c.req.valid('json');

    const [ownedEntry] = await db
      .select({
        id: mealEntries.id,
        mealId: meals.id,
      })
      .from(mealEntries)
      .innerJoin(meals, eq(mealEntries.mealId, meals.id))
      .where(
        and(
          eq(mealEntries.id, entryId),
          eq(meals.workspaceId, workspaceId),
          eq(meals.userId, userId),
        ),
      )
      .limit(1);

    if (!ownedEntry) {
      return c.json({ error: 'Meal entry not found' }, 404);
    }

    const updatePayload = {
      foodItemId: data.foodItemId === null ? null : data.foodItemId,
      rawName: data.rawName,
      grams: toNumericString(data.grams),
      portionCount: toNumericString(data.portionCount),
      calories: toNumericString(data.calories),
      proteinG: toNumericString(data.proteinG),
      fatG: toNumericString(data.fatG),
      carbsG: toNumericString(data.carbsG),
      estimationMode: data.estimationMode,
      confidence: data.confidence === undefined ? undefined : data.confidence,
    } as Partial<MealEntryInsert>;

    const [updatedEntry] = await db
      .update(mealEntries)
      .set(updatePayload)
      .where(eq(mealEntries.id, entryId))
      .returning();

    await db
      .update(meals)
      .set({ updatedAt: new Date() } as Partial<MealInsert>)
      .where(eq(meals.id, ownedEntry.mealId));

    return c.json(updatedEntry);
  },
);

/**
 * PATCH /api/v1/nutrition-goals/current
 * Replace current nutrition goal with a new active goal row.
 */
nutritionRoutes.patch(
  '/nutrition-goals/current',
  async (c) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    c.header('x-request-id', requestId);
    console.info('[nutrition-goals.current.patch] request started', { requestId });

    try {
      const context = await resolveNutritionContext(c.req.raw);
      if (!context) {
        console.info('[nutrition-goals.current.patch] context missing', { requestId });
        return c.json({ error: 'No workspace membership found', requestId }, 403);
      }

      const { workspaceId, userId } = context;
      const payload = await c.req.json().catch(() => ({}));
      const parsedPayload = updateCurrentNutritionGoalSchema.safeParse(payload);
      if (!parsedPayload.success) {
        console.info('[nutrition-goals.current.patch] invalid payload', {
          requestId,
          issues: parsedPayload.error.issues,
          elapsedMs: Date.now() - startedAt,
        });
        return c.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid nutrition goal payload',
            details: parsedPayload.error.issues,
            requestId,
          },
          400,
        );
      }
      const data = parsedPayload.data;
      const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
      console.info('[nutrition-goals.current.patch] context resolved', {
        requestId,
        userId,
        workspaceId,
        payload: data,
      });

      const [createdGoal] = await db.transaction(async (tx) => {
        const existingGoals = await tx
          .select()
          .from(nutritionGoals)
          .where(
            and(
              eq(nutritionGoals.workspaceId, workspaceId),
              eq(nutritionGoals.userId, userId),
            ),
          )
          .orderBy(desc(nutritionGoals.effectiveFrom));

        console.info('[nutrition-goals.current.patch] existing goals loaded', {
          requestId,
          count: existingGoals.length,
        });

        const currentGoal = existingGoals.find((goal) => !goal.effectiveTo);
        console.info('[nutrition-goals.current.patch] current goal lookup', {
          requestId,
          found: Boolean(currentGoal),
          currentGoalId: currentGoal?.id ?? null,
        });
        if (currentGoal) {
          await tx
            .update(nutritionGoals)
            .set({
              effectiveTo: effectiveFrom,
              updatedAt: new Date(),
            } as Partial<NutritionGoalInsert>)
            .where(eq(nutritionGoals.id, currentGoal.id));
          console.info('[nutrition-goals.current.patch] old goal closed', {
            requestId,
            closedGoalId: currentGoal.id,
          });
        }

        const [newGoal] = await tx
          .insert(nutritionGoals)
          .values({
            workspaceId,
            userId,
            caloriesTarget:
              data.caloriesTarget === undefined ? undefined : data.caloriesTarget,
            proteinTargetG: toNumericString(data.proteinTargetG),
            fatTargetG: toNumericString(data.fatTargetG),
            carbsTargetG: toNumericString(data.carbsTargetG),
            effectiveFrom,
          } as NutritionGoalInsert)
          .returning();
        console.info('[nutrition-goals.current.patch] new goal inserted', {
          requestId,
          goalId: newGoal?.id ?? null,
        });

        return [newGoal] as const;
      });

      console.info('[nutrition-goals.current.patch] response sent', {
        requestId,
        status: 200,
        elapsedMs: Date.now() - startedAt,
      });
      return c.json({
        ...createdGoal,
        requestId,
      });
    } catch (error) {
      console.error('[nutrition-goals.current.patch] failed', {
        requestId,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(
        {
          code: 'NUTRITION_GOAL_UPDATE_FAILED',
          message: 'Failed to update nutrition goal',
          requestId,
        },
        500,
      );
    }
  },
);
