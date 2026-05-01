import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  location: z.string().max(500).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isAllDay: z.boolean().optional().default(false),
  status: z.enum(['tentative', 'confirmed', 'cancelled']).optional().default('confirmed'),
  sourceProvider: z.enum(['manual', 'google', 'yandex']).optional().default('manual'),
  calendarRef: z.string().max(255).optional(),
  externalId: z.string().max(500).optional(),
  externalCalendarId: z.string().max(255).optional(),
  externalEventId: z.string().max(500).optional(),
  timezone: z.string().max(100).optional(),
  meetingUrl: z.string().max(2000).optional(),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
