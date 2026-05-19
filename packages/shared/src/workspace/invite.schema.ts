import { z } from 'zod';

export const joinWorkspaceSchema = z.object({
  code: z.string().min(6).max(20),
});
