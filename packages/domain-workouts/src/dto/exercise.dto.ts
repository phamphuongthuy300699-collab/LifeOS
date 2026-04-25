import { z } from 'zod';
import { Difficulty } from '@lifeos/shared';

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  descriptionShort: z.string().max(1000).optional(),
  descriptionMarkdown: z.string().max(20000).optional(),
  muscleGroups: z.array(z.string().min(1)).optional().default([]),
  primaryMuscleGroups: z.array(z.string().min(1)).optional().default([]),
  secondaryMuscleGroups: z.array(z.string().min(1)).optional().default([]),
  movementPattern: z.string().min(1).max(120).optional(),
  instructions: z.array(z.string().min(1)).optional().default([]),
  commonMistakes: z.array(z.string().min(1)).optional().default([]),
  equipment: z.array(z.string().min(1)).optional().default([]),
  difficulty: z.enum(Difficulty).optional().default('intermediate'),
  defaultVideoUrl: z.string().url().optional(),
  video: z
    .object({
      url: z.string().url().nullable().optional(),
      source: z.string().min(1).max(80).nullable().optional(),
      title: z.string().min(1).max(300).nullable().optional(),
    })
    .optional(),
  defaultRestSeconds: z.number().int().positive().max(7200).optional(),
  isCustom: z.boolean().optional().default(true),
});

export type CreateExerciseDto = z.infer<typeof createExerciseSchema>;

export const updateExerciseSchema = createExerciseSchema.partial();
export type UpdateExerciseDto = z.infer<typeof updateExerciseSchema>;
