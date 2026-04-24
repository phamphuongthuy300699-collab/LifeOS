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

const INBOX_MOCK_STORAGE_KEY = 'lifeos-inbox-mock-v1';

function readMockInboxItems(): InboxItem[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(INBOX_MOCK_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as InboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMockInboxItems(items: InboxItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INBOX_MOCK_STORAGE_KEY, JSON.stringify(items));
}

function makeMockInboxId(): string {
  return `inbox_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

// --- Hooks ---

export function usePendingInboxItems() {
  return useQuery({
    queryKey: ['inbox', 'pending'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: InboxItem[] }>('/inbox-items');
      } catch {
        return { items: readMockInboxItems() };
      }
    },
  });
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInboxItemInput) => {
      try {
        return await apiFetch<InboxItem>('/inbox-items', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        const item: InboxItem = {
          id: makeMockInboxId(),
          rawText: data.rawText,
          title: null,
          status: 'pending',
          sourceType: 'manual',
          capturedAt: new Date().toISOString(),
        };
        const next = [item, ...readMockInboxItems()];
        writeMockInboxItems(next);
        return item;
      }
    },
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
