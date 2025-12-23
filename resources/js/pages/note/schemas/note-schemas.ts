import { z } from 'zod';
/**
 * Base note schema with common fields
 */
const baseNoteSchema = {
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  content: z
    .string()
    .min(1, 'Content is required')
    .trim(),

  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .default([]),

  category: z
    .string()
    .max(100, 'Category must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  is_pinned: z
    .boolean()
    .default(false),
};

/**
 * Create Note Schema
 *
 * Used for the create note form.
 */
export const createNoteSchema = z.object({
  ...baseNoteSchema,
});

export type CreateNoteFormData = z.infer<typeof createNoteSchema>;

/**
 * Update Note Schema
 *
 * Used for the edit note form.
 * Includes note ID for identification.
 */
export const updateNoteSchema = z.object({
  id: z.number().int().positive(),
  ...baseNoteSchema,
});

export type UpdateNoteFormData = z.infer<typeof updateNoteSchema>;

/**
 * Note Filter Schema
 *
 * Validates filter inputs for note list.
 */
export const noteFilterSchema = z.object({
  search: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  is_pinned: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type NoteFilterData = z.infer<typeof noteFilterSchema>;

export function cleanNoteFormData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Partial<T> = { ...data };

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key as keyof T];
    if (value === '' || value === null || value === undefined) {
      delete cleaned[key as keyof T];
    }
    if (Array.isArray(value) && value.length === 0) {
      delete cleaned[key as keyof T];
    }
  });

  return cleaned;
}
