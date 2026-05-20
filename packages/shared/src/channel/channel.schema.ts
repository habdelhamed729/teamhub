import { z } from 'zod';

export const createChannelSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['public', 'private', 'dm']).optional(),
    participantUserId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'dm' && !data.participantUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participantUserId'],
        message: 'A DM channel requires one selected person',
      });
    }
  });

export const updateChannelSchema = z.object({
  name: z.string().min(1).optional(),
});

export const addChannelMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateChannelDTO = z.infer<typeof createChannelSchema>;
export type UpdateChannelDTO = z.infer<typeof updateChannelSchema>;
export type AddChannelMemberDTO = z.infer<typeof addChannelMemberSchema>;
