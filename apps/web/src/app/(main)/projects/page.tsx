'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getDictionary } from '@/shared/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  useCreateProject,
  useCreateProjectMilestone,
  useProject,
  useProjects,
} from '@/shared/hooks/use-projects';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('ru-RU');
}

export default function ProjectsPage() {
  const dict = getDictionary('ru');
  const { data, isLoading } = useProjects();
  const createMutation = useCreateProject();

  const [name, setName] = useState('');
  const [nextAction, setNextAction] = useState('');

  const items = data?.items ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const selectedProjectFallback = useMemo(() => items[0]?.id ?? '', [items]);
  const projectId = selectedProjectId || selectedProjectFallback;

  const { data: projectDetails } = useProject(projectId || undefined);
  const createMilestoneMutation = useCreateProjectMilestone(projectId || '');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

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

  const onCreateMilestone = async () => {
    if (!projectId || !milestoneTitle.trim()) return;
    await createMilestoneMutation.mutateAsync({
      title: milestoneTitle.trim(),
      targetDate: milestoneTargetDate ? new Date(milestoneTargetDate).toISOString() : undefined,
      status: 'active',
    });
    setMilestoneTitle('');
    setMilestoneTargetDate('');
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
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

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant bg-surface p-5 lg:col-span-5">
          <h2 className="mb-3 text-lg font-semibold text-on-surface">Проекты</h2>
          {isLoading && !data ? (
            <p className="text-sm text-on-surface-variant">{dict.common.loading}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Проектов пока нет</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const active = item.id === projectId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      active
                        ? 'border-primary bg-primary-fixed/20'
                        : 'border-outline-variant bg-surface-container-low hover:border-primary/40'
                    }`}
                    onClick={() => setSelectedProjectId(item.id)}
                  >
                    <p className="font-semibold text-on-surface">{item.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {item.currentNextAction || 'Next action не задан'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface p-5 lg:col-span-7">
          <h2 className="mb-3 text-lg font-semibold text-on-surface">Project detail / milestones</h2>

          {!projectDetails ? (
            <p className="text-sm text-on-surface-variant">Выберите проект.</p>
          ) : (
            <div className="space-y-4">
              <article className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="font-semibold text-on-surface">{projectDetails.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {projectDetails.currentNextAction || 'Next action не задан'}
                </p>
              </article>

              <article className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Новая веха
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                    placeholder="Название вехи"
                    value={milestoneTitle}
                    onChange={(event) => setMilestoneTitle(event.target.value)}
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                    value={milestoneTargetDate}
                    onChange={(event) => setMilestoneTargetDate(event.target.value)}
                  />
                </div>
                <Button
                  className="mt-3 rounded-full"
                  disabled={createMilestoneMutation.isPending || !milestoneTitle.trim()}
                  onClick={onCreateMilestone}
                >
                  {createMilestoneMutation.isPending ? 'Создаю...' : 'Создать milestone'}
                </Button>
              </article>

              <div className="space-y-3">
                {projectDetails.milestones.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Вех пока нет.</p>
                ) : (
                  projectDetails.milestones.map((milestone) => (
                    <article
                      key={milestone.id}
                      className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-on-surface">{milestone.title}</p>
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant">
                          {milestone.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        target: {toDateLabel(milestone.targetDate)}
                      </p>
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {milestone.tasks.map((task) => (
                            <Link
                              href={`/tasks/${task.taskId}`}
                              key={task.taskId}
                              className="block rounded-md border border-outline-variant bg-surface px-3 py-2"
                            >
                              <p className="text-sm font-semibold text-on-surface">{task.title}</p>
                              <p className="text-xs text-on-surface-variant">
                                {task.status} • due: {toDateLabel(task.dueAt)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-on-surface-variant">Пока нет связанных задач.</p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
