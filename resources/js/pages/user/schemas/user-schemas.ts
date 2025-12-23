import { z } from 'zod';

/**
 * Zod Validation Schemas for User Forms
 *
 * Provides client-side validation for user creation and editing.
 * These schemas ensure data integrity before making API calls,
 * improving UX with instant feedback and reducing unnecessary server requests.
 */

/**
 * User role value (dynamic).
 */
export const userRoleSchema = z.string().min(1, 'Role is required');

/**
 * Base user schema with common fields
 */
const baseUserSchema = {
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),

  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  role: userRoleSchema,

  birthday: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    ),

  division_id: z
    .custom<number | null | undefined>((val) => {
      // Allow null, undefined, or empty string
      if (val === null || val === undefined || val === '') return true;

      // Allow positive integers
      if (typeof val === 'number') {
        return Number.isInteger(val) && val > 0;
      }

      // Allow numeric strings
      if (typeof val === 'string') {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num > 0;
      }

      return false;
    }, 'Division ID must be a positive integer')
    .transform((val: any) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') return Number(val);
      return val;
    })
    .optional()
    .nullable(),
};

/**
 * Create User Schema
 *
 * Used for the create user form.
 * Password is required for new users.
 */
export const createUserSchema = z.object({
  ...baseUserSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be less than 255 characters'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Update User Schema
 *
 * Used for the edit user form.
 * Password is optional (only update if provided).
 * Includes user ID for identification.
 */
export const updateUserSchema = z.object({
  id: z.number().int().positive(),
  ...baseUserSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be less than 255 characters')
    .optional()
    .or(z.literal('')),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

/**
 * Avatar File Schema
 *
 * Validates avatar file uploads.
 * Accepts common image formats and enforces size limit.
 */
export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 2 * 1024 * 1024, {
    message: 'Avatar file size must be less than 2MB',
  })
  .refine(
    (file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      return allowedTypes.includes(file.type);
    },
    {
      message: 'Avatar must be a JPEG, PNG, JPG, GIF, or WebP image',
    }
  )
  .optional()
  .nullable();

/**
 * User Filter Schema
 *
 * Validates filter inputs for user list.
 */
export const userFilterSchema = z.object({
  searchTerm: z.string().max(255).optional(),
  roleFilter: z.union([z.literal('all'), userRoleSchema]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type UserFilterData = z.infer<typeof userFilterSchema>;

/**
 * Helper function to transform form data before submission
 * Removes empty optional fields to avoid sending unnecessary data
 */
export function cleanUserFormData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Partial<T> = { ...data };

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key as keyof T];
    // Remove empty strings, null, undefined
    if (value === '' || value === null || value === undefined) {
      delete cleaned[key as keyof T];
    }
  });

  return cleaned;
}
