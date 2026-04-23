'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDictionary } from '@lifeos/i18n';
import {
  Activity,
  ArrowRight,
  Clock3,
  Dumbbell,
  Flame,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type WorkoutPlan,
  useBootstrapWorkoutDemo,
  useStartWorkoutSession,
  useWorkoutPlans,
} from '@/shared/hooks/use-workouts';

function formatPlanExercisesCount(plan: WorkoutPlan) {
  return `${plan.exercises.length} упражнений`;
}

export default function WorkoutPage() {
  const dict = getDictionary('ru');
  const router = useRouter();
  const { data, isLoading } = useWorkoutPlans();
  const startSessionMutation = useStartWorkoutSession();
  const bootstrapDemoMutation = useBootstrapWorkoutDemo();

  const plans = data?.items ?? [];
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const firstPlan = plans[0];
    if (!selectedPlanId && firstPlan) {
      setSelectedPlanId(firstPlan.id);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const handleStartWorkout = async () => {
    if (!selectedPlan) return;

    const session = await startSessionMutation.mutateAsync({
      workoutPlanId: selectedPlan.id,
    });
    router.push(`/workout/session/${session.id}`);
  };

  const handleBootstrapDemo = async () => {
    const createdPlan = await bootstrapDemoMutation.mutateAsync();
    setSelectedPlanId(createdPlan.id);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <p className="text-on-surface-variant">{dict.common.loading}</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-primary-fixed">
            Sprint 4
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-on-surface">
            {dict.workout.title}
          </h1>
          <p className="max-w-xl text-on-surface-variant">
            Планов пока нет. Создадим стартовый демо-план, чтобы сразу перейти в
            активную тренировку и проверить новый флоу.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleBootstrapDemo}
              disabled={bootstrapDemoMutation.isPending}
              className="rounded-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {bootstrapDemoMutation.isPending
                ? 'Создаю...'
                : 'Создать демо-план'}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-gradient-to-br from-primary to-secondary p-6 text-white lg:col-span-8">
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5" />
              Активный фокус
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {selectedPlan?.name}
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              {selectedPlan?.goal || 'Силовая тренировка с фокусом на прогресс'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-sm">
                <Dumbbell className="h-4 w-4" />
                {selectedPlan ? formatPlanExercisesCount(selectedPlan) : ''}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-sm">
                <Clock3 className="h-4 w-4" />
                ~ 60 мин
              </div>
            </div>
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 h-28 w-28 text-white/15" />
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container p-6 lg:col-span-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Готовность
            </p>
            <h2 className="text-2xl font-semibold text-on-surface">Workout Preview</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Запускаем сессию и переносим вас в Active workout mode.
            </p>
          </div>
          <Button
            onClick={handleStartWorkout}
            disabled={!selectedPlan || startSessionMutation.isPending}
            className="mt-6 h-12 rounded-full"
          >
            {startSessionMutation.isPending ? 'Запуск...' : dict.workout.startWorkout}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-5">
          <h3 className="mb-4 text-lg font-semibold text-on-surface">
            {dict.workout.plans}
          </h3>
          <div className="space-y-3">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/30'
                      : 'border-outline-variant bg-surface-container-low hover:border-primary/40'
                  }`}
                >
                  <p className="font-semibold text-on-surface">{plan.name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {plan.goal || 'Без описания'}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wider text-on-surface-variant">
                    {formatPlanExercisesCount(plan)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-on-surface">
              {dict.workout.exercises}
            </h3>
            <span className="text-xs uppercase tracking-wider text-on-surface-variant">
              {selectedPlan ? formatPlanExercisesCount(selectedPlan) : ''}
            </span>
          </div>

          <div className="space-y-3">
            {selectedPlan?.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">
                      {exercise.exercise?.name || 'Exercise'}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {exercise.targetSets || '-'} подходов •{' '}
                      {exercise.targetReps || '-'} повторений
                    </p>
                  </div>
                </div>
                <span className="text-sm text-on-surface-variant">
                  {exercise.targetWeight || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Activity className="h-4 w-4" />
            После завершения автоматически откроется Workout Summary с CTA в питание.
          </div>
          <Button
            variant="outline"
            onClick={handleBootstrapDemo}
            disabled={bootstrapDemoMutation.isPending}
            className="rounded-full"
          >
            Обновить демо-данные
          </Button>
        </div>
      </section>
    </main>
  );
}
