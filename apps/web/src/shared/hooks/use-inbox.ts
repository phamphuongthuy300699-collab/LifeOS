import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

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

export type InboxUnifiedItemType = 'email' | 'task' | 'capture' | 'note' | 'event';

export type InboxUnifiedItem = {
  id: string;
  type: InboxUnifiedItemType;
  title: string;
  subtitle?: string;
  snippet?: string;
  sourceProvider?: 'google' | 'gmail' | 'yandex' | 'manual' | 'voice' | 'note' | 'inbox' | 'calendar' | 'unknown';
  status: string;
  priority?: string;
  dueAt?: string;
  scheduledAt?: string;
  createdAt: string;
  receivedAt?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  linkedMilestoneId?: string;
  sourceRefType?: string;
  sourceRefId?: string;
  metadata?: Record<string, unknown>;
};

export type InboxUnifiedResponse = {
  items: InboxUnifiedItem[];
  counts: {
    all: number;
    email: number;
    task: number;
    capture: number;
    note: number;
    event: number;
    snoozed: number;
  };
  filters: {
    type: 'all' | 'email' | 'task' | 'capture' | 'note' | 'event' | 'snoozed';
    status: string | null;
    sourceProvider: string | null;
  };
  page: {
    limit: number;
    cursor: string | null;
    hasMore: boolean;
    nextCursor: string | null;
  };
};

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

export function useInboxUnified(params?: {
  type?: 'all' | 'email' | 'task' | 'capture' | 'note' | 'event' | 'snoozed';
  status?: string;
  sourceProvider?: string;
  limit?: number;
  cursor?: string;
}) {
  return useQuery({
    queryKey: ['inbox', 'unified', params ?? {}],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.sourceProvider) searchParams.set('sourceProvider', params.sourceProvider);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.cursor) searchParams.set('cursor', params.cursor);

      const endpoint = searchParams.toString() ? `/inbox?${searchParams.toString()}` : '/inbox';

      try {
        return await apiFetch<InboxUnifiedResponse>(endpoint);
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const captureItems = readMockInboxItems().map(
          (item): InboxUnifiedItem => ({
            id: item.id,
            type: 'capture',
            title: item.title || 'Capture',
            snippet: item.rawText,
            sourceProvider: 'manual',
            status: item.status,
            createdAt: item.capturedAt,
          }),
        );

        return {
          items: captureItems,
          counts: {
            all: captureItems.length,
            email: 0,
            task: 0,
            capture: captureItems.length,
            note: 0,
            event: 0,
            snoozed: 0,
          },
          filters: {
            type: params?.type ?? 'all',
            status: params?.status ?? null,
            sourceProvider: params?.sourceProvider ?? null,
          },
          page: {
            limit: params?.limit ?? 30,
            cursor: params?.cursor ?? null,
            hasMore: false,
            nextCursor: null,
          },
        } satisfies InboxUnifiedResponse;
      }
    },
  });
}

export function usePendingInboxItems() {
  return useQuery({
    queryKey: ['inbox', 'pending'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: InboxItem[] }>('/inbox-items');
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
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
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
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
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
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
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });

      if (variables.targetType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.targetType === 'note') {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    },
  });
}

export function useTriageInboxItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { itemId: string; data: TriageInboxItemInput }) =>
      apiFetch<{ inboxItem: InboxItem; createdEntityType: string; createdEntityId: string }>(
        `/inbox-items/${payload.itemId}/triage`,
        {
          method: 'POST',
          body: JSON.stringify(payload.data),
        },
      ),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });

      if (payload.data.targetType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (payload.data.targetType === 'note') {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      } else if (payload.data.targetType === 'event') {
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
      }
    },
  });
}

export function useUpdateMailActionState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      messageId: string;
      triageStatus: 'done' | 'snoozed' | 'needs_action';
    }) =>
      apiFetch<{ state: unknown; requestId?: string }>(
        `/mail/messages/${payload.messageId}/action-state?triageStatus=${encodeURIComponent(
          payload.triageStatus,
        )}`,
        {
          method: 'PATCH',
          timeoutMs: 30_000,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['mail'] });
    },
  });
}

export function useCreateTaskFromMail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) =>
      apiFetch<{ task: { id: string }; requestId?: string }>(
        `/mail/messages/${messageId}/create-task`,
        {
          method: 'POST',
          timeoutMs: 30_000,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mail'] });
    },
  });
}

export function useUpdateInboxItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { itemId: string; status: 'pending' | 'triaged' | 'archived' }) =>
      apiFetch<InboxItem>(`/inbox-items/${payload.itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: payload.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
  });
}
