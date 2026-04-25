'use client';

import { useState } from 'react';
import { getDictionary } from '@/shared/lib/i18n';
import { Button } from '@/components/ui/button';
import { useCreateProject, useProjects } from '@/shared/hooks/use-projects';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function ProjectsPage() {
  const dict = getDictionary('ru');
  const { data, isLoading } = useProjects();
  const createMutation = useCreateProject();

  const [name, setName] = useState('');
  const [nextAction, setNextAction] = useState('');

  const items = data?.items ?? [];

  const onCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({
      name: name.trim(),
      slug: toSlug(name),
      currentNextAction: nextAction.trim() || undefined,
    });
    setName('');
    setNextAction('');
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-content">{dict.projects.title}</h1>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Новый проект</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название проекта"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
          <input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Next action"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
        </div>
        <div className="mt-4">
          <Button className="rounded-full" onClick={onCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Сохраняю...' : 'Добавить проект'}
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Проекты</h2>
        {isLoading && !data ? (
          <p className="text-sm text-on-surface-variant">{dict.common.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Проектов пока нет</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <article key={item.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="font-semibold text-on-surface">{item.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {item.currentNextAction || 'Next action не задан'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
