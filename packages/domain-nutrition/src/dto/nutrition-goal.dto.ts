import { z } from 'zod';

export const updateCurrentNutritionGoalSchema = z.object({
  caloriesTarget: z.number().int().positive().nullable().optional(),
  proteinTargetG: z.number().positive().nullable().optional(),
  fatTargetG: z.number().positive().nullable().optional(),
  carbsTargetG: z.number().positive().nullable().optional(),
  effectiveFrom: z.string().datetime().optional(),
});

export type UpdateCurrentNutritionGoalDto = z.infer<
  typeof updateCurrentNutritionGoalSchema
>;
