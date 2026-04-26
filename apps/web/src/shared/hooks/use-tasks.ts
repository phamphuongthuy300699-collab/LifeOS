import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

// --- Types ---
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  createdAt: string;
}

// --- Hooks ---

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiFetch<{ items: Task[] }>('/tasks'),
  });
}

export function useTodayData() {
  return useQuery({
    queryKey: ['today'],
    queryFn: async () => {
      try {
        return await apiFetch<{
          focusBlock: string;
          pendingInboxCount: number;
          topTasks: Task[];
          events: any[];
          emailsRequiringAction: any[];
        }>('/today');
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        return {
          focusBlock: 'Подключите API для синхронизации или продолжайте в демо-режиме',
          pendingInboxCount: 0,
          topTasks: [],
          events: [],
          emailsRequiringAction: [],
        };
      }
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<Task>(`/tasks/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
  });
}
