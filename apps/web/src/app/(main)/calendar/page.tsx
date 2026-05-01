'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useCalendarEvents,
  useCalendarOverdue,
  useCalendarToday,
  useCalendarUpcoming,
  useCreateEvent,
  useSyncGoogleCalendar,
} from '@/shared/hooks/use-calendar';
import { describeApiError } from '@/shared/lib/api';

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toIsoFromLocal(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

type CalendarSegment = 'today' | 'overdue' | 'next7' | 'events';

export default function CalendarPage() {
  const [segment, setSegment] = useState<CalendarSegment>('today');

  const now = useMemo(() => new Date(), []);
  const fromRange = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const toRange = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

  const { data: todayData, isLoading: todayLoading } = useCalendarToday();
  const { data: upcomingData, isLoading: upcomingLoading } = useCalendarUpcoming();
  const { data: overdueData, isLoading: overdueLoading } = useCalendarOverdue();
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useCalendarEvents({
    from: fromRange,
    to: toRange,
    limit: 300,
  });

  const syncGoogleMutation = useSyncGoogleCalendar();
  const createEventMutation = useCreateEvent();

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventEndAt, setEventEndAt] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isLoading = todayLoading || upcomingLoading || overdueLoading || eventsLoading;

  const runAction = async (
    runner: () => Promise<unknown>,
    endpoint: string,
    successMessage: string,
  ) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await runner();
      setActionSuccess(successMessage);
    } catch (error) {
      const { userMessage, debugMessage } = describeApiError(error, endpoint);
      setActionError(userMessage);
      console.error('Calendar action failed', debugMessage);
    }
  };

  const handleSyncGoogle = async () => {
    await runAction(
      () =>
        syncGoogleMutation.mutateAsync({
          from: fromRange,
          to: toRange,
          limit: 300,
        }),
      '/calendar/google/sync',
      'Google Calendar синхронизирован.',
    );

    await refetchEvents();
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventStartAt || !eventEndAt) {
      setActionError('Укажите название, начало и конец события.');
      return;
    }

    const startAtIso = toIsoFromLocal(eventStartAt);
    const endAtIso = toIsoFromLocal(eventEndAt);
    if (!startAtIso || !endAtIso) {
      setActionError('Некорректная дата/время события.');
      return;
    }

    await runAction(
      () =>
        createEventMutation.mutateAsync({
          title: eventTitle.trim(),
          startAt: startAtIso,
          endAt: endAtIso,
          location: eventLocation.trim() || undefined,
          status: 'confirmed',
        }),
      '/events',
      'Событие создано.',
    );

    setEventTitle('');
    setEventStartAt('');
    setEventEndAt('');
    setEventLocation('');
  };

  if (isLoading) {
    return <div className="px-6 py-8 text-on-surface-variant">Загрузка календаря...</div>;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-on-surface">
              <CalendarClock className="h-6 w-6 text-primary" />
              Calendar & Planning
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Today, overdue, ближайшие 7 дней и события (manual + Google sync).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={handleSyncGoogle}
              disabled={syncGoogleMutation.isPending}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {syncGoogleMutation.isPending ? 'Синхронизирую...' : 'Sync Google Calendar'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => refetchEvents()}
              disabled={eventsLoading}
            >
              Обновить события
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'today' as const, label: 'Сегодня' },
            { key: 'overdue' as const, label: 'Просрочено' },
            { key: 'next7' as const, label: '7 дней' },
            { key: 'events' as const, label: 'События' },
          ].map((item) => {
            const active = segment === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSegment(item.key)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Новое событие</p>
          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-4">
            <input
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none lg:col-span-2"
              placeholder="Название события"
              value={eventTitle}
              onChange={(event) => setEventTitle(event.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none"
              value={eventStartAt}
              onChange={(event) => setEventStartAt(event.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none"
              value={eventEndAt}
              onChange={(event) => setEventEndAt(event.target.value)}
            />
            <input
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none lg:col-span-3"
              placeholder="Локация / ссылка"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
            />
            <Button
              className="rounded-full"
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createEventMutation.isPending ? 'Создаю...' : 'Создать'}
            </Button>
          </div>
        </div>

        {actionError ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
        ) : null}

        {actionSuccess ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {actionSuccess}
          </div>
        ) : null}
      </section>

      {segment === 'today' ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Due today
            </h2>
            {(todayData?.dueToday ?? []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">На сегодня задач с дедлайном нет.</p>
            ) : (
              <div className="space-y-2">
                {(todayData?.dueToday ?? []).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                    <p className="font-semibold text-on-surface">{task.title}</p>
                    <p className="text-xs text-on-surface-variant">due: {formatDateTime(task.dueAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Scheduled today
            </h2>
            {(todayData?.scheduledToday ?? []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">Нет задач в расписании на сегодня.</p>
            ) : (
              <div className="space-y-2">
                {(todayData?.scheduledToday ?? []).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                    <p className="font-semibold text-on-surface">{task.title}</p>
                    <p className="text-xs text-on-surface-variant">start: {formatDateTime(task.scheduledStartAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-12">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Events today</h2>
            {(todayData?.events ?? []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">Событий на сегодня нет.</p>
            ) : (
              <div className="space-y-2">
                {(todayData?.events ?? []).map((event) => (
                  <article key={event.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                    <p className="font-semibold text-on-surface">{event.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatDateTime(event.startAt)} — {formatDateTime(event.endAt)}
                    </p>
                    <p className="text-xs text-on-surface-variant">provider: {event.sourceProvider}</p>
                    {event.meetingUrl ? (
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary"
                      >
                        Открыть встречу
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {segment === 'overdue' ? (
        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            Overdue
          </h2>
          {(overdueData?.items ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">Нет просроченных задач.</p>
          ) : (
            <div className="space-y-2">
              {(overdueData?.items ?? []).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <p className="font-semibold text-on-surface">{task.title}</p>
                  <p className="text-xs text-red-300">due: {formatDateTime(task.dueAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {segment === 'next7' ? (
        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Next 7 days
          </h2>
          {(upcomingData?.tasks ?? []).length === 0 && (upcomingData?.events ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">Ближайших задач и событий нет.</p>
          ) : (
            <div className="space-y-2">
              {(upcomingData?.tasks ?? []).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <p className="font-semibold text-on-surface">{task.title}</p>
                  <p className="text-xs text-on-surface-variant">
                    due/scheduled: {formatDateTime(task.dueAt || task.scheduledStartAt)}
                  </p>
                </Link>
              ))}
              {(upcomingData?.events ?? []).map((event) => (
                <article key={event.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <p className="font-semibold text-on-surface">{event.title}</p>
                  <p className="text-xs text-on-surface-variant">event: {formatDateTime(event.startAt)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {segment === 'events' ? (
        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Events feed ({eventsData?.items.length ?? 0})
          </h2>
          {(eventsData?.items ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">События отсутствуют. Выполните sync или создайте событие вручную.</p>
          ) : (
            <div className="space-y-2">
              {(eventsData?.items ?? []).map((event) => (
                <article key={event.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-on-surface">{event.title}</p>
                    <span className="rounded-full border border-outline-variant px-2 py-0.5 text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {event.sourceProvider}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {formatDateTime(event.startAt)} — {formatDateTime(event.endAt)}
                  </p>
                  {event.location ? <p className="text-xs text-on-surface-variant">{event.location}</p> : null}
                  {event.meetingUrl ? (
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary"
                    >
                      Открыть встречу
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            Overdue
          </div>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{overdueData?.total ?? 0}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <Clock3 className="h-4 w-4 text-primary" />
            Due today
          </div>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{todayData?.dueToday.length ?? 0}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Events synced
          </div>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{eventsData?.items.length ?? 0}</p>
        </article>
      </section>
    </main>
  );
}
