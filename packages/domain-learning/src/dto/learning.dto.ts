import { z } from 'zod';
import { LearningStatus, MaterialType } from '@lifeos/shared';

export const createLearningTrackSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  status: z.enum(LearningStatus).optional().default('active'),
  goal: z.string().max(10000).optional(),
});
export type CreateLearningTrackDto = z.infer<typeof createLearningTrackSchema>;

export const updateLearningTrackSchema = createLearningTrackSchema.partial();
export type UpdateLearningTrackDto = z.infer<typeof updateLearningTrackSchema>;

export const createLearningMaterialSchema = z.object({
  learningTrackId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  title: z.string().min(1).max(400),
  materialType: z.enum(MaterialType).optional().default('article'),
  url: z.string().url().optional(),
  status: z.enum(LearningStatus).optional().default('active'),
  estimateMinutes: z.number().int().positive().optional(),
  metadataJson: z.record(z.unknown()).optional(),
});
export type CreateLearningMaterialDto = z.infer<typeof createLearningMaterialSchema>;

export const createLearningSessionSchema = z.object({
  learningTrackId: z.string().uuid().optional(),
  materialId: z.string().uuid().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});
export type CreateLearningSessionDto = z.infer<typeof createLearningSessionSchema>;
