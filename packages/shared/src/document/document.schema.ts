import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
