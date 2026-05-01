import { z } from 'zod';
import { SessionStatus } from '@lifeos/shared';

export const createWorkoutSessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0).default(0),
  targetSchemeJson: z.record(z.unknown()).optional(),
  previousResultJson: z.record(z.unknown()).optional(),
});
export type CreateWorkoutSessionExerciseDto = z.infer<
  typeof createWorkoutSessionExerciseSchema
>;

export const createWorkoutSessionSchema = z.object({
  workoutPlanId: z.string().uuid().optional(),
  startedAt: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  perceivedIntensity: z.number().int().min(1).max(10).optional(),
  exercises: z.array(createWorkoutSessionExerciseSchema).optional().default([]),
});
export type CreateWorkoutSessionDto = z.infer<typeof createWorkoutSessionSchema>;

export const updateWorkoutSessionSchema = z.object({
  endedAt: z.string().datetime().nullable().optional(),
  sessionStatus: z.enum(SessionStatus).optional(),
  notes: z.string().max(5000).nullable().optional(),
  perceivedIntensity: z.number().int().min(1).max(10).nullable().optional(),
});
export type UpdateWorkoutSessionDto = z.infer<typeof updateWorkoutSessionSchema>;

export const createWorkoutSetSchema = z.object({
  workoutSessionExerciseId: z.string().uuid(),
  setNumber: z.number().int().positive().optional(),
  weightValue: z.number().positive().optional(),
  repsCount: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceMeters: z.number().int().min(0).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  rir: z.number().int().min(0).max(10).optional(),
  isWarmup: z.boolean().optional().default(false),
  isCompleted: z.boolean().optional().default(true),
});
export type CreateWorkoutSetDto = z.infer<typeof createWorkoutSetSchema>;

export const updateWorkoutSetSchema = z.object({
  weightValue: z.number().positive().nullable().optional(),
  repsCount: z.number().int().min(0).nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  distanceMeters: z.number().int().min(0).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  isWarmup: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});
export type UpdateWorkoutSetDto = z.infer<typeof updateWorkoutSetSchema>;
