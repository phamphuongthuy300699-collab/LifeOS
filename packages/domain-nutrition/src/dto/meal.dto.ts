import { z } from 'zod';
import { EstimationMode, MealType, SourceType } from '@lifeos/shared';

export const createMealSchema = z.object({
  mealType: z.enum(MealType),
  consumedAt: z.string().datetime().optional(),
  sourceType: z.enum(SourceType).optional().default('manual'),
  sourceRefType: z.string().max(50).optional(),
  sourceRefId: z.string().uuid().optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateMealDto = z.infer<typeof createMealSchema>;

export const updateMealSchema = z.object({
  mealType: z.enum(MealType).optional(),
  consumedAt: z.string().datetime().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export type UpdateMealDto = z.infer<typeof updateMealSchema>;

export const createMealEntrySchema = z.object({
  foodItemId: z.string().uuid().optional(),
  rawName: z.string().min(1).max(300),
  grams: z.number().positive().optional(),
  portionCount: z.number().positive().optional(),
  calories: z.number().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  estimationMode: z.enum(EstimationMode).optional().default('manual'),
  confidence: z.number().int().min(0).max(100).optional(),
});

export type CreateMealEntryDto = z.infer<typeof createMealEntrySchema>;

export const updateMealEntrySchema = z.object({
  foodItemId: z.string().uuid().nullable().optional(),
  rawName: z.string().min(1).max(300).optional(),
  grams: z.number().positive().nullable().optional(),
  portionCount: z.number().positive().nullable().optional(),
  calories: z.number().nonnegative().nullable().optional(),
  proteinG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
  carbsG: z.number().nonnegative().nullable().optional(),
  estimationMode: z.enum(EstimationMode).optional(),
  confidence: z.number().int().min(0).max(100).nullable().optional(),
});

export type UpdateMealEntryDto = z.infer<typeof updateMealEntrySchema>;
