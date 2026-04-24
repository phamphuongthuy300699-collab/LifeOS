import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type Exercise = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  descriptionMarkdown: string | null;
  muscleGroupsJson: string[] | null;
  equipmentJson: string[] | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  defaultVideoUrl: string | null;
  defaultRestSeconds: number | null;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutPlanExercise = {
  id: string;
  workoutPlanId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number | null;
  targetReps: string | null;
  targetWeight: string | null;
  targetRestSeconds: number | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  exercise: Exercise | null;
};

export type WorkoutPlan = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  goal: string | null;
  description: string | null;
  isActive: boolean;
  scheduleHintJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutPlanExercise[];
};

export type WorkoutSet = {
  id: string;
  workoutSessionExerciseId: string;
  setNumber: number;
  weightValue: string | null;
  repsCount: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  rir: number | null;
  isWarmup: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
};

export type WorkoutSessionExercise = {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  orderIndex: number;
  targetSchemeJson: Record<string, unknown> | null;
  previousResultJson: Record<string, unknown> | null;
  createdAt: string;
  exercise: Exercise | null;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  workspaceId: string;
  userId: string;
  workoutPlanId: string | null;
  startedAt: string;
  endedAt: string | null;
  sessionStatus: 'planned' | 'active' | 'completed' | 'cancelled';
  perceivedIntensity: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSessionDetails = WorkoutSession & {
  exercises: WorkoutSessionExercise[];
};

type StartSessionInput = {
  workoutPlanId: string;
};

type AddWorkoutSetInput = {
  workoutSessionExerciseId: string;
  weightValue?: number;
  repsCount?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  rpe?: number;
  rir?: number;
  isWarmup?: boolean;
  isCompleted?: boolean;
};

type UpdateWorkoutSessionInput = {
  endedAt?: string | null;
  sessionStatus?: 'planned' | 'active' | 'completed' | 'cancelled';
  notes?: string | null;
  perceivedIntensity?: number | null;
};

const demoExercisesSeed = [
  {
    name: 'Жим штанги лежа',
    slug: 'bench-press',
    targetSets: 4,
    targetReps: '8-10',
    targetWeight: '60 кг',
  },
  {
    name: 'Жим гантелей лежа',
    slug: 'dumbbell-press',
    targetSets: 4,
    targetReps: '10-12',
    targetWeight: '24 кг',
  },
  {
    name: 'Отжимания на брусьях',
    slug: 'parallel-dips',
    targetSets: 3,
    targetReps: 'Макс',
    targetWeight: 'Свой вес',
  },
  {
    name: 'Разгибания на блоке',
    slug: 'cable-pushdown',
    targetSets: 3,
    targetReps: '12-15',
    targetWeight: '22 кг',
  },
] as const;

export function useWorkoutPlans() {
  return useQuery({
    queryKey: ['workout-plans'],
    queryFn: () => apiFetch<{ items: WorkoutPlan[] }>('/workout-plans'),
  });
}

export function useExerciseById(exerciseId?: string) {
  return useQuery({
    queryKey: ['exercise', exerciseId],
    enabled: Boolean(exerciseId),
    queryFn: () => apiFetch<Exercise>(`/exercises/${exerciseId}`),
  });
}

export function useWorkoutSession(sessionId?: string) {
  return useQuery({
    queryKey: ['workout-session', sessionId],
    enabled: Boolean(sessionId),
    queryFn: () => apiFetch<WorkoutSessionDetails>(`/workout-sessions/${sessionId}`),
  });
}

export function useStartWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartSessionInput) =>
      apiFetch<WorkoutSessionDetails>('/workout-sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      queryClient.setQueryData(['workout-session', session.id], session);
    },
  });
}

export function useAddWorkoutSet(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWorkoutSetInput) =>
      apiFetch<WorkoutSet>(`/workout-sessions/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-session', sessionId] });
    },
  });
}

export function useUpdateWorkoutSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateWorkoutSessionInput) =>
      apiFetch<WorkoutSession>(`/workout-sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    },
  });
}

/**
 * Fast bootstrap for local MVP flow:
 * creates missing exercises and one starter plan if no plans exist.
 */
export function useBootstrapWorkoutDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const existingExercises = await apiFetch<{ items: Exercise[] }>('/exercises');
      const existingBySlug = new Map(
        existingExercises.items.map((exercise) => [exercise.slug, exercise]),
      );

      const ensuredExercises: Exercise[] = [];

      for (const template of demoExercisesSeed) {
        const existing = existingBySlug.get(template.slug);
        if (existing) {
          ensuredExercises.push(existing);
          continue;
        }

        const created = await apiFetch<Exercise>('/exercises', {
          method: 'POST',
          body: JSON.stringify({
            name: template.name,
            slug: template.slug,
            descriptionShort: `Базовое упражнение: ${template.name}`,
            muscleGroups: ['chest', 'triceps'],
            equipment: ['barbell'],
            difficulty: 'intermediate',
            isCustom: true,
          }),
        });
        ensuredExercises.push(created);
      }

      const exercisesPayload = demoExercisesSeed.map((template, index) => {
        const exercise = ensuredExercises.find((item) => item.slug === template.slug);
        if (!exercise) {
          throw new Error(`Exercise ${template.slug} was not created`);
        }

        return {
          exerciseId: exercise.id,
          orderIndex: index,
          targetSets: template.targetSets,
          targetReps: template.targetReps,
          targetWeight: template.targetWeight,
          targetRestSeconds: 90,
        };
      });

      const plan = await apiFetch<WorkoutPlan>('/workout-plans', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Грудь и Трицепс',
          goal: 'Сила и гипертрофия верхней части тела',
          description: 'Спринт 4 демо-план',
          isActive: true,
          exercises: exercisesPayload,
        }),
      });

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    },
  });
}
