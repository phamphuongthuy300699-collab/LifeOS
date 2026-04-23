/**
 * Note DTOs — Zod schemas for validation.
 */
import { z } from 'zod';
import { NoteType } from '@lifeos/shared';

export const createNoteSchema = z.object({
  title: z.string().max(500).optional(),
  bodyMarkdown: z.string().max(100000).optional().default(''),
  noteType: z.enum(NoteType).optional().default('general'),
  sourceType: z.string().max(30).optional(),
  createdFromInboxItemId: z.string().uuid().optional(),
});

export type CreateNoteDto = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  title: z.string().max(500).optional().nullable(),
  bodyMarkdown: z.string().max(100000).optional(),
  noteType: z.enum(NoteType).optional(),
});

export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;

export const noteFilterSchema = z.object({
  noteType: z.enum(NoteType).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type NoteFilterDto = z.infer<typeof noteFilterSchema>;
