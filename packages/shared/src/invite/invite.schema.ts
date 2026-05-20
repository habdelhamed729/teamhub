import { z } from 'zod';

export const createInviteSchema = z.object({
  expires_at: z.string().optional(),
  max_uses: z.number().int().positive().optional(),
});

export type CreateInviteDTO = z.infer<typeof createInviteSchema>;
