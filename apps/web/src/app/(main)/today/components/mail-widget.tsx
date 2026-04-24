'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/shared/lib/api';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

type MailWidgetMessage = {
  isUnread: boolean;
};

export function MailWidget() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchMail = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const res = await api.get<{ messages: MailWidgetMessage[] }>('/mail/threads');
        if (res.data.messages) {
          const unread = res.data.messages.filter((m) => m.isUnread).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to fetch mail widget data', err);
        setUnreadCount(0);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMail();
  }, []);

  return (
    <section className="bg-surface-container-high border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mail size={32} />}
      </div>
      <div className="flex-1 text-center md:text-left">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {loading
            ? 'Загружаю почту...'
            : unreadCount !== null
              ? `${unreadCount} unread emails`
              : 'Почта недоступна'}
        </h3>
        <p className="text-on-surface-variant mt-1">
          {hasError
            ? 'Проверьте подключение аккаунта и API.'
            : 'Review your inbox and triage new messages.'}
        </p>
      </div>
      <Link href="/mail" className="w-full md:w-auto">
        <button className="w-full bg-primary text-on-primary px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-shadow flex items-center justify-center gap-2">
          Open Mail <ArrowRight size={18} />
        </button>
      </Link>
    </section>
  );
}
