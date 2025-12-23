import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  division_ids: z.array(z.number()).min(1, 'At least one division is required'),
  participant_ids: z.array(z.number()).optional().default([]),
}).refine(
  (data) => {
    if (!data.start_date || !data.end_date) return true;
    return new Date(data.start_date) <= new Date(data.end_date);
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
);

export const updateEventSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  division_ids: z.array(z.number()).min(1, 'At least one division is required').optional(),
  participant_ids: z.array(z.number()).optional().default([]),
}).refine(
  (data) => {
    if (!data.start_date || !data.end_date) return true;
    return new Date(data.start_date) <= new Date(data.end_date);
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
);

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;

export function cleanEventFormData(data: any) {
  const cleaned: any = { ...data };

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === '') {
      cleaned[key] = undefined;
    }
  });

  if (cleaned.division_ids && !Array.isArray(cleaned.division_ids)) {
    cleaned.division_ids = [cleaned.division_ids];
  }

  if (cleaned.participant_ids && !Array.isArray(cleaned.participant_ids)) {
    cleaned.participant_ids = [cleaned.participant_ids];
  }

  return cleaned;
}
