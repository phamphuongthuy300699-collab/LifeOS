import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

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

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  orderIndex: number;
  tasks?: Array<{
    taskId: string;
    title: string;
    status: string;
    priority: string;
    dueAt: string | null;
    scheduledStartAt: string | null;
    completedAt: string | null;
  }>;
};

export type ProjectDetails = Project & {
  milestones: ProjectMilestone[];
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
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        return { items: readMock() };
      }
    },
  });
}

export function useProject(projectId?: string) {
  return useQuery({
    queryKey: ['project', projectId],
    enabled: Boolean(projectId),
    queryFn: () => apiFetch<ProjectDetails>(`/projects/${projectId}`),
  });
}

export function useProjectMilestones(projectId?: string) {
  return useQuery({
    queryKey: ['project', projectId, 'milestones'],
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ items: ProjectMilestone[] }>(`/projects/${projectId}/milestones`),
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
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
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

export function useCreateProjectMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      targetDate?: string;
      status?: string;
      orderIndex?: number;
    }) =>
      apiFetch<ProjectMilestone>(`/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProjectMilestone(milestoneId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title?: string;
      description?: string | null;
      targetDate?: string | null;
      status?: string;
      orderIndex?: number;
    }) =>
      apiFetch<ProjectMilestone>(`/project-milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        timeoutMs: 30_000,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
