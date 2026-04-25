import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  currentNextAction: string | null;
  currentMilestone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  slug: string;
  description?: string;
  currentNextAction?: string;
};

const PROJECTS_MOCK_KEY = 'lifeos-projects-mock-v1';

function readMock(): Project[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PROJECTS_MOCK_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMock(items: Project[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_MOCK_KEY, JSON.stringify(items));
}

function makeId(): string {
  return `project_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: Project[] }>('/projects');
      } catch {
        return { items: readMock() };
      }
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectInput) => {
      try {
        return await apiFetch<Project>('/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        const created: Project = {
          id: makeId(),
          name: payload.name,
          slug: payload.slug,
          description: payload.description ?? null,
          status: 'active',
          currentNextAction: payload.currentNextAction ?? null,
          currentMilestone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        writeMock([created, ...readMock()]);
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
