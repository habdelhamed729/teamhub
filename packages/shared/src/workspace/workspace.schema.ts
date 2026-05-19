import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, or hyphens only'),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

