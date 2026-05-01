import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Task } from './use-tasks';

export type CalendarEvent = {
  id: string;
  workspaceId: string;
  userId: string;
  sourceProvider?: 'manual' | 'google' | 'yandex';
  calendarRef: string | null;
  externalId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  status: 'tentative' | 'confirmed' | 'cancelled';
  meetingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarTodayResponse = {
  dueToday: Task[];
  scheduledToday: Task[];
  events: CalendarEvent[];
  overdue: Task[];
};

export type CalendarUpcomingResponse = {
  rangeStart: string;
  rangeEnd: string;
  tasks: Task[];
  events: CalendarEvent[];
};

export type CalendarOverdueResponse = {
  items: Task[];
  total: number;
};

export type CalendarEventsResponse = {
  items: CalendarEvent[];
  filters: {
    from: string | null;
    to: string | null;
    sourceProvider: string | null;
    limit: number;
  };
};

export type SyncGoogleCalendarResponse = {
  requestId: string;
  importedCount: number;
  updatedCount: number;
  totalGoogleEvents: number;
  rangeStart: string;
  rangeEnd: string;
  provider: 'google';
  elapsedMs: number;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isAllDay?: boolean;
  status?: 'tentative' | 'confirmed' | 'cancelled';
};

export type UpdateEventInput = Partial<CreateEventInput>;

export function useCalendarToday() {
  return useQuery({
    queryKey: ['calendar', 'today'],
    queryFn: () => apiFetch<CalendarTodayResponse>('/calendar/today'),
  });
}

export function useCalendarUpcoming() {
  return useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => apiFetch<CalendarUpcomingResponse>('/calendar/upcoming'),
  });
}

export function useCalendarOverdue() {
  return useQuery({
    queryKey: ['calendar', 'overdue'],
    queryFn: () => apiFetch<CalendarOverdueResponse>('/calendar/overdue'),
  });
}

export function useCalendarEvents(params?: {
  from?: string;
  to?: string;
  sourceProvider?: 'manual' | 'google' | 'yandex';
  limit?: number;
}) {
  return useQuery({
    queryKey: ['calendar', 'events', params ?? {}],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params?.from) search.set('from', params.from);
      if (params?.to) search.set('to', params.to);
      if (params?.sourceProvider) search.set('sourceProvider', params.sourceProvider);
      if (params?.limit) search.set('limit', String(params.limit));

      const endpoint = search.toString()
        ? `/calendar/events?${search.toString()}`
        : '/calendar/events';

      return apiFetch<CalendarEventsResponse>(endpoint);
    },
  });
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { from?: string; to?: string; limit?: number }) => {
      const search = new URLSearchParams();
      if (payload?.from) search.set('from', payload.from);
      if (payload?.to) search.set('to', payload.to);
      if (payload?.limit) search.set('limit', String(payload.limit));

      const endpoint = search.toString()
        ? `/calendar/google/sync?${search.toString()}`
        : '/calendar/google/sync';

      return apiFetch<SyncGoogleCalendarResponse>(endpoint, {
        method: 'POST',
        timeoutMs: 30_000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventInput) =>
      apiFetch<CalendarEvent & { requestId?: string }>('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEventInput) =>
      apiFetch<CalendarEvent & { requestId?: string }>(`/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unified'] });
    },
  });
}
