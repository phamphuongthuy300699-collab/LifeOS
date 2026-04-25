'use client';

import { useState } from 'react';
import { getDictionary } from '@/shared/lib/i18n';
import { Button } from '@/components/ui/button';
import { useCreateLearningTrack, useLearningTracks } from '@/shared/hooks/use-learning';

export default function LearningPage() {
  const dict = getDictionary('ru');
  const { data, isLoading } = useLearningTracks();
  const createMutation = useCreateLearningTrack();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const tracks = data?.items ?? [];

  const onCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim(), goal: goal.trim() || undefined });
    setName('');
    setGoal('');
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-content">{dict.learning.title}</h1>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Новый трек</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название трека"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Цель"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
          />
        </div>
        <div className="mt-4">
          <Button className="rounded-full" onClick={onCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Сохраняю...' : 'Добавить трек'}
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-on-surface">Треки</h2>
        {isLoading && !data ? (
          <p className="text-sm text-on-surface-variant">{dict.common.loading}</p>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Треков пока нет</p>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <article key={track.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="font-semibold text-on-surface">{track.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{track.goal || 'Без цели'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
