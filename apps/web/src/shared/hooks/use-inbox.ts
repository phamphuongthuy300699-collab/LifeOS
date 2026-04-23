import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

// --- Types (Placeholder for actual shared DTOs) ---
export interface InboxItem {
  id: string;
  rawText: string;
  title: string | null;
  status: string;
  sourceType: string;
  capturedAt: string;
}

export interface CreateInboxItemInput {
  rawText: string;
  captureChannel?: string;
}

export interface TriageInboxItemInput {
  targetType: 'task' | 'note' | 'event' | 'meal' | 'expense' | 'contact' | 'ignore';
  title: string;
  body?: string;
}

// --- Hooks ---

export function usePendingInboxItems() {
  return useQuery({
    queryKey: ['inbox', 'pending'],
    queryFn: () => apiFetch<{ items: InboxItem[] }>('/inbox-items'),
  });
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInboxItemInput) => 
      apiFetch<InboxItem>('/inbox-items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
  });
}

export function useTriageInboxItem(itemId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TriageInboxItemInput) =>
      apiFetch<{ inboxItem: InboxItem; createdEntityType: string; createdEntityId: string }>(
        `/inbox-items/${itemId}/triage`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      
      // Also invalidate target entity lists
      if (variables.targetType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.targetType === 'note') {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    },
  });
}
