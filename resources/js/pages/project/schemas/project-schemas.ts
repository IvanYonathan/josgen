import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  division_ids: z.array(z.number()).min(1, 'At least one division is required'),
  member_ids: z.array(z.number()).default([]),
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

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Project name is required').max(255).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  division_ids: z.array(z.number()).min(1, 'At least one division is required').optional(),
  member_ids: z.array(z.number()).optional(),
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

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  assigned_to: z.number().nullable().optional(),
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

export const updateTaskSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Task title is required').max(255).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  assigned_to: z.number().nullable().optional(),
  is_completed: z.boolean().optional(),
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

export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export function cleanProjectFormData(data: any) {
  const cleaned: any = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === '') {
      cleaned[key] = undefined;
    }
  });
  return cleaned;
}
