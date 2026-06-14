import { z } from "zod";

export const habitCreateSchema = z.object({
  title: z.string().min(1),
  streak: z.number().int().nonnegative().optional().default(0),
  isCompleted: z.boolean().optional().default(false),
});

export const habitUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  streak: z.number().int().nonnegative().optional(),
  isCompleted: z.boolean().optional(),
});
