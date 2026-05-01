/**
 * @lifeos/domain-nutrition
 * Nutrition tracking domain
 */

export {
  updateCurrentNutritionGoalSchema,
} from './dto/nutrition-goal.dto';
export type { UpdateCurrentNutritionGoalDto } from './dto/nutrition-goal.dto';

export {
  createMealSchema,
  updateMealSchema,
  createMealEntrySchema,
  updateMealEntrySchema,
} from './dto/meal.dto';
export type {
  CreateMealDto,
  UpdateMealDto,
  CreateMealEntryDto,
  UpdateMealEntryDto,
} from './dto/meal.dto';
