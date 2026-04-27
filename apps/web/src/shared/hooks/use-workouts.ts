import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, shouldUseDemoFallback } from '../lib/api';

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

const WORKOUT_MOCK_STORAGE_KEY = 'lifeos-workout-mock-v1';
const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

type WorkoutMockState = {
  exercises: Exercise[];
  plans: WorkoutPlan[];
  sessions: WorkoutSessionDetails[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function emptyMockState(): WorkoutMockState {
  return {
    exercises: [],
    plans: [],
    sessions: [],
  };
}

function readMockState(): WorkoutMockState {
  if (typeof window === 'undefined') {
    return emptyMockState();
  }

  const raw = window.localStorage.getItem(WORKOUT_MOCK_STORAGE_KEY);
  if (!raw) {
    return emptyMockState();
  }

  try {
    const parsed = JSON.parse(raw) as WorkoutMockState;
    return {
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyMockState();
  }
}

function writeMockState(state: WorkoutMockState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKOUT_MOCK_STORAGE_KEY, JSON.stringify(state));
}

function createMockExercise(
  template: (typeof demoExercisesSeed)[number],
): Exercise {
  const timestamp = nowIso();
  return {
    id: makeId('exercise'),
    workspaceId: DEFAULT_WORKSPACE_ID,
    userId: DEFAULT_USER_ID,
    name: template.name,
    slug: template.slug,
    descriptionShort: `Базовое упражнение: ${template.name}`,
    descriptionMarkdown: `Контрольная техника для упражнения «${template.name}».`,
    muscleGroupsJson: ['chest', 'triceps'],
    equipmentJson: ['barbell'],
    difficulty: 'intermediate',
    defaultVideoUrl: null,
    defaultRestSeconds: 90,
    isCustom: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createMockPlan(exercises: Exercise[]): WorkoutPlan {
  const timestamp = nowIso();
  const mappedExercises: WorkoutPlanExercise[] = demoExercisesSeed.map(
    (template, index) => {
      const exercise = exercises.find((item) => item.slug === template.slug);
      if (!exercise) {
        throw new Error(`Exercise ${template.slug} missing in mock state`);
      }

      return {
        id: makeId('plan_exercise'),
        workoutPlanId: 'placeholder',
        exerciseId: exercise.id,
        orderIndex: index,
        targetSets: template.targetSets,
        targetReps: template.targetReps,
        targetWeight: template.targetWeight,
        targetRestSeconds: 90,
        metadataJson: null,
        createdAt: timestamp,
        exercise,
      };
    },
  );

  const planId = makeId('plan');
  return {
    id: planId,
    workspaceId: DEFAULT_WORKSPACE_ID,
    userId: DEFAULT_USER_ID,
    name: 'Грудь и Трицепс',
    goal: 'Сила и гипертрофия верхней части тела',
    description: 'Спринт 4 демо-план',
    isActive: true,
    scheduleHintJson: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    exercises: mappedExercises.map((item) => ({
      ...item,
      workoutPlanId: planId,
    })),
  };
}

export function useWorkoutPlans() {
  return useQuery({
    queryKey: ['workout-plans'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: WorkoutPlan[] }>('/workout-plans');
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        return { items: state.plans };
      }
    },
  });
}

export function useExerciseById(exerciseId?: string) {
  return useQuery({
    queryKey: ['exercise', exerciseId],
    enabled: Boolean(exerciseId),
    queryFn: async () => {
      try {
        return await apiFetch<Exercise>(`/exercises/${exerciseId}`);
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const exercise = state.exercises.find((item) => item.id === exerciseId);
        if (!exercise) {
          throw new Error('Exercise not found');
        }
        return exercise;
      }
    },
  });
}

export function useWorkoutSession(sessionId?: string) {
  return useQuery({
    queryKey: ['workout-session', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      try {
        return await apiFetch<WorkoutSessionDetails>(`/workout-sessions/${sessionId}`);
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        return session;
      }
    },
  });
}

export function useStartWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartSessionInput) => {
      try {
        const endpoint = `/workout-sessions?workoutPlanId=${encodeURIComponent(
          payload.workoutPlanId,
        )}`;
        return await apiFetch<WorkoutSessionDetails>(endpoint, {
          method: 'POST',
        });
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const plan = state.plans.find((item) => item.id === payload.workoutPlanId);
        if (!plan) {
          throw new Error('Workout plan not found');
        }

        const timestamp = nowIso();
        const sessionId = makeId('session');

        const session: WorkoutSessionDetails = {
          id: sessionId,
          workspaceId: plan.workspaceId,
          userId: plan.userId,
          workoutPlanId: plan.id,
          startedAt: timestamp,
          endedAt: null,
          sessionStatus: 'active',
          perceivedIntensity: null,
          notes: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          exercises: plan.exercises.map((exercise) => ({
            id: makeId('session_exercise'),
            workoutSessionId: sessionId,
            exerciseId: exercise.exerciseId,
            orderIndex: exercise.orderIndex,
            targetSchemeJson: {
              targetSets: exercise.targetSets ?? 3,
              targetReps: exercise.targetReps ?? '10',
            },
            previousResultJson: null,
            createdAt: timestamp,
            exercise: exercise.exercise,
            sets: [],
          })),
        };

        writeMockState({
          ...state,
          sessions: [session, ...state.sessions],
        });

        return session;
      }
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      queryClient.setQueryData(['workout-session', session.id], session);
    },
  });
}

export function useAddWorkoutSet(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddWorkoutSetInput) => {
      try {
        const params = new URLSearchParams();
        params.set('workoutSessionExerciseId', payload.workoutSessionExerciseId);
        if (payload.weightValue !== undefined) {
          params.set('weightValue', String(payload.weightValue));
        }
        if (payload.repsCount !== undefined) {
          params.set('repsCount', String(payload.repsCount));
        }
        if (payload.durationSeconds !== undefined) {
          params.set('durationSeconds', String(payload.durationSeconds));
        }
        if (payload.distanceMeters !== undefined) {
          params.set('distanceMeters', String(payload.distanceMeters));
        }
        if (payload.rpe !== undefined) {
          params.set('rpe', String(payload.rpe));
        }
        if (payload.rir !== undefined) {
          params.set('rir', String(payload.rir));
        }
        if (payload.isWarmup !== undefined) {
          params.set('isWarmup', String(payload.isWarmup));
        }
        if (payload.isCompleted !== undefined) {
          params.set('isCompleted', String(payload.isCompleted));
        }

        return await apiFetch<WorkoutSet>(
          `/workout-sessions/${sessionId}/sets?${params.toString()}`,
          {
          method: 'POST',
          },
        );
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        const sessionExercise = session.exercises.find(
          (item) => item.id === payload.workoutSessionExerciseId,
        );
        if (!sessionExercise) {
          throw new Error('Session exercise not found');
        }

        const timestamp = nowIso();
        const nextSetNumber = sessionExercise.sets.length + 1;
        const set: WorkoutSet = {
          id: makeId('set'),
          workoutSessionExerciseId: payload.workoutSessionExerciseId,
          setNumber: nextSetNumber,
          weightValue:
            payload.weightValue !== undefined ? String(payload.weightValue) : null,
          repsCount: payload.repsCount ?? null,
          durationSeconds: payload.durationSeconds ?? null,
          distanceMeters: payload.distanceMeters ?? null,
          rpe: payload.rpe ?? null,
          rir: payload.rir ?? null,
          isWarmup: payload.isWarmup ?? false,
          isCompleted: payload.isCompleted ?? false,
          completedAt: payload.isCompleted ? timestamp : null,
          createdAt: timestamp,
        };

        sessionExercise.sets = [...sessionExercise.sets, set];
        session.updatedAt = timestamp;

        writeMockState({
          ...state,
          sessions: state.sessions.map((item) =>
            item.id === session.id ? session : item,
          ),
        });

        return set;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-session', sessionId] });
    },
  });
}

export function useUpdateWorkoutSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateWorkoutSessionInput) => {
      try {
        const params = new URLSearchParams();
        if (payload.endedAt !== undefined) {
          params.set('endedAt', payload.endedAt ?? 'null');
        }
        if (payload.sessionStatus !== undefined) {
          params.set('sessionStatus', payload.sessionStatus);
        }
        if (payload.notes !== undefined) {
          params.set('notes', payload.notes ?? 'null');
        }
        if (payload.perceivedIntensity !== undefined) {
          params.set(
            'perceivedIntensity',
            payload.perceivedIntensity === null ? 'null' : String(payload.perceivedIntensity),
          );
        }

        const endpoint = params.toString()
          ? `/workout-sessions/${sessionId}?${params.toString()}`
          : `/workout-sessions/${sessionId}`;

        return await apiFetch<WorkoutSession>(endpoint, {
          method: 'PATCH',
        });
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        const updated: WorkoutSessionDetails = {
          ...session,
          ...payload,
          endedAt:
            payload.sessionStatus === 'completed' && !payload.endedAt
              ? nowIso()
              : payload.endedAt ?? session.endedAt,
          updatedAt: nowIso(),
        };

        writeMockState({
          ...state,
          sessions: state.sessions.map((item) =>
            item.id === sessionId ? updated : item,
          ),
        });

        return updated;
      }
    },
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
      try {
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

        return await apiFetch<WorkoutPlan>('/workout-plans', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Грудь и Трицепс',
            goal: 'Сила и гипертрофия верхней части тела',
            description: 'Спринт 4 демо-план',
            isActive: true,
            exercises: exercisesPayload,
          }),
        });
      } catch (error) {
        if (!shouldUseDemoFallback()) throw error;
        const state = readMockState();
        const existingBySlug = new Map(
          state.exercises.map((exercise) => [exercise.slug, exercise]),
        );

        const ensuredExercises: Exercise[] = [...state.exercises];
        for (const template of demoExercisesSeed) {
          if (!existingBySlug.has(template.slug)) {
            const created = createMockExercise(template);
            ensuredExercises.push(created);
            existingBySlug.set(template.slug, created);
          }
        }

        const plan = createMockPlan(ensuredExercises);
        writeMockState({
          exercises: ensuredExercises,
          plans: [plan, ...state.plans.filter((item) => item.id !== plan.id)],
          sessions: state.sessions,
        });

        return plan;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    },
  });
}
