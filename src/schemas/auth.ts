import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
