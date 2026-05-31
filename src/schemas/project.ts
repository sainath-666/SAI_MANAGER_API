import { z } from "zod";

const dateString = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Use YYYY-MM-DD");

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional().default(""),
  category: z.string().min(1).optional().default("General"),
  status: z
    .enum(["Planning", "In Progress", "Review", "Completed"])
    .optional()
    .default("Planning"),
  tasksCount: z.number().int().nonnegative().optional().default(0),
  completedTasksCount: z.number().int().nonnegative().optional().default(0),
  dueDate: dateString.nullable().optional().default(null),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).nullable().optional(),
  category: z.string().min(1).nullable().optional(),
  status: z.enum(["Planning", "In Progress", "Review", "Completed"]).optional(),
  tasksCount: z.number().int().nonnegative().optional(),
  completedTasksCount: z.number().int().nonnegative().optional(),
  dueDate: dateString.nullable().optional(),
});
