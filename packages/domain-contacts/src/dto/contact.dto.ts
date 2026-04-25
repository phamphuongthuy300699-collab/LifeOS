import { z } from 'zod';
import { SourceType } from '@lifeos/shared';

export const createContactSchema = z.object({
  firstName: z.string().max(160).optional(),
  lastName: z.string().max(160).optional(),
  displayName: z.string().min(1).max(300),
  company: z.string().max(300).optional(),
  roleTitle: z.string().max(300).optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().max(80).optional(),
  shortProfile: z.string().max(5000).optional(),
  notesMarkdown: z.string().max(20000).optional(),
  lastInteractionAt: z.string().datetime().optional(),
  sourceType: z.enum(SourceType).optional().default('manual'),
  externalProviderId: z.string().max(200).optional(),
});
export type CreateContactDto = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
