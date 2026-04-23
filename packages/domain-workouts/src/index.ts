/**
 * @lifeos/domain-workouts
 * Workout tracking domain
 */

// DTOs
export {
  createExerciseSchema,
  updateExerciseSchema,
} from './dto/exercise.dto';
export type {
  CreateExerciseDto,
  UpdateExerciseDto,
} from './dto/exercise.dto';

export {
  createWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  createWorkoutPlanExerciseSchema,
} from './dto/workout-plan.dto';
export type {
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
  CreateWorkoutPlanExerciseDto,
} from './dto/workout-plan.dto';

export {
  createWorkoutSessionSchema,
  updateWorkoutSessionSchema,
  createWorkoutSessionExerciseSchema,
  createWorkoutSetSchema,
  updateWorkoutSetSchema,
} from './dto/workout-session.dto';
export type {
  CreateWorkoutSessionDto,
  UpdateWorkoutSessionDto,
  CreateWorkoutSessionExerciseDto,
  CreateWorkoutSetDto,
  UpdateWorkoutSetDto,
} from './dto/workout-session.dto';
