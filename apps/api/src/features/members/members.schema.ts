import z from "zod";

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).optional(),
});
export const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});
