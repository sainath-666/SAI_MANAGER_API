import { z } from "zod";

export const noteCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().max(5000).optional().default(""),
  category: z.string().min(1).optional().default("General"),
  isPinned: z.boolean().optional().default(false),
});

export const noteUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().max(5000).optional(),
  category: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});
