import { z } from "zod";

const dateString = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Use YYYY-MM-DD");

export const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional().default(""),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  category: z.string().min(1).optional().default("General"),
  dueDate: dateString.nullable().optional().default(null),
  orderIndex: z.number().int().optional().default(0),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().min(1).nullable().optional(),
  dueDate: dateString.nullable().optional(),
  orderIndex: z.number().int().optional(),
});
