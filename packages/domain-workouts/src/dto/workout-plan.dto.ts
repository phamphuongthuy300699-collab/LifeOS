import { z } from 'zod';

export const createWorkoutPlanExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0).default(0),
  targetSets: z.number().int().positive().optional(),
  targetReps: z.string().max(100).optional(),
  targetWeight: z.string().max(100).optional(),
  targetRestSeconds: z.number().int().positive().max(7200).optional(),
});
export type CreateWorkoutPlanExerciseDto = z.infer<
  typeof createWorkoutPlanExerciseSchema
>;

export const createWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(300),
  goal: z.string().max(5000).optional(),
  description: z.string().max(20000).optional(),
  isActive: z.boolean().optional().default(true),
  scheduleHintJson: z.record(z.unknown()).optional(),
  exercises: z.array(createWorkoutPlanExerciseSchema).optional().default([]),
});

export type CreateWorkoutPlanDto = z.infer<typeof createWorkoutPlanSchema>;

export const updateWorkoutPlanSchema = createWorkoutPlanSchema
  .omit({ exercises: true })
  .partial();
export type UpdateWorkoutPlanDto = z.infer<typeof updateWorkoutPlanSchema>;
