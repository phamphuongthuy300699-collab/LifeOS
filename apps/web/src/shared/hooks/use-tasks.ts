import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  dueAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  parentTaskId: string | null;
  projectId: string | null;
  sourceType: string | null;
  sourceRefType: string | null;
  sourceRefId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRelation {
  id: string;
  taskId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  relationKind: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface TaskMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  orderIndex: number;
}

export interface TaskSourceEmail {
  id: string;
  subject: string | null;
  snippet: string | null;
  sentAt: string;
  fromJson: { name?: string; email?: string } | null;
  webUrl: string | null;
}

export interface TaskDetails extends Task {
  subtasks: Task[];
  relations: TaskRelation[];
  milestones: TaskMilestone[];
  sourceEmail: TaskSourceEmail | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueAt?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  projectId?: string;
  parentTaskId?: string;
  sourceType?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: Task['status'];
  priority?: Task['priority'];
  dueAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  projectId?: string | null;
  parentTaskId?: string | null;
}

export interface TodayData {
  focusBlock: string;
  pendingInboxCount: number;
  topTasks: Array<Task & { isOverdue?: boolean; isDueToday?: boolean }>;
  dueTodayTasks: Task[];
  overdueTasks: Task[];
  scheduledTasks: Task[];
  events: any[];
  emailsRequiringAction: any[];
}

export function useTasks(filters?: {
  status?: string;
  includeCompleted?: boolean;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['tasks', filters ?? {}],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.includeCompleted) params.set('includeCompleted', 'true');
      if (filters?.projectId) params.set('projectId', filters.projectId);
      const endpoint = params.toString() ? `/tasks?${params.toString()}` : '/tasks';
      return apiFetch<{ items: Task[] }>(endpoint);
    },
  });
}

export function useTask(taskId?: string) {
  return useQuery({
    queryKey: ['task', taskId],
    enabled: Boolean(taskId),
    queryFn: () => apiFetch<TaskDetails>(`/tasks/${taskId}`),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskInput) =>
      apiFetch<Task & { requestId?: string }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'hub'] });
    },
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaskInput) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'hub'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${taskId}/complete`, {
        method: 'POST',
        timeoutMs: 30_000,
      }),
    onSuccess: (_task, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'hub'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useSnoozeTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      dueAt?: string;
      scheduledStartAt?: string;
      scheduledEndAt?: string;
    }) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${taskId}/snooze`, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'hub'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateTaskAny() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { taskId: string; data: UpdateTaskInput }) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${payload.taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload.data),
        timeoutMs: 30_000,
      }),
    onSuccess: (_task, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useSnoozeTaskAny() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      taskId: string;
      dueAt?: string;
      scheduledStartAt?: string;
      scheduledEndAt?: string;
    }) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${payload.taskId}/snooze`, {
        method: 'POST',
        body: JSON.stringify({
          dueAt: payload.dueAt,
          scheduledStartAt: payload.scheduledStartAt,
          scheduledEndAt: payload.scheduledEndAt,
        }),
        timeoutMs: 30_000,
      }),
    onSuccess: (_task, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      priority?: Task['priority'];
      dueAt?: string;
      scheduledStartAt?: string;
      scheduledEndAt?: string;
    }) =>
      apiFetch<Task & { requestId?: string }>(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'hub'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useLinkTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      relatedEntityType: string;
      relatedEntityId: string;
      relationKind?: string;
      metadataJson?: Record<string, unknown>;
    }) =>
      apiFetch<{ id: string; requestId?: string }>(`/tasks/${taskId}/link`, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useLinkTaskAny() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      taskId: string;
      relatedEntityType: string;
      relatedEntityId: string;
      relationKind?: string;
      metadataJson?: Record<string, unknown>;
    }) =>
      apiFetch<{ id: string; requestId?: string }>(`/tasks/${payload.taskId}/link`, {
        method: 'POST',
        body: JSON.stringify({
          relatedEntityType: payload.relatedEntityType,
          relatedEntityId: payload.relatedEntityId,
          relationKind: payload.relationKind,
          metadataJson: payload.metadataJson,
        }),
        timeoutMs: 30_000,
      }),
    onSuccess: (_relation, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useTodayData() {
  return useQuery({
    queryKey: ['today'],
    queryFn: async () => {
      try {
        return await apiFetch<TodayData>('/today');
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        return {
          focusBlock: 'Подключите API для синхронизации или продолжайте в демо-режиме',
          pendingInboxCount: 0,
          topTasks: [],
          dueTodayTasks: [],
          overdueTasks: [],
          scheduledTasks: [],
          events: [],
          emailsRequiringAction: [],
        } satisfies TodayData;
      }
    },
  });
}
