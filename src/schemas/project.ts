import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional().default(""),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "archived", "completed"]).optional(),
});
