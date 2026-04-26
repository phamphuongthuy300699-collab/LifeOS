'use client';

import Link from 'next/link';
import { ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, Flame, Inbox, Rocket } from 'lucide-react';
import { getDictionary } from '@/shared/lib/i18n';
import { TaskCard } from '@/shared/components/task-card';
import { useTodayData, useCompleteTask } from '@/shared/hooks/use-tasks';
import { useLearningTracks } from '@/shared/hooks/use-learning';
import { useProjects } from '@/shared/hooks/use-projects';
import { useContacts } from '@/shared/hooks/use-contacts';
import { useWorkoutPlans } from '@/shared/hooks/use-workouts';
import { useDailyNutrition } from '@/shared/hooks/use-nutrition';

import { MailWidget } from './components/mail-widget';

function formatEventTime(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function TodayPage() {
  const dict = getDictionary('ru');
  const { data, isLoading, isError } = useTodayData();
  const completeMutation = useCompleteTask();
  const { data: learningData } = useLearningTracks();
  const { data: projectData } = useProjects();
  const { data: contactData } = useContacts();
  const { data: workoutPlansData } = useWorkoutPlans();
  const { data: nutritionData } = useDailyNutrition();

  const workoutPlan = workoutPlansData?.items?.[0] ?? null;

  const eveningSuggestion = (() => {
    const projects = projectData?.items ?? [];
    if (projects.length > 0) {
      return {
        title: 'Вечерний проектный контекст',
        text:
          projects[0]?.currentNextAction ||
          'Откройте проект и обновите next action на завтра.',
        href: '/projects',
        cta: 'Открыть проекты',
      };
    }

    const learning = learningData?.items ?? [];
    if (learning.length > 0) {
      return {
        title: 'Вечернее обучение',
        text: learning[0]?.goal || 'Продвиньте активный трек минимум на 30 минут.',
        href: '/learning',
        cta: 'Начать обучение',
      };
    }

    const contacts = contactData?.items ?? [];
    if (contacts.length > 0) {
      return {
        title: 'Вечерние контакты',
        text: 'Обновите заметку по ключевому контакту и зафиксируйте следующий шаг.',
        href: '/contacts',
        cta: 'Открыть контакты',
      };
    }

    return {
      title: 'Вечерний фокус',
      text: 'Добавьте первый учебный трек или проект, чтобы получать персональные рекомендации.',
      href: '/more',
      cta: 'Открыть разделы',
    };
  })();

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  if (isLoading && !data) {
    return <div className="p-6 text-on-surface-variant">{dict.common.loading}</div>;
  }

  if (isError) {
    return (
      <main className="px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <h2 className="text-xl font-semibold text-on-surface">Today временно недоступен</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Не удалось загрузить данные. Проверь подключение к API или настройки авторизации.
          </p>
        </section>
      </main>
    );
  }

  const pendingTasksCount = data?.topTasks?.length ?? 0;
  const todayEventsCount = data?.events?.length ?? 0;
  const unreadMailCount = data?.emailsRequiringAction?.length ?? 0;

  return (
    <main className="grid grid-cols-1 gap-gutter px-6 py-8 md:grid-cols-12">
      <div className="flex flex-col gap-xl md:col-span-8">
        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{dict.today.focusBlock}</p>
              <h2 className="mt-2 text-2xl font-semibold text-on-surface">{data?.focusBlock || 'Фокус дня ещё не задан'}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Сконцентрируйтесь на главной задаче до обеда, потом переключайтесь на обработку входящих.</p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed md:flex">
              <Rocket size={20} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Задачи
              </div>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{pendingTasksCount}</p>
            </article>
            <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                <CalendarDays className="h-3.5 w-3.5" />
                События
              </div>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{todayEventsCount}</p>
            </article>
            <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                <Inbox className="h-3.5 w-3.5" />
                Mail
              </div>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{unreadMailCount}</p>
            </article>
            <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                <BrainCircuit className="h-3.5 w-3.5" />
                Workout
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-on-surface">{workoutPlan?.name || 'План не выбран'}</p>
            </article>
            <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                <Flame className="h-3.5 w-3.5" />
                Ккал
              </div>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{Math.round(nutritionData?.totals.calories ?? 0)}</p>
            </article>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-on-surface">{dict.today.topTasks}</h3>
            <Link href="/projects" className="text-sm font-semibold text-primary">
              Все задачи
            </Link>
          </div>
          {data?.topTasks && data.topTasks.length > 0 ? (
            <ul className="space-y-3">
              {data.topTasks.map((task) => (
                <li key={task.id}>
                  <TaskCard task={task} onComplete={handleComplete} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-on-surface-variant">Сегодня нет активных задач. Добавьте первую через быстрый плюс.</p>
          )}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-on-surface">{dict.today.events}</h3>
            <span className="text-xs uppercase tracking-wider text-on-surface-variant">Календарь</span>
          </div>
          {data?.events && data.events.length > 0 ? (
            <div className="space-y-2">
              {data.events.map((event: any) => (
                <article
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3"
                >
                  <div>
                    <p className="font-medium text-on-surface">{event.title || 'Событие'}</p>
                    <p className="text-xs text-on-surface-variant">{event.location || 'Без локации'}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{formatEventTime(event.startAt)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">На сегодня событий в календаре нет.</p>
          )}
        </section>

        <MailWidget />
      </div>

      <aside className="flex flex-col gap-xl md:col-span-4">
        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Workout today</p>
          <h3 className="mt-2 text-xl font-semibold text-on-surface">{workoutPlan?.name || 'Подберите план'}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{workoutPlan?.goal || 'Откройте тренировку, чтобы выбрать план на сегодня.'}</p>
          <Link
            href="/workout"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-on-primary"
          >
            Открыть тренировку
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Nutrition summary</p>
          <h3 className="mt-2 text-xl font-semibold text-on-surface">Питание сегодня</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-on-surface">Ккал: {Math.round(nutritionData?.totals.calories ?? 0)}</p>
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-on-surface">Б: {Math.round(nutritionData?.totals.protein ?? 0)} г</p>
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-on-surface">Ж: {Math.round(nutritionData?.totals.fat ?? 0)} г</p>
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-on-surface">У: {Math.round(nutritionData?.totals.carbs ?? 0)} г</p>
          </div>
          <Link
            href="/nutrition"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-on-primary"
          >
            Открыть питание
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="relative overflow-hidden rounded-xl bg-inverse-surface p-6 text-inverse-on-surface">
          <h3 className="text-xl font-semibold">{eveningSuggestion.title}</h3>
          <p className="mt-2 text-sm text-outline-variant">{eveningSuggestion.text}</p>
          <Link href={eveningSuggestion.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-inverse-primary">
            {eveningSuggestion.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
        </section>
      </aside>
    </main>
  );
}
