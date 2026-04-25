import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type LearningTrack = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  goal: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLearningTrackInput = {
  name: string;
  description?: string;
  goal?: string;
};

const LEARNING_MOCK_KEY = 'lifeos-learning-mock-v1';

function readMockTracks(): LearningTrack[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(LEARNING_MOCK_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LearningTrack[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMockTracks(items: LearningTrack[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEARNING_MOCK_KEY, JSON.stringify(items));
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function useLearningTracks() {
  return useQuery({
    queryKey: ['learning', 'tracks'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: LearningTrack[] }>('/learning/tracks');
      } catch {
        return { items: readMockTracks() };
      }
    },
  });
}

export function useCreateLearningTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLearningTrackInput) => {
      try {
        return await apiFetch<LearningTrack>('/learning/tracks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        const item: LearningTrack = {
          id: makeId('track'),
          name: payload.name,
          description: payload.description ?? null,
          status: 'active',
          goal: payload.goal ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        writeMockTracks([item, ...readMockTracks()]);
        return item;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'tracks'] });
    },
  });
}
