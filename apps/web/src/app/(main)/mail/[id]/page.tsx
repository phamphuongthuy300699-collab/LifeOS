'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiError, api, describeApiError } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Check, Clock, Reply, CheckSquare } from 'lucide-react';

type MailMessageDetails = {
  id: string;
  subject?: string | null;
  fromJson?: { name?: string; email?: string };
  toJson?: Array<{ name?: string; email?: string }>;
  sentAt: string;
  labelsJson?: string[];
  bodyHtml?: string | null;
  bodyText?: string | null;
  webUrl?: string | null;
};

export default function MailMessagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [message, setMessage] = useState<MailMessageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<null | 'done' | 'snoozed' | 'create-task'>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchMsg = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ message: MailMessageDetails }>(`/mail/messages/${id}`);
        if (res.data.message) {
          setMessage(res.data.message);
        }
      } catch (err) {
        const { userMessage, debugMessage } = describeApiError(err, '/mail/messages/:id');
        console.error('Failed to fetch message', debugMessage);
        setActionError(userMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchMsg();
  }, [id]);

  const updateState = async (triageStatus: 'done' | 'snoozed') => {
    try {
      setActionLoading(triageStatus);
      setActionError(null);
      setActionSuccess(null);
      await api.patch(
        `/mail/messages/${id}/action-state?triageStatus=${encodeURIComponent(triageStatus)}`,
      );
      setActionSuccess(
        triageStatus === 'done'
          ? 'Письмо отмечено как Done.'
          : 'Письмо перенесено в Snoozed.',
      );
      setTimeout(() => {
        router.push('/mail');
      }, 500);
    } catch (err) {
      const { userMessage, debugMessage } = describeApiError(
        err,
        '/mail/messages/:id/action-state',
      );
      setActionError(userMessage);
      console.error('Failed to update state', debugMessage);
      if (err instanceof ApiError) {
        console.error('Failed to update state payload', err.details);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const createTask = async () => {
    try {
      setActionLoading('create-task');
      setActionError(null);
      setActionSuccess(null);
      await api.post(`/mail/messages/${id}/create-task`, {});
      setActionSuccess('Задача создана из письма.');
      setTimeout(() => {
        router.push('/mail');
      }, 500);
    } catch (err) {
      const { userMessage, debugMessage } = describeApiError(
        err,
        '/mail/messages/:id/create-task',
      );
      setActionError(userMessage);
      console.error('Failed to create task', debugMessage);
      if (err instanceof ApiError) {
        console.error('Failed to create task payload', err.details);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!message) {
    return <div className="p-6">Message not found</div>;
  }

  const recipients = message.toJson ?? [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Actions */}
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mail')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState('done')}
            disabled={Boolean(actionLoading)}
          >
            <Check className="w-4 h-4 mr-2" />
            {actionLoading === 'done' ? 'Done...' : 'Done'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState('snoozed')}
            disabled={Boolean(actionLoading)}
          >
            <Clock className="w-4 h-4 mr-2" />
            {actionLoading === 'snoozed' ? 'Snoozing...' : 'Snooze'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={createTask}
            disabled={Boolean(actionLoading)}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {actionLoading === 'create-task' ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </div>

      {actionError ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Action error: {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mx-4 mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {actionSuccess}
        </div>
      ) : null}

      {/* Message Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">{message.subject || '(No Subject)'}</h1>
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="font-medium">{message.fromJson?.name || message.fromJson?.email}</p>
              <p className="text-muted-foreground">&lt;{message.fromJson?.email}&gt;</p>
              <div className="mt-1 flex gap-2">
                <span className="text-muted-foreground">To:</span>
                {recipients.map((t, i) => (
                  <span key={i}>{t.name || t.email}{i < recipients.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
            </div>
            <div className="text-right text-muted-foreground whitespace-nowrap">
              {new Date(message.sentAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Labels */}
        {message.labelsJson && message.labelsJson.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {message.labelsJson.filter((l: string) => !['UNREAD', 'INBOX'].includes(l)).map((label: string) => (
              <span key={label} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                {label}
              </span>
            ))}
          </div>
        )}

        <hr />

        {/* Body */}
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words">
          {message.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
          ) : message.bodyText ? (
            <pre className="whitespace-pre-wrap font-sans">{message.bodyText}</pre>
          ) : (
            <div className="text-muted-foreground italic flex flex-col items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mb-4" />
              Loading body... (Make sure the API fetches it)
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Reply Action */}
      <div className="p-4 border-t">
        <a href={message.webUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full">
            <Reply className="w-4 h-4 mr-2" /> Reply in Gmail
          </Button>
        </a>
      </div>
    </div>
  );
}
