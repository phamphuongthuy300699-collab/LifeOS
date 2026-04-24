'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getDictionary } from '@/shared/lib/i18n';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useAddWorkoutSet,
  useUpdateWorkoutSession,
  useWorkoutSession,
} from '@/shared/hooks/use-workouts';

export default function ActiveWorkoutPage() {
  const dict = getDictionary('ru');
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data: session, isLoading } = useWorkoutSession(sessionId);
  const addSetMutation = useAddWorkoutSet(sessionId);
  const updateSessionMutation = useUpdateWorkoutSession(sessionId);

  const exercises = session?.exercises ?? [];
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const activeExercise = exercises[activeExerciseIndex];

  useEffect(() => {
    if (!activeExercise) return;

    const lastSet = [...activeExercise.sets]
      .sort((a, b) => a.setNumber - b.setNumber)
      .at(-1);

    setWeight(lastSet?.weightValue ? String(lastSet.weightValue) : '');
    setReps(lastSet?.repsCount ? String(lastSet.repsCount) : '');
  }, [activeExercise?.id]);

  const completedSets = useMemo(
    () =>
      session?.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets.filter((set) => set.isCompleted).length;
      }, 0) ?? 0,
    [session?.exercises],
  );

  const totalSets = useMemo(
    () =>
      session?.exercises.reduce((sum, exercise) => {
        const targetSets = exercise.targetSchemeJson?.targetSets;
        if (typeof targetSets === 'number') return sum + targetSets;
        return sum + 3;
      }, 0) ?? 0,
    [session?.exercises],
  );

  const handleCompleteSet = async () => {
    if (!activeExercise) return;

    const weightValue = Number(weight);
    const repsValue = Number(reps);

    await addSetMutation.mutateAsync({
      workoutSessionExerciseId: activeExercise.id,
      weightValue: Number.isFinite(weightValue) && weightValue > 0 ? weightValue : undefined,
      repsCount: Number.isFinite(repsValue) && repsValue >= 0 ? repsValue : undefined,
      isCompleted: true,
    });
  };

  const handleFinishWorkout = async () => {
    await updateSessionMutation.mutateAsync({
      sessionStatus: 'completed',
    });
    router.push(`/workout/session/${sessionId}/summary`);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8 text-on-surface-variant">
        {dict.common.loading}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-6 py-8">
        <p className="text-on-surface">Сессия не найдена.</p>
      </div>
    );
  }

  if (!activeExercise) {
    return (
      <div className="px-6 py-8">
        <p className="text-on-surface">
          В этой сессии пока нет упражнений. Вернитесь к плану и создайте новую.
        </p>
        <Link href="/workout" className="mt-4 inline-flex">
          <Button variant="outline">К планам</Button>
        </Link>
      </div>
    );
  }

  const isLastExercise = activeExerciseIndex === exercises.length - 1;
  const isFirstExercise = activeExerciseIndex === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <section className="flex items-center justify-between">
        <Link href="/workout" className="inline-flex items-center">
          <Button variant="ghost" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>

        <div className="rounded-full bg-primary-fixed px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-primary-fixed">
          Сет {completedSets} / {totalSets}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              Упражнение {activeExerciseIndex + 1} из {exercises.length}
            </p>
            <Link
              href="#"
              className="text-xs font-semibold uppercase tracking-wider text-primary"
            >
              {dict.workout.technique}
            </Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
            {activeExercise.exercise?.name || 'Exercise'}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Цель: {String(activeExercise.targetSchemeJson?.targetSets ?? 3)} ×{' '}
            {String(activeExercise.targetSchemeJson?.targetReps ?? 10)}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {dict.workout.weight}
              </span>
              <input
                type="number"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container px-4 text-lg text-on-surface outline-none transition focus:border-primary"
                placeholder="32"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {dict.workout.reps}
              </span>
              <input
                type="number"
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container px-4 text-lg text-on-surface outline-none transition focus:border-primary"
                placeholder="12"
              />
            </label>
          </div>

          <Button
            onClick={handleCompleteSet}
            disabled={addSetMutation.isPending}
            className="mt-6 h-12 w-full rounded-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {addSetMutation.isPending ? 'Сохраняю...' : 'Завершить подход'}
          </Button>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-outline-variant bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Выполненные подходы
            </h2>
            <div className="space-y-2">
              {activeExercise.sets.length === 0 && (
                <p className="text-sm text-on-surface-variant">
                  Пока нет подходов. Добавьте первый.
                </p>
              )}
              {activeExercise.sets
                .slice()
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  >
                    <span className="text-on-surface">
                      {dict.workout.set} {set.setNumber}
                    </span>
                    <span className="text-on-surface-variant">
                      {set.weightValue || '-'} кг × {set.repsCount || '-'}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Навигация по упражнениям
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setActiveExerciseIndex((index) => Math.max(0, index - 1))
                }
                disabled={isFirstExercise}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Предыдущее
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setActiveExerciseIndex((index) =>
                    Math.min(exercises.length - 1, index + 1),
                  )
                }
                disabled={isLastExercise}
                className="flex-1"
              >
                Следующее
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary-fixed/20 p-5">
            <div className="mb-3 flex items-center gap-2 text-on-primary-fixed">
              <Dumbbell className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Finish workout
              </span>
            </div>
            <Button
              onClick={handleFinishWorkout}
              disabled={updateSessionMutation.isPending}
              className="h-11 w-full rounded-full"
            >
              {updateSessionMutation.isPending
                ? 'Завершаю...'
                : dict.workout.finishWorkout}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
