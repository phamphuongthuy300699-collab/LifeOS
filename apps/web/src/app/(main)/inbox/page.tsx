'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Inbox as InboxIcon,
  Mail,
  NotebookPen,
  Plus,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type InboxUnifiedItem,
  useCreateTaskFromMail,
  useInboxUnified,
  useTriageInboxItemMutation,
  useUpdateInboxItemStatus,
  useUpdateMailActionState,
} from '@/shared/hooks/use-inbox';
import {
  useCompleteTask,
  useCreateTask,
  useLinkTaskAny,
  useSnoozeTaskAny,
  useUpdateTaskAny,
} from '@/shared/hooks/use-tasks';
import { describeApiError } from '@/shared/lib/api';

type Segment = 'all' | 'mail' | 'tasks' | 'notes' | 'events' | 'snoozed';

function formatDateTime(value?: string): string {
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

function toLocalDatetimeInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetimeInputValue(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toType(segment: Segment): 'all' | 'email' | 'task' | 'note' | 'event' | 'snoozed' {
  if (segment === 'mail') return 'email';
  if (segment === 'tasks') return 'task';
  if (segment === 'notes') return 'note';
  if (segment === 'events') return 'event';
  if (segment === 'snoozed') return 'snoozed';
  return 'all';
}

function providerBadge(provider?: string) {
  const text = provider ? provider.toUpperCase() : 'UNKNOWN';
  return (
    <span className="rounded-full border border-outline-variant bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
      {text}
    </span>
  );
}

export default function InboxPage() {
  const [segment, setSegment] = useState<Segment>('all');
  const [sourceProvider, setSourceProvider] = useState<string>('all');

  const queryParams = useMemo(
    () => ({
      type: toType(segment),
      sourceProvider: sourceProvider === 'all' ? undefined : sourceProvider,
      limit: 50,
    }),
    [segment, sourceProvider],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useInboxUnified(queryParams);

  const updateMailActionMutation = useUpdateMailActionState();
  const createTaskFromMailMutation = useCreateTaskFromMail();
  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTaskAny();
  const snoozeTaskMutation = useSnoozeTaskAny();
  const triageInboxItemMutation = useTriageInboxItemMutation();
  const updateInboxItemStatusMutation = useUpdateInboxItemStatus();
  const linkTaskMutation = useLinkTaskAny();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueAt, setQuickDueAt] = useState('');
  const [quickPriority, setQuickPriority] = useState<'urgent' | 'high' | 'medium' | 'low' | 'none'>('medium');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const busy =
    updateMailActionMutation.isPending ||
    createTaskFromMailMutation.isPending ||
    completeTaskMutation.isPending ||
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    snoozeTaskMutation.isPending ||
    triageInboxItemMutation.isPending ||
    updateInboxItemStatusMutation.isPending ||
    linkTaskMutation.isPending;

  const segments = [
    { key: 'all' as const, label: 'Все', count: data?.counts.all ?? 0 },
    { key: 'mail' as const, label: 'Почта', count: data?.counts.email ?? 0 },
    { key: 'tasks' as const, label: 'Задачи', count: data?.counts.task ?? 0 },
    { key: 'notes' as const, label: 'Заметки', count: data?.counts.note ?? 0 },
    { key: 'events' as const, label: 'События', count: data?.counts.event ?? 0 },
    { key: 'snoozed' as const, label: 'Отложенные', count: data?.counts.snoozed ?? 0 },
  ];

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
      await refetch();
    } catch (actionErr) {
      const { userMessage, debugMessage } = describeApiError(actionErr, endpoint);
      setActionError(userMessage);
      console.error('Inbox action failed', debugMessage);
    }
  };

  const handleQuickTaskCreate = async () => {
    if (!quickTitle.trim()) return;

    await runAction(
      () =>
        createTaskMutation.mutateAsync({
          title: quickTitle.trim(),
          priority: quickPriority,
          dueAt: quickDueAt ? new Date(quickDueAt).toISOString() : undefined,
          sourceType: 'inbox',
        }),
      '/tasks',
      'Задача добавлена во входящие.',
    );

    setQuickTitle('');
    setQuickDueAt('');
    setQuickPriority('medium');
  };

  const handleEmailAction = async (
    item: InboxUnifiedItem,
    action: 'done' | 'snoozed' | 'create-task',
  ) => {
    if (action === 'create-task') {
      await runAction(
        () => createTaskFromMailMutation.mutateAsync(item.id),
        '/mail/messages/:id/create-task',
        'Задача из письма создана.',
      );
      return;
    }

    await runAction(
      () =>
        updateMailActionMutation.mutateAsync({
          messageId: item.id,
          triageStatus: action,
        }),
      '/mail/messages/:id/action-state',
      action === 'done' ? 'Письмо отмечено как done.' : 'Письмо отправлено в snooze.',
    );
  };

  const handleTaskAction = async (
    item: InboxUnifiedItem,
    action: 'complete' | 'plan-today' | 'due-tomorrow' | 'set-due' | 'snooze',
  ) => {
    if (action === 'complete') {
      await runAction(
        () => completeTaskMutation.mutateAsync(item.id),
        '/tasks/:id/complete',
        'Задача закрыта.',
      );
      return;
    }

    if (action === 'plan-today') {
      await runAction(
        () =>
          updateTaskMutation.mutateAsync({
            taskId: item.id,
            data: {
              status: 'todo',
              scheduledStartAt: new Date().toISOString(),
            },
          }),
        '/tasks/:id',
        'Задача запланирована на сегодня.',
      );
      return;
    }

    if (action === 'set-due') {
      const suggestedDue = new Date();
      suggestedDue.setDate(suggestedDue.getDate() + 1);
      suggestedDue.setHours(12, 0, 0, 0);

      const typedValue = window.prompt(
        'Укажите дедлайн в формате YYYY-MM-DDTHH:mm',
        toLocalDatetimeInputValue(suggestedDue),
      );

      if (!typedValue) return;

      const dueAt = fromLocalDatetimeInputValue(typedValue);
      if (!dueAt) {
        setActionError('Некорректный формат даты. Используйте YYYY-MM-DDTHH:mm');
        return;
      }

      await runAction(
        () =>
          updateTaskMutation.mutateAsync({
            taskId: item.id,
            data: {
              status: 'todo',
              dueAt,
            },
          }),
        '/tasks/:id',
        'Дедлайн задачи обновлен.',
      );
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    await runAction(
      () =>
        snoozeTaskMutation.mutateAsync({
          taskId: item.id,
          dueAt: tomorrow.toISOString(),
        }),
      '/tasks/:id/snooze',
      action === 'due-tomorrow' ? 'Дедлайн перенесен на завтра.' : 'Задача отложена.',
    );
  };

  const handleCaptureAction = async (
    item: InboxUnifiedItem,
    targetType: 'task' | 'note' | 'event' | 'archive',
  ) => {
    if (targetType === 'archive') {
      await runAction(
        () => updateInboxItemStatusMutation.mutateAsync({ itemId: item.id, status: 'archived' }),
        '/inbox-items/:id',
        'Capture item архивирован.',
      );
      return;
    }

    await runAction(
      () =>
        triageInboxItemMutation.mutateAsync({
          itemId: item.id,
          data: {
            targetType,
            title: item.title,
            body: item.snippet,
          },
        }),
      '/inbox-items/:id/triage',
      `Capture item преобразован в ${targetType}.`,
    );
  };

  const handleNoteCreateTask = async (item: InboxUnifiedItem) => {
    const createdTask = await createTaskMutation.mutateAsync({
      title: item.title,
      description: item.snippet,
      priority: 'none',
      sourceType: 'inbox',
    });

    await runAction(
      () =>
        linkTaskMutation.mutateAsync({
          taskId: createdTask.id,
          relatedEntityType: 'note',
          relatedEntityId: item.id,
          relationKind: 'source_note',
        }),
      '/tasks/:id/link',
      'Задача создана и связана с заметкой.',
    );
  };

  if (isLoading) {
    return <div className="px-6 py-8 text-on-surface-variant">Загрузка Inbox...</div>;
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <h1 className="text-xl font-semibold text-on-surface">Inbox временно недоступен</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {(error as Error)?.message || 'Не удалось загрузить unified incoming stream.'}
          </p>
          <Button className="mt-4 rounded-full" onClick={() => refetch()}>
            Повторить
          </Button>
        </section>
      </main>
    );
  }

  const items = data?.items ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Inbox Triage Center</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Единый поток входящего: письма, задачи, capture, заметки и события.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Обновить
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {segments.map((item) => {
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
                {item.label} • {item.count}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs uppercase tracking-wider text-on-surface-variant">Provider</label>
          <select
            value={sourceProvider}
            onChange={(event) => setSourceProvider(event.target.value)}
            className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none"
          >
            <option value="all">All</option>
            <option value="google">Google</option>
            <option value="gmail">Gmail</option>
            <option value="yandex">Yandex</option>
            <option value="manual">Manual</option>
            <option value="voice">Voice</option>
            <option value="note">Note</option>
            <option value="inbox">Inbox</option>
          </select>
        </div>

        <div className="mt-5 rounded-lg border border-outline-variant bg-surface-container-low p-3">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Quick task capture</p>
          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-4">
            <input
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none lg:col-span-2"
              placeholder="Что нужно сделать?"
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none"
              value={quickDueAt}
              onChange={(event) => setQuickDueAt(event.target.value)}
            />
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none"
              value={quickPriority}
              onChange={(event) =>
                setQuickPriority(
                  event.target.value as 'urgent' | 'high' | 'medium' | 'low' | 'none',
                )
              }
            >
              <option value="urgent">urgent</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
              <option value="none">none</option>
            </select>
          </div>
          <Button
            className="mt-2 h-9 rounded-full"
            onClick={handleQuickTaskCreate}
            disabled={busy || !quickTitle.trim()}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Добавить задачу
          </Button>
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

      <section className="space-y-3">
        {items.length === 0 ? (
          <article className="rounded-xl border border-outline-variant bg-surface p-6 text-sm text-on-surface-variant">
            Нет элементов в выбранном сегменте.
          </article>
        ) : (
          items.map((item) => {
            const isEmail = item.type === 'email';
            const isTask = item.type === 'task';
            const isCapture = item.type === 'capture';
            const isNote = item.type === 'note';
            const isEvent = item.type === 'event';

            return (
              <article
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-outline-variant bg-surface p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-outline-variant bg-surface-container-low px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {item.type}
                      </span>
                      {providerBadge(item.sourceProvider)}
                      <span className="rounded-full border border-outline-variant bg-surface-container-low px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {item.status}
                      </span>
                    </div>

                    <h3 className="truncate text-base font-semibold text-on-surface">{item.title}</h3>
                    {item.subtitle ? (
                      <p className="mt-1 truncate text-sm text-on-surface-variant">{item.subtitle}</p>
                    ) : null}
                    {item.snippet ? (
                      <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{item.snippet}</p>
                    ) : null}

                    <p className="mt-2 text-xs text-on-surface-variant">
                      received: {formatDateTime(item.receivedAt)} • created: {formatDateTime(item.createdAt)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-on-surface-variant">
                      {item.priority ? <span>priority: {item.priority}</span> : null}
                      {item.dueAt ? <span>due: {formatDateTime(item.dueAt)}</span> : null}
                      {item.scheduledAt ? <span>scheduled: {formatDateTime(item.scheduledAt)}</span> : null}
                      {item.linkedTaskId ? (
                        <Link href={`/tasks/${item.linkedTaskId}`} className="font-semibold text-primary hover:underline">
                          linked task
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isEmail ? (
                      <>
                        <Link href={`/mail/${item.id}`}>
                          <Button variant="outline" className="h-8 rounded-full px-3">
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Open
                          </Button>
                        </Link>
                        {!item.linkedTaskId ? (
                          <Button
                            className="h-8 rounded-full px-3"
                            onClick={() => handleEmailAction(item, 'create-task')}
                            disabled={busy}
                          >
                            Create Task
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleEmailAction(item, 'done')}
                          disabled={busy}
                        >
                          Done
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleEmailAction(item, 'snoozed')}
                          disabled={busy}
                        >
                          Snooze
                        </Button>
                      </>
                    ) : null}

                    {isTask ? (
                      <>
                        <Link href={`/tasks/${item.id}`}>
                          <Button variant="outline" className="h-8 rounded-full px-3">
                            <Tag className="mr-1.5 h-3.5 w-3.5" />
                            Open
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleTaskAction(item, 'plan-today')}
                          disabled={busy}
                        >
                          Plan Today
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleTaskAction(item, 'due-tomorrow')}
                          disabled={busy}
                        >
                          Due +1d
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleTaskAction(item, 'set-due')}
                          disabled={busy}
                        >
                          Set Due Date
                        </Button>
                        <Button
                          className="h-8 rounded-full px-3"
                          onClick={() => handleTaskAction(item, 'complete')}
                          disabled={busy}
                        >
                          Complete
                        </Button>
                      </>
                    ) : null}

                    {isCapture ? (
                      <>
                        <Button
                          className="h-8 rounded-full px-3"
                          onClick={() => handleCaptureAction(item, 'task')}
                          disabled={busy}
                        >
                          Create Task
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleCaptureAction(item, 'note')}
                          disabled={busy}
                        >
                          Create Note
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleCaptureAction(item, 'event')}
                          disabled={busy}
                        >
                          Create Event
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => handleCaptureAction(item, 'archive')}
                          disabled={busy}
                        >
                          Archive
                        </Button>
                      </>
                    ) : null}

                    {isNote ? (
                      <>
                        <Button
                          className="h-8 rounded-full px-3"
                          onClick={() => handleNoteCreateTask(item)}
                          disabled={busy}
                        >
                          <NotebookPen className="mr-1.5 h-3.5 w-3.5" />
                          Create Task
                        </Button>
                      </>
                    ) : null}

                    {isEvent ? (
                      <Link href="/calendar">
                        <Button variant="outline" className="h-8 rounded-full px-3">
                          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                          Open Calendar
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <InboxIcon className="h-4 w-4" />
            Unified
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{data?.counts.all ?? 0}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <Mail className="h-4 w-4" />
            Email
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{data?.counts.email ?? 0}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <Sparkles className="h-4 w-4" />
            Task
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{data?.counts.task ?? 0}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
            <Clock3 className="h-4 w-4" />
            Snoozed
          </p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{data?.counts.snoozed ?? 0}</p>
        </article>
      </section>
    </main>
  );
}
