'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Flag, Milestone, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useCompleteTask,
  useCreateSubtask,
  useLinkTask,
  useSnoozeTask,
  useTask,
  useUpdateTask,
} from '@/shared/hooks/use-tasks';
import {
  useProjectMilestones,
  useProjects,
} from '@/shared/hooks/use-projects';
import { describeApiError } from '@/shared/lib/api';

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromLocal(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const { data: task, isLoading, refetch } = useTask(taskId);
  const { data: projectsData } = useProjects();
  const updateTaskMutation = useUpdateTask(taskId);
  const completeTaskMutation = useCompleteTask();
  const snoozeTaskMutation = useSnoozeTask(taskId);
  const createSubtaskMutation = useCreateSubtask(taskId);
  const linkTaskMutation = useLinkTask(taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low' | 'none'>('none');
  const [dueAt, setDueAt] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [projectId, setProjectId] = useState<string>('');

  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const milestonesQueryProjectId = projectId || task?.projectId || undefined;
  const { data: milestonesData } = useProjectMilestones(milestonesQueryProjectId);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    setPriority(task.priority ?? 'none');
    setDueAt(toDatetimeLocal(task.dueAt));
    setScheduledStartAt(toDatetimeLocal(task.scheduledStartAt));
    setScheduledEndAt(toDatetimeLocal(task.scheduledEndAt));
    setProjectId(task.projectId ?? '');

    const milestoneId = task.milestones?.[0]?.id;
    setSelectedMilestoneId(milestoneId ?? '');
  }, [task]);

  const activeMilestone = useMemo(
    () => task?.milestones?.[0] ?? null,
    [task?.milestones],
  );

  const runAction = async (runner: () => Promise<unknown>, endpoint: string, successText: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await runner();
      setActionSuccess(successText);
      await refetch();
    } catch (error) {
      const { userMessage, debugMessage } = describeApiError(error, endpoint);
      setActionError(userMessage);
      console.error('Task action failed', debugMessage);
    }
  };

  if (isLoading || !task) {
    return <div className="px-6 py-8 text-on-surface-variant">Загрузка задачи...</div>;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <section className="flex items-center justify-between">
        <Link href="/inbox" className="inline-flex items-center">
          <Button variant="ghost" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            В Inbox
          </Button>
        </Link>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary-fixed">
          Task detail
        </span>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold text-on-surface">{task.title}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Status: {task.status} • Priority: {task.priority}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                runAction(
                  () => completeTaskMutation.mutateAsync(task.id),
                  '/tasks/:id/complete',
                  'Задача закрыта.',
                )
              }
              disabled={completeTaskMutation.isPending || task.status === 'done'}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                runAction(
                  () =>
                    snoozeTaskMutation.mutateAsync({
                      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
                      scheduledStartAt: scheduledStartAt
                        ? new Date(scheduledStartAt).toISOString()
                        : undefined,
                      scheduledEndAt: scheduledEndAt
                        ? new Date(scheduledEndAt).toISOString()
                        : undefined,
                    }),
                  '/tasks/:id/snooze',
                  'Дедлайн/расписание обновлены.',
                )
              }
              disabled={snoozeTaskMutation.isPending}
            >
              <Clock3 className="mr-2 h-4 w-4" />
              Snooze/Reschedule
            </Button>
          </div>
        </div>

        {actionError ? (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
        ) : null}
        {actionSuccess ? (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {actionSuccess}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-8">
          <h2 className="mb-4 text-lg font-semibold text-on-surface">Редактирование задачи</h2>

          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название"
            />
            <textarea
              className="h-24 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Priority</span>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                  value={priority}
                  onChange={(event) =>
                    setPriority(
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
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Project</span>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  <option value="">— без проекта —</option>
                  {(projectsData?.items ?? []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-on-surface-variant">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due at
                </span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Scheduled start</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                  value={scheduledStartAt}
                  onChange={(event) => setScheduledStartAt(event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Scheduled end</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                  value={scheduledEndAt}
                  onChange={(event) => setScheduledEndAt(event.target.value)}
                />
              </label>
            </div>

            <Button
              className="rounded-full"
              onClick={() =>
                runAction(
                  () =>
                    updateTaskMutation.mutateAsync({
                      title: title.trim(),
                      description: description.trim() ? description.trim() : null,
                      priority,
                      projectId: projectId || null,
                      dueAt: dueAt ? toIsoFromLocal(dueAt) ?? null : null,
                      scheduledStartAt: scheduledStartAt
                        ? toIsoFromLocal(scheduledStartAt) ?? null
                        : null,
                      scheduledEndAt: scheduledEndAt
                        ? toIsoFromLocal(scheduledEndAt) ?? null
                        : null,
                    }),
                  '/tasks/:id',
                  'Задача обновлена.',
                )
              }
              disabled={updateTaskMutation.isPending || !title.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <section className="rounded-xl border border-outline-variant bg-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              <Milestone className="h-4 w-4" />
              Milestone
            </h3>

            {activeMilestone ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="font-semibold text-on-surface">{activeMilestone.title}</p>
                <p className="text-xs text-on-surface-variant">
                  status: {activeMilestone.status} • target: {toDatetimeLocal(activeMilestone.targetDate)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Веха пока не привязана.</p>
            )}

            <div className="mt-3 space-y-2">
              <select
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none"
                value={selectedMilestoneId}
                onChange={(event) => setSelectedMilestoneId(event.target.value)}
              >
                <option value="">Выбрать milestone</option>
                {(milestonesData?.items ?? []).map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() =>
                  runAction(
                    () =>
                      linkTaskMutation.mutateAsync({
                        relatedEntityType: 'project_milestone',
                        relatedEntityId: selectedMilestoneId,
                        relationKind: 'milestone',
                      }),
                    '/tasks/:id/link',
                    'Milestone привязан к задаче.',
                  )
                }
                disabled={!selectedMilestoneId || linkTaskMutation.isPending}
              >
                <Flag className="mr-2 h-4 w-4" />
                Привязать веху
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Subtasks
            </h3>

            <div className="space-y-2">
              {task.subtasks.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Подзадач пока нет.</p>
              ) : (
                task.subtasks.map((subtask) => (
                  <article key={subtask.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                    <p className="text-sm font-semibold text-on-surface">{subtask.title}</p>
                    <p className="text-xs text-on-surface-variant">status: {subtask.status}</p>
                  </article>
                ))
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none"
                placeholder="Новая подзадача"
                value={subtaskTitle}
                onChange={(event) => setSubtaskTitle(event.target.value)}
              />
              <Button
                className="rounded-full"
                onClick={() =>
                  runAction(
                    () =>
                      createSubtaskMutation.mutateAsync({
                        title: subtaskTitle.trim(),
                        priority: 'none',
                      }),
                    '/tasks/:id/subtasks',
                    'Подзадача создана.',
                  ).then(() => setSubtaskTitle(''))
                }
                disabled={createSubtaskMutation.isPending || !subtaskTitle.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {task.sourceEmail ? (
            <section className="rounded-xl border border-outline-variant bg-surface p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Linked email
              </h3>
              <Link href={`/mail/${task.sourceEmail.id}`} className="font-semibold text-primary hover:underline">
                {task.sourceEmail.subject || '(No subject)'}
              </Link>
              <p className="mt-1 text-xs text-on-surface-variant">{task.sourceEmail.snippet || 'Без сниппета'}</p>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
