'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError, api, describeApiError } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Inbox, Loader2, Mail } from 'lucide-react';

type MailActionState = {
  triageStatus: string;
};

type MailMessage = {
  id: string;
  fromJson?: { name?: string; email?: string };
  subject?: string | null;
  sentAt: string;
  isUnread: boolean;
  snippet?: string | null;
  actionStates?: MailActionState[];
};

type MailFilter = 'all' | 'new' | 'needs_action' | 'done' | 'snoozed' | 'converted_to_task';

const FILTERS: Array<{ key: MailFilter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'needs_action', label: 'К действию' },
  { key: 'done', label: 'Done' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'converted_to_task', label: 'В задачи' },
];

function getTriageStatus(message: MailMessage): string {
  return message.actionStates?.[0]?.triageStatus || 'new';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'snoozed':
      return 'Snoozed';
    case 'converted_to_task':
      return 'Task';
    case 'needs_action':
      return 'Action';
    case 'waiting':
      return 'Waiting';
    default:
      return 'New';
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'done':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    case 'snoozed':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    case 'converted_to_task':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    case 'needs_action':
      return 'border-violet-500/40 bg-violet-500/10 text-violet-300';
    default:
      return 'border-outline-variant bg-surface-container-low text-on-surface-variant';
  }
}

export default function MailInboxPage() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MailFilter>('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const fetchMail = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.get<{ messages: MailMessage[] }>('/mail/threads');
      setMessages(res.data.messages ?? []);
    } catch (err) {
      const { userMessage, debugMessage } = describeApiError(err, '/mail/threads');
      console.error('Failed to fetch mail', debugMessage);
      if (err instanceof ApiError) {
        console.error('Failed to fetch mail payload', err.details);
      }
      setLoadError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMail();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncError(null);
      setSyncSuccess(null);
      const res = await api.post<{
        importedCount?: number;
        updatedCount?: number;
        threadsCount?: number;
        messagesCount?: number;
      }>('/mail/sync', {});
      const imported = res.data.importedCount ?? 0;
      const updated = res.data.updatedCount ?? 0;
      const total = res.data.messagesCount ?? 0;
      setSyncSuccess(
        `Синхронизация завершена: импортировано ${imported}, обновлено ${updated}, всего писем ${total}.`,
      );
      await fetchMail();
    } catch (err) {
      const { userMessage, debugMessage } = describeApiError(err, '/mail/sync');
      console.error('Sync failed', debugMessage);
      if (err instanceof ApiError) {
        console.error('Sync failed payload', err.details);
      }
      setSyncError(userMessage);
    } finally {
      setSyncing(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages;
    return messages.filter((message) => getTriageStatus(message) === activeFilter);
  }, [activeFilter, messages]);

  const unreadCount = messages.filter((message) => message.isUnread).length;
  const needsActionCount = messages.filter(
    (message) => getTriageStatus(message) === 'needs_action' || getTriageStatus(message) === 'new',
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-on-surface">
              <Mail className="h-6 w-6 text-primary" />
              Mail Triage
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Разберите входящие письма: done, snooze или превратите в задачу.
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing} className="rounded-full">
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sync Gmail
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Всего писем</p>
            <p className="mt-1 text-xl font-semibold text-on-surface">{messages.length}</p>
          </article>
          <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Unread</p>
            <p className="mt-1 text-xl font-semibold text-on-surface">{unreadCount}</p>
          </article>
          <article className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Требуют действий</p>
            <p className="mt-1 text-xl font-semibold text-on-surface">{needsActionCount}</p>
          </article>
        </div>

        {syncSuccess ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {syncSuccess}
          </div>
        ) : null}

        {syncError ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Sync error: {syncError}
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Ошибка загрузки почты: {loadError}
          </div>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface text-on-surface hover:border-primary/50'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </section>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-on-surface-variant" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <section className="rounded-xl border border-outline-variant bg-surface p-8 text-center">
          <Inbox className="mx-auto h-8 w-8 text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            В этом фильтре пока нет писем. Запустите синхронизацию или переключите вкладку.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {filteredMessages.map((message) => {
            const status = getTriageStatus(message);
            const isUnread = message.isUnread;

            return (
              <Link key={message.id} href={`/mail/${message.id}`}>
                <article className="rounded-xl border border-outline-variant bg-surface p-4 transition hover:border-primary/50 hover:bg-surface-container-low">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isUnread ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                        <p className="truncate text-sm text-on-surface-variant">
                          {message.fromJson?.name || message.fromJson?.email || 'Unknown sender'}
                        </p>
                      </div>
                      <h3 className={`mt-1 truncate text-base ${isUnread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                        {message.subject || '(No subject)'}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                        {message.snippet || 'Без превью письма'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {new Date(message.sentAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {status === 'done' ? <CheckCircle className="h-4 w-4 text-emerald-300" /> : null}
                      {status === 'snoozed' ? <Clock className="h-4 w-4 text-amber-300" /> : null}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
