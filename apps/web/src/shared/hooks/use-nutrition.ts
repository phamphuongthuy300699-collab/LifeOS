import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout';

export type NutritionGoal = {
  id: string;
  caloriesTarget: number | null;
  proteinTargetG: number | null;
  fatTargetG: number | null;
  carbsTargetG: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type MealEntry = {
  id: string;
  mealId: string;
  rawName: string;
  grams: number | null;
  portionCount: number | null;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  createdAt: string;
};

export type Meal = {
  id: string;
  mealType: MealType;
  consumedAt: string;
  notes: string | null;
  entries: MealEntry[];
};

export type DailyNutritionData = {
  date: string;
  goal: NutritionGoal | null;
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  targets: {
    calories: number | null;
    protein: number;
    fat: number;
    carbs: number;
  };
  remaining: {
    calories: number | null;
    protein: number;
    fat: number;
    carbs: number;
  };
  meals: Meal[];
};

type SetGoalInput = {
  caloriesTarget?: number | null;
  proteinTargetG?: number | null;
  fatTargetG?: number | null;
  carbsTargetG?: number | null;
};

type AddQuickMealInput = {
  mealType: MealType;
  rawName: string;
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
};

const NUTRITION_MOCK_STORAGE_KEY = 'lifeos-nutrition-mock-v1';

type NutritionMockState = {
  goal: NutritionGoal | null;
  meals: Meal[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function asNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readMockState(): NutritionMockState {
  if (typeof window === 'undefined') {
    return { goal: null, meals: [] };
  }

  const raw = window.localStorage.getItem(NUTRITION_MOCK_STORAGE_KEY);
  if (!raw) {
    return { goal: null, meals: [] };
  }

  try {
    const parsed = JSON.parse(raw) as NutritionMockState;
    return {
      goal: parsed.goal ?? null,
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
    };
  } catch {
    return { goal: null, meals: [] };
  }
}

function writeMockState(state: NutritionMockState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NUTRITION_MOCK_STORAGE_KEY, JSON.stringify(state));
}

function buildDailyFromState(state: NutritionMockState): DailyNutritionData {
  const totals = state.meals
    .flatMap((meal) => meal.entries)
    .reduce(
      (acc, entry) => {
        acc.calories += entry.calories ?? 0;
        acc.protein += entry.proteinG ?? 0;
        acc.fat += entry.fatG ?? 0;
        acc.carbs += entry.carbsG ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );

  const targets = {
    calories: state.goal?.caloriesTarget ?? null,
    protein: state.goal?.proteinTargetG ?? 0,
    fat: state.goal?.fatTargetG ?? 0,
    carbs: state.goal?.carbsTargetG ?? 0,
  };

  return {
    date: nowIso(),
    goal: state.goal,
    totals,
    targets,
    remaining: {
      calories:
        targets.calories === null ? null : Math.max(0, targets.calories - totals.calories),
      protein: Math.max(0, targets.protein - totals.protein),
      fat: Math.max(0, targets.fat - totals.fat),
      carbs: Math.max(0, targets.carbs - totals.carbs),
    },
    meals: state.meals,
  };
}

function normalizeMealEntry(item: Record<string, unknown>): MealEntry {
  return {
    id: String(item.id),
    mealId: String(item.mealId),
    rawName: String(item.rawName ?? ''),
    grams: item.grams == null ? null : asNumber(item.grams),
    portionCount: item.portionCount == null ? null : asNumber(item.portionCount),
    calories: item.calories == null ? null : asNumber(item.calories),
    proteinG: item.proteinG == null ? null : asNumber(item.proteinG),
    fatG: item.fatG == null ? null : asNumber(item.fatG),
    carbsG: item.carbsG == null ? null : asNumber(item.carbsG),
    createdAt: String(item.createdAt ?? nowIso()),
  };
}

function normalizeMeal(item: Record<string, unknown>): Meal {
  const entriesRaw = Array.isArray(item.entries) ? item.entries : [];
  return {
    id: String(item.id),
    mealType: String(item.mealType) as MealType,
    consumedAt: String(item.consumedAt ?? nowIso()),
    notes: (item.notes as string | null | undefined) ?? null,
    entries: entriesRaw.map((entry) =>
      normalizeMealEntry(entry as Record<string, unknown>),
    ),
  };
}

function normalizeGoal(item: Record<string, unknown> | null): NutritionGoal | null {
  if (!item) return null;
  return {
    id: String(item.id),
    caloriesTarget: item.caloriesTarget == null ? null : asNumber(item.caloriesTarget),
    proteinTargetG: item.proteinTargetG == null ? null : asNumber(item.proteinTargetG),
    fatTargetG: item.fatTargetG == null ? null : asNumber(item.fatTargetG),
    carbsTargetG: item.carbsTargetG == null ? null : asNumber(item.carbsTargetG),
    effectiveFrom: String(item.effectiveFrom ?? nowIso()),
    effectiveTo: (item.effectiveTo as string | null | undefined) ?? null,
  };
}

export function useDailyNutrition() {
  return useQuery({
    queryKey: ['nutrition', 'daily'],
    queryFn: async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>('/nutrition/daily');
        return {
          date: String(data.date ?? nowIso()),
          goal: normalizeGoal((data.goal as Record<string, unknown> | null) ?? null),
          totals: {
            calories: asNumber((data.totals as Record<string, unknown>)?.calories),
            protein: asNumber((data.totals as Record<string, unknown>)?.protein),
            fat: asNumber((data.totals as Record<string, unknown>)?.fat),
            carbs: asNumber((data.totals as Record<string, unknown>)?.carbs),
          },
          targets: {
            calories:
              (data.targets as Record<string, unknown>)?.calories == null
                ? null
                : asNumber((data.targets as Record<string, unknown>)?.calories),
            protein: asNumber((data.targets as Record<string, unknown>)?.protein),
            fat: asNumber((data.targets as Record<string, unknown>)?.fat),
            carbs: asNumber((data.targets as Record<string, unknown>)?.carbs),
          },
          remaining: {
            calories:
              (data.remaining as Record<string, unknown>)?.calories == null
                ? null
                : asNumber((data.remaining as Record<string, unknown>)?.calories),
            protein: asNumber((data.remaining as Record<string, unknown>)?.protein),
            fat: asNumber((data.remaining as Record<string, unknown>)?.fat),
            carbs: asNumber((data.remaining as Record<string, unknown>)?.carbs),
          },
          meals: (Array.isArray(data.meals) ? data.meals : []).map((item) =>
            normalizeMeal(item as Record<string, unknown>),
          ),
        } satisfies DailyNutritionData;
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        return buildDailyFromState(readMockState());
      }
    },
  });
}

export function useSetCurrentNutritionGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SetGoalInput) => {
      try {
        const params = new URLSearchParams();
        if (payload.caloriesTarget !== undefined && payload.caloriesTarget !== null) {
          params.set('caloriesTarget', String(payload.caloriesTarget));
        }
        if (payload.proteinTargetG !== undefined && payload.proteinTargetG !== null) {
          params.set('proteinTargetG', String(payload.proteinTargetG));
        }
        if (payload.fatTargetG !== undefined && payload.fatTargetG !== null) {
          params.set('fatTargetG', String(payload.fatTargetG));
        }
        if (payload.carbsTargetG !== undefined && payload.carbsTargetG !== null) {
          params.set('carbsTargetG', String(payload.carbsTargetG));
        }

        const endpoint = params.toString()
          ? `/nutrition-goals/current?${params.toString()}`
          : '/nutrition-goals/current';

        return await apiFetch<NutritionGoal>(endpoint, {
          method: 'PATCH',
        });
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const now = nowIso();
        const nextGoal: NutritionGoal = {
          id: makeId('goal'),
          caloriesTarget: payload.caloriesTarget ?? null,
          proteinTargetG: payload.proteinTargetG ?? null,
          fatTargetG: payload.fatTargetG ?? null,
          carbsTargetG: payload.carbsTargetG ?? null,
          effectiveFrom: now,
          effectiveTo: null,
        };

        writeMockState({
          ...state,
          goal: nextGoal,
        });

        return nextGoal;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
    },
  });
}

export function useAddQuickMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddQuickMealInput) => {
      try {
        const meal = await apiFetch<{ id: string }>('/meals', {
          method: 'POST',
          body: JSON.stringify({
            mealType: payload.mealType,
            consumedAt: nowIso(),
            sourceType: 'manual',
          }),
        });

        await apiFetch(`/meals/${meal.id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            rawName: payload.rawName,
            calories: payload.calories,
            proteinG: payload.proteinG,
            fatG: payload.fatG,
            carbsG: payload.carbsG,
            estimationMode: 'manual',
          }),
        });

        return meal;
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const mealId = makeId('meal');
        const createdAt = nowIso();

        const newEntry: MealEntry = {
          id: makeId('meal_entry'),
          mealId,
          rawName: payload.rawName,
          grams: null,
          portionCount: null,
          calories: payload.calories ?? null,
          proteinG: payload.proteinG ?? null,
          fatG: payload.fatG ?? null,
          carbsG: payload.carbsG ?? null,
          createdAt,
        };

        const newMeal: Meal = {
          id: mealId,
          mealType: payload.mealType,
          consumedAt: createdAt,
          notes: null,
          entries: [newEntry],
        };

        writeMockState({
          ...state,
          meals: [newMeal, ...state.meals],
        });

        return { id: mealId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
    },
  });
}
