import z from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(3).max(255),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(), // Tiptap JSON
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
