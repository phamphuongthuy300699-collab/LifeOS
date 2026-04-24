'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, CheckCircle, Clock } from 'lucide-react';

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

export default function MailInboxPage() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchMail = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const res = await api.get<{ messages: MailMessage[] }>('/mail/threads');
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch mail', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMail();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/mail/sync', {});
      // Usually we'd poll or use websockets, but for MVP we just show a toast and refresh shortly
      setTimeout(() => fetchMail(), 3000);
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  const getTriageIcon = (status: string) => {
    switch(status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'converted_to_task': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'snoozed': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Mail Triage
        </h1>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Sync Gmail
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : hasError ? (
        <div className="text-center py-12 text-muted-foreground">
          Не удалось загрузить почту. Проверьте подключение Gmail и API.
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No recent emails found. Try syncing.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const triageState = msg.actionStates?.[0]?.triageStatus || 'new';
            const isRead = !msg.isUnread;

            return (
              <Link key={msg.id} href={`/mail/${msg.id}`}>
                <div className={`p-4 rounded-xl border transition-colors hover:border-primary/50 cursor-pointer flex flex-col gap-2 ${isRead ? 'bg-card opacity-80' : 'bg-card font-medium shadow-sm'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 truncate">
                      <span className="text-sm text-muted-foreground">{msg.fromJson?.name || msg.fromJson?.email}</span>
                      <h3 className="text-base truncate mt-1">{msg.subject || '(No Subject)'}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.sentAt).toLocaleDateString()}
                      </span>
                      {getTriageIcon(triageState)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {msg.snippet}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
