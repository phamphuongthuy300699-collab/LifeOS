'use client';

import { useState } from 'react';
import { getDictionary } from '@/shared/lib/i18n';
import { Button } from '@/components/ui/button';
import { useContacts, useCreateContact } from '@/shared/hooks/use-contacts';

export default function ContactsPage() {
  const dict = getDictionary('ru');
  const { data, isLoading } = useContacts();
  const createMutation = useCreateContact();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const items = data?.items ?? [];

  const onCreate = async () => {
    if (!displayName.trim()) return;
    await createMutation.mutateAsync({
      displayName: displayName.trim(),
      primaryEmail: email.trim() || undefined,
      company: company.trim() || undefined,
    });
    setDisplayName('');
    setEmail('');
    setCompany('');
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-content">{dict.contacts.title}</h1>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Новый контакт</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Имя"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Компания"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
        </div>
        <div className="mt-4">
          <Button className="rounded-full" onClick={onCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Сохраняю...' : 'Добавить контакт'}
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Контакты</h2>
        {isLoading && !data ? (
          <p className="text-sm text-on-surface-variant">{dict.common.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Контактов пока нет</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <article key={item.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="font-semibold text-on-surface">{item.displayName}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {item.primaryEmail || 'Без email'}{item.company ? ` • ${item.company}` : ''}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
