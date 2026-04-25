'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getDictionary } from '@/shared/lib/i18n';
import { Activity, CheckCircle2, Dumbbell, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkoutSession } from '@/shared/hooks/use-workouts';

function toNumber(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function WorkoutSummaryPage() {
  const dict = getDictionary('ru');
  const params = useParams();
  const sessionId = params.id as string;

  const { data: session, isLoading } = useWorkoutSession(sessionId);

  const stats = useMemo(() => {
    if (!session) {
      return {
        completedSets: 0,
        exercisesDone: 0,
        totalVolume: 0,
        totalReps: 0,
        durationMinutes: 0,
      };
    }

    let completedSets = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let exercisesDone = 0;

    for (const exercise of session.exercises) {
      const doneSets = exercise.sets.filter((set) => set.isCompleted);
      if (doneSets.length > 0) {
        exercisesDone += 1;
      }
      for (const set of doneSets) {
        const reps = set.repsCount ?? 0;
        const weight = toNumber(set.weightValue);
        completedSets += 1;
        totalReps += reps;
        totalVolume += weight * reps;
      }
    }

    const startedAt = new Date(session.startedAt).getTime();
    const endedAt = session.endedAt
      ? new Date(session.endedAt).getTime()
      : Date.now();
    const durationMinutes = Math.max(
      0,
      Math.round((endedAt - startedAt) / 60_000),
    );

    return {
      completedSets,
      exercisesDone,
      totalVolume,
      totalReps,
      durationMinutes,
    };
  }, [session]);

  if (isLoading) {
    return (
      <div className="px-6 py-8 text-on-surface-variant">
        {dict.common.loading}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-6 py-8 text-on-surface">
        Не удалось загрузить summary тренировки.
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary-fixed">
          <CheckCircle2 className="h-4 w-4" />
          {dict.workout.summary}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
          Тренировка завершена
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Отличный прогресс. Ниже метрики сессии и быстрый переход в питание.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Подходы
          </p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">
            {stats.completedSets}
          </p>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Повторы
          </p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">
            {stats.totalReps}
          </p>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Объем
          </p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">
            {Math.round(stats.totalVolume).toLocaleString('ru-RU')}
          </p>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Время
          </p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">
            {stats.durationMinutes} мин
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-outline-variant bg-surface p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Упражнения в сессии
          </h2>
          <div className="space-y-2">
            {session.exercises.map((exercise) => {
              const doneSets = exercise.sets.filter((set) => set.isCompleted).length;
              return (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
                >
                  <span className="text-sm text-on-surface">
                    {exercise.exercise?.name || 'Exercise'}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {doneSets} подходов
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Статус
          </h2>
          <div className="space-y-3 text-sm text-on-surface">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>{stats.exercisesDone} упражнений с прогрессом</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span>Сессия: {session.sessionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span>Готово к post-workout приему пищи</span>
            </div>
          </div>
        </article>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/nutrition?mealType=post_workout">
          <Button className="rounded-full">{dict.nutrition.addMeal}</Button>
        </Link>
        <Link href="/workout">
          <Button variant="outline" className="rounded-full">
            К тренировкам
          </Button>
        </Link>
      </section>
    </main>
  );
}
