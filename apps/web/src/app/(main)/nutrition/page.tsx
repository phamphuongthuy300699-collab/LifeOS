'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDictionary } from '@/shared/lib/i18n';
import { ApiError, describeApiError } from '@/shared/lib/api';
import {
  type MealType,
  useAddQuickMeal,
  useDailyNutrition,
  useSetCurrentNutritionGoal,
} from '@/shared/hooks/use-nutrition';
import { Button } from '@/components/ui/button';
import { Flame, Salad, Target } from 'lucide-react';

const mealTypeOrder: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
];

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function NutritionPage() {
  const dict = getDictionary('ru');

  const { data, isLoading, isError, refetch } = useDailyNutrition();
  const setGoalMutation = useSetCurrentNutritionGoal();
  const addQuickMealMutation = useAddQuickMeal();

  const [mealType, setMealType] = useState<MealType>('snack');
  const [rawName, setRawName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalFat, setGoalFat] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');
  const [saveGoalError, setSaveGoalError] = useState<string | null>(null);
  const [saveGoalSuccess, setSaveGoalSuccess] = useState<string | null>(null);
  const [createMealError, setCreateMealError] = useState<string | null>(null);
  const [createMealSuccess, setCreateMealSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromQuery = new URLSearchParams(window.location.search).get('mealType');
    if (fromQuery && mealTypeOrder.includes(fromQuery as MealType)) {
      setMealType(fromQuery as MealType);
    }
  }, []);

  useEffect(() => {
    if (!data?.goal) return;
    setGoalCalories(data.goal.caloriesTarget?.toString() ?? '');
    setGoalProtein(data.goal.proteinTargetG?.toString() ?? '');
    setGoalFat(data.goal.fatTargetG?.toString() ?? '');
    setGoalCarbs(data.goal.carbsTargetG?.toString() ?? '');
  }, [data?.goal]);

  const todayMeals = useMemo(() => data?.meals ?? [], [data?.meals]);

  const handleSetGoal = async () => {
    setSaveGoalError(null);
    setSaveGoalSuccess(null);
    try {
      await setGoalMutation.mutateAsync({
        caloriesTarget: toNumberOrUndefined(goalCalories) ?? null,
        proteinTargetG: toNumberOrUndefined(goalProtein) ?? null,
        fatTargetG: toNumberOrUndefined(goalFat) ?? null,
        carbsTargetG: toNumberOrUndefined(goalCarbs) ?? null,
      });
      await refetch();
      setSaveGoalSuccess('Цели КБЖУ сохранены.');
    } catch (error) {
      const { userMessage, debugMessage } = describeApiError(
        error,
        '/nutrition-goals/current',
      );
      setSaveGoalError(userMessage);
      console.error('Failed to save nutrition goals', debugMessage);
      if (error instanceof ApiError) {
        console.error('Failed to save nutrition goals payload', error.details);
      }
    }
  };

  const handleAddQuickMeal = async () => {
    if (!rawName.trim()) return;
    setCreateMealError(null);
    setCreateMealSuccess(null);
    try {
      await addQuickMealMutation.mutateAsync({
        mealType,
        rawName: rawName.trim(),
        calories: toNumberOrUndefined(calories),
        proteinG: toNumberOrUndefined(protein),
        fatG: toNumberOrUndefined(fat),
        carbsG: toNumberOrUndefined(carbs),
      });
      await refetch();
      setCreateMealSuccess('Приём пищи сохранён.');
      setRawName('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
    } catch (error) {
      const { userMessage, debugMessage } = describeApiError(
        error,
        '/meals + /meals/:id/entries',
      );
      setCreateMealError(userMessage);
      console.error('Failed to create meal', debugMessage);
      if (error instanceof ApiError) {
        console.error('Failed to create meal payload', error.details);
      }
    }
  };

  if (isLoading && !data) {
    return (
      <main className="px-6 py-8">
        <p className="text-on-surface-variant">{dict.common.loading}</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <h2 className="text-xl font-semibold text-on-surface">Nutrition временно недоступен</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Не удалось загрузить данные питания. Проверь подключение к API или авторизацию.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <article className="rounded-xl border border-outline-variant bg-gradient-to-br from-primary to-secondary p-6 text-white lg:col-span-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5" />
            Sprint 5
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{dict.nutrition.title}</h1>
          <p className="mt-2 max-w-2xl text-white/85">
            Дневной баланс КБЖУ, быстрый ввод приемов пищи и связка с post-workout
            сценарием.
          </p>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface-container p-6 lg:col-span-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            {dict.nutrition.dailyGoal}
          </h2>
          <div className="space-y-1 text-sm text-on-surface">
            <p>
              {dict.nutrition.calories}: {data?.targets.calories ?? '—'} ккал
            </p>
            <p>
              {dict.nutrition.protein}: {Math.round(data?.targets.protein ?? 0)} г
            </p>
            <p>
              {dict.nutrition.fat}: {Math.round(data?.targets.fat ?? 0)} г
            </p>
            <p>
              {dict.nutrition.carbs}: {Math.round(data?.targets.carbs ?? 0)} г
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            {dict.nutrition.consumed}
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">
            {Math.round(data?.totals.calories ?? 0)}
          </p>
          <p className="text-sm text-on-surface-variant">{dict.nutrition.calories}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            {dict.nutrition.protein}
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">
            {Math.round(data?.totals.protein ?? 0)} г
          </p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            {dict.nutrition.fat}
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">
            {Math.round(data?.totals.fat ?? 0)} г
          </p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            {dict.nutrition.carbs}
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">
            {Math.round(data?.totals.carbs ?? 0)} г
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-7">
          <div className="mb-4 flex items-center gap-2">
            <Salad className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-on-surface">{dict.nutrition.addMeal}</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm text-on-surface-variant">
              Тип
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
              >
                {mealTypeOrder.map((item) => (
                  <option key={item} value={item}>
                    {dict.nutrition.mealType[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-on-surface-variant">
              Блюдо
              <input
                value={rawName}
                onChange={(e) => setRawName(e.target.value)}
                placeholder="Например: греческий йогурт"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface placeholder:text-on-surface-variant/70"
              />
            </label>
            <label className="text-sm text-on-surface-variant">
              {dict.nutrition.calories}
              <input
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="350"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
              />
            </label>
            <label className="text-sm text-on-surface-variant">
              {dict.nutrition.protein}, г
              <input
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="28"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
              />
            </label>
            <label className="text-sm text-on-surface-variant">
              {dict.nutrition.fat}, г
              <input
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="12"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
              />
            </label>
            <label className="text-sm text-on-surface-variant">
              {dict.nutrition.carbs}, г
              <input
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="40"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
              />
            </label>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleAddQuickMeal}
              disabled={addQuickMealMutation.isPending || !rawName.trim()}
              className="rounded-full"
            >
              {addQuickMealMutation.isPending ? 'Сохраняю...' : dict.nutrition.addMeal}
            </Button>
            {createMealError ? (
              <p className="mt-3 text-sm text-red-300">{createMealError}</p>
            ) : null}
            {createMealSuccess ? (
              <p className="mt-3 text-sm text-emerald-300">{createMealSuccess}</p>
            ) : null}
          </div>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-on-surface">Цели КБЖУ</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <input
              value={goalCalories}
              onChange={(e) => setGoalCalories(e.target.value)}
              placeholder="Калории, ккал"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
            />
            <input
              value={goalProtein}
              onChange={(e) => setGoalProtein(e.target.value)}
              placeholder="Белки, г"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
            />
            <input
              value={goalFat}
              onChange={(e) => setGoalFat(e.target.value)}
              placeholder="Жиры, г"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
            />
            <input
              value={goalCarbs}
              onChange={(e) => setGoalCarbs(e.target.value)}
              placeholder="Углеводы, г"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handleSetGoal}
              disabled={setGoalMutation.isPending}
              className="rounded-full"
            >
              {setGoalMutation.isPending ? 'Обновляю...' : 'Сохранить цели'}
            </Button>
            {saveGoalError ? (
              <p className="mt-3 text-sm text-red-300">{saveGoalError}</p>
            ) : null}
            {saveGoalSuccess ? (
              <p className="mt-3 text-sm text-emerald-300">{saveGoalSuccess}</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-on-surface">Приемы пищи сегодня</h2>

        {todayMeals.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Добавьте первый прием пищи.</p>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <article
                key={meal.id}
                className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-on-surface">
                    {dict.nutrition.mealType[meal.mealType]}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                    {new Date(meal.consumedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  {meal.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-on-surface">{entry.rawName}</span>
                      <span className="text-on-surface-variant">
                        {Math.round(entry.calories ?? 0)} ккал •{' '}
                        {Math.round(entry.proteinG ?? 0)}Б / {Math.round(entry.fatG ?? 0)}Ж /{' '}
                        {Math.round(entry.carbsG ?? 0)}У
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
