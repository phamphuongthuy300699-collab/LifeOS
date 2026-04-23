import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  location: z.string().max(500).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isAllDay: z.boolean().optional().default(false),
  status: z.enum(['tentative', 'confirmed', 'cancelled']).optional().default('confirmed'),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
