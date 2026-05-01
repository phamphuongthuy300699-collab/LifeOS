import { z } from 'zod';
import { Difficulty, Locale } from '@lifeos/shared';

export const workoutSeedExerciseSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  descriptionShort: z.string().max(1000).optional(),
  descriptionMarkdown: z.string().max(50000).optional(),
  instructions: z.array(z.string().min(1)).default([]),
  commonMistakes: z.array(z.string().min(1)).default([]),
  primaryMuscleGroups: z.array(z.string().min(1)).default([]),
  secondaryMuscleGroups: z.array(z.string().min(1)).default([]),
  movementPattern: z.string().min(1).max(120).optional(),
  equipment: z.array(z.string().min(1)).default([]),
  difficulty: z.enum(Difficulty).default('intermediate'),
  video: z
    .object({
      url: z.string().url().nullable().optional(),
      source: z.string().min(1).max(80).nullable().optional(),
      title: z.string().min(1).max(300).nullable().optional(),
    })
    .optional(),
  defaultRestSeconds: z.number().int().positive().max(7200).optional(),
  isCustom: z.boolean().default(false),
});

export const workoutSeedPlanExerciseSchema = z.object({
  exerciseSlug: z.string().min(1).max(220),
  orderIndex: z.number().int().min(0).default(0),
  targetSets: z.number().int().positive().optional(),
  targetRepsMin: z.number().int().positive().max(1000).optional(),
  targetRepsMax: z.number().int().positive().max(1000).optional(),
  targetWeightValue: z.number().nonnegative().max(10000).nullable().optional(),
  targetWeightUnit: z.string().min(1).max(16).optional(),
  targetRestSeconds: z.number().int().positive().max(7200).optional(),
  notes: z.string().max(5000).optional(),
});

export const workoutSeedPlanSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(220),
  goal: z.string().max(5000).optional(),
  description: z.string().max(20000).optional(),
  isActive: z.boolean().default(true),
  scheduleHint: z.record(z.unknown()).optional(),
  exercises: z.array(workoutSeedPlanExerciseSchema).default([]),
});

export const workoutSeedSchema = z.object({
  version: z.number().int().positive(),
  locale: z.enum(Locale).default('ru'),
  exercises: z.array(workoutSeedExerciseSchema),
  workoutPlans: z.array(workoutSeedPlanSchema),
});

export type WorkoutSeed = z.infer<typeof workoutSeedSchema>;
