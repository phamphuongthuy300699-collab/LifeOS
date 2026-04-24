'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, CirclePlay, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExerciseById } from '@/shared/hooks/use-workouts';

function formatValueList(values: string[] | null | undefined): string {
  if (!values || values.length === 0) {
    return 'Не указано';
  }

  return values.join(', ');
}

export default function ExerciseTechniquePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exerciseId = params.exerciseId as string;
  const sessionId = searchParams.get('sessionId');

  const { data: exercise, isLoading, isError } = useExerciseById(exerciseId);

  const backHref = sessionId
    ? `/workout/session/${sessionId}`
    : '/workout';

  if (isLoading) {
    return <div className="px-6 py-8 text-on-surface-variant">Загрузка...</div>;
  }

  if (isError || !exercise) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <h1 className="text-2xl font-semibold text-on-surface">Техника недоступна</h1>
          <p className="mt-2 text-on-surface-variant">
            Не удалось загрузить карточку упражнения. Попробуйте открыть снова.
          </p>
          <Link href={backHref} className="mt-6 inline-flex">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к тренировке
            </Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <section className="flex items-center justify-between">
        <Link href={backHref} className="inline-flex items-center">
          <Button variant="ghost" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary-fixed">
          <Target className="h-4 w-4" />
          Technique sheet
        </div>

        <h1 className="text-3xl font-semibold text-on-surface">{exercise.name}</h1>
        <p className="mt-3 text-on-surface-variant">
          {exercise.descriptionShort || 'Описание отсутствует. Добавь краткий cue для этого упражнения.'}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Мышечные группы
            </p>
            <p className="text-sm text-on-surface">{formatValueList(exercise.muscleGroupsJson)}</p>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Оборудование
            </p>
            <p className="text-sm text-on-surface">{formatValueList(exercise.equipmentJson)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Уровень и отдых
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-on-surface">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/40 px-3 py-1">
              <Flame className="h-3.5 w-3.5" />
              {exercise.difficulty || 'intermediate'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-on-secondary-container">
              Rest {exercise.defaultRestSeconds || 90}s
            </span>
          </div>
        </div>

        {exercise.defaultVideoUrl && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Видео техники
            </p>
            <a
              href={exercise.defaultVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" className="rounded-full">
                <CirclePlay className="mr-2 h-4 w-4" />
                Открыть видео
              </Button>
            </a>
          </div>
        )}

        {exercise.descriptionMarkdown && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Подробные заметки
            </p>
            <p className="whitespace-pre-wrap text-sm text-on-surface">
              {exercise.descriptionMarkdown}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
